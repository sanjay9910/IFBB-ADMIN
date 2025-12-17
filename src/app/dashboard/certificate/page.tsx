// src/app/admin/certificates/page.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";

/**
 * Admin - Certificate Upload Page (client component)
 * - Replace uploadFileToServer(file, onProgress) with your real API call (XHR/Axios with FormData)
 * - Uses URL.createObjectURL for previews and revokes on remove/clear
 */

export default function Page() {
  const [files, setFiles] = useState([]); // { id, file, url, progress, uploaded, uploadedUrl, error, primary }
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // unique id helper
  const uid = () => Math.random().toString(36).slice(2, 9);

  // --- Replace this with your actual upload implementation ---
  // Should accept (file, onProgress) and return { success: true, url: "https://..." }
  // For progress: use XHR upload.onprogress or Axios onUploadProgress.
  async function uploadFileToServer(file, onProgress) {
    // Simulated upload for demo (progress updates). Replace with real API call.
    return new Promise((resolve) => {
      const total = file.size || 200000;
      let sent = 0;
      const t = setInterval(() => {
        sent += Math.max(15000, total * 0.07);
        const pct = Math.min(100, Math.round((sent / total) * 100));
        onProgress(pct);
        if (pct >= 100) {
          clearInterval(t);
          // Simulated uploaded URL (server should return real storage URL)
          resolve({ success: true, url: URL.createObjectURL(file) });
        }
      }, 160);
    });
  }
  // ---------------------------------------------------------

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

  function removeFile(id) {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.url) URL.revokeObjectURL(f.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  function setPrimary(id) {
    setFiles((prev) => prev.map((x) => ({ ...x, primary: x.id === id })));
  }

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

  async function startUploadAll() {
    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    if (toUpload.length === 0) {
      alert("No files to upload");
      return;
    }

    // Upload in parallel (per-file progress)
    toUpload.forEach(async (f) => {
      // ensure progress UI exists
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

  function clearAll() {
    files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setFiles([]);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Certificates</h1>
          <p className="mt-2 text-sm text-slate-600">
            Upload certificate images (single or multiple). Previews, reorder, set primary and upload.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Upload Certificates</h2>
                <p className="mt-1 text-sm text-slate-500">PNG, JPG recommended. Each certificate will be previewed for confirmation.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => inputRef.current && inputRef.current.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 transition"
                >
                  Select images
                </button>

                <button
                  onClick={startUploadAll}
                  disabled={files.length === 0}
                  className={`px-4 py-2 rounded-md border ${files.length === 0 ? "text-slate-400 border-slate-200" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  Upload all
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
          </div>

          <div className="p-6">
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

            {/* drag/drop box */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative rounded-md border-2 border-dashed p-6 mb-6 transition-colors ${
                dragActive ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                  <p className="text-lg font-medium text-slate-900">Drag & drop certificate images here</p>
                  <p className="mt-1 text-sm text-slate-500">Drop images or click <span className="font-medium">Select images</span>.</p>
                </div>

                <div className="w-36 text-center">
                  <div className="text-xs text-slate-500">Selected</div>
                  <div className="text-2xl font-semibold text-slate-900">{files.length}</div>
                </div>
              </div>

              {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/80 text-sky-700 px-3 py-2 rounded-md font-medium">Release to upload</div>
                </div>
              )}
            </div>

            {/* previews grid centered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-stretch">
              {files.map((f, i) => (
                <div key={f.id} className="bg-white border rounded-lg p-3 flex flex-col items-stretch shadow-sm">
                  <div className="w-full h-44 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img src={f.url} alt={`cert-${i}`} className="max-w-full max-h-full object-contain" />
                    {f.primary && <span className="absolute top-3 left-3 bg-sky-600 text-white text-xs px-2 py-1 rounded">Primary</span>}
                  </div>

                  <div className="mt-3 flex-1">
                    <div className="text-sm font-medium text-slate-900 truncate">{f.file.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{Math.round(f.file.size / 1024)} KB</div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                      <div style={{ width: `${f.progress ?? 0}%` }} className="h-2 bg-gradient-to-r from-sky-500 to-sky-300 transition-all" />
                    </div>
                    <div className="text-xs text-slate-500 mt-2">{f.uploaded ? "Uploaded" : f.error ? `Error` : `${f.progress ?? 0}%`}</div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setPrimary(f.id)}
                      disabled={f.primary}
                      className={`flex-1 px-3 py-2 rounded-md text-sm ${f.primary ? "bg-slate-100 text-slate-500" : "bg-sky-600 text-white hover:bg-sky-700"}`}
                    >
                      Set Primary
                    </button>

                    <button
                      onClick={() => removeFile(f.id)}
                      className="px-2 py-2 rounded-md border text-sm text-red-600 hover:bg-red-50"
                      aria-label="Remove certificate"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => move(f.id, -1)}
                      disabled={i === 0}
                      className="px-2 py-1 rounded-md border text-sm text-slate-600 hover:bg-slate-50"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => move(f.id, +1)}
                      disabled={i === files.length - 1}
                      className="px-2 py-1 rounded-md border text-sm text-slate-600 hover:bg-slate-50"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {files.length === 0 && (
              <div className="mt-6 text-center text-slate-500">
                No certificates selected yet. Use drag & drop or click{" "}
                <button onClick={() => inputRef.current && inputRef.current.click()} className="text-sky-600">Select images</button>.
              </div>
            )}
          </div>

          <div className="p-4 border-t text-sm text-slate-600">
            Tip: After uploading, save your certificate details on server and store returned image URLs. Replace <code>uploadFileToServer</code> above with your API call.
          </div>
        </div>
      </div>
    </div>
  );
}
