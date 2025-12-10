// src/app/admin/courses/page.tsx
"use client";

import React, { useMemo, useState } from "react";

/**
 * Improved Courses Admin Page
 * - Modern, professional UI
 * - Responsive grid
 * - Create / Edit modal with image preview
 * - View modal
 *
 * Replace saveCourseToApi / file uploads with real APIs.
 */

/* ---------------- Types ---------------- */
type ModuleItem = { id: string; title: string };
type Course = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  rating?: number;
  duration?: string;
  modules: ModuleItem[];
  imageUrl?: string | null;
  description?: string;
  visibility: "public" | "private";
  published: boolean;
  tags: string[];
  createdAt: string;
};

/* ------------- Helpers & Dummy ------------- */
const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 9);

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=9ad9b3a1f9b0f3f9b8ef8bfb7b7e7f1a";

const INITIAL_COURSES: Course[] = [
  {
    id: uid("c-"),
    title: "Beginner Bodybuilding Plan",
    price: 14.99,
    originalPrice: 19.99,
    rating: 4.5,
    duration: "3h 0m",
    modules: [
      { id: uid("m-"), title: "Intro to Bodybuilding" },
      { id: uid("m-"), title: "Workout Plan" },
    ],
    imageUrl: PLACEHOLDER,
    description:
      "A beginner-friendly bodybuilding course covering fundamentals, nutrition, and sample workouts.",
    visibility: "public",
    published: true,
    tags: ["bodybuilding", "beginner", "workout"],
    createdAt: new Date().toISOString(),
  },
  {
    id: uid("c-"),
    title: "Advanced Nutrition & Cutting",
    price: 29.99,
    originalPrice: null,
    rating: 4.8,
    duration: "5h 20m",
    modules: [
      { id: uid("m-"), title: "Macronutrients Deep Dive" },
      { id: uid("m-"), title: "Meal Timing" },
      { id: uid("m-"), title: "Supplements" },
    ],
    imageUrl: PLACEHOLDER,
    description: "Advanced nutrition tactics for cutting fat and preserving muscle.",
    visibility: "private",
    published: false,
    tags: ["nutrition", "advanced"],
    createdAt: new Date().toISOString(),
  },
];

/* ----------------- Fake API ----------------- */
async function saveCourseToApi(course: Course) {
  // Replace this with a real API call
  return new Promise<{ success: boolean; id?: string }>((res) =>
    setTimeout(() => res({ success: true, id: course.id }), 500)
  );
}

/* ---------------- Small components ---------------- */
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">{children}</span>;
}

function Icon({ name }: { name: string }) {
  const map: Record<string, string> = {
    eye: "👁️",
    lock: "🔒",
    star: "⭐",
    edit: "✏️",
    trash: "🗑️",
    plus: "➕",
    publish: "🚀",
    draft: "📦",
  };
  return <span className="text-sm">{map[name] ?? "•"}</span>;
}

/* ------------------ Page ------------------ */
export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [query, setQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.join(" ").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [query, courses]);

  /* Handlers */
  function openNewCourse() {
    setEditing({
      id: uid("c-"),
      title: "",
      price: 0,
      originalPrice: null,
      rating: 0,
      duration: "",
      modules: [{ id: uid("m-"), title: "" }],
      imageUrl: null,
      description: "",
      visibility: "private",
      published: false,
      tags: [],
      createdAt: new Date().toISOString(),
    });
    setFormOpen(true);
  }

  function openEditCourse(c: Course) {
    setEditing(JSON.parse(JSON.stringify(c)));
    setFormOpen(true);
  }

  function closeForm() {
    // revoke preview blob urls if used
    if (editing?.imageUrl && editing.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editing.imageUrl);
    }
    setEditing(null);
    setFormOpen(false);
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) {
      alert("Please enter title");
      return;
    }
    setSaving(true);
    const resp = await saveCourseToApi(editing);
    if (!resp.success) {
      alert("Save failed");
      setSaving(false);
      return;
    }
    setCourses((prev) => {
      const exists = prev.some((p) => p.id === editing.id);
      if (exists) return prev.map((p) => (p.id === editing.id ? editing : p));
      return [editing, ...prev];
    });
    setSaving(false);
    setFormOpen(false);
    setEditing(null);
  }

  function onDelete(courseId: string) {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    setCourses((prev) => prev.filter((p) => p.id !== courseId));
  }

  function toggleVisibility(courseId: string) {
    setCourses((prev) => prev.map((p) => (p.id === courseId ? { ...p, visibility: p.visibility === "public" ? "private" : "public" } : p)));
  }

  function togglePublish(courseId: string) {
    setCourses((prev) => prev.map((p) => (p.id === courseId ? { ...p, published: !p.published } : p)));
  }

  /* UI */
  return (
    <div className="min-h-[calc(100vh-4rem)] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Courses</h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Manage your course catalog — add new courses, edit details, publish or archive. Replace the placeholder save function with your API call.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm w-full md:w-[460px]">
              <svg className="w-4 h-4 text-slate-400 mr-3" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, tags or description..."
                className="outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
                aria-label="Search courses"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-xs text-slate-500 ml-2">Clear</button>
              )}
            </div>

            <button onClick={openNewCourse} className="ml-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">
              <span className="text-lg">➕</span>
              <span className="font-medium">New Course</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <article key={c.id} className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition p-4 flex flex-col h-full">
              <div className="relative rounded-xl overflow-hidden h-44 bg-slate-100">
                <img src={c.imageUrl ?? PLACEHOLDER} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Pill><Icon name="star" /> <span className="ml-1 font-medium text-xs">{c.rating ?? "—"}</span></Pill>
                  <Pill>{c.duration ?? "—"}</Pill>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(c.id)}
                    title={c.published ? "Unpublish" : "Publish"}
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${c.published ? "bg-emerald-600 text-white" : "bg-white/80 text-slate-700 border"}`}
                  >
                    {c.published ? "Published" : "Draft"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">{c.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm">
                      {c.originalPrice ? <span className="text-xs line-through text-slate-400 mr-1">${c.originalPrice.toFixed(2)}</span> : null}
                      <div className="text-indigo-700 font-bold">${c.price.toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  <strong className="text-slate-800">{c.modules.length}</strong> module(s) • {c.tags.length ? c.tags.map(t => <span key={t} className="inline-block mr-2 text-slate-700">#{t}</span>) : <span className="text-slate-400">no tags</span>}
                </div>

                <div className="mt-4 flex gap-2 items-center">
                  <button onClick={() => setSelectedCourse(c)} className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">View</button>
                  <button onClick={() => openEditCourse(c)} className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">Edit</button>
                  <button onClick={() => onDelete(c.id)} className="px-3 py-2 bg-white border rounded-lg text-sm text-red-600 hover:bg-red-50">Delete</button>
                </div>

                <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
                  <div>{c.visibility === "public" ? <span className="inline-flex items-center gap-1"> <Icon name="eye" /> Public</span> : <span className="inline-flex items-center gap-1"><Icon name="lock" /> Private</span>}</div>
                  <div>
                    <button onClick={() => toggleVisibility(c.id)} className="px-2 py-1 rounded bg-slate-50 border text-slate-700 text-xs">
                      {c.visibility === "public" ? "Make private" : "Make public"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && <div className="mt-8 text-center text-slate-500">No courses found.</div>}
      </div>

      {/* ---------- Form Modal (Create / Edit) ---------- */}
      {formOpen && editing && (
        <div className="fixed inset-0 z-60 flex items-start md:items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={closeForm} />
          <form onSubmit={submitForm} className="relative z-50 w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-auto max-h-[90vh]">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{courses.find(x => x.id === editing.id) ? "Edit Course" : "Create Course"}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={closeForm} className="px-3 py-1 rounded-md border">Close</button>
                <button type="submit" disabled={saving} className={`px-4 py-2 rounded-md text-white ${saving ? "bg-slate-300" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <label className="block">
                    <div className="text-sm font-medium">Course title</div>
                    <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-2 block w-full rounded-md border px-3 py-2" />
                  </label>

                  <label className="block">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">Short description</div>
                      <div className="text-xs text-slate-400">{(editing.description || "").length}/200</div>
                    </div>
                    <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} className="mt-2 block w-full rounded-md border px-3 py-2" />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <div className="text-sm font-medium">Price (USD)</div>
                      <input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="mt-2 block w-full rounded-md border px-3 py-2" />
                    </label>

                    <label>
                      <div className="text-sm font-medium">Original price (optional)</div>
                      <input type="number" step="0.01" value={editing.originalPrice ?? ""} onChange={(e) => setEditing({ ...editing, originalPrice: e.target.value ? Number(e.target.value) : null })} className="mt-2 block w-full rounded-md border px-3 py-2" />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label>
                      <div className="text-sm font-medium">Rating</div>
                      <input type="number" step="0.1" min={0} max={5} value={editing.rating ?? 0} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} className="mt-2 block w-full rounded-md border px-3 py-2" />
                    </label>

                    <label>
                      <div className="text-sm font-medium">Duration</div>
                      <input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="mt-2 block w-full rounded-md border px-3 py-2" />
                    </label>

                    <label>
                      <div className="text-sm font-medium">Visibility</div>
                      <select value={editing.visibility} onChange={(e) => setEditing({ ...editing, visibility: e.target.value as any })} className="mt-2 block w-full rounded-md border px-3 py-2">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Modules</div>
                      <button type="button" onClick={() => setEditing({ ...editing, modules: [...editing.modules, { id: uid("m-"), title: "" }] })} className="text-xs text-indigo-600">Add module</button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {editing.modules.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2">
                          <input value={m.title} onChange={(e) => setEditing({ ...editing, modules: editing.modules.map(x => x.id === m.id ? { ...x, title: e.target.value } : x) })} className="flex-1 rounded-md border px-3 py-2" placeholder={`Module ${i + 1} title`} />
                          <button type="button" onClick={() => setEditing({ ...editing, modules: editing.modules.filter(x => x.id !== m.id) })} className="px-3 py-1 rounded-md border text-red-600">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label>
                    <div className="text-sm font-medium">Tags (comma separated)</div>
                    <input value={editing.tags.join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} className="mt-2 block w-full rounded-md border px-3 py-2" />
                  </label>
                </div>

                {/* right column */}
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Course image</div>
                    <div className="mt-2 rounded-md border p-2 bg-slate-50">
                      <div className="h-40 w-full rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                        {editing.imageUrl ? <img src={editing.imageUrl} alt="preview" className="w-full h-full object-cover" /> : <div className="text-sm text-slate-400">No image selected</div>}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <input type="file" accept="image/*" id="courseImage" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (editing.imageUrl && editing.imageUrl.startsWith("blob:")) URL.revokeObjectURL(editing.imageUrl);
                          const url = URL.createObjectURL(f);
                          setEditing({ ...editing, imageUrl: url });
                        }} />
                        <label htmlFor="courseImage" className="px-3 py-2 rounded-md bg-white border cursor-pointer text-sm">Upload</label>
                        <button type="button" onClick={() => setEditing({ ...editing, imageUrl: null })} className="px-3 py-2 rounded-md border text-sm">Remove</button>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">Recommended 1200×720 px. JPG/PNG.</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-md p-3 border">
                    <div className="text-xs text-slate-500">Quick actions</div>
                    <div className="mt-3 flex flex-col gap-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
                        <span className="text-sm">Published</span>
                      </label>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditing({ ...editing, visibility: editing.visibility === "public" ? "private" : "public" })} className="px-3 py-2 rounded-md border text-sm">
                          Toggle visibility
                        </button>
                        <button type="button" onClick={() => setEditing({ ...editing, price: Math.max(0, (editing.price || 0) - 1) })} className="px-3 py-2 rounded-md border text-sm">Price -</button>
                        <button type="button" onClick={() => setEditing({ ...editing, price: Number(((editing.price || 0) + 1).toFixed(2)) })} className="px-3 py-2 rounded-md border text-sm">Price +</button>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Note: This UI stores images as client previews (object URLs). Integrate with your upload API in <code className="bg-slate-100 px-1 py-0.5 rounded">saveCourseToApi</code>.
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------- View Modal ---------- */}
      {selectedCourse && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedCourse(null)} />
          <div className="relative z-50 max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-auto max-h-[90vh]">
            <div className="p-4 border-b flex items-start gap-4">
              <div className="w-36 h-24 rounded overflow-hidden bg-slate-100">
                <img src={selectedCourse.imageUrl ?? PLACEHOLDER} alt={selectedCourse.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedCourse.title}</h3>
                <div className="text-sm text-slate-500 mt-1">{selectedCourse.tags.map(t => <span key={t} className="mr-2">#{t}</span>)}</div>
                <div className="mt-3 text-sm text-slate-700">{selectedCourse.description}</div>
              </div>
              <div>
                <button onClick={() => setSelectedCourse(null)} className="px-3 py-1 rounded border">Close</button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Modules</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {selectedCourse.modules.map(m => <li key={m.id}>{m.title}</li>)}
                  </ul>
                </div>

                <div>
                  <div className="text-sm font-medium">Meta</div>
                  <div className="mt-2 text-sm text-slate-700 space-y-1">
                    <div>Price: ${selectedCourse.price.toFixed(2)}</div>
                    {selectedCourse.originalPrice ? <div>Original: ${selectedCourse.originalPrice.toFixed(2)}</div> : null}
                    <div>Duration: {selectedCourse.duration || "—"}</div>
                    <div>Rating: {selectedCourse.rating ?? "—"}</div>
                    <div>Visibility: {selectedCourse.visibility}</div>
                    <div>Published: {selectedCourse.published ? "Yes" : "No"}</div>
                    <div>Created: {new Date(selectedCourse.createdAt).toLocaleString()}</div>
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
