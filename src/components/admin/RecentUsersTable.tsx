"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
} from "lucide-react";

/* ================= TYPES ================= */

type Student = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatar?: string;
  courses: { id: string; title: string; purchasedAt: string }[];
};

type FilterType = "all" | "active" | "inactive";

/* ================= CONFIG ================= */

const API_URL = "https://ifbb-1.onrender.com/api/admin/get-all-users";

const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NTg3NzkzMSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjYxMzcxMzF9.vf348GFqAWkiaF9LqHIgod07o3sLuiKCkrgi_v4CUKQ";

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
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">User Details</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <img
              src={student.avatar}
              className="w-16 h-16 rounded-xl shadow"
              alt={student.name}
            />
            <div>
              <h3 className="font-bold text-xl text-gray-800">{student.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {student.email}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              Status:{" "}
              {student.active ? (
                <span className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-600 font-semibold">
                  <XCircle className="w-4 h-4" /> Inactive
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              User ID: {student.id.substring(0, 8)}...
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-800">
              <BookOpen className="w-5 h-5" />
              Courses ({student.courses.length})
            </h4>
            {student.courses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No courses purchased</p>
            ) : (
              <div className="space-y-2">
                {student.courses.map((course, index) => (
                  <div 
                    key={course.id}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition"
                  >
                    <div className="font-medium text-gray-800">{course.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Purchased: {new Date(course.purchasedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN ================= */

export default function UsersList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        });

        const mapped: Student[] = res.data.map((u: any, idx: number) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          active: !u.isBannedByAdmin,
          avatar: avatarDataUrl(u.name, idx),
          courses: u.purchasedCourses || [],
        }));

        setStudents(mapped);
        setFilteredStudents(mapped);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let result = students;

    // Apply search filter
    if (search) {
      result = result.filter(
        (student) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    if (filter === "active") {
      result = result.filter((student) => student.active);
    } else if (filter === "inactive") {
      result = result.filter((student) => !student.active);
    }

    setFilteredStudents(result);
  }, [search, filter, students]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [students]);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Users Management
          </h1>
          <p className="text-gray-600 mt-2">Manage all users and their accounts</p>
        </div> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive Users</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Bar */}
            <div className="relative w-full md:w-auto flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-5 py-3 rounded-xl font-medium transition ${filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                All Users
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-5 py-3 rounded-xl font-medium transition flex items-center gap-2 ${filter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Active
              </button>
              <button
                onClick={() => setFilter("inactive")}
                className={`px-5 py-3 rounded-xl font-medium transition flex items-center gap-2 ${filter === "inactive"
                    ? "bg-red-600 text-white"
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
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="p-5 text-left text-sm font-semibold text-gray-700">
                        User
                      </th>
                      <th className="p-5 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="p-5 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="p-5 text-left text-sm font-semibold text-gray-700">
                        Courses
                      </th>
                      <th className="p-5 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, idx) => (
                      <tr
                        key={student.id}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition duration-150 group"
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              className="w-12 h-12 rounded-xl shadow-sm group-hover:shadow transition"
                              alt={student.name}
                            />
                            <div>
                              <span className="font-semibold text-gray-900">
                                {student.name}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {student.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-5">
                          <div className="text-gray-700">{student.email}</div>
                        </td>

                        <td className="p-5">
                          {student.active ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full font-medium">
                              <XCircle className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {student.courses.length}
                            </span>
                            <span className="text-gray-500 text-sm">
                              course{student.courses.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </td>

                        <td className="p-5">
                          <button
                            onClick={() => setSelected(student)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow group-hover:shadow-md"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length === 0 && (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Filter className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-lg">No users found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {search
                      ? "Try a different search term"
                      : filter !== "all"
                      ? "No users match the selected filter"
                      : "No users available"}
                  </p>
                </div>
              )}

              {/* Results Count */}
              <div className="p-5 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-gray-600 text-sm">
                    Showing{" "}
                    <span className="font-semibold">
                      {filteredStudents.length}
                    </span>{" "}
                    of <span className="font-semibold">{students.length}</span>{" "}
                    users
                  </div>
                  <div className="text-gray-600 text-sm">
                    Filter:{" "}
                    <span className="font-semibold capitalize">
                      {filter === "all" ? "All Users" : filter}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {selected && (
          <UserModal student={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}