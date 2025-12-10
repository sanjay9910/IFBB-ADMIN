// src/app/admin/brands/page.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";

/**
 * Brand images admin page (single or multiple upload)
 * - Pure client-side JS/React
 * - Replace `uploadFileToServer(file, onProgress)` with your real API call
 */

export default function Page() {
  const [files, setFiles] = useState([]); // { id, file, url, progress, uploaded, error, primary }
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // helper: unique id
  const uid = () => Math.random().toString(36).slice(2, 9);

  // Replace this function with your real API upload.
  // It should accept (file, onProgress) and return { success: true, url: "https://..." }.
  // You can implement XHR/Axios for real progress callbacks.
  async function uploadFileToServer(file, onProgress) {
    // Simulated upload with progress for demo. Replace with real upload.
    return new Promise((res) => {
      const total = file.size || 1000000;
      let sent = 0;
      const interval = setInterval(() => {
        sent += Math.max(20000, total * 0.06);
        const progress = Math.min(1, sent / total);
        onProgress(Math.round(progress * 100));
        if (progress >= 1) {
          clearInterval(interval);
          // Simulated uploaded URL (replace with server response)
          res({ success: true, url: URL.createObjectURL(file) });
        }
      }, 180);
    });
  }

  // when files are selected from input or dropped
  const onFilesSelected = useCallback((selectedFiles) => {
    const arr = Array.from(selectedFiles).map((f) => ({
      id: uid(),
      file: f,
      url: URL.createObjectURL(f),
      progress: 0,
      uploaded: false,
      uploadedUrl: null,
      error: null,
      primary: false,
    }));
    setFiles((prev) => [...prev, ...arr]);
  }, []);

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

  // remove a selected file
  function removeFile(id) {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.url) URL.revokeObjectURL(f.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  // set primary image (single)
  function setPrimary(id) {
    setFiles((prev) => prev.map((x) => ({ ...x, primary: x.id === id })));
  }

  // move item left (-1) or right (+1)
  function move(id, dir) {
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

  // start uploading all (parallel)
  function startUploadAll() {
    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    if (toUpload.length === 0) {
      alert("No files to upload");
      return;
    }

    toUpload.forEach(async (f) => {
      // ensure progress exists
      setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, progress: 1 } : p)));
      try {
        const resp = await uploadFileToServer(f.file, (pct) =>
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, progress: pct } : p)))
        );

        if (resp?.success) {
          setFiles((prev) =>
            prev.map((p) =>
              p.id === f.id ? { ...p, progress: 100, uploaded: true, uploadedUrl: resp.url } : p
            )
          );
        } else {
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, error: "Upload failed" } : p)));
        }
      } catch (err) {
        setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, error: "Upload error" } : p)));
      }
    });
  }

  // clear all selected files
  function clearAll() {
    files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setFiles([]);
  }

  // UI
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold text-slate-900">Brand Images</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload brand logos/images. You can upload one or multiple images. After uploading, replace the simulated upload function
              with your API.
            </p>
          </div>

          <div className="p-6">
            {/* Drag & Drop area */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
                dragActive ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
              }`}
              aria-label="Drop files here"
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

              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                  <p className="text-lg font-medium text-slate-900">Drag & drop images here</p>
                  <p className="mt-1 text-sm text-slate-500">
                    PNG, JPG, GIF — high quality logos recommended. You can upload multiple images.
                  </p>

                  <div className="mt-4 flex items-center gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => inputRef.current && inputRef.current.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 text-white shadow hover:bg-sky-700 transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Select images
                    </button>

                    <button
                      onClick={startUploadAll}
                      disabled={files.length === 0}
                      className={`px-4 py-2 rounded-md border ${files.length === 0 ? "text-slate-400 border-slate-200" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      Upload
                    </button>

                    <button
                      onClick={clearAll}
                      disabled={files.length === 0}
                      className="px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-64 flex-shrink-0">
                  <div className="rounded-md bg-slate-100 p-3 text-center">
                    <div className="text-xs text-slate-500">Selected</div>
                    <div className="text-2xl font-semibold text-slate-900">{files.length}</div>
                    <div className="text-xs text-slate-400 mt-1">files</div>
                  </div>
                </div>
              </div>

              {/* overlay when dragging */}
              {dragActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-sky-700 bg-white/80 px-4 py-2 rounded-md">Drop to upload</div>
                </div>
              )}
            </div>

            {/* previews */}
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((f, i) => (
                  <div key={f.id} className="bg-white border rounded-lg p-3 flex flex-col">
                    <div className="relative w-full h-40 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img src={f.url} alt={`preview-${i}`} className="max-w-full max-h-full object-contain" />
                      {f.primary && <span className="absolute top-2 left-2 bg-sky-600 text-white text-xs px-2 py-1 rounded">Primary</span>}
                    </div>

                    <div className="mt-3 flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">{f.file.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{Math.round(f.file.size / 1024)} KB</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setPrimary(f.id)}
                        disabled={f.primary}
                        className={`flex-1 px-2 py-2 rounded-md text-sm ${f.primary ? "bg-slate-100 text-slate-500" : "bg-sky-600 text-white hover:bg-sky-700"}`}
                      >
                        Set primary
                      </button>

                      <button
                        onClick={() => removeFile(f.id)}
                        className="px-2 py-2 rounded-md border text-sm text-red-600 hover:bg-red-50"
                        aria-label="Remove image"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="w-full h-2 bg-slate-100 rounded">
                        <div
                          style={{ width: `${f.progress ?? 0}%` }}
                          className={`h-2 rounded bg-gradient-to-r from-sky-500 to-sky-300 transition-all`}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        {f.uploaded ? "Uploaded" : f.error ? `Error: ${f.error}` : `${f.progress ?? 0}%`}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => move(f.id, -1)}
                        className="px-2 py-1 rounded border text-sm text-slate-600 hover:bg-slate-50"
                        aria-label="Move left"
                        disabled={i === 0}
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => move(f.id, +1)}
                        className="px-2 py-1 rounded border text-sm text-slate-600 hover:bg-slate-50"
                        aria-label="Move right"
                        disabled={i === files.length - 1}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {files.length === 0 && (
                <div className="mt-6 text-center text-slate-500">
                  No images selected yet. Use drag & drop or click{" "}
                  <button onClick={() => inputRef.current && inputRef.current.click()} className="text-sky-600">
                    Select images
                  </button>
                  .
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer / notes */}
        <div className="mt-6 max-w-5xl mx-auto text-sm text-slate-500">
          <p>
            After selecting images, click <strong>Upload</strong>. Replace the <code>uploadFileToServer</code> function in this file with your real API
            (use fetch/XHR with FormData). The component will call that function for each selected file and display per-file upload progress.
          </p>
        </div>
      </div>
    </div>
  );
}
