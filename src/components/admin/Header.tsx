// src/components/admin/Header.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // close profile dropdown on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // handle logout confirm
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    router.push("/login"); // Replace if needed
  };

  return (
    <>
      {/* HEADER */}
      <header
        className="fixed pb-10 pt-10 top-0 left-0 right-0 bg-white border-b z-50 h-[var(--header-h)]"
        role="banner"
      >
        <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left */}
          <div className="flex pl-[300px] items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <Image src="/images/Logo.png" alt="IFBB" width={36} height={36} />
                <span className="text-lg font-semibold text-slate-900">IFBB Admin</span>
              </div>

              <div className="md:hidden text-lg font-semibold text-slate-900">IFBB Admin</div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-3 border rounded-full px-3 py-1 hover:shadow-sm"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 relative flex-shrink-0">
                  <Image src="/images/sanjay.jpeg" alt="Admin avatar" fill style={{ objectFit: "cover" }} />
                </div>

                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-bold text-slate-800">Sanjay Admin</span>
                  <span className="text-xs text-slate-500">sanjay@gmail.com</span>
                </div>
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg py-1 z-[100]">
                  <a href="/dashboard/setting" className="block px-4 py-2 text-black text-sm hover:bg-slate-100">
                    Profile
                  </a>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- MOBILE MENU ---------------- */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />

          <aside className="fixed inset-y-0 left-0 w-80 max-w-full bg-white z-50 shadow-lg p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Image src="/images/Logo.png" alt="IFBB" width={40} height={40} />
                <div>
                  <div className="font-medium text-slate-800">IFBB Admin</div>
                  <div className="text-sm text-slate-500">sanjay@gmail.com</div>
                </div>
              </div>

              <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map((it) => (
                <a key={it.key} href={it.href} className="px-4 py-3 rounded-md text-sm hover:bg-slate-100">
                  {it.label}
                </a>
              ))}
            </nav>

            <div className="mt-6 border-t pt-4">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full px-4 py-3 rounded-md bg-red-100 text-red-700 font-medium hover:bg-red-200 text-left"
              >
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ---------------- LOGOUT CONFIRM MODAL ---------------- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />

          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-[10000]">
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
