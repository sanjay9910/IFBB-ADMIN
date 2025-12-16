// src/app/admin/layout.tsx
import React from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import "../globals.css";

export const metadata = {
  title: "IFBB Admin",
  description: "IFBB Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <div className="min-h-screen flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col md:ml-[var(--sidebar-w)]">
            <Header />
            <main className="flex-1 overflow-y-auto pt-[var(--header-h)] bg-slate-50">
              <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
