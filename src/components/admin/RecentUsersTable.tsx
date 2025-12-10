// src/components/admin/UsersList.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Users,
  Mail,
  BookOpen,
  Eye,
  CheckCircle2,
  XCircle,
  MoreVertical
} from "lucide-react";

/** Type definitions */
type Student = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatar?: string;
  courses: { id: string; title: string; purchasedAt: string }[];
};

/** Dummy Students */
const DUMMY_STUDENTS: Student[] = Array.from({ length: 36 }).map((_, i) => {
  const idx = i + 1;
  return {
    id: `s${idx}`,
    name: `Student ${idx}`,
    email: `student${idx}@example.com`,
    active: idx % 3 !== 0,
    avatar: undefined,
    courses:
      idx % 5 === 0
        ? [
            { id: "c1", title: "Full Body Training", purchasedAt: "2025-03-01" },
            { id: "c2", title: "Advanced Nutrition", purchasedAt: "2025-06-12" },
          ]
        : [{ id: "c1", title: "Full Body Training", purchasedAt: "2025-03-01" }],
  };
});

const PER_PAGE =9;

/** helper: pick color by index */
function pickColor(n: number) {
  const colors = [
    "#EF4444", "#F97316", "#F59E0B", "#10B981", 
    "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4"
  ];
  return colors[n % colors.length];
}

/** helper: generate SVG avatar data URL with initials */
function avatarDataUrl(name: string, n: number) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bg = pickColor(n);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
    <rect width='100%' height='100%' fill='${bg}' rx='24' ry='24'/>
    <text x='50%' y='54%' font-family='Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' font-size='48' fill='white' dominant-baseline='middle' text-anchor='middle'>${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Simple Modal Component
function UserModal({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Student Details</h2>
          <p className="text-blue-100 text-sm mt-1">Complete profile information</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-blue-100">
              <img 
                src={student.avatar ?? avatarDataUrl(student.name, 0)} 
                alt={student.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
              <p className="text-slate-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {student.email}
              </p>
              <div className="mt-2">
                {student.active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Enrolled Courses ({student.courses.length})
            </h4>
            <div className="space-y-3">
              {student.courses.map((course) => (
                <div key={course.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-slate-900">{course.title}</h5>
                      <p className="text-sm text-slate-600 mt-1">
                        Purchased: {new Date(course.purchasedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Student | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // close filter on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  /** Filter Logic */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUMMY_STUDENTS.filter((s) => {
      if (filter === "active" && !s.active) return false;
      if (filter === "inactive" && s.active) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [query, filter]);

  /** Pagination Logic */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  function renderPageButtons() {
    const delta = 2;
    const pages: (number | string)[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= page - delta && p <= page + delta)) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages.map((item, idx) => {
      if (item === "...") {
        return (
          <span key={`dots-${idx}`} className="px-2 text-sm text-slate-400">
            …
          </span>
        );
      }
      const p = item as number;
      return (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${
            page === p 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105" 
              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          {p}
        </button>
      );
    });
  }

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header Section */}
      <div className="p-6 space-y-6 flex-shrink-0">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Students Management</h1>
            <p className="text-sm text-slate-600">Manage and view all student profiles</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search students by name or email..."
              className="w-full pl-12 pr-20 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter & Count */}
          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-slate-700">Filter:</span>
                <span className="capitalize text-blue-600">{filter}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${filterOpen ? 'rotate-90' : ''}`} />
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {["all", "active", "inactive"].map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFilter(f as any);
                        setPage(1);
                        setFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium capitalize transition-colors ${
                        filter === f 
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {f === "all" && "All Students"}
                      {f === "active" && "Active Only"}
                      {f === "inactive" && "Inactive Only"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Count Badge */}
            <div className="px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
              <span className="text-sm text-slate-600">
                <span className="font-bold text-blue-600">{filtered.length}</span> students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pageItems.map((s, idx) => {
            const globalIndex = (page - 1) * PER_PAGE + idx;
            const avatar = s.avatar ?? avatarDataUrl(s.name, globalIndex);
            return (
              <article
                key={s.id}
                className="group bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Header with Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-slate-100 group-hover:ring-blue-200 transition-all duration-300">
                      <img src={avatar} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Status Indicator */}
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      s.active ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {s.email}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {s.active ? (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Course Info */}
                <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">{s.courses.length}</span> 
                    <span>course{s.courses.length > 1 ? "s" : ""} enrolled</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setSelected(s)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </article>
            );
          })}

          {/* Empty State */}
          {pageItems.length === 0 && (
            <div className="col-span-full">
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No students found</h3>
                <p className="text-sm text-slate-500">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="mt-8 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Page Info */}
              <div className="text-sm text-slate-600 order-2 sm:order-1">
                Showing{" "}
                <span className="font-bold text-slate-900">{(page - 1) * PER_PAGE + 1}</span>
                {" – "}
                <span className="font-bold text-slate-900">
                  {Math.min(page * PER_PAGE, filtered.length)}
                </span>
                {" of "}
                <span className="font-bold text-blue-600">{filtered.length}</span>
                {" students"}
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {renderPageButtons()}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && <UserModal student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}