"use client";

import React, { useMemo, useState, useEffect } from "react";

/* ---------------- Types ---------------- */
type ModuleItem = { 
  _id: string;
  title: string;
  description?: string;
  type?: string;
  assetLink?: string;
};

type Course = {
  _id: string;
  title: string;
  price: number;
  discountedPrice?: number;
  rating?: number;
  durationToComplete?: string;
  modules: ModuleItem[];
  courseThumbnail?: string | null;
  description?: string;
  isPublic: boolean;
  published: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  purchasedByHowMuch?: number;
};

/* ------------- Constants ------------- */
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NTg3NzkzMSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjYxMzcxMzF9.vf348GFqAWkiaF9LqHIgod07o3sLuiKCkrgi_v4CUKQ";

const API_BASE_URL = "https://ifbb-1.onrender.com/api/admin";

const PLACEHOLDER = "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop";

/* ------------- API Functions ------------- */
async function fetchCourses() {
  try {
    const response = await fetch(`${API_BASE_URL}/get-stats`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status}`);
    }
    
    const data = await response.json();
    return data.stats.recentCourses.map((course: any) => ({
      _id: course._id,
      title: course.title,
      price: course.price,
      discountedPrice: course.discountedPrice,
      rating: course.averageRating || 0,
      durationToComplete: course.durationToComplete,
      modules: course.modules || [],
      courseThumbnail: course.courseThumbnail,
      description: course.description,
      isPublic: course.isPublic,
      published: course.isPublic, // Assuming isPublic means published
      tags: course.tags || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      purchasedByHowMuch: course.purchasedByHowMuch || 0
    })) as Course[];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

async function createCourse(courseData: FormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/create-course`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: courseData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create course: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}

async function updateCourse(courseId: string, courseData: FormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/update-course/${courseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: courseData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update course: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
}

async function deleteCourse(courseId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-course/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete course: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
}

/* ---------------- Small components ---------------- */
function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className="text-slate-700 text-xl">{icon}</div>
      </div>
    </div>
  );
}

/* ------------------ Page ------------------ */
export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalPurchasesCount: 0
  });

  // Fetch courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get-stats`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const courseData = data.stats.recentCourses.map((course: any) => ({
          _id: course._id,
          title: course.title,
          price: course.price,
          discountedPrice: course.discountedPrice,
          rating: course.averageRating || 0,
          durationToComplete: course.durationToComplete,
          modules: course.modules || [],
          courseThumbnail: course.courseThumbnail,
          description: course.description,
          isPublic: course.isPublic,
          published: course.isPublic,
          tags: course.tags || [],
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          purchasedByHowMuch: course.purchasedByHowMuch || 0
        }));
        
        setCourses(courseData);
        setStats({
          totalCourses: data.stats.totalCourses,
          totalUsers: data.stats.totalUsers,
          totalRevenue: data.stats.totalRevenue,
          averageRating: data.stats.averageRating,
          totalPurchasesCount: data.stats.totalPurchasesCount
        });
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.tags?.join(" ").toLowerCase().includes(q) || "") ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [query, courses]);

  /* Handlers */
  function openNewCourse() {
    setEditing({
      _id: "",
      title: "",
      price: 0,
      discountedPrice: undefined,
      rating: 0,
      durationToComplete: "",
      modules: [],
      courseThumbnail: null,
      description: "",
      isPublic: false,
      published: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setFormOpen(true);
  }

  function openEditCourse(c: Course) {
    setEditing({ ...c });
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editing) return;
    
    if (!editing.title.trim()) {
      alert("Please enter course title");
      return;
    }

    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('title', editing.title);
      formData.append('description', editing.description || '');
      formData.append('price', editing.price.toString());
      if (editing.discountedPrice) {
        formData.append('discountedPrice', editing.discountedPrice.toString());
      }
      if (editing.durationToComplete) {
        formData.append('durationToComplete', editing.durationToComplete);
      }
      formData.append('isPublic', editing.isPublic.toString());
      
      // Handle thumbnail upload if it's a file
      if (editing.courseThumbnail && typeof editing.courseThumbnail !== 'string') {
        formData.append('thumbnail', editing.courseThumbnail);
      }

      let response;
      if (editing._id) {
        // Update existing course
        response = await updateCourse(editing._id, formData);
      } else {
        // Create new course
        response = await createCourse(formData);
      }

      if (response.message) {
        // Refresh the course list
        await loadCourses();
        setFormOpen(false);
        setEditing(null);
        alert(editing._id ? "Course updated successfully!" : "Course created successfully!");
      }
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Failed to save course. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(courseId: string) {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    
    try {
      await deleteCourse(courseId);
      // Refresh the course list
      await loadCourses();
      alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Please try again.");
    }
  }

  function toggleVisibility(courseId: string) {
    const course = courses.find(c => c._id === courseId);
    if (!course) return;
    
    // Update locally first for immediate feedback
    setCourses(prev => prev.map(p => 
      p._id === courseId ? { ...p, isPublic: !p.isPublic, published: !p.isPublic } : p
    ));
    
    // Then update on server
    const formData = new FormData();
    formData.append('isPublic', (!course.isPublic).toString());
    
    updateCourse(courseId, formData).catch(error => {
      console.error("Failed to update visibility:", error);
      // Revert on error
      setCourses(prev => prev.map(p => 
        p._id === courseId ? { ...p, isPublic: course.isPublic, published: course.isPublic } : p
      ));
    });
  }

  function togglePublish(courseId: string) {
    const course = courses.find(c => c._id === courseId);
    if (!course) return;
    
    // Update locally first for immediate feedback
    setCourses(prev => prev.map(p => 
      p._id === courseId ? { ...p, published: !p.published, isPublic: !p.published } : p
    ));
    
    // Then update on server
    const formData = new FormData();
    formData.append('isPublic', (!course.published).toString());
    
    updateCourse(courseId, formData).catch(error => {
      console.error("Failed to update publish status:", error);
      // Revert on error
      setCourses(prev => prev.map(p => 
        p._id === courseId ? { ...p, published: course.published, isPublic: course.published } : p
      ));
    });
  }

  /* UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Course Management</h1>
              <p className="mt-2 text-slate-600">Manage your course catalog, analytics, and student engagement</p>
            </div>
            <button
              onClick={openNewCourse}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Course
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Courses"
              value={stats.totalCourses}
              icon={<span className="text-2xl">📚</span>}
            />
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={<span className="text-2xl">👥</span>}
            />
            <StatCard
              label="Total Revenue"
              value={`$${stats.totalRevenue}`}
              icon={<span className="text-2xl">💰</span>}
            />
            <StatCard
              label="Avg Rating"
              value={stats.averageRating.toFixed(1)}
              icon={<span className="text-2xl">⭐</span>}
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses, tags, or descriptions..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 rounded-md ${viewMode === "grid" ? "bg-white shadow" : "text-slate-600"}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 rounded-md ${viewMode === "list" ? "bg-white shadow" : "text-slate-600"}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Courses Grid/List */}
        {!loading && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div
                key={c._id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Course Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={c.courseThumbnail || PLACEHOLDER}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Pill className={`${c.published ? "bg-emerald-500 text-white" : "bg-slate-600 text-white"}`}>
                      {c.published ? "Published" : "Draft"}
                    </Pill>
                    <Pill className={`${c.isPublic ? "bg-blue-500 text-white" : "bg-slate-500 text-white"}`}>
                      {c.isPublic ? "Public" : "Private"}
                    </Pill>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-sm text-slate-500">Price</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900">${c.price.toFixed(2)}</span>
                      {c.discountedPrice && (
                        <span className="text-sm text-slate-400 line-through">${c.discountedPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                    <div className="flex items-center gap-1 text-amber-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold">{c.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{c.description}</p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {c.durationToComplete || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {c.modules?.length || 0} modules
                      </span>
                    </div>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Students */}
                  <div className="mb-4 text-sm text-slate-700">
                    <span className="font-medium">{c.purchasedByHowMuch || 0}</span> students enrolled
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedCourse(c)}
                      className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openEditCourse(c)}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(c._id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && viewMode === "list" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {filtered.map((c) => (
              <div
                key={c._id}
                className="p-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={c.courseThumbnail || PLACEHOLDER} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">{c.title}</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">${c.price.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          <Pill className={`${c.published ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>
                            {c.published ? "Published" : "Draft"}
                          </Pill>
                          <Pill className={`${c.isPublic ? "bg-blue-500 text-white" : "bg-slate-600 text-white"}`}>
                            {c.isPublic ? "Public" : "Private"}
                          </Pill>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-2 line-clamp-1">{c.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>⭐ {c.rating?.toFixed(1) || "0.0"}</span>
                      <span>⏱️ {c.durationToComplete || "—"}</span>
                      <span>📚 {c.modules?.length || 0} modules</span>
                      <span>👥 {c.purchasedByHowMuch || 0} students</span>
                      <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditCourse(c)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedCourse(c)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or create a new course</p>
            <button
              onClick={openNewCourse}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow font-medium"
            >
              Create Your First Course
            </button>
          </div>
        )}
      </div>

      {/* ---------- Form Modal (Create / Edit) ---------- */}
      {formOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />
          <form
            onSubmit={submitForm}
            className="relative z-50 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editing._id ? "Edit Course" : "Create New Course"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Course Title *</label>
                    <input
                      type="text"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={editing.durationToComplete || ""}
                      onChange={(e) => setEditing({ ...editing, durationToComplete: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="e.g., 40 hours"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Discounted Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editing.discountedPrice || ""}
                      onChange={(e) => setEditing({ ...editing, discountedPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={editing.isPublic ? "true" : "false"}
                      onChange={(e) => setEditing({ ...editing, isPublic: e.target.value === "true", published: e.target.value === "true" })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="false">Private (Draft)</option>
                      <option value="true">Public (Published)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course Thumbnail</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50">
                    {editing.courseThumbnail ? (
                      <div className="relative">
                        <img
                          src={typeof editing.courseThumbnail === 'string' ? editing.courseThumbnail : URL.createObjectURL(editing.courseThumbnail)}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, courseThumbnail: null })}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="text-4xl mb-3">📸</div>
                        <p className="text-slate-600 mb-2">Upload a course thumbnail</p>
                        <p className="text-sm text-slate-500">Recommended: 1200×720 px</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="courseThumbnail"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditing({ ...editing, courseThumbnail: file });
                        }
                      }}
                    />
                    <label
                      htmlFor="courseThumbnail"
                      className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium cursor-pointer transition"
                    >
                      Choose Image
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {editing._id ? "Update course details" : "Create new course"}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-3 rounded-xl font-medium transition ${
                      saving
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : editing._id ? (
                      "Update Course"
                    ) : (
                      "Create Course"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------- View Modal ---------- */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCourse(null)} />
          <div className="relative z-50 max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative h-64 bg-gradient-to-r from-indigo-500 to-purple-600">
              <img
                src={selectedCourse.courseThumbnail || PLACEHOLDER}
                alt={selectedCourse.title}
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedCourse.title}</h2>
                  <div className="flex items-center gap-3">
                    <Pill className="bg-white/20 backdrop-blur-sm text-white">
                      {selectedCourse.isPublic ? "Public" : "Private"}
                    </Pill>
                    <Pill className="bg-white/20 backdrop-blur-sm text-white">
                      {selectedCourse.published ? "Published" : "Draft"}
                    </Pill>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Course Details */}
                <div className="md:col-span-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
                    <p className="text-slate-600">{selectedCourse.description || "No description provided"}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Modules ({selectedCourse.modules?.length || 0})</h3>
                    {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCourse.modules.map((module, index) => (
                          <div
                            key={module._id}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{module.title}</div>
                              {module.description && (
                                <div className="text-sm text-slate-600">{module.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No modules added yet</p>
                    )}
                  </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Information</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-slate-500">Price</div>
                        <div className="text-2xl font-bold text-slate-900">${selectedCourse.price.toFixed(2)}</div>
                        {selectedCourse.discountedPrice && (
                          <div className="text-sm text-slate-400 line-through mt-1">
                            ${selectedCourse.discountedPrice.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-500">Duration</div>
                          <div className="font-medium text-slate-900">{selectedCourse.durationToComplete || "—"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Students</div>
                          <div className="font-medium text-slate-900">{selectedCourse.purchasedByHowMuch || 0}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-500">Created</div>
                          <div className="font-medium text-slate-900">
                            {new Date(selectedCourse.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Updated</div>
                          <div className="font-medium text-slate-900">
                            {new Date(selectedCourse.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        openEditCourse(selectedCourse);
                      }}
                      className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
                    >
                      Edit Course
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this course?")) {
                          onDelete(selectedCourse._id);
                          setSelectedCourse(null);
                        }
                      }}
                      className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition"
                    >
                      Delete
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