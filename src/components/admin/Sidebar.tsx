// src/components/admin/Sidebar.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, Award, BookOpen, FileText, Newspaper, 
  Settings, LogOut, ChevronRight, Sparkles
} from "lucide-react";

const items = [
  { key: "users", label: "Users", href: "/dashboard/users", icon: Users },
  { key: "brands", label: "Brand Logo", href: "/dashboard/brands", icon: Award },
  { key: "courses", label: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { key: "certificates", label: "Certificates", href: "/dashboard/certificate", icon: FileText },
  { key: "news", label: "News", href: "/dashboard/news", icon: Newspaper },
  { key: "settings", label: "Settings", href: "/dashboard/setting", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname() || "/admin";
  const router = useRouter();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    // 🔥 Replace with your logout logic
    router.push("/login");
  };

  return (
    <>
      {/* SIDEBAR */}
      <aside
        className="w-72 fixed left-0 top-0 bottom-0 z-[9999]
                   bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
                   border-r border-slate-700/50 hidden md:flex flex-col shadow-2xl"
      >
        {/* Logo Section */}
        <div className="px-6 py-8 flex items-center justify-center border-b border-slate-700/50">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
              <img 
                src="/images/Logo.png" 
                width={70} 
                height={70} 
                alt="Logo"
                className="relative z-10"
              />
            </div>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-4 py-2 overflow-y-auto">
          {items.map((it) => {
            const active = path.startsWith(it.href);
            const Icon = it.icon;

            return (
              <Link
                key={it.key}
                href={it.href}
                className={`group relative px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3
                  ${active
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}

                <div className={`transition-transform duration-300 ${active ? "" : "group-hover:scale-110"}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <span className="flex-1">{it.label}</span>

                <ChevronRight 
                  className={`w-4 h-4 transition-all duration-300 ${
                    active 
                      ? "opacity-100 translate-x-0" 
                      : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  }`} 
                />

                {!active && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto px-4 py-6 border-t border-slate-700/50">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="group w-full px-4 py-3.5 rounded-xl text-left 
                       bg-gradient-to-r from-red-500/10 to-rose-500/10 
                       hover:from-red-500/20 hover:to-rose-500/20 
                       border border-red-500/30 text-red-400 hover:text-red-300
                       font-semibold transition-all duration-300 flex items-center gap-3 
                       hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
          >
            <div className="w-9 h-9 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors duration-300">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="flex-1">Logout</span>
            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </button>
        </div>

        {/* Version Info */}
        <div className="px-6 py-3 text-center border-t border-slate-700/50">
          <p className="text-xs text-slate-500">v1.0.0 • Admin Panel</p>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* LOGOUT CONFIRM MODAL */}
      {/* ---------------------------------------------------------------- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-[10001] animate-fadeIn">
            <h2 className="text-xl font-semibold text-slate-900">Confirm Logout</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to logout from admin panel?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-md border text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
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
