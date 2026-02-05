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
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
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
    <rect width='100%' height='100%' rx='12' fill='${pickColor(n)}'/>
    <text x='50%' y='55%' font-size='28' fill='white'
      dominant-baseline='middle' text-anchor='middle'>${initials}</text>
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

/* ================= MODAL ================= */

function UserModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">User Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* User Info Card */}
          <div className="flex items-center gap-5 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <img
              src={student.avatar}
              className="w-20 h-20 rounded-xl shadow-md"
              alt={student.name}
            />
            <div className="flex-1">
              <h3 className="font-bold text-2xl text-gray-900">
                {student.name}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                <Mail className="w-4 h-4" />
                {student.email}
              </p>
            </div>
          </div>

          {/* Status & User ID Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Status</div>
              {student.active ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg">
                  <XCircle className="w-5 h-5" />
                  Inactive
                </span>
              )}
            </div>

            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">User ID</div>
              <div className="text-sm font-mono text-gray-900 break-all">
                {student.id}
              </div>
            </div>
          </div>

          {/* Join Date Card */}
          <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
              <Calendar className="w-4 h-4" />
              Member Since
            </div>
            <div className="text-lg font-semibold text-blue-900">
              {formatDate(student.createdAt)}
            </div>
          </div>

          {/* Courses Card */}
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-bold flex items-center gap-2 mb-4 text-gray-900 text-lg">
              <BookOpen className="w-5 h-5" />
              Purchased Courses ({student.courses.length})
            </h4>

            {student.courses.length === 0 ? (
              <div className="p-4 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                <p className="text-sm text-gray-500 italic">
                  No courses purchased yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.courses.map((course) => (
                  <div
                    key={course._id}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h5 className="font-semibold text-gray-900">
                        {course.title}
                      </h5>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-gray-500">
                          ${course.price}
                        </span>
                        <span className="font-bold text-green-600">
                          ${course.discountedPrice}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Purchased: {formatDate(course.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
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

  // ✅ Fetch users with dynamic token
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/auth/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          "🔵 Fetching users with token:",
          token.substring(0, 20) + "..."
        );

        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Map API response to Student type
        const mapped: Student[] = res.data.map((u: any, idx: number) => ({
          id: u._id,
          name: u.name || "Unknown",
          email: u.email || "N/A",
          active: !u.isBannedByAdmin,
          avatar: u.avatar || avatarDataUrl(u.name, idx),
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
        console.log("✅ Users fetched successfully:", mapped.length);
      } catch (error: any) {
        console.error("❌ Error fetching users:", error);

        if (error.response?.status === 401) {
          setError("Session expired. Please login again.");
          router.replace("/auth/login");
          return;
        }

        setError(
          error.response?.data?.message || "Failed to load users. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, isAuthenticated, router]);

  // ✅ Apply filters and search
  useEffect(() => {
    let result = students;

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (student) =>
          student.name.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filter === "active") {
      result = result.filter((student) => student.active);
    } else if (filter === "inactive") {
      result = result.filter((student) => !student.active);
    }

    setFilteredStudents(result);
  }, [search, filter, students]);

  // ✅ Calculate stats
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [students]);

  // Show loading while checking auth
  if (!isAuthenticated || !token) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all users in the system
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error Loading Users</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-4xl font-bold text-green-600 mt-3">
                  {stats.active}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Users
                </p>
                <p className="text-4xl font-bold text-red-600 mt-3">
                  {stats.inactive}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  filter === "all"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                  filter === "active"
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Active
              </button>
              <button
                onClick={() => setFilter("inactive")}
                className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                  filter === "inactive"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading users...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-gray-300 mb-4">
                <Filter className="w-20 h-20 mx-auto" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No users found</p>
              <p className="text-gray-500 text-sm mt-2">
                {search
                  ? "Try a different search term"
                  : filter !== "all"
                  ? "No users match the selected filter"
                  : "No users available"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Courses
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-blue-50/50 transition duration-150"
                      >
                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              className="w-10 h-10 rounded-lg shadow-sm"
                              alt={student.name}
                            />
                            <span className="font-semibold text-gray-900">
                              {student.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          <p className="text-gray-700 text-sm">{student.email}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {student.active ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                              <XCircle className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Courses Count */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              {student.courses.length}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {student.courses.length === 1
                                ? "course"
                                : "courses"}
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4">
                          <p className="text-gray-600 text-sm">
                            {formatDate(student.createdAt)}
                          </p>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelected(student)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Results Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-600">
                <div>
                  Showing <span className="font-semibold">{filteredStudents.length}</span> of{" "}
                  <span className="font-semibold">{students.length}</span> users
                </div>
                <div>
                  Filter:{" "}
                  <span className="font-semibold capitalize">
                    {filter === "all" ? "All Users" : filter}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Detail Modal */}
        {selected && (
          <UserModal student={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}