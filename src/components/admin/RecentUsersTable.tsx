"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Users,
  Mail,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  BookOpen,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/* ================= TYPES ================= */

type Course = {
  _id: string;
  title: string;
  price: string;
  discountedPrice: string;
  createdAt: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatar?: string;
  courses: Course[];
  createdAt: string;
};

type FilterType = "all" | "active" | "inactive";

/* ================= CONFIG ================= */

const API_URL = "https://ifbb-master.onrender.com/api/admin/get-all-users";

/* ================= HELPERS ================= */

function pickColor(n: number) {
  const colors = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#EF4444",
    "#06B6D4",
  ];
  return colors[n % colors.length];
}

function avatarDataUrl(name: string, n: number) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
    <defs>
      <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${pickColor(n)}'/>
        <stop offset='100%' stop-color='${pickColor(n + 2)}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='14' fill='url(#g)'/>
    <text x='50%' y='55%' font-size='26' font-family='sans-serif' fill='white'
      dominant-baseline='middle' text-anchor='middle' font-weight='700'>${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

/* ================= MOBILE CARD ================= */

function MobileStudentCard({
  student,
  onView,
}: {
  student: Student;
  onView: () => void;
}) {
  return (
    <div className="bg-white rounded border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3">
        <img
          src={student.avatar}
          className="w-12 h-12 rounded shadow-sm flex-shrink-0"
          alt={student.name}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base truncate">{student.name}</p>
          <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {student.email}
          </p>
        </div>
        {student.active ? (
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Active
          </span>
        ) : (
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
            Inactive
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-700">{student.courses.length}</span>
            {student.courses.length === 1 ? " course" : " courses"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(student.createdAt)}
          </span>
        </div>
        <button
          onClick={onView}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      </div>
    </div>
  );
}

/* ================= MODAL ================= */

function UserModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded sm:rounded w-full sm:max-w-2xl overflow-hidden shadow animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-5 sm:p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">User Details</h2>
            <p className="text-white/70 text-sm mt-0.5">Full profile information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded transition"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto">
          {/* User Info Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-gray-100 rounded border border-gray-200">
            <img
              src={student.avatar}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-md"
              alt={student.name}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 truncate">
                {student.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1.5 truncate">
                <Mail className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                {student.email}
              </p>
            </div>
          </div>

          {/* Status & User ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
              {student.active ? (
                <span className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Active Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 font-semibold rounded border border-red-200 text-sm">
                  <XCircle className="w-4 h-4" />
                  Inactive Account
                </span>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User ID</div>
              <div className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                {student.id}
              </div>
            </div>
          </div>

          {/* Join Date */}
          <div className="p-4 bg-indigo-50 rounded border border-indigo-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Member Since
            </div>
            <div className="text-lg font-bold text-indigo-900">
              {formatDate(student.createdAt)}
            </div>
          </div>

          {/* Courses */}
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <h4 className="font-bold flex items-center gap-2 mb-3 text-gray-900">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Purchased Courses
              <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {student.courses.length}
              </span>
            </h4>

            {student.courses.length === 0 ? (
              <div className="p-6 bg-white rounded border border-dashed border-gray-300 text-center">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No courses purchased yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {student.courses.map((course) => (
                  <div
                    key={course._id}
                    className="p-3.5 bg-white rounded border border-gray-200 hover:border-indigo-300 transition hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <h5 className="font-semibold text-gray-900 text-sm leading-snug flex-1">
                        {course.title}
                      </h5>
                      <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
                        <span className="line-through text-gray-400 text-xs">${course.price}</span>
                        <span className="font-bold text-emerald-600">${course.discountedPrice}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Purchased: {formatDate(course.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded font-semibold hover:bg-gray-200 transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN ================= */

export default function UsersList() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Fetch users ---- */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/auth/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const mapped: Student[] = res.data.map((u: any, idx: number) => ({
          id: u._id,
          name: u.name || "Unknown",
          email: u.email || "N/A",
          active: !u.isBannedByAdmin,
          avatar: u.avatar || avatarDataUrl(u.name || "U", idx),
          courses: (u.purchasedCourses || []).map((course: any) => ({
            _id: course._id,
            title: course.title,
            price: course.price,
            discountedPrice: course.discountedPrice,
            createdAt: course.createdAt,
          })),
          createdAt: u.createdAt || new Date().toISOString(),
        }));

        setStudents(mapped);
        setFilteredStudents(mapped);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.replace("/auth/login");
          return;
        }
        setError(
          err.response?.data?.message || "Failed to load users. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, isAuthenticated, router]);

  /* ---- Filter & Search ---- */
  useEffect(() => {
    let result = students;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }

    if (filter === "active") result = result.filter((s) => s.active);
    else if (filter === "inactive") result = result.filter((s) => !s.active);

    setFilteredStudents(result);
  }, [search, filter, students]);

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const inactive = total - active;
    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
    return { total, active, inactive, activePercent };
  }, [students]);

  /* ---- Auth guard loading ---- */
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Checking authentication…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ---- Page Header ---- */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-600 rounded">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              Users Management
            </h1>
          </div>
          <p className="text-gray-500 ml-14 text-sm sm:text-base">
            Monitor and manage all registered users
          </p>
        </div>

        {/* ---- Error ---- */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-3">
            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Error Loading Users</p>
              <p className="text-xs mt-1 text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ---- Stats Cards ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Total */}
          <div className="bg-white rounded shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
              <div className="p-2.5 bg-indigo-50 rounded">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              All registered accounts
            </p>
          </div>

          {/* Active */}
          <div className="bg-white rounded shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active</p>
              <div className="p-2.5 bg-emerald-50 rounded">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-emerald-600">{stats.active}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Activity rate</span>
                <span className="font-semibold text-emerald-600">{stats.activePercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.activePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Inactive */}
          <div className="bg-white rounded shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inactive</p>
              <div className="p-2.5 bg-red-50 rounded">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-red-500">{stats.inactive}</p>
            <p className="text-xs text-gray-400 mt-1">Banned or restricted</p>
          </div>
        </div>

        {/* ---- Search & Filter Bar ---- */}
        <div className="bg-white rounded shadow-sm border border-gray-100 p-4 sm:p-5 mb-5">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-gray-900 placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "active", "inactive"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm font-semibold capitalize transition-all duration-200 ${
                    filter === f
                      ? f === "all"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : f === "active"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-red-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "All Users" : f === "active" ? "✓ Active" : "✕ Inactive"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ---- Table / Cards ---- */}
        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading users…</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <div className="text-gray-200 mb-4">
                <Filter className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-gray-600 text-lg font-bold">No users found</p>
              <p className="text-gray-400 text-sm mt-2">
                {search
                  ? "Try a different search term"
                  : filter !== "all"
                  ? "No users match the selected filter"
                  : "No users available"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table — hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["User", "Email", "Status", "Courses", "Joined", "Action"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-indigo-50/40 transition-colors duration-150 group"
                      >
                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              className="w-10 h-10 rounded-full shadow-sm"
                              alt={student.name}
                            />
                            <span className="font-bold text-gray-900 text-sm">
                              {student.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4">
                          <p className="text-gray-500 text-sm truncate max-w-[180px]">
                            {student.email}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {student.active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Courses */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 bg-indigo-50 rounded">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <span className="font-bold text-gray-900 text-sm">
                              {student.courses.length}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {student.courses.length === 1 ? "course" : "courses"}
                            </span>
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4">
                          <p className="text-gray-400 text-sm">
                            {formatDate(student.createdAt)}
                          </p>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelected(student)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 active:scale-95 transition-all duration-150 font-semibold text-xs shadow-sm hover:shadow-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards — visible only on mobile */}
              <div className="md:hidden p-3 space-y-3">
                {filteredStudents.map((student) => (
                  <MobileStudentCard
                    key={student.id}
                    student={student}
                    onView={() => setSelected(student)}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs text-gray-500">
                <p>
                  Showing{" "}
                  <span className="font-bold text-gray-700">{filteredStudents.length}</span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-700">{students.length}</span>{" "}
                  users
                </p>
                <p>
                  Filter:{" "}
                  <span className="font-bold text-indigo-600 capitalize">
                    {filter === "all" ? "All Users" : filter}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <UserModal student={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}