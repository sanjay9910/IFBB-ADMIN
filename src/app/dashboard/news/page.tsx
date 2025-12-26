"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";

/* ================= TYPES ================= */
type NewsItem = {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ================= CONFIG ================= */
const API_BASE_URL = "https://ifbb-1.onrender.com/api";
const API_POST = `${API_BASE_URL}/admin/news`;
const API_GET = `${API_BASE_URL}/news`;
const API_DELETE = `${API_BASE_URL}/admin/news`;

/* ================= PAGE ================= */
export default function NewsManagerPage() {
  const { token, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  /* ---------- form state ---------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /* ---------- list state ---------- */
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Set mounted flag
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ================= FETCH NEWS ================= */
  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_GET);
      setNewsList(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch news error", err);
      setError("Failed to load news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      fetchNews();
    }
  }, [mounted, isAuthenticated, token]);

  /* ================= HANDLE IMAGE SELECTION ================= */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  /* ================= CREATE NEWS ================= */
  const handlePublish = async () => {
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("published", published.toString());
    if (image) fd.append("image", image);

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await axios.post(API_POST, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        setSuccess("News published successfully!");
        setTitle("");
        setDescription("");
        setImage(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = "";
        
        // Refresh news list
        await fetchNews();
      } else {
        setError(res.data?.message || "Failed to publish news");
      }
    } catch (err: any) {
      console.error("Publish error", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError(err.response?.data?.message || "Failed to publish news. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE NEWS ================= */
  const deleteNews = async (id: string) => {
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    if (!confirm("Are you sure you want to delete this news? This action cannot be undone.")) return;

    try {
      setDeletingId(id);
      setError(null);

      await axios.delete(`${API_DELETE}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNewsList((prev) => prev.filter((n) => n._id !== id));
      setSuccess("News deleted successfully!");
    } catch (err: any) {
      console.error("Delete error", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to delete news. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  /* ================= CLEAR FORM ================= */
  const clearForm = () => {
    setTitle("");
    setDescription("");
    setPublished(true);
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
    setSuccess(null);
  };

  /* ================= FORMAT DATE ================= */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while checking authentication
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ================= STATUS MESSAGES ================= */}
        {(error || success) && (
          <div className={`p-4 rounded-xl ${error ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
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

        {/* ================= CREATE NEWS SECTION ================= */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">
              Create News Article
            </h1>
            <p className="mt-2 text-slate-600">
              Publish news articles with images to keep users updated
            </p>
          </div>

          <div className="p-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    News Title *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter news headline"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setError(null);
                    }}
                    placeholder="Write detailed news content here..."
                    rows={6}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="published"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="published" className="text-sm text-slate-700">
                      Publish immediately
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={clearForm}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={loading || !title.trim() || !description.trim()}
                      className={`px-6 py-2 rounded-lg font-medium transition ${
                        loading || !title.trim() || !description.trim()
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Publishing...
                        </span>
                      ) : (
                        "Publish News"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  News Image (Optional)
                </label>
                
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-indigo-400 transition cursor-pointer bg-gradient-to-br from-slate-50 to-white">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="text-center py-10 cursor-pointer"
                      onClick={() => fileRef.current?.click()}
                    >
                      <div className="text-4xl mb-3">📸</div>
                      <p className="text-slate-600 mb-2">Upload news image</p>
                      <p className="text-sm text-slate-500">Recommended: 1200×630 px</p>
                      <p className="text-xs text-slate-400 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {imagePreview ? "Change Image" : "Select Image"}
                    </button>
                  </div>
                </div>

                {image && (
                  <div className="mt-3 text-sm text-slate-600">
                    Selected: <span className="font-medium">{image.name}</span>
                    <span className="ml-3 text-slate-500">
                      ({(image.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= NEWS LIST SECTION ================= */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">News Articles</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Total: <span className="font-semibold">{newsList.length}</span> articles
                </p>
              </div>
              <button
                onClick={fetchNews}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Refreshing..." : "Refresh List"}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading && newsList.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📰</div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No news articles yet</h3>
                <p className="text-slate-500">Create your first news article above</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsList.map((news) => (
                  <div
                    key={news._id}
                    className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* News Image */}
                    {news.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={news.imageUrl}
                          alt={news.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${news.published ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                            {news.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* News Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 line-clamp-2">
                        {news.title}
                      </h3>

                      <p className="text-slate-600 text-sm mt-2 line-clamp-3">
                        {news.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          {formatDate(news.createdAt)}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(news.imageUrl, '_blank')}
                            disabled={!news.imageUrl}
                            className={`text-xs px-3 py-1 rounded-lg ${
                              news.imageUrl 
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            View Image
                          </button>
                          <button
                            onClick={() => deleteNews(news._id)}
                            disabled={deletingId === news._id}
                            className={`text-xs px-3 py-1 rounded-lg ${
                              deletingId === news._id
                                ? 'bg-red-100 text-red-700'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            {deletingId === news._id ? (
                              <span className="flex items-center gap-1">
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Deleting...
                              </span>
                            ) : (
                              "Delete"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats Footer */}
            {newsList.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div>
                    Showing <span className="font-semibold">{newsList.length}</span> news articles
                    {newsList.some(n => !n.published) && (
                      <span className="ml-3">
                        (<span className="text-emerald-600">{newsList.filter(n => n.published).length}</span> published,
                        <span className="text-slate-500 ml-1">{newsList.filter(n => !n.published).length}</span> drafts)
                      </span>
                    )}
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
  );
}