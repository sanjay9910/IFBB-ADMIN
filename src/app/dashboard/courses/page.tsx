"use client";

import React, { useMemo, useState, useEffect } from "react";

/* ---------------- Types ---------------- */
type ModuleItem = { 
  _id: string;
  title: string;
  description?: string;
  type?: string;
  assetLink?: string;
  assetFile?: File | null;
  asset?: {
    url?: string;
    fileName?: string;
    fileType?: string;
  };
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
  thumbnailFile?: File | null;
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
      modules: course.modules?.map((module: any) => ({
        _id: module._id,
        title: module.title,
        description: module.description,
        type: module.type,
        assetLink: module.assetLink,
        asset: module.asset || {}
      })) || [],
      courseThumbnail: course.courseThumbnail,
      description: course.description,
      isPublic: course.isPublic,
      published: course.isPublic,
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
      const errorText = await response.text();
      console.error("Create course error response:", errorText);
      throw new Error(`Failed to create course: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}

async function updateCourse(courseId: string, courseData: FormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/edit-course/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: courseData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update course error response:", errorText);
      throw new Error(`Failed to update course: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
}

async function updateModule(courseId: string, moduleId: string, moduleData: FormData) {
  try {
    console.log("Updating module:", moduleId, "for course:", courseId);
    console.log("Module data:", {
      title: moduleData.get('title'),
      type: moduleData.get('type'),
      description: moduleData.get('description'),
      hasFile: !!moduleData.get('asset'),
      hasLink: !!moduleData.get('assetLink')
    });
    
    const response = await fetch(`${API_BASE_URL}/edit-module/${courseId}/${moduleId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: moduleData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update module error response:", errorText);
      throw new Error(`Failed to update module: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
}

async function addModule(courseId: string, moduleData: FormData) {
  try {
    console.log("Adding module to course:", courseId);
    console.log("Module data:", {
      title: moduleData.get('title'),
      type: moduleData.get('type'),
      description: moduleData.get('description'),
      hasFile: !!moduleData.get('asset'),
      hasLink: !!moduleData.get('assetLink')
    });
    
    const response = await fetch(`${API_BASE_URL}/add-module-to-course/${courseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: moduleData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Add module error response:", errorText);
      throw new Error(`Failed to add module: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error adding module:", error);
    throw error;
  }
}

async function deleteModule(courseId: string, moduleId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-module/${courseId}/${moduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete module: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting module:", error);
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
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [selectedCourseForModule, setSelectedCourseForModule] = useState<string>("");
  const [moduleError, setModuleError] = useState<string>("");

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
          modules: course.modules?.map((module: any) => ({
            _id: module._id,
            title: module.title,
            description: module.description,
            type: module.type,
            assetLink: module.assetLink,
            asset: module.asset || {}
          })) || [],
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
      thumbnailFile: null,
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
    setEditing({ 
      ...c,
      thumbnailFile: null
    });
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
  }

  function closeModuleForm() {
    setEditingModule(null);
    setModuleFormOpen(false);
    setSelectedCourseForModule("");
    setModuleError("");
  }

  function openNewModule(courseId: string) {
    setEditingModule({
      _id: "",
      title: "",
      description: "",
      type: "pdf",
      assetLink: "",
      assetFile: null
    });
    setSelectedCourseForModule(courseId);
    setModuleError("");
    setModuleFormOpen(true);
  }

  function openEditModule(module: ModuleItem, courseId: string) {
    setEditingModule({ ...module, assetFile: null });
    setSelectedCourseForModule(courseId);
    setModuleError("");
    setModuleFormOpen(true);
  }

  async function submitModuleForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingModule || !selectedCourseForModule) return;
    
    // Validation
    if (!editingModule.title.trim()) {
      setModuleError("Please enter module title");
      return;
    }
    
    if (!editingModule.type) {
      setModuleError("Please select module type");
      return;
    }
    
    if (!editingModule.assetFile && !editingModule.assetLink) {
      setModuleError("Please upload a file or provide a link");
      return;
    }

    setSaving(true);
    setModuleError("");
    
    try {
      const formData = new FormData();
      formData.append('title', editingModule.title);
      formData.append('description', editingModule.description || '');
      formData.append('type', editingModule.type || '');
      
      // IMPORTANT: Check file upload
      if (editingModule.assetFile) {
        console.log("Adding file to FormData:", editingModule.assetFile.name);
        formData.append('asset', editingModule.assetFile);
      } 
      
      // Check for link
      if (editingModule.assetLink) {
        console.log("Adding link to FormData:", editingModule.assetLink);
        formData.append('assetLink', editingModule.assetLink);
      }

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      let response;
      if (editingModule._id) {
        // Update existing module
        console.log(`Updating module ${editingModule._id} for course ${selectedCourseForModule}`);
        response = await updateModule(selectedCourseForModule, editingModule._id, formData);
      } else {
        // Add new module
        console.log(`Adding new module to course ${selectedCourseForModule}`);
        response = await addModule(selectedCourseForModule, formData);
      }

      console.log("API Response:", response);
      
      if (response.message || response.success) {
        // Refresh the course list
        await loadCourses();
        closeModuleForm();
        alert(editingModule._id ? "Module updated successfully!" : "Module added successfully!");
      } else {
        throw new Error("Failed to save module");
      }
    } catch (error: any) {
      console.error("Error saving module:", error);
      setModuleError(error.message || "Failed to save module. Please try again.");
      alert("Failed to save module. Please check console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteModuleHandler(courseId: string, moduleId: string) {
    if (!confirm("Delete this module? This cannot be undone.")) return;
    
    try {
      await deleteModule(courseId, moduleId);
      // Refresh the course list
      await loadCourses();
      alert("Module deleted successfully!");
    } catch (error) {
      console.error("Error deleting module:", error);
      alert("Failed to delete module. Please try again.");
    }
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
      
      // Handle thumbnail upload
      if (editing.thumbnailFile) {
        formData.append('thumbnail', editing.thumbnailFile);
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

      await loadCourses();
      if (selectedCourse?._id === courseId) {
        setSelectedCourse(null);
      }
      alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Please try again.");
    }
  }

  function toggleVisibility(courseId: string) {
    const course = courses.find(c => c._id === courseId);
    if (!course) return;
    setCourses(prev => prev.map(p => 
      p._id === courseId ? { ...p, isPublic: !p.isPublic, published: !p.isPublic } : p
    ));
    const formData = new FormData();
    formData.append('isPublic', (!course.isPublic).toString());
    
    updateCourse(courseId, formData).catch(error => {
      console.error("Failed to update visibility:", error);
      setCourses(prev => prev.map(p => 
        p._id === courseId ? { ...p, isPublic: course.isPublic, published: course.isPublic } : p
      ));
    });
  }

  function openModuleContent(module: ModuleItem) {
    if (module.asset?.url) {
      window.open(module.asset.url, '_blank');
    } else if (module.assetLink) {
      window.open(module.assetLink, '_blank');
    } else {
      alert("No content available for this module");
    }
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
                  className="w-full pl-10 text-black pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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

      {/* ---------- Form Modal (Create / Edit Course) ---------- */}
      {formOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />
          <form
            onSubmit={submitForm}
            className="relative z-50 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
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

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Course Title *</label>
                    <input
                      type="text"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      className="w-full px-4 py-3 text-black bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={editing.durationToComplete || ""}
                      onChange={(e) => setEditing({ ...editing, durationToComplete: e.target.value })}
                      className="w-full px-4 text-black py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                    className="w-full px-4 py-3 text-black bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
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
                      className="w-full px-4 py-3 text-black text-black bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                      className="w-full px-4 text-black text-black py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={editing.isPublic ? "true" : "false"}
                      onChange={(e) => setEditing({ ...editing, isPublic: e.target.value === "true", published: e.target.value === "true" })}
                      className="w-full px-4 py-3 bg-white border text-black border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option className="text-black" value="false">Private</option>
                      <option className="text-black" value="true">Public</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course Thumbnail</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50">
                    {editing.courseThumbnail || editing.thumbnailFile ? (
                      <div className="relative">
                        <img
                          src={editing.thumbnailFile ? URL.createObjectURL(editing.thumbnailFile) : (editing.courseThumbnail || PLACEHOLDER)}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({ 
                              ...editing, 
                              courseThumbnail: null,
                              thumbnailFile: null 
                            });
                          }}
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
                          setEditing({ ...editing, thumbnailFile: file });
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

      {/* ---------- Module Form Modal ---------- */}
      {moduleFormOpen && editingModule && (
        <div className="fixed inset-0 z-50 flex  items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModuleForm} />
          <form
            onSubmit={submitModuleForm}
            className="relative z-50 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingModule._id ? "Edit Module" : "Add New Module"}
                </h2>
                <button
                  type="button"
                  onClick={closeModuleForm}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Error Message */}
                {moduleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{moduleError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Module Title *</label>
                  <input
                    type="text"
                    value={editingModule.title}
                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    required
                    placeholder="e.g., Introduction to Course"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={editingModule.description || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 text-black bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Brief description of the module..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Content Type *</label>
                  <select
                    value={editingModule.type || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="video">video</option>
                    <option value="pdf">pdf</option>
                    {/* <option value="text">Text Content</option>
                    <option value="quiz">Quiz</option> */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Content *</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Upload File</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50">
                        {editingModule.assetFile ? (
                          <div className="relative">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                              <div className="text-2xl">
                                {editingModule.type === 'video' ? '🎬' : 
                                 editingModule.type === 'pdf' ? '📄' : '📝'}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">{editingModule.assetFile.name}</div>
                                <div className="text-sm text-slate-600">{(editingModule.assetFile.size / 1024 / 1024).toFixed(2)} MB</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingModule({ ...editingModule, assetFile: null });
                                  setModuleError("");
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6">
                            <div className="text-4xl mb-3">📎</div>
                            <p className="text-slate-600 mb-2">Upload video, PDF or other file</p>
                            <p className="text-sm text-slate-500">Max file size: 10MB</p>
                          </div>
                        )}
                        <input
                          type="file"
                          id="moduleFile"
                          className="hidden"
                          accept={editingModule.type === 'video' ? 'video/*' : 
                                  editingModule.type === 'pdf' ? '.pdf' : '*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEditingModule({ ...editingModule, assetFile: file, assetLink: "" });
                              setModuleError("");
                            }
                          }}
                        />
                        <label
                          htmlFor="moduleFile"
                          className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium cursor-pointer transition"
                        >
                          Choose File
                        </label>
                      </div>
                    </div>

                    <div className="text-center text-slate-500">OR</div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-2">External Link</label>
                      <input
                        type="text"
                        value={editingModule.assetLink || ""}
                        onChange={(e) => {
                          setEditingModule({ ...editingModule, assetLink: e.target.value, assetFile: null });
                          setModuleError("");
                        }}
                        className="w-full px-4 py-3 bg-white txet-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                        placeholder="https://example.com/video"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">* Please provide either a file upload OR an external link</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {editingModule._id ? "Update module details" : "Add new module"}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModuleForm}
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
                    ) : editingModule._id ? (
                      "Update Module"
                    ) : (
                      "Add Module"
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
          <div className="relative z-50 max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
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

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Course Details */}
                <div className="md:col-span-2">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Description</h3>
                      <button
                        onClick={() => openNewModule(selectedCourse._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Module
                      </button>
                    </div>
                    <p className="text-slate-600">{selectedCourse.description || "No description provided"}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Modules ({selectedCourse.modules?.length || 0})</h3>
                    {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCourse.modules.map((module, index) => (
                          <div
                            key={module._id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition group"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">{module.title}</div>
                                {module.description && (
                                  <div className="text-sm text-slate-600 mt-1">{module.description}</div>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  {module.type && (
                                    <Pill className="bg-slate-200 text-slate-700">
                                      {module.type}
                                    </Pill>
                                  )}
                                  {(module.asset?.url || module.assetLink) && (
                                    <button
                                      onClick={() => openModuleContent(module)}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition"
                                    >
                                      {module.asset?.url ? '📁 View Content' : '🔗 View Link'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModule(module, selectedCourse._id)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit module"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteModuleHandler(selectedCourse._id, module._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete module"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-xl">
                        <div className="text-4xl mb-3">📚</div>
                        <p className="text-slate-600 mb-4">No modules added yet</p>
                        <button
                          onClick={() => openNewModule(selectedCourse._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add First Module
                        </button>
                      </div>
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

                      <div>
                        <div className="text-sm text-slate-500 mb-2">Rating</div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-lg font-semibold">{selectedCourse.rating?.toFixed(1) || "0.0"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openNewModule(selectedCourse._id)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium transition"
                    >
                      Add Module
                    </button>
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