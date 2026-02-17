"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';

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
  price: number | string;
  discountedPrice?: number | string;
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
const API_BASE_URL = "https://ifbb-master.onrender.com/api/admin";
const PLACEHOLDER = "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop";

/* ------------- API Functions ------------- */
async function fetchCourses(page = 1, limit = 10, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/get-stats?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      courses: (data.stats?.recentCourses || []).map((course: any) => ({
        _id: course._id,
        title: course.title,
        price: course.price || 0,
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
      })) as Course[],
      total: data.stats?.totalCourses || 0,
      page: page,
      totalPages: Math.ceil((data.stats?.totalCourses || 0) / limit)
    };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return { courses: [], total: 0, page: 1, totalPages: 0 };
  }
}

// Add new function for toggling course visibility
async function toggleCourseVisibility(courseId: string, isPublic: boolean, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/change-course-visibility/${courseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isPublic })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update visibility: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error toggling course visibility:", error);
    throw error;
  }
}

async function createCourse(courseData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/create-course`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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

async function updateCourse(courseId: string, courseData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/edit-course/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
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

async function updateModule(courseId: string, moduleId: string, moduleData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/edit-module/${courseId}/${moduleId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: moduleData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update module: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
}

async function addModule(courseId: string, moduleData: FormData, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/add-module-to-course/${courseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: moduleData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add module: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error adding module:", error);
    throw error;
  }
}

async function deleteModule(courseId: string, moduleId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-module/${moduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Delete module failed. Course ID: ${courseId}, Module ID: ${moduleId}, Status: ${response.status}`);
      throw new Error(`Failed to delete module: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
}

async function deleteCourse(courseId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-course/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    <div className="bg-gradient-to-br from-white border border-slate-200 rounded p-4">
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
  const { token } = useAuth() || {};
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
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 9
  });

  // Fetch courses on component mount
  useEffect(() => {
    if (token) {
      loadCourses(pagination.currentPage);
    }
  }, [token]);

  async function loadCourses(page = 1) {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get-stats?page=${page}&limit=${pagination.itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract all courses from stats
        const allCourses = data.stats?.recentCourses || [];
        const courseData = allCourses.map((course: any) => ({
          _id: course._id,
          title: course.title,
          price: course.price || 0,
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
          totalCourses: data.stats?.totalCourses || 0,
          totalUsers: data.stats?.totalUsers || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          averageRating: data.stats?.averageRating || 0,
          totalPurchasesCount: data.stats?.totalPurchasesCount || 0
        });
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil((data.stats?.totalCourses || 0) / prev.itemsPerPage),
          totalItems: data.stats?.totalCourses || 0
        }));
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
    // Close the view course modal first
    setSelectedCourse(null);
    
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
    // Close the view course modal first
    setSelectedCourse(null);
    
    setEditingModule({ ...module, assetFile: null });
    setSelectedCourseForModule(courseId);
    setModuleError("");
    setModuleFormOpen(true);
  }

  async function submitModuleForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingModule || !selectedCourseForModule || !token) return;
    
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
      
      if (editingModule.assetFile) {
        formData.append('asset', editingModule.assetFile);
      } 
      
      if (editingModule.assetLink) {
        formData.append('assetLink', editingModule.assetLink);
      }

      let response;
      if (editingModule._id) {
        response = await updateModule(selectedCourseForModule, editingModule._id, formData, token);
      } else {
        response = await addModule(selectedCourseForModule, formData, token);
      }

      if (response.message || response.success) {
        await loadCourses(pagination.currentPage);
        closeModuleForm();
        alert(editingModule._id ? "Module updated successfully!" : "Module added successfully!");
      } else {
        throw new Error("Failed to save module");
      }
    } catch (error: any) {
      console.error("Error saving module:", error);
      setModuleError(error.message || "Failed to save module. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteModuleHandler(courseId: string, moduleId: string) {
    if (!token) return;
    if (!confirm("Delete this module? This cannot be undone.")) return;
    
    try {
      console.log(`Deleting module: Course ID - ${courseId}, Module ID - ${moduleId}`);
      
      await deleteModule(courseId, moduleId, token);
      await loadCourses(pagination.currentPage);
      
      // Refresh selected course if it's open
      if (selectedCourse && selectedCourse._id === courseId) {
        const updatedCourse = courses.find(c => c._id === courseId);
        if (updatedCourse) {
          setSelectedCourse(updatedCourse);
        }
      }
      
      alert("Module deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting module:", error);
      alert(`Failed to delete module: ${error.message}`);
    }
  }

  async function submitForm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editing || !token) return;
    
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
      formData.append('isPublic', editing.isPublic.toString());
      
      if (editing.discountedPrice) {
        formData.append('discountedPrice', editing.discountedPrice.toString());
      }
      
      if (editing.durationToComplete) {
        formData.append('durationToComplete', editing.durationToComplete);
      }
      
      if (editing.thumbnailFile) {
        formData.append('thumbnail', editing.thumbnailFile);
      }

      let response;
      if (editing._id) {
        response = await updateCourse(editing._id, formData, token);
      } else {
        response = await createCourse(formData, token);
      }

      if (response.message) {
        await loadCourses(pagination.currentPage);
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
    if (!token) return;
    if (!confirm("Delete this course? This cannot be undone.")) return;
    
    try {
      await deleteCourse(courseId, token);
      await loadCourses(pagination.currentPage);
      if (selectedCourse?._id === courseId) {
        setSelectedCourse(null);
      }
      alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Please try again.");
    }
  }

  // Fixed: Proper visibility toggle with API call
  async function toggleVisibility(courseId: string) {
    if (!token) return;
    
    const course = courses.find(c => c._id === courseId);
    if (!course) return;
    
    const newVisibility = !course.isPublic;
    
    try {
      await toggleCourseVisibility(courseId, newVisibility, token);
      
      // Update local state
      setCourses(prev => prev.map(p => 
        p._id === courseId ? { ...p, isPublic: newVisibility, published: newVisibility } : p
      ));
      
      // Update selected course if it's the same
      if (selectedCourse?._id === courseId) {
        setSelectedCourse(prev => prev ? { ...prev, isPublic: newVisibility, published: newVisibility } : null);
      }
      
    } catch (error) {
      console.error("Failed to update visibility:", error);
      alert("Failed to update course visibility. Please try again.");
    }
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

  // Pagination handlers
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    loadCourses(page);
  }

  function PaginationControls() {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-center mt-8">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => goToPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`px-3 py-2 rounded-lg ${pagination.currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            Previous
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => goToPage(1)}
                className={`px-3 py-2 rounded-lg ${1 === pagination.currentPage ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                1
              </button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-2 rounded-lg ${page === pagination.currentPage ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {page}
            </button>
          ))}
          
          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
              <button
                onClick={() => goToPage(pagination.totalPages)}
                className={`px-3 py-2 rounded-lg ${pagination.totalPages === pagination.currentPage ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {pagination.totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => goToPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className={`px-3 py-2 rounded-lg ${pagination.currentPage === pagination.totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            Next
          </button>
        </nav>
      </div>
    );
  }

  // Helper function to format price
  function formatPrice(price: number | string): string {
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
    }
    return price.toFixed(2);
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
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded   transition-all duration-200 font-medium"
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
              value={`$${stats.totalRevenue.toFixed(2)}`}
              icon={<span className="text-2xl">💰</span>}
            />
            <StatCard
              label="Avg Rating"
              value={stats.averageRating.toFixed(1)}
              icon={<span className="text-2xl">⭐</span>}
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded border  border-slate-200 p-4 mb-6 shadow-sm">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
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
                    className={`px-3 py-2 rounded ${viewMode === "grid" ? "bg-white shadow" : "text-slate-600"}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 rounded ${viewMode === "list" ? "bg-white shadow" : "text-slate-600"}`}
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  className="group bg-white rounded border border-slate-200 overflow-hidden shadow-sm  transition-all duration-300"
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
                    <div className="absolute top-2   left-2 flex gap-2">
                      {/* <Pill className={`${c.published ? "bg-emerald-500 text-white" : "bg-slate-600 text-white"}`}>
                        {c.published ? "Published" : "Draft"}
                      </Pill> */}
                      <Pill className={`${c.isPublic ? "bg-blue-500 text-white" : "bg-slate-500 text-white"}`}>
                        {c.isPublic ? "Public" : "Private"}
                      </Pill>
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-lg">
                      {/* <div className="text-sm text-slate-500">Price</div> */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">${formatPrice(c.price)}</span>
                        {c.discountedPrice && (
                          <span className="text-sm text-slate-400 line-through">${formatPrice(c.discountedPrice)}</span>
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
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedCourse(c)}
                        className="flex-2 px-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-sm font-medium transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleVisibility(c._id)}
                        className={`px-2 py-1 rounded text-sm font-medium transition ${c.isPublic ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
                      >
                        {c.isPublic ? 'Make Private' : 'Make Public'}
                      </button>
                      <button
                        onClick={() => openEditCourse(c)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-sm font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(c._id)}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && <PaginationControls />}
          </>
        )}

        {!loading && viewMode === "list" && (
          <>
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  className="p-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0">
                      <img src={c.courseThumbnail || PLACEHOLDER} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900">{c.title}</h3>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-900">${formatPrice(c.price)}</span>
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
                        onClick={() => toggleVisibility(c._id)}
                        className={`px-2 py-1 rounded text-sm font-medium transition ${c.isPublic ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
                      >
                        {c.isPublic ? 'Private' : 'Public'}
                      </button>
                      <button
                        onClick={() => openEditCourse(c)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-sm font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setSelectedCourse(c)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && <PaginationControls />}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or create a new course</p>
            <button
              onClick={openNewCourse}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow font-medium"
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
            className="relative z-50 w-full max-w-4xl bg-white rounded shadow-2xl overflow-hidden max-h-[90vh]"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={editing.durationToComplete || ""}
                      onChange={(e) => setEditing({ ...editing, durationToComplete: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
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
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-slate-900"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={editing.isPublic ? "true" : "false"}
                      onChange={(e) => setEditing({ ...editing, isPublic: e.target.value === "true", published: e.target.value === "true" })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900"
                    >
                      <option value="false">Private</option>
                      <option value="true">Public</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Course Thumbnail</label>
                  <div className="border-2 border-dashed border-slate-300 rounded p-6 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50">
                    {editing.courseThumbnail || editing.thumbnailFile ? (
                      <div className="relative">
                        <img
                          src={editing.thumbnailFile ? URL.createObjectURL(editing.thumbnailFile) : (editing.courseThumbnail || PLACEHOLDER)}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded mx-auto"
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
                      className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium cursor-pointer transition"
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
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-3 rounded font-medium transition ${
                      saving
                        ? "bg-slate-400 cursor-not-allowed text-white"
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
        <div className="fixed inset-0 z-50  flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModuleForm} />
          <form
            onSubmit={submitModuleForm}
            className="relative z-50 w-full max-w-2xl bg-white rounded shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
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
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
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
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-slate-900"
                    placeholder="Brief description of the module..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Content Type *</label>
                  <select
                    value={editingModule.type || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900"
                  >
                    <option value="">Select type</option>
                    <option value="video">video</option>
                    <option value="pdf">pdf</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Content *</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-2">Upload File</label>
                      <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50">
                        {editingModule.assetFile ? (
                          <div className="relative">
                            <div className="flex items-center gap-3 p-3 bg-white rounded">
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
                          className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium cursor-pointer transition"
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
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
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
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-3 rounded font-medium transition ${
                      saving
                        ? "bg-slate-400 cursor-not-allowed text-white"
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
          <div className="relative z-50 max-w-6xl w-full bg-white rounded shadow-2xl overflow-hidden max-h-[90vh]">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded text-sm font-medium transition"
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
                            className="flex items-center justify-between p-4 bg-slate-50 rounded hover:bg-slate-100 transition group"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-medium">
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
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
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
                      <div className="text-center py-8 bg-slate-50 rounded">
                        <div className="text-4xl mb-3">📚</div>
                        <p className="text-slate-600 mb-4">No modules added yet</p>
                        <button
                          onClick={() => openNewModule(selectedCourse._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded text-sm font-medium transition"
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
                  <div className="bg-slate-50 rounded p-5">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Information</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-slate-500">Price</div>
                        <div className="text-xl font-bold text-slate-900">${formatPrice(selectedCourse.price)}</div>
                        {selectedCourse.discountedPrice && (
                          <div className="text-sm text-slate-400 line-through mt-1">
                            ${formatPrice(selectedCourse.discountedPrice)}
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

                      <div className="pt-4 border-t border-slate-200">
                        <button
                          onClick={() => toggleVisibility(selectedCourse._id)}
                          className={`w-full py-3 rounded font-medium transition ${selectedCourse.isPublic ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'}`}
                        >
                          {selectedCourse.isPublic ? 'Make Course Private' : 'Make Course Public'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openNewModule(selectedCourse._id)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded font-medium transition"
                    >
                      Add Module
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        openEditCourse(selectedCourse);
                      }}
                      className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition"
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
                      className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded font-medium transition"
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