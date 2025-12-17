"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";

const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NTg3NzkzMSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjYxMzcxMzF9.vf348GFqAWkiaF9LqHIgod07o3sLuiKCkrgi_v4CUKQ";
const API_BASE_URL = "https://ifbb-1.onrender.com/api/admin";

type UploadedFile = {
  id: string;
  file: File;
  url: string;
  progress: number;
  uploaded: boolean;
  uploadedUrl: string | null;
  error: string | null;
  primary: boolean;
  serverId?: string;
};

type UploadedImage = {
  _id: string;
  imageUrl: string;
  publicId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export default function BrandImagesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Generate unique ID
  const uid = () => Math.random().toString(36).slice(2, 9);

  // Fetch uploaded images on component mount
  useEffect(() => {
    fetchUploadedImages();
  }, []);

  async function fetchUploadedImages() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/affiliations`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedImages(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching uploaded images:", error);
    } finally {
      setLoading(false);
    }
  }

  // Real upload function
  async function uploadFileToServer(file: File, onProgress: (progress: number) => void): Promise<{ success: boolean; url?: string; serverId?: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.message === "Affiliation image uploaded successfully") {
                resolve({
                  success: true,
                  url: response.affiliation.imageUrl,
                  serverId: response.affiliation._id
                });
              } else {
                resolve({ success: false });
              }
            } catch (e) {
              resolve({ success: false });
            }
          } else {
            resolve({ success: false });
          }
        });
        
        xhr.addEventListener('error', () => {
          resolve({ success: false });
        });
        
        xhr.open('POST', `${API_BASE_URL}/upload-affiliation`);
        xhr.setRequestHeader('Authorization', `Bearer ${ADMIN_TOKEN}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error("Upload error:", error);
      return { success: false };
    }
  }

  const onFilesSelected = useCallback((selectedFiles: FileList) => {
    const arr = Array.from(selectedFiles).map((f) => ({
      id: uid(),
      file: f,
      url: URL.createObjectURL(f),
      progress: 0,
      uploaded: false,
      uploadedUrl: null,
      error: null,
      primary: false,
      serverId: undefined
    }));
    setFiles((prev) => [...prev, ...arr]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [onFilesSelected]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  function removeFile(id: string) {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.url) URL.revokeObjectURL(f.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function deleteUploadedImage(imageId: string, publicId: string) {
    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/affiliation/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicId })
      });
      
      if (response.ok) {
        // Remove from local state
        setUploadedImages(prev => prev.filter(img => img._id !== imageId));
        alert("Image deleted successfully!");
      } else {
        alert("Failed to delete image. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image. Please try again.");
    }
  }

  function setPrimary(id: string) {
    setFiles((prev) => prev.map((x) => ({ ...x, primary: x.id === id })));
  }

  function move(id: string, dir: number) {
    setFiles((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      return copy;
    });
  }

  // Start uploading all files
  async function startUploadAll() {
    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    if (toUpload.length === 0) {
      alert("No files to upload");
      return;
    }

    for (const f of toUpload) {
      // Update progress to 1 to show uploading started
      setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, progress: 1 } : p)));
      
      try {
        const resp = await uploadFileToServer(f.file, (pct) =>
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, progress: pct } : p)))
        );

        if (resp?.success) {
          setFiles((prev) =>
            prev.map((p) =>
              p.id === f.id ? { 
                ...p, 
                progress: 100, 
                uploaded: true, 
                uploadedUrl: resp.url,
                serverId: resp.serverId
              } : p
            )
          );
        } else {
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, error: "Upload failed" } : p)));
        }
      } catch (err) {
        setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, error: "Upload error" } : p)));
      }
    }
    
    // Refresh uploaded images list after uploads complete
    setTimeout(() => fetchUploadedImages(), 1000);
  }

  // Clear all selected files
  function clearAll() {
    files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setFiles([]);
  }

  // Copy image URL to clipboard
  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url)
      .then(() => alert("URL copied to clipboard!"))
      .catch(err => console.error("Failed to copy:", err));
  }

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const uploadedCount = files.filter(f => f.uploaded).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Brand Image Management</h1>
          <p className="text-slate-600">Upload and manage your brand logos and affiliation images</p>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Upload New Images</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload brand logos and affiliation images. Supported formats: PNG, JPG, GIF.
              </p>
            </div>

            <div className="p-6">
              {/* Drag & Drop area */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`relative rounded-xl border-3 border-dashed p-8 transition-all duration-200 ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-50" 
                    : "border-slate-300 hover:border-slate-400 bg-white"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) onFilesSelected(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <p className="text-lg font-medium text-slate-900">Drag & drop images here</p>
                  <p className="mt-2 text-sm text-slate-500 max-w-md">
                    Drop your brand images or click the button below to browse files. You can upload multiple images at once.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Select Images
                    </button>

                    <button
                      onClick={startUploadAll}
                      disabled={files.length === 0 || files.every(f => f.uploaded)}
                      className={`px-5 py-3 rounded-xl font-medium ${
                        files.length === 0 || files.every(f => f.uploaded)
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                      }`}
                    >
                      Upload All ({files.filter(f => !f.uploaded).length})
                    </button>

                    <button
                      onClick={clearAll}
                      disabled={files.length === 0}
                      className={`px-5 py-3 rounded-xl font-medium ${
                        files.length === 0
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* overlay when dragging */}
                {dragActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span className="text-lg font-semibold">Drop to upload</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {files.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                    <div className="text-sm font-medium text-indigo-700">Selected</div>
                    <div className="text-2xl font-bold text-indigo-900 mt-1">{files.length}</div>
                    <div className="text-xs text-indigo-600">files</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                    <div className="text-sm font-medium text-emerald-700">Uploaded</div>
                    <div className="text-2xl font-bold text-emerald-900 mt-1">{uploadedCount}</div>
                    <div className="text-xs text-emerald-600">completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                    <div className="text-sm font-medium text-slate-700">Total Size</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{(totalSize / (1024 * 1024)).toFixed(2)}</div>
                    <div className="text-xs text-slate-600">MB</div>
                  </div>
                </div>
              )}

              {/* Selected files preview */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Selected Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                    {files.map((f, i) => (
                      <div 
                        key={f.id} 
                        className={`bg-white border rounded-xl p-4 flex flex-col transition-all hover:shadow-lg ${
                          f.primary ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                          <img 
                            src={f.url} 
                            alt={`preview-${i}`} 
                            className="max-w-full max-h-full object-contain p-2" 
                          />
                          {f.primary && (
                            <span className="absolute top-2 left-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                              Primary
                            </span>
                          )}
                          {f.uploaded && (
                            <span className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                              ✓ Uploaded
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">{f.file.name}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                {(f.file.size / 1024).toFixed(1)} KB • {f.file.type.split('/')[1]?.toUpperCase()}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => move(f.id, -1)}
                                disabled={i === 0}
                                className={`p-1.5 rounded-lg ${
                                  i === 0 
                                    ? 'text-slate-300 cursor-not-allowed' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => move(f.id, 1)}
                                disabled={i === files.length - 1}
                                className={`p-1.5 rounded-lg ${
                                  i === files.length - 1
                                    ? 'text-slate-300 cursor-not-allowed' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${f.progress}%` }}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  f.error
                                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                                    : f.uploaded
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                }`}
                              />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-xs font-medium">
                                {f.error ? (
                                  <span className="text-red-600">Error: {f.error}</span>
                                ) : f.uploaded ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Uploaded
                                  </span>
                                ) : (
                                  <span className="text-indigo-600">{f.progress}%</span>
                                )}
                              </div>
                              {f.uploadedUrl && (
                                <button
                                  onClick={() => copyToClipboard(f.uploadedUrl!)}
                                  className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                  Copy URL
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => setPrimary(f.id)}
                            disabled={f.primary}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                              f.primary
                                ? 'bg-slate-100 text-slate-500 cursor-default'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow hover:shadow-md'
                            }`}
                          >
                            {f.primary ? 'Primary' : 'Set as Primary'}
                          </button>
                          <button
                            onClick={() => removeFile(f.id)}
                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <div className="mt-6 text-center py-8">
                  <div className="text-4xl mb-3">📁</div>
                  <h4 className="text-lg font-medium text-slate-900 mb-2">No files selected</h4>
                  <p className="text-slate-500">Select images to upload or drag & drop them here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Uploaded Images */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Uploaded Images</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    All your previously uploaded brand images
                  </p>
                </div>
                <button
                  onClick={fetchUploadedImages}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : uploadedImages.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Total: <span className="font-semibold">{uploadedImages.length}</span> images
                    </div>
                    <div className="text-xs text-slate-500">
                      Click on any image to copy its URL
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-2">
                    {uploadedImages.map((image) => (
                      <div 
                        key={image._id} 
                        className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-slate-100 mb-4">
                          <img 
                            src={image.imageUrl} 
                            alt="Uploaded brand" 
                            className="w-full h-full object-contain p-2"
                            onClick={() => copyToClipboard(image.imageUrl)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-slate-500">Uploaded</div>
                              <div className="text-sm font-medium text-slate-900">
                                {new Date(image.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">ID</div>
                              <div className="text-xs font-mono text-slate-600 truncate max-w-[120px]">
                                {image._id.slice(-8)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(image.imageUrl)}
                              className="flex-1 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition"
                            >
                              Copy URL
                            </button>
                            <button
                              onClick={() => deleteUploadedImage(image._id, image.publicId)}
                              className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🖼️</div>
                  <h4 className="text-lg font-medium text-slate-900 mb-2">No uploaded images</h4>
                  <p className="text-slate-500">Upload some images to see them here</p>
                </div>
              )}
            </div>

            {/* Footer notes */}
            <div className="border-t border-slate-200 p-6 bg-gradient-to-r from-slate-50 to-white">
              <div className="text-sm">
                <h4 className="font-semibold text-slate-900 mb-2">Information</h4>
                <ul className="text-slate-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Images are uploaded to Cloudinary and stored permanently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Maximum file size: 5MB per image</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Supported formats: PNG, JPG, JPEG, GIF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Use the "Copy URL" button to get the direct image link</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        {/* <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">API Integration Active</h3>
              <p className="text-sm text-slate-600 mt-1">
                All uploads and deletions are processed through your backend API. Images are stored in Cloudinary with proper metadata.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}