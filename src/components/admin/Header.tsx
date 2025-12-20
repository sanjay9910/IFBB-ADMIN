// src/components/admin/Header.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, X, Bell, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  course: string;
  state: string;
  message: string;
  termsAccepted: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const navItems = [
  { key: "users", label: "Users", href: "/admin/users" },
  { key: "brands", label: "Brand Logo", href: "/admin/brands" },
  { key: "courses", label: "Course", href: "/admin/courses" },
  { key: "certificates", label: "Certificate", href: "/admin/certificates" },
  { key: "news", label: "News", href: "/admin/news" },
  { key: "settings", label: "Setting", href: "/admin/settings" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [viewedInquiries, setViewedInquiries] = useState<Set<string>>(new Set());
  const [selectedNotification, setSelectedNotification] = useState<Inquiry | null>(null);
  const [newInquiriesCount, setNewInquiriesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Fetch inquiries
  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NjA0OTE3NSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjYzMDgzNzV9.-GBlOh0DFjsURFWFrxUtFVs10kfL64gCy0T2EMk36iQ";

      const response = await fetch(
        "https://ifbb-1.onrender.com/api/admin/course-inquiries",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          mode: "cors",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setInquiries(data.data);
        const newCount = data.data.filter((inquiry: Inquiry) => inquiry.status === "new").length;
        setNewInquiriesCount(newCount);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inquiries on mount and set up polling
  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(e.target as Node)) setNotificationOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Handle logout confirm
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    router.push("/login");
  };

  // Handle view notification
  const handleViewNotification = (inquiry: Inquiry) => {
    setSelectedNotification(inquiry);
    setViewedInquiries((prev) => new Set(prev).add(inquiry._id));
  };

  // Handle delete notification
  const handleDeleteNotification = (inquiryId: string) => {
    setInquiries((prev) => prev.filter((inquiry) => inquiry._id !== inquiryId));
    if (selectedNotification?._id === inquiryId) {
      setSelectedNotification(null);
    }
  };

  // Handle view all notifications
  const handleViewAllNotifications = () => {
    setNotificationOpen(false);
    router.push("/dashboard/notification");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unviewedCount = inquiries.filter((inq) => !viewedInquiries.has(inq._id)).length;

  return (
    <>
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 bg-white border-b z-50 h-20"
        role="banner"
      >
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left - Logo & Menu Button */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image 
                  src="/images/Logo.png" 
                  alt="IFBB" 
                  width={36} 
                  height={36} 
                  className="w-8 h-8 sm:w-9 sm:h-9"
                  priority
                />
                <span className="text-lg font-semibold text-slate-900 hidden sm:block">
                  IFBB Admin
                </span>
                <span className="text-lg font-semibold text-slate-900 sm:hidden">
                  IFBB
                </span>
              </div>
            </div>
          </div>

          {/* Right - Profile and Notification */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Profile - Moved to the left of Notification */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile menu"
                className="mt-2"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0">
                  <Image 
                    src="/images/sanjay.jpeg" 
                    alt="Admin avatar" 
                    fill 
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 32px, 36px"
                  />
                </div>
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg py-1 z-[100]">
                  <a
                    href="/dashboard/setting"
                    className="block px-4 py-2 text-black text-sm hover:bg-slate-100 transition-colors"
                  >
                    Profile
                  </a>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setNotificationOpen((v) => !v)}
                className="relative p-2 rounded-full hover:bg-slate-300 bg-slate-200 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unviewedCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-600 rounded-full">
                    {unviewedCount > 9 ? '9+' : unviewedCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border rounded-lg shadow-2xl z-[100]">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                    {unviewedCount > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {unviewedCount} New
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-slate-500">Loading...</div>
                    ) : inquiries.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">
                        <p>No inquiries yet</p>
                      </div>
                    ) : (
                      inquiries.slice(0, 5).map((inquiry) => (
                        <div
                          key={inquiry._id}
                          className={`px-4 py-3 border-b hover:bg-slate-50 transition-colors ${
                            !viewedInquiries.has(inquiry._id) ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex-1 cursor-pointer min-w-0"
                              onClick={() => handleViewNotification(inquiry)}
                            >
                              <p className="font-semibold text-slate-900 text-sm truncate">
                                {inquiry.name}
                              </p>
                              <p className="text-xs text-slate-600 mt-1 truncate">
                                {inquiry.course}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDate(inquiry.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleViewNotification(inquiry)}
                                className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNotification(inquiry._id)}
                                className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleViewAllNotifications}
                    className="w-full px-4 py-3 text-center bg-[#2424B9] hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* NOTIFICATION DETAIL MODAL */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                    {selectedNotification.name}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Submitted: {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-slate-500 hover:text-slate-700 text-2xl font-bold flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                    <p className="text-slate-900 mt-2 break-all">{selectedNotification.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
                    <p className="text-slate-900 mt-2">{selectedNotification.phone}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Course</label>
                    <p className="text-slate-900 mt-2">{selectedNotification.course}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">State</label>
                    <p className="text-slate-900 mt-2">{selectedNotification.state}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</label>
                    <p className="text-slate-900 mt-2">
                      {new Date(selectedNotification.dob).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                    <p className="text-slate-900 mt-2 capitalize">{selectedNotification.status}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Message</label>
                  <p className="text-slate-900 mt-2 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Inquiry ID</label>
                  <p className="text-slate-600 text-sm mt-2 font-mono break-all">
                    {selectedNotification._id}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteNotification(selectedNotification._id);
                    setSelectedNotification(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40" 
            onClick={() => setMobileOpen(false)} 
          />

          <aside className="fixed inset-y-0 left-0 w-80 max-w-full bg-white z-50 shadow-lg p-4 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Image 
                  src="/images/Logo.png" 
                  alt="IFBB" 
                  width={40} 
                  height={40} 
                  priority
                />
                <div>
                  <div className="font-medium text-slate-800">IFBB Admin</div>
                  <div className="text-sm text-slate-500">sanjay@gmail.com</div>
                </div>
              </div>

              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((it) => (
                <a
                  key={it.key}
                  href={it.href}
                  className="px-4 py-3 rounded-md text-sm hover:bg-slate-100 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {it.label}
                </a>
              ))}
            </nav>

            <div className="mt-8 border-t pt-4">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full px-4 py-3 rounded-md bg-red-100 text-red-700 font-medium hover:bg-red-200 text-left transition-colors"
              >
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* LOGOUT CONFIRM MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />

          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-[10000]">
            <h2 className="text-xl font-semibold text-slate-900">Confirm Logout</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to logout from admin panel?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}