"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Award,
  BookOpen,
  FileText,
  Newspaper,
  Bell,
  Image as ImageIcon,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const items = [
  { key: "users", label: "Users", href: "/dashboard/users", icon: Users },
  { key: "brands", label: "Brand Logo", href: "/dashboard/brands", icon: Award },
  { key: "courses", label: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { key: "certificates", label: "Certificates", href: "/dashboard/certificate", icon: FileText },
  { key: "certificates", label: "Exam", href: "/dashboard/exam", icon: FileText },
  { key: "news", label: "News", href: "/dashboard/news", icon: Newspaper },
  { key: "notification", label: "Notification", href: "/dashboard/notification", icon: Bell },
  { key: "gallery", label: "Gallery", href: "/dashboard/galleryImag", icon: ImageIcon },
  { key: "settings", label: "Settings", href: "/dashboard/setting", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
   const { logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout= () => {
    logout();
    setShowLogoutModal(false);
    router.push("/auth/login");
  };
  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700/50 flex justify-center">
        <img src="/images/Logo.png" alt="Logo" className="w-16 h-16" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;

          return (
            <Link
              key={it.key}
              href={it.href}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition
                ${
                  active
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="flex-1">{it.label}</span>
              <ChevronRight
                className={`w-4 h-4 transition ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                     text-red-400 hover:text-red-300
                     bg-red-500/10 hover:bg-red-500/20 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      <p className="text-xs text-center text-slate-500 pb-4">
        v1.0.0 • Admin Panel
      </p>
    </>
  );

  return (
    <>
      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 z-[1000] flex items-center px-4">
        <button onClick={() => setOpen(true)}>
          <Menu className="w-6 h-6 text-white" />
        </button>
        <span className="ml-4 text-white font-semibold">Admin Panel</span>
      </div>

      {/* ===== MOBILE SIDEBAR ===== */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-72 bg-slate-900 text-white flex flex-col">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4"
            >
              <X className="w-6 h-6" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-72
                        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
                        border-r border-slate-700/50 z-[999] flex-col">
        {SidebarContent}
      </aside>

      {/* ===== LOGOUT MODAL ===== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold">Confirm Logout</h2>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to logout?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
