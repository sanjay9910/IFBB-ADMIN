"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";

// API configuration
const API_CONFIG = {
  baseUrl: "https://ifbb-1.onrender.com/api",
  uploadEndpoint: "/admin/certificates",
  fetchEndpoint: "/certificates",
  deleteEndpoint: "/admin/certificates" // Assuming DELETE /admin/certificates/:id
};

// Available categories
const CATEGORIES = ["coach", "athlete", "judge", "trainer", "other"];

export default function CertificateManager() {
  // State management
  const [files, setFiles] = useState([]);
  const [uploadedCertificates, setUploadedCertificates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("coach");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [showAuthInput, setShowAuthInput] = useState(false);
  
  const inputRef = useRef(null);

  // Generate unique ID
  const uid = () => Math.random().toString(36).slice(2, 9);

  // Authentication setup
  useEffect(() => {
    const savedToken = localStorage.getItem('ifbb_auth_token');
    if (savedToken) {
      setAuthToken(savedToken);
    } else {
      setShowAuthInput(true);
    }
  }, []);

  const saveAuthToken = (token) => {
    localStorage.setItem('ifbb_auth_token', token);
    setAuthToken(token);
    setShowAuthInput(false);
    setSuccess("Authentication token saved successfully!");
  };

  const logout = () => {
    localStorage.removeItem('ifbb_auth_token');
    setAuthToken(null);
    setShowAuthInput(true);
    setSuccess("Logged out successfully");
  };

  // Upload file to server
  const uploadFileToServer = async (file, category, onProgress) => {
    try {
      if (!authToken) {
        throw new Error("Authentication required. Please add your token.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      // Simulate progress
      const total = file.size || 200000;
      let sent = 0;
      const progressInterval = setInterval(() => {
        sent += Math.max(15000, total * 0.07);
        const pct = Math.min(90, Math.round((sent / total) * 100));
        onProgress(pct);
      }, 160);

      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.uploadEndpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      clearInterval(progressInterval);
      onProgress(100);

      if (response.status === 401) {
        throw new Error("Authentication failed (401). Token may be invalid or expired.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result.data || result,
        url: result.fileUrl || result.data?.fileUrl || URL.createObjectURL(file)
      };
    } catch (err) {
      console.error("Upload error:", err);
      
      if (err.message.includes("401") || err.message.includes("Authentication")) {
        setError(err.message + " - Please update your authentication token.");
        setShowAuthInput(true);
      }
      
      return {
        success: false,
        error: err.message || "Upload failed"
      };
    }
  };

  // Fetch certificates by category
  const fetchCertificatesByCategory = async (category) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.fetchEndpoint}?category=${category}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch certificates");
      }
      
      // Transform API response to match our UI structure
      const certificates = (result.data || []).map((cert, index) => ({
        id: cert._id || `cert-${index}-${Date.now()}`,
        name: cert.fileUrl?.split('/').pop() || `certificate-${index}`,
        url: cert.fileUrl,
        category: cert.category || category,
        uploadedAt: cert.createdAt || new Date().toISOString(),
        publicId: cert.publicId,
        primary: index === 0
      }));
      
      setUploadedCertificates(certificates);
      return certificates;
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load certificates: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Delete certificate
  const deleteCertificate = async (certificateId, publicId) => {
    if (!authToken) {
      setError("Authentication required to delete certificates.");
      setShowAuthInput(true);
      return false;
    }

    if (!window.confirm("Are you sure you want to delete this certificate?")) {
      return false;
    }

    try {
      setDeletingId(certificateId);
      
      // First try with publicId in body
      const deleteBody = publicId ? { publicId } : { id: certificateId };
      
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.deleteEndpoint}/${certificateId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteBody)
      });

      if (response.status === 401) {
        throw new Error("Authentication failed (401). Token may be invalid or expired.");
      }

      if (!response.ok) {
        // If first attempt fails, try without body (URL parameter only)
        const retryResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.deleteEndpoint}/${certificateId}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(`Delete failed: ${retryResponse.status} - ${errorText}`);
        }
      }

      // Remove from state
      setUploadedCertificates(prev => prev.filter(cert => cert.id !== certificateId));
      setSuccess("Certificate deleted successfully!");
      
      // Refresh list
      fetchCertificatesByCategory(selectedCategory);
      
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      setError(`Failed to delete certificate: ${err.message}`);
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  // Load certificates when category changes
  useEffect(() => {
    fetchCertificatesByCategory(selectedCategory);
  }, [selectedCategory]);

  // File selection handler
  const onFilesSelected = useCallback((selectedFiles) => {
    const arr = Array.from(selectedFiles).map((file) => ({
      id: uid(),
      file,
      url: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      uploadedUrl: null,
      error: null,
      category: selectedCategory,
      primary: false,
      name: file.name,
      size: file.size
    }));
    
    setFiles((prev) => [...prev, ...arr]);
    setSuccess(null);
  }, [selectedCategory]);

  // Drag and drop handlers
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [onFilesSelected]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Upload all files
  const startUploadAll = async () => {
    if (!authToken) {
      setError("Authentication required. Please add your API token.");
      setShowAuthInput(true);
      return;
    }

    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    
    if (toUpload.length === 0) {
      setError("No files to upload");
      return;
    }

    setUploading(true);
    setError(null);

    const uploadPromises = toUpload.map(async (fileItem) => {
      setFiles((prev) =>
        prev.map((p) =>
          p.id === fileItem.id ? { ...p, progress: 1 } : p
        )
      );

      try {
        const result = await uploadFileToServer(
          fileItem.file,
          fileItem.category,
          (progress) => {
            setFiles((prev) =>
              prev.map((p) =>
                p.id === fileItem.id ? { ...p, progress } : p
              )
            );
          }
        );

        if (result.success) {
          setFiles((prev) =>
            prev.map((p) =>
              p.id === fileItem.id
                ? {
                    ...p,
                    progress: 100,
                    uploaded: true,
                    uploadedUrl: result.url,
                    error: null
                  }
                : p
            )
          );
          
          return { success: true, file: fileItem.name };
        } else {
          setFiles((prev) =>
            prev.map((p) =>
              p.id === fileItem.id
                ? { ...p, error: result.error || "Upload failed" }
                : p
            )
          );
          return { success: false, file: fileItem.name, error: result.error };
        }
      } catch (err) {
        setFiles((prev) =>
          prev.map((p) =>
            p.id === fileItem.id
              ? { ...p, error: err.message || "Upload error" }
              : p
          )
        );
        return { success: false, file: fileItem.name, error: err.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    setUploading(false);

    const successful = results.filter((r) => r.success).length;
    
    if (successful > 0) {
      setSuccess(`Successfully uploaded ${successful} of ${toUpload.length} files`);
      
      // Refresh certificates list
      fetchCertificatesByCategory(selectedCategory);
      
      // Clear uploaded files after 2 seconds
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => !f.uploaded));
      }, 2000);
    } else {
      setError("Failed to upload any files");
    }
  };

  // File management functions
  const removeFile = (id) => {
    setFiles((prev) => {
      const file = prev.find((x) => x.id === id);
      if (file?.url) URL.revokeObjectURL(file.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const setPrimary = (id) => {
    setFiles((prev) => prev.map((x) => ({ ...x, primary: x.id === id })));
  };

  const moveFile = (id, direction) => {
    setFiles((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      return copy;
    });
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setFiles([]);
    setError(null);
    setSuccess(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Authentication Modal */}
        {showAuthInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                🔐 Authentication Required
              </h3>
              <p className="text-slate-600 mb-4">
                Admin operations require authentication. Please enter your authorization token.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Authorization Token
                </label>
                <input
                  type="password"
                  placeholder="Bearer token"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      saveAuthToken(e.target.value.trim());
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Token will be saved in browser's localStorage
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const token = document.querySelector('input[type="password"]').value.trim();
                    if (token) saveAuthToken(token);
                  }}
                  className="flex-1 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700"
                >
                  Save Token
                </button>
                <button
                  onClick={() => setShowAuthInput(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50"
                >
                  Skip (View Only)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header with Auth Status */}
        <div className="text-center mb-10">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex items-center gap-3">
              {authToken ? (
                <>
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-emerald-700">Authenticated</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthInput(true)}
                  className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-100"
                >
                  ⚠️ Add Token (Upload/Delete)
                </button>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            📜 Certificate Management
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {authToken 
              ? "Upload, view, and manage certificates"
              : "View certificates (upload/delete requires authentication)"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Top controls section */}
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Certificate Dashboard</h2>
                <p className="mt-2 text-slate-600">
                  Currently viewing: <span className="font-semibold capitalize">{selectedCategory}</span> certificates
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category selector */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={!authToken}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      authToken
                        ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white hover:from-sky-700 hover:to-sky-600 shadow-lg shadow-sky-100"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Certificates
                  </button>

                  <button
                    onClick={startUploadAll}
                    disabled={files.length === 0 || uploading || !authToken}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      (files.length === 0 || uploading || !authToken)
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-100"
                    }`}
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      `Upload All (${files.length})`
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status messages */}
            {(error || success) && (
              <div className={`mt-4 p-4 rounded-lg ${error ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${error ? "bg-red-100" : "bg-emerald-100"}`}>
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
                  <p className={error ? "text-red-700" : "text-emerald-700"}>
                    {error || success}
                  </p>
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
          </div>

          {/* Hidden file input */}
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

          {/* Main content area */}
          <div className="p-8">
            {/* Upload zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative rounded-xl border-3 border-dashed p-8 mb-10 transition-all duration-300 ${
                dragActive
                  ? "border-sky-400 bg-gradient-to-br from-sky-50 to-white shadow-lg"
                  : "border-slate-300 bg-gradient-to-br from-white to-slate-50"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-sky-100 to-sky-50 mb-4">
                    <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {dragActive ? "Drop your files here" : "Drag & drop certificate images"}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Drop images or{" "}
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="text-sky-600 font-semibold hover:text-sky-700 underline"
                    >
                      browse
                    </button>{" "}
                    from your computer
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <span
                        key={cat}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedCategory === cat
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-500 mb-1">Selected for Upload</div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{files.length}</div>
                    <div className="text-xs text-slate-500">in {selectedCategory} category</div>
                  </div>
                </div>
              </div>

              {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm text-sky-700 px-6 py-4 rounded-xl font-bold text-lg shadow-2xl border border-sky-200">
                    Release to upload to {selectedCategory}
                  </div>
                </div>
              )}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Queue */}
              <div className="bg-gradient-to-b from-white to-slate-50 rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Upload Queue</h3>
                  {files.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {files.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-slate-400 mb-3">No files in queue</div>
                    <p className="text-sm text-slate-500">
                      Add certificates using drag & drop or the "Add Certificates" button
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {files.map((fileItem, index) => (
                      <div
                        key={fileItem.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {/* Preview */}
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <img
                              src={fileItem.url}
                              alt={fileItem.name}
                              className="max-w-full max-h-full object-cover"
                            />
                          </div>

                          {/* File info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-slate-900 truncate">
                                  {fileItem.name}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-slate-500">
                                    {formatFileSize(fileItem.size)}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                    {fileItem.category}
                                  </span>
                                  {fileItem.primary && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700">
                                      Primary
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => moveFile(fileItem.id, -1)}
                                  disabled={index === 0}
                                  className={`p-1 rounded ${
                                    index === 0
                                      ? "text-slate-300 cursor-not-allowed"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  ◀
                                </button>
                                <button
                                  onClick={() => moveFile(fileItem.id, 1)}
                                  disabled={index === files.length - 1}
                                  className={`p-1 rounded ${
                                    index === files.length - 1
                                      ? "text-slate-300 cursor-not-allowed"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  ▶
                                </button>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>
                                  {fileItem.uploaded
                                    ? "✅ Uploaded"
                                    : fileItem.error
                                    ? "❌ Error"
                                    : `${fileItem.progress}%`}
                                </span>
                                {fileItem.error && (
                                  <span className="text-red-600 text-xs">{fileItem.error}</span>
                                )}
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${fileItem.progress}%` }}
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    fileItem.error
                                      ? "bg-red-500"
                                      : fileItem.uploaded
                                      ? "bg-emerald-500"
                                      : "bg-gradient-to-r from-sky-500 to-sky-400"
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => setPrimary(fileItem.id)}
                                disabled={fileItem.primary || fileItem.uploaded}
                                className={`px-3 py-1.5 text-sm rounded-lg ${
                                  fileItem.primary || fileItem.uploaded
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-sky-600 text-white hover:bg-sky-700"
                                }`}
                              >
                                {fileItem.primary ? "Primary" : "Set Primary"}
                              </button>
                              <button
                                onClick={() => removeFile(fileItem.id)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing Certificates */}
              <div className="bg-gradient-to-b from-white to-slate-50 rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      📂 Existing Certificates ({selectedCategory})
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Total: {uploadedCertificates.length} certificates
                    </p>
                  </div>
                  <button
                    onClick={() => fetchCertificatesByCategory(selectedCategory)}
                    disabled={loading}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                </div>

                {loading && uploadedCertificates.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 text-sky-600 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-slate-500">Loading certificates...</p>
                    </div>
                  </div>
                ) : uploadedCertificates.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-slate-400 mb-3">No certificates found</div>
                    <p className="text-sm text-slate-500">
                      Upload certificates to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {uploadedCertificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Certificate preview */}
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 relative">
                            {cert.url ? (
                              <>
                                <img
                                  src={cert.url}
                                  alt={cert.name}
                                  className="max-w-full max-h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                  }}
                                />
                                <a
                                  href={cert.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all"
                                  title="View full size"
                                >
                                  <div className="opacity-0 group-hover:opacity-100 bg-white/90 p-2 rounded-full">
                                    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </div>
                                </a>
                              </>
                            ) : (
                              <div className="text-slate-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Certificate info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-slate-900 truncate">
                                  {cert.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                                    {cert.category}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatDate(cert.uploadedAt)}
                                  </span>
                                </div>
                                {cert.publicId && (
                                  <div className="mt-2">
                                    <p className="text-xs text-slate-400 truncate" title={cert.publicId}>
                                      ID: {cert.publicId.substring(0, 20)}...
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Certificate actions */}
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={cert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                    title="View certificate"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </a>
                                  
                                  <button
                                    onClick={() => deleteCertificate(cert.id, cert.publicId)}
                                    disabled={!authToken || deletingId === cert.id}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      !authToken
                                        ? "text-slate-300 cursor-not-allowed"
                                        : deletingId === cert.id
                                        ? "text-amber-600 bg-amber-50"
                                        : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                    }`}
                                    title="Delete certificate"
                                  >
                                    {deletingId === cert.id ? (
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                
                                {!authToken && (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    Login to delete
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Category statistics */}
                {uploadedCertificates.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing {uploadedCertificates.length} certificate
                        {uploadedCertificates.length !== 1 ? "s" : ""} in{" "}
                        <span className="font-semibold text-slate-900 capitalize">{selectedCategory}</span> category
                      </div>
                      <div className="text-xs text-slate-500">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}