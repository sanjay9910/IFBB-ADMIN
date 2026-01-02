// src/components/admin/Header.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, X, Bell, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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
  { key: "users", label: "Users", href: "/dashboard/users" },
  { key: "brands", label: "Brand Logo", href: "/dashboard/brands" },
  { key: "courses", label: "Course", href: "/dashboard/courses" },
  { key: "certificates", label: "Certificate", href: "/dashboard/certificate" },
  { key: "news", label: "News", href: "/dashboard/news" },
  { key: "settings", label: "Setting", href: "/dashboard/setting" },
];

const API_BASE_URL = "https://ifbb-1.onrender.com/api";

export default function Header() {
  const { token, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [viewedInquiries, setViewedInquiries] = useState<Set<string>>(new Set());
  const [selectedNotification, setSelectedNotification] = useState<Inquiry | null>(null);
  const [newInquiriesCount, setNewInquiriesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Fetch inquiries
  const fetchInquiries = async () => {
    if (!token) {
      setError("Authentication required. Please login.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/course-inquiries`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          mode: "cors",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        logout();
        router.push("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch inquiries: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setInquiries(data.data);
        const newCount = data.data.filter((inquiry: Inquiry) => inquiry.status === "new").length;
        setNewInquiriesCount(newCount);
      } else {
        setError("Failed to load inquiries data");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to fetch inquiries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch inquiries on mount and set up polling
  useEffect(() => {
    if (token) {
      fetchInquiries();
      const interval = setInterval(fetchInquiries, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Mark inquiry as read on API
  const markAsRead = async (inquiryId: string) => {
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/admin/course-inquiries/${inquiryId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "read" }),
      });
    } catch (err) {
      console.error("Error marking inquiry as read:", err);
    }
  };

  // Delete inquiry from API
  const deleteInquiryFromAPI = async (inquiryId: string) => {
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/course-inquiries/${inquiryId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting inquiry:", err);
      return false;
    }
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(e.target as Node)) setNotificationOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    router.push("/auth/login");
  };

  // Handle view notification
  const handleViewNotification = (inquiry: Inquiry) => {
    setSelectedNotification(inquiry);
    setViewedInquiries((prev) => new Set(prev).add(inquiry._id));
    
    // Mark as read on API if status is new
    if (inquiry.status === "new") {
      markAsRead(inquiry._id);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (inquiryId: string) => {
    const success = await deleteInquiryFromAPI(inquiryId);
    if (success) {
      setInquiries((prev) => prev.filter((inquiry) => inquiry._id !== inquiryId));
      if (selectedNotification?._id === inquiryId) {
        setSelectedNotification(null);
      }
    } else {
      setError("Failed to delete inquiry. Please try again.");
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

  const unviewedCount = inquiries.filter((inq) => 
    inq.status === "new" && !viewedInquiries.has(inq._id)
  ).length;

  // Show loading while checking authentication
  if (!token) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50 h-20">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/Logo.png" 
              alt="IFBB" 
              width={36} 
              height={36} 
              className="w-8 h-8 sm:w-9 sm:h-9"
              priority
            />
            <span className="text-lg font-semibold text-slate-900">IFBB Admin</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 bg-white border-b z-50 h-20 shadow-sm"
        role="banner"
      >
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left - Logo & Menu Button */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="flex ml-[270px] items-center gap-3">
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
            {/* Profile */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile menu"
                className="mt-2"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0 border-2 border-white shadow-sm">
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
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-[100]">
                  <div className="px-4 py-2 border-b">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {user?.email || "sanjay@gmail.com"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      Admin User
                    </div>
                  </div>
                  <a
                    href="/dashboard/setting"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile Settings
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
                className="relative p-2 rounded-full hover:bg-slate-200 bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unviewedCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unviewedCount > 9 ? '9+' : unviewedCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border rounded-lg shadow-2xl z-[100] overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="text-lg font-semibold text-slate-900">Course Inquiries</h3>
                    {unviewedCount > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {unviewedCount} New
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-slate-500 text-sm">Loading inquiries...</p>
                      </div>
                    ) : error ? (
                      <div className="p-4 text-center">
                        <p className="text-red-600 text-sm mb-2">{error}</p>
                        <button 
                          onClick={fetchInquiries}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    ) : inquiries.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-3xl mb-3">📭</div>
                        <p className="text-slate-600">No inquiries yet</p>
                        <p className="text-sm text-slate-500 mt-1">Check back later for new inquiries</p>
                      </div>
                    ) : (
                      inquiries.slice(0, 5).map((inquiry) => (
                        <div
                          key={inquiry._id}
                          className={`px-4 py-3 border-b hover:bg-slate-50 transition-colors cursor-pointer ${
                            inquiry.status === "new" && !viewedInquiries.has(inquiry._id) 
                              ? "bg-blue-50 border-l-4 border-l-blue-500" 
                              : ""
                          }`}
                          onClick={() => handleViewNotification(inquiry)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900 text-sm truncate">
                                  {inquiry.name}
                                </p>
                                {inquiry.status === "new" && (
                                  <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 truncate">
                                Course: {inquiry.course}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                {/* <span>📅</span> */}
                                {formatDate(inquiry.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

                  {inquiries.length > 0 && (
                    <div className="border-t">
                      <button
                        onClick={handleViewAllNotifications}
                        className="w-full px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition-all"
                      >
                        View All Inquiries ({inquiries.length})
                      </button>
                    </div>
                  )}
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                      selectedNotification.status === 'new' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedNotification.status === 'read'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedNotification.status.charAt(0).toUpperCase() + selectedNotification.status.slice(1)}
                    </span>
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
                  <p className="text-slate-600 text-sm mt-2 font-mono break-all bg-slate-100 p-2 rounded">
                    {selectedNotification._id}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteNotification(selectedNotification._id);
                    setSelectedNotification(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Inquiry
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

          <aside className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-lg p-4 overflow-auto">
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
                  <div className="text-sm text-slate-500">
                    {user?.email || "sanjay@gmail.com"}
                  </div>
                </div>
              </div>

              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((it) => (
                <a
                  key={it.key}
                  href={it.href}
                  className="px-4 py-3 rounded-md text-sm hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900"
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
                className="w-full px-4 py-3 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-medium text-left transition-colors flex items-center justify-between"
              >
                <span>Logout</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Confirm Logout</h2>
            </div>
            
            <p className="text-slate-600 mb-2">
              Are you sure you want to logout from the admin panel?
            </p>
            <p className="text-sm text-slate-500">
              You will need to login again to access admin features.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleLogoutConfirm}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
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