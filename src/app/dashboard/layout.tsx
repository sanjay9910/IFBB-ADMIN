"use client";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div
        className="
          flex flex-col
          md:ml-72
          transition-all duration-300
        "
      >
        {/* Header */}
        <Header />

        {/* Content */}
        <main
          className="
            flex-1
            mt-14 md:mt-0
            px-4 sm:px-6 lg:px-8
            bg-gray-50
          "
        >
          {/* Content Card Wrapper */}
          <div
            className="
              max-w-full
              mx-auto
              bg-white
              rounded-2xl
              shadow-sm
              border border-gray-200
              p-4 sm:p-6
             mt-[90px]
             mb-[20px]
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
