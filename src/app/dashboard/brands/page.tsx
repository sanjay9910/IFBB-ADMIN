"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = "https://ifbb-master.onrender.com/api/admin";

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
  const { token, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Generate unique ID
  const uid = () => Math.random().toString(36).slice(2, 9);

  // Fetch uploaded images on component mount and when token changes
  useEffect(() => {
    if (token && isAuthenticated) {
      fetchUploadedImages();
    }
  }, [token, isAuthenticated]);

  async function fetchUploadedImages() {
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/affiliations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedImages(data.data || []);
        setError(null);
      } else if (response.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load images. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching uploaded images:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // Real upload function
  async function uploadFileToServer(file: File, onProgress: (progress: number) => void): Promise<{ success: boolean; url?: string; serverId?: string }> {
    if (!token) {
      return { success: false };
    }

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
                  url: response.affiliation?.imageUrl,
                  serverId: response.affiliation?._id
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
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
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
    setError(null);
    setSuccess(null);
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
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/affiliation/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicId })
      });
      
      if (response.ok) {
        // Remove from local state
        setUploadedImages(prev => prev.filter(img => img._id !== imageId));
        setSuccess("Image deleted successfully!");
        setError(null);
      } else if (response.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to delete image. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Error deleting image. Please try again.");
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
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    if (toUpload.length === 0) {
      setError("No files to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const uploadPromises = toUpload.map(async (f) => {
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
                uploadedUrl: resp.url || null,
                serverId: resp.serverId
              } : p
            )
          );
          return { success: true };
        } else {
          setFiles((prev) => 
            prev.map((p) => 
              p.id === f.id ? { ...p, error: "Upload failed" } : p
            )
          );
          return { success: false };
        }
      } catch (err) {
        setFiles((prev) => 
          prev.map((p) => 
            p.id === f.id ? { ...p, error: "Upload error" } : p
          )
        );
        return { success: false };
      }
    });

    const results = await Promise.all(uploadPromises);
    setUploading(false);

    const successfulUploads = results.filter(r => r.success).length;
    
    if (successfulUploads > 0) {
      setSuccess(`Successfully uploaded ${successfulUploads} of ${toUpload.length} files`);
      
      // Refresh uploaded images list after uploads complete
      setTimeout(() => {
        fetchUploadedImages();
        // Clear uploaded files after 2 seconds
        setFiles((prev) => prev.filter((f) => !f.uploaded));
      }, 2000);
    } else {
      setError("Failed to upload any files");
    }
  }

  // Clear all selected files
  function clearAll() {
    files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setFiles([]);
    setError(null);
    setSuccess(null);
  }

  // Copy image URL to clipboard
  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url)
      .then(() => setSuccess("URL copied to clipboard!"))
      .catch(err => {
        console.error("Failed to copy:", err);
        setError("Failed to copy URL to clipboard");
      });
  }

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const uploadedCount = files.filter(f => f.uploaded).length;

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
    if (e.currentTarget.value) {
      e.currentTarget.value = "";
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Status Messages */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl ${error ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${error ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {error ? (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className={error ? "text-red-700" : "text-emerald-700"}>{error || success}</p>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-auto text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
                  onChange={handleFileInputChange}
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
                      disabled={files.length === 0 || files.every(f => f.uploaded) || uploading}
                      className={`px-5 py-3 rounded-xl font-medium ${
                        files.length === 0 || files.every(f => f.uploaded) || uploading
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                      }`}
                    >
                      {uploading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        `Upload All (${files.filter(f => !f.uploaded).length})`
                      )}
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
                                {(f.file.size / 1024).toFixed(1)} KB • {f.file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
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
                            disabled={f.primary || f.uploaded}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                              f.primary || f.uploaded
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
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Refreshing..." : "Refresh"}
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
                        <div 
                          className="relative w-full h-48 rounded-lg overflow-hidden bg-slate-100 mb-4 cursor-pointer"
                          onClick={() => copyToClipboard(image.imageUrl)}
                        >
                          <img 
                            src={image.imageUrl} 
                            alt="Uploaded brand" 
                            className="w-full h-full object-contain p-2"
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
                              {/* <div className="text-xs text-slate-500">ID</div>
                              <div className="text-xs font-mono text-slate-600 truncate max-w-[120px]">
                                {image._id.slice(-8)}
                              </div> */}
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
      </div>
    </div>
  );
}