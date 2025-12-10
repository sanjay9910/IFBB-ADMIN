// src/app/admin/news/page.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";


export default function Page() {
  // ---- state ----
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [featured, setFeatured] = useState(null); 
  const [gallery, setGallery] = useState([]); 
  const [dragActive, setDragActive] = useState(false);

  const fileRef = useRef(null);
  const galleryRef = useRef(null);

  // ---- helpers ----
  const uid = () => Math.random().toString(36).slice(2, 9);
  async function uploadFileToServer(file, onProgress) {
    return new Promise((resolve) => {
      const total = file.size || 200000;
      let sent = 0;
      const t = setInterval(() => {
        sent += Math.max(15000, total * 0.06);
        const pct = Math.min(100, Math.round((sent / total) * 100));
        onProgress(pct);
        if (pct >= 100) {
          clearInterval(t);
          resolve({ success: true, url: URL.createObjectURL(file) });
        }
      }, 140);
    });
  }


  async function publishNewsToApi(payload) {
    return new Promise((res) => setTimeout(() => res({ success: true, id: uid() }), 600));
  }

  // Create preview object for a file
  function makePreview(file) {
    return {
      id: uid(),
      file,
      url: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      uploadedUrl: null,
      error: null,
      primary: false,
    };
  }

  // ---- featured handlers ----
  function addFeatured(file) {
    if (!file) return;
    if (featured?.url) URL.revokeObjectURL(featured.url);
    setFeatured(makePreview(file));
  }
  function removeFeatured() {
    if (featured?.url) URL.revokeObjectURL(featured.url);
    setFeatured(null);
  }

  // ---- gallery handlers ----
  const addGalleryFiles = useCallback((filesList) => {
    const arr = Array.from(filesList).map((f) => makePreview(f));
    setGallery((prev) => [...prev, ...arr]);
  }, []);

  function removeGallery(id) {
    setGallery((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.url) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function setGalleryPrimary(id) {
    setGallery((prev) => prev.map((p) => ({ ...p, primary: p.id === id })));
  }

  function moveGallery(id, dir) {
    setGallery((prev) => {
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

  // ---- file input handlers ----
  function onFeaturedSelected(e) {
    const f = e.target.files?.[0];
    if (f) addFeatured(f);
    // reset input
    e.currentTarget.value = "";
  }

  function onGallerySelected(e) {
    if (e.target.files && e.target.files.length) addGalleryFiles(e.target.files);
    e.currentTarget.value = "";
  }

  // drag handlers for gallery area
  function onDropGallery(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length) addGalleryFiles(e.dataTransfer.files);
  }
  function onDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  async function uploadAllMedia() {
    // featured
    let featuredUrl = featured?.uploadedUrl || null;
    if (featured && !featured.uploaded && !featured.error) {
      setFeatured((p) => (p ? { ...p, progress: 1 } : p));
      try {
        const resp = await uploadFileToServer(featured.file, (pct) =>
          setFeatured((p) => (p ? { ...p, progress: pct } : p))
        );
        if (resp?.success) {
          setFeatured((p) => (p ? { ...p, uploaded: true, uploadedUrl: resp.url, progress: 100 } : p));
          featuredUrl = resp.url;
        } else {
          setFeatured((p) => (p ? { ...p, error: "Upload failed" } : p));
        }
      } catch (err) {
        setFeatured((p) => (p ? { ...p, error: "Upload error" } : p));
      }
    }

    // gallery parallel
    const toUpload = gallery.filter((g) => !g.uploaded && !g.error);
    const promises = toUpload.map(
      (g) =>
        new Promise(async (res) => {
          setGallery((prev) => prev.map((p) => (p.id === g.id ? { ...p, progress: 1 } : p)));
          try {
            const r = await uploadFileToServer(g.file, (pct) =>
              setGallery((prev) => prev.map((p) => (p.id === g.id ? { ...p, progress: pct } : p)))
            );
            if (r?.success) {
              setGallery((prev) => prev.map((p) => (p.id === g.id ? { ...p, uploaded: true, uploadedUrl: r.url, progress: 100 } : p)));
              res({ success: true, url: r.url, id: g.id });
            } else {
              setGallery((prev) => prev.map((p) => (p.id === g.id ? { ...p, error: "Upload failed" } : p)));
              res({ success: false, id: g.id });
            }
          } catch (err) {
            setGallery((prev) => prev.map((p) => (p.id === g.id ? { ...p, error: "Upload error" } : p)));
            res({ success: false, id: g.id });
          }
        })
    );

    await Promise.all(promises);

    const galleryUrls = gallery.map((g) => g.uploadedUrl).filter(Boolean);
    return { featuredUrl, galleryUrls };
  }

  // ---- publish ----
  async function onPublish() {
    if (!title.trim()) {
      alert("Please provide a title.");
      return;
    }

    // upload media first
    const { featuredUrl, galleryUrls } = await uploadAllMedia();

    // prepare payload
    const payload = {
      title: title.trim(),
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      summary,
      content,
      publishDate: publishDate || null,
      featuredUrl,
      gallery: galleryUrls,
    };

    // call publish API
    const resp = await publishNewsToApi(payload);
    if (resp?.success) {
      alert("News published successfully");
      // cleanup preview URLs and state
      if (featured?.url) URL.revokeObjectURL(featured.url);
      gallery.forEach((g) => g.url && URL.revokeObjectURL(g.url));
      setTitle("");
      setCategory("General");
      setTags("");
      setSummary("");
      setContent("");
      setPublishDate("");
      setFeatured(null);
      setGallery([]);
    } else {
      alert("Failed to publish news");
    }
  }

  // ---- UI ----
  const isPublishDisabled = !title.trim();

  return (
    <div className=" h-[100%] bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Create News</h1>
          <p className="mt-2 text-sm text-slate-600">Add news item with featured image and gallery. Replace API functions to integrate.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Title</span>
                    <span className="text-xs text-slate-400">{title.length}/150</span>
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    placeholder="Enter news title..."
                    className="mt-2 block w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Summary</span>
                  <input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short summary (optional)"
                    className="mt-2 block w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Content</span>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write full content here..."
                    rows={6}
                    className="mt-2 block w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label>
                  <span className="text-sm font-medium text-slate-700">Category</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 block w-full rounded-md border px-3 py-2 text-sm">
                    <option>General</option>
                    <option>Announcements</option>
                    <option>Events</option>
                    <option>Updates</option>
                    <option>Promotions</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">Tags (comma separated)</span>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fitness, exam" className="mt-2 block w-full rounded-md border px-3 py-2 text-sm" />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">Publish date</span>
                  <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="mt-2 block w-full rounded-md border px-3 py-2 text-sm" />
                </label>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Featured */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-slate-800">Featured Image</h3>
                <div className="text-sm text-slate-500">Single image</div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-1/3">
                  <div className="bg-white border rounded-md p-3">
                    <div className="h-40 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                      {featured ? (
                        <img src={featured.url} alt="featured" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-slate-400 text-sm">No featured image</div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFeaturedSelected} />
                      <button onClick={() => fileRef.current && fileRef.current.click()} className="px-3 py-2 rounded-md bg-sky-600 text-white text-sm">Select</button>
                      <button onClick={removeFeatured} disabled={!featured} className="px-3 py-2 rounded-md border text-sm text-red-600">Remove</button>
                    </div>

                    {featured && (
                      <div className="mt-3">
                        <div className="w-full h-2 bg-slate-100 rounded">
                          <div style={{ width: `${featured.progress ?? 0}%` }} className="h-2 bg-sky-500 rounded transition-all" />
                        </div>
                        <div className="text-xs text-slate-500 mt-2">{featured.uploaded ? "Uploaded" : featured.error ? "Error" : `${featured.progress ?? 0}%`}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                <div className="flex-1">
                  <div className={`rounded-md border-2 border-dashed p-4 ${dragActive ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"}`} onDrop={onDropGallery} onDragOver={onDragOver} onDragLeave={onDragLeave}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Gallery</h4>
                        <div className="text-xs text-slate-500">Drag & drop or select multiple images</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input ref={galleryRef} type="file" multiple accept="image/*" className="hidden" onChange={onGallerySelected} />
                        <button onClick={() => galleryRef.current && galleryRef.current.click()} className="px-3 py-2 rounded-md bg-white border text-sm">Select</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {gallery.map((g, i) => (
                        <div key={g.id} className="bg-white border rounded-md p-2 flex flex-col">
                          <div className="w-full h-28 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                            <img src={g.url} alt={`g-${i}`} className="max-h-full max-w-full object-contain" />
                            {g.primary && <span className="absolute top-2 left-2 bg-sky-600 text-white text-xs px-2 py-1 rounded">Primary</span>}
                          </div>

                          <div className="mt-2 text-xs text-slate-700 truncate">{g.file.name}</div>

                          <div className="mt-2 flex items-center gap-2">
                            <button onClick={() => setGalleryPrimary(g.id)} disabled={g.primary} className={`flex-1 text-xs px-2 py-1 rounded ${g.primary ? "bg-slate-100 text-slate-500" : "bg-sky-600 text-white"}`}>Set primary</button>
                            <button onClick={() => removeGallery(g.id)} className="px-2 py-1 rounded border text-xs text-red-600">Remove</button>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <button onClick={() => moveGallery(g.id, -1)} disabled={i === 0} className="px-2 py-1 rounded border text-xs">◀</button>
                            <button onClick={() => moveGallery(g.id, +1)} disabled={i === gallery.length - 1} className="px-2 py-1 rounded border text-xs">▶</button>
                          </div>

                          <div className="mt-2">
                            <div className="w-full h-1 bg-slate-100 rounded">
                              <div style={{ width: `${g.progress ?? 0}%` }} className="h-1 bg-sky-500 rounded transition-all" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {gallery.length === 0 && <div className="mt-4 text-sm text-slate-500 text-center">No gallery images yet</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <div className="text-sm text-slate-500">Preview will use uploaded URLs after uploading.</div>

              <div className="flex items-center gap-3">
                <button onClick={() => { setTitle(""); setSummary(""); setContent(""); setTags(""); setGallery([]); removeFeatured(); }} className="px-4 py-2 rounded-md border text-sm">Reset</button>

                <button onClick={onPublish} disabled={isPublishDisabled} className={`px-4 py-2 rounded-md text-sm text-white ${isPublishDisabled ? "bg-slate-300" : "bg-sky-600 hover:bg-sky-700"}`}>
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
