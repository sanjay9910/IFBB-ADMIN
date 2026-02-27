"use client";

import React, { useState, useEffect } from "react";
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
  { key: "exam", label: "Exam", href: "/dashboard/exam", icon: FileText },
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    router.push("/auth/login");
  };

  const SidebarContent = (
    <>
      {/* Logo with glow effect */}
      <div className="px-6 py-6 border-b border-slate-700/50 flex justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent blur-xl" />
        <img 
          src="/images/Logo.png" 
          alt="Logo" 
          className="w-16 h-16 relative z-10 drop-shadow-2xl transition-transform duration-500 hover:scale-110 hover:rotate-3" 
        />
      </div>

      {/* Nav with stagger animation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {items.map((it, index) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;

          return (
            <Link
              key={it.key}
              href={it.href}
              onClick={() => setOpen(false)}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all duration-300 ease-out group overflow-hidden
                ${mounted ? "animate-slideIn" : "opacity-0"}
                ${
                  active
                    ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40 scale-[1.02]"
                    : "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-800 hover:to-slate-700 hover:scale-[1.02] hover:shadow-lg"
                }`}
            >
              {/* Animated background glow for active item */}
              {active && (
                <>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-r-full shadow-lg shadow-white/50" />
                  <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />
                </>
              )}
              
              {/* Hover ripple effect */}
              <span className="absolute inset-0 scale-0 rounded-xl bg-white/10 transition-transform duration-500 group-hover:scale-100" />
              
              <Icon 
                className={`w-5 h-5 relative z-10 transition-all duration-300 
                  ${active ? "scale-110 drop-shadow-lg" : "group-hover:scale-110 group-hover:rotate-6"}`} 
              />
              <span className="flex-1 relative z-10 transition-all duration-300">
                {it.label}
              </span>
              <ChevronRight
                className={`w-4 h-4 relative z-10 transition-all duration-300 
                  ${active 
                    ? "opacity-100 translate-x-0" 
                    : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1"
                  }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Logout with pulse effect */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                     text-red-400 hover:text-white font-semibold
                     bg-gradient-to-r from-red-500/10 to-red-600/10 
                     hover:from-red-500/20 hover:to-red-600/20
                     border border-red-500/20 hover:border-red-500/40
                     transition-all duration-300 ease-out
                     hover:scale-[1.02] active:scale-95
                     hover:shadow-xl hover:shadow-red-500/30
                     group relative overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <LogOut className="w-5 h-5 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 relative z-10" />
          <span className="relative z-10">Logout</span>
        </button>
      </div>

      <p className="text-xs text-center text-slate-500 pb-4 transition-colors duration-300 hover:text-slate-400">
        v1.0.0 • Admin Panel
      </p>
    </>
  );

  return (
    <>
      {/* ===== MOBILE TOP BAR with backdrop blur ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-xl z-[1000] flex items-center px-4 border-b border-slate-700/50 shadow-xl">
        <button 
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 active:scale-90 group"
        >
          <Menu className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
        </button>
        <div className="ml-4 flex items-center gap-3">
          <span className="text-white font-bold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Admin Panel
          </span>
        </div>
      </div>

      {/* ===== MOBILE SIDEBAR with better animations ===== */}
      <div
        className={`fixed inset-0 z-[9999] flex md:hidden transition-all duration-500 ${
          open ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`relative w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl transition-all duration-500 ease-out ${
            open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-20 p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-300 hover:rotate-90 active:scale-90 border border-slate-700/50 hover:border-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
          {SidebarContent}
        </aside>
      </div>

      {/* ===== DESKTOP SIDEBAR with enhanced gradient ===== */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-70 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 z-[999] flex-col shadow-2xl shadow-black/50 backdrop-blur-xl">
        {SidebarContent}
      </aside>

      {/* ===== LOGOUT MODAL with bounce animation ===== */}
      <div
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ${
          showLogoutModal ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ${
            showLogoutModal ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setShowLogoutModal(false)}
        />
        <div
          className={`relative bg-gradient-to-br from-white to-slate-50 rounded-2xl w-full max-w-sm p-6 shadow-2xl 
            border border-slate-200 transition-all duration-500 ${
            showLogoutModal
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-75 translate-y-8"
          }`}
        >
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/30">
              <LogOut className="w-6 h-6 text-white"  />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Logout</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to logout from your account?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/40 hover:shadow-xl hover:shadow-red-500/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgb(51, 65, 85);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgb(71, 85, 105);
        }
      `}</style>
    </>
  );
}