"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

/* ================= CONFIG ================= */
const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NjA0OTE3NSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjYzMDgzNzV9.-GBlOh0DFjsURFWFrxUtFVs10kfL64gCy0T2EMk36iQ";

const API_POST = "https://ifbb-1.onrender.com/api/admin/news";
const API_GET = "https://ifbb-1.onrender.com/api/news";
const API_DELETE = "https://ifbb-1.onrender.com/api/admin/news";

/* ================= PAGE ================= */
export default function Page() {
  /* ---------- form state ---------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [image, setImage] = useState(null);

  /* ---------- list state ---------- */
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);

  /* ================= FETCH NEWS ================= */
  const fetchNews = async () => {
    try {
      const res = await axios.get(API_GET);
      setNewsList(res.data?.data || []);
    } catch (err) {
      console.error("Fetch news error", err);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  /* ================= CREATE NEWS ================= */
  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Title and description required");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("published", published);
    if (image) fd.append("image", image);

    try {
      setLoading(true);

      const res = await axios.post(API_POST, fd, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });

      if (res.data?.success) {
        alert("News published successfully");
        setTitle("");
        setDescription("");
        setImage(null);
        fetchNews();
      }
    } catch (err) {
      console.error("Publish error", err);
      alert("Failed to publish news");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE NEWS ================= */
  const deleteNews = async (id) => {
    if (!confirm("Are you sure you want to delete this news?")) return;

    try {
      await axios.delete(`${API_DELETE}/${id}`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });

      setNewsList((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Delete error", err);
      alert("Delete failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ================= CREATE NEWS ================= */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Create News
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="News title"
                className="w-full border rounded-md text-black px-3 py-2 text-sm"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="News description"
                rows={5}
                className="w-full border text-black rounded-md px-3 py-2 text-sm"
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                <span className="text-sm text-black">Published</span>
              </div>

              <div className="flex gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileRef.current.click()}
                  className="px-4 py-2 bg-sky-600 text-white rounded-md text-sm"
                >
                  Select Image
                </button>

                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm"
                >
                  {loading ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>

            {image && (
              <div className="border rounded-md p-3">
                <img
                  src={URL.createObjectURL(image)}
                  alt="preview"
                  className="w-full h-48 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* ================= NEWS LIST ================= */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl text-black font-bold mb-6">All News</h2>

          {newsList.length === 0 ? (
            <p className="text-slate-500">No news found</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsList.map((n) => (
                <div
                  key={n._id}
                  className="border rounded-xl p-4 flex flex-col shadow-sm"
                >
                  {n.imageUrl && (
                    <img
                      src={n.imageUrl}
                      alt={n.title}
                      className="h-40 w-full object-cover rounded-md"
                    />
                  )}

                  <h3 className="mt-3 font-semibold text-slate-900">
                    {n.title}
                  </h3>

                  <p className="text-sm text-slate-600 mt-1 line-clamp-3">
                    {n.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => deleteNews(n._id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
