"use client";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-72 flex flex-col">
        <Header />
        <main className="flex-1 pt-20 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
