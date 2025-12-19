"use client";

import React, { useState, useEffect, useRef } from 'react';

/* ---------------- Types ---------------- */
type GalleryImage = {
  _id: string;
  imageUrl: string;
  publicId: string;
  createdAt: string;
  updatedAt: string;
};

type ImageWithSize = GalleryImage & {
  sizeInBytes?: number;
};

/* ------------- Constants ------------- */
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NTg3NzkzMSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjYxMzcxMzF9.vf348GFqAWkiaF9LqHIgod07o3sLuiKCkrgi_v4CUKQ";

const API_BASE_URL = "https://ifbb-1.onrender.com/api";
const ADMIN_API_BASE_URL = "https://ifbb-1.onrender.com/api/admin";

/* ------------- Helper Functions ------------- */
async function getImageSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    
    // If content-length header is not available, fetch the whole image
    const imgResponse = await fetch(url);
    const blob = await imgResponse.blob();
    return blob.size;
  } catch (error) {
    console.error("Error fetching image size:", error);
    return 0; // Return 0 if cannot fetch size
  }
}

function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/* ------------- API Functions ------------- */
async function fetchGalleryImagesWithSizes(): Promise<ImageWithSize[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/gallery`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gallery images: ${response.status}`);
    }
    
    const data = await response.json();
    const images: GalleryImage[] = data.images || [];
    
    // Fetch sizes for all images in parallel
    const imagesWithSizes = await Promise.all(
      images.map(async (image) => {
        try {
          const sizeInBytes = await getImageSize(image.imageUrl);
          return {
            ...image,
            sizeInBytes
          };
        } catch (error) {
          console.error(`Error fetching size for image ${image._id}:`, error);
          return {
            ...image,
            sizeInBytes: 0
          };
        }
      })
    );
    
    return imagesWithSizes;
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return [];
  }
}

async function uploadGalleryImage(formData: FormData) {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/gallery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

async function deleteGalleryImage(imageId: string) {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/gallery/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete image: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

/* ------------------ Component ------------------ */
export default function GalleryPage() {
  const [images, setImages] = useState<ImageWithSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithSize | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [totalStorage, setTotalStorage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images on component mount
  useEffect(() => {
    loadImages();
  }, []);

  // Update total storage when images change
  useEffect(() => {
    const totalBytes = images.reduce((sum, image) => sum + (image.sizeInBytes || 0), 0);
    setTotalStorage(totalBytes);
  }, [images]);

  async function loadImages() {
    setLoading(true);
    try {
      const galleryImages = await fetchGalleryImagesWithSizes();
      setImages(galleryImages);
      setError("");
    } catch (error: any) {
      console.error("Error loading images:", error);
      setError("Failed to load gallery images. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleImageClick(image: ImageWithSize) {
    setSelectedImage(image);
    setShowImageModal(true);
  }

  function handleCloseImageModal() {
    setSelectedImage(null);
    setShowImageModal(false);
  }

  function handleOpenUploadModal() {
    setShowUploadModal(true);
    setError("");
    setSuccess("");
  }

  function handleCloseUploadModal() {
    setShowUploadModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      setError("Please select an image to upload");
      return;
    }

    const file = fileInputRef.current.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await uploadGalleryImage(formData);
      
      if (result.success) {
        setSuccess("Image uploaded successfully!");
        await loadImages(); // Refresh the image list with sizes
        handleCloseUploadModal();
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await deleteGalleryImage(imageId);
      
      if (result.success) {
        setSuccess("Image deleted successfully!");
        // Remove the deleted image from state
        setImages(prev => prev.filter(img => img._id !== imageId));
        
        // Close modal if the deleted image was selected
        if (selectedImage?._id === imageId) {
          handleCloseImageModal();
        }
      } else {
        throw new Error(result.message || "Delete failed");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      setError(error.message || "Failed to delete image. Please try again.");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Get latest image date
  function getLatestImageDate() {
    if (images.length === 0) return null;
    const sorted = [...images].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0].createdAt;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gallery</h1>
              <p className="mt-2 text-slate-600">Manage and showcase your collection of images</p>
            </div>
            <button
              onClick={handleOpenUploadModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Image
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Images</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{images.length}</p>
                </div>
                <div className="text-slate-700 text-xl">🖼️</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Storage Used</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatBytes(totalStorage)}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {images.filter(img => img.sizeInBytes && img.sizeInBytes > 0).length} of {images.length} images sized
                  </p>
                </div>
                <div className="text-slate-700 text-xl">💾</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Last Updated</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {getLatestImageDate() ? formatDate(getLatestImageDate()!) : '—'}
                  </p>
                </div>
                <div className="text-slate-700 text-xl">📅</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-slate-600">Loading gallery images...</p>
            <p className="text-sm text-slate-500 mt-2">Fetching image sizes, please wait</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No images yet</h3>
            <p className="text-slate-600 mb-6">Upload your first image to get started</p>
            <button
              onClick={handleOpenUploadModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload First Image
            </button>
          </div>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {images.map((image) => (
    <div
      key={image._id}
      className="group relative bg-white rounded-2xl border border-slate-200/50 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 cursor-pointer"
    >
      {/* Image Container */}
      <div 
        className="relative h-72 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
        onClick={() => handleImageClick(image)}
      >
        <img
          src={image.imageUrl}
          alt={`Gallery image ${image._id}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Premium Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Date Badge - Enhanced */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/50">
          <div className="text-xs font-semibold text-slate-700 tracking-wide">
            {formatDate(image.createdAt)}
          </div>
        </div>

        {/* View Icon - Appears on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-gradient-to-b from-white to-slate-50/50">
        
        {/* Size Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs font-medium text-slate-600">
              {image.sizeInBytes ? formatBytes(image.sizeInBytes) : 'Size unknown'}
            </span>
          </div>
          
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteImage(image._id);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Delete image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        {/* View Details Button */}
        <button
          onClick={() => handleImageClick(image)}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
          View Details
        </button>
      </div>
    </div>
  ))}
</div>
        )}
      </div>

      {/* ---------- Upload Image Modal ---------- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseUploadModal} />
          <form
            onSubmit={handleFileUpload}
            className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Image</h2>
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Image *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-400 transition cursor-pointer bg-slate-50">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-slate-600 mb-2">Click to browse or drag & drop</p>
                    <p className="text-sm text-slate-500 mb-4">Supports: JPG, PNG, WebP (Max 5MB)</p>
                    <input
                      type="file"
                      id="galleryImage"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={() => setError("")}
                    />
                    <label
                      htmlFor="galleryImage"
                      className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium cursor-pointer transition"
                    >
                      Choose File
                    </label>
                  </div>
                  {fileInputRef.current?.files?.[0] && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📷</div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{fileInputRef.current.files[0].name}</div>
                          <div className="text-sm text-slate-600">
                            {formatBytes(fileInputRef.current.files[0].size)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Upload image to gallery
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseUploadModal}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`px-6 py-3 rounded-xl font-medium transition ${
                      uploading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                    }`}
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      "Upload Image"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Image View Modal ---------- */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseImageModal} />
          <div className="relative z-50 max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="relative">
              <img
                src={selectedImage.imageUrl}
                alt={`Gallery image ${selectedImage._id}`}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <button
                onClick={handleCloseImageModal}
                className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Image Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-500">Image ID</div>
                      <div className="font-mono text-sm text-slate-900 break-all">{selectedImage._id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">File Size</div>
                      <div className="font-medium text-slate-900">
                        {selectedImage.sizeInBytes ? formatBytes(selectedImage.sizeInBytes) : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Public ID</div>
                      <div className="font-mono text-sm text-slate-900">{selectedImage.publicId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Uploaded Date</div>
                      <div className="font-medium text-slate-900">{formatDate(selectedImage.createdAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <a
                      href={selectedImage.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium text-center transition-colors duration-200"
                    >
                      Open in New Tab
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedImage.imageUrl);
                        setSuccess("Image URL copied to clipboard!");
                      }}
                      className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors duration-200"
                    >
                      Copy Image URL
                    </button>
                    <button
                      onClick={() => handleDeleteImage(selectedImage._id)}
                      className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors duration-200"
                    >
                      Delete Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}