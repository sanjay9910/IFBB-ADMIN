import React from "react";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import "./globals.css"; 

export const metadata = {
  title: "IFBB Admin",
  description: "IFBB Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">   
      <body className="h-full bg-slate-50"> 
        <div className="min-h-screen flex"> 
          <Sidebar />
          <div className="flex-1 flex flex-col bg-white">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {children}
            </main>

          </div>
        </div>

      </body>
    </html>
  );
}
