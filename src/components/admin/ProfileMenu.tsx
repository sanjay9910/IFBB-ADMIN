// src/components/admin/ProfileMenu.tsx
"use client";
import React from "react";
import Image from "next/image";

export default function ProfileMenu() {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-slate-600 hidden sm:block">
        <div>Admin</div>
        <div className="text-xs text-slate-400">admin@ifbb.example</div>
      </div>
      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 relative">
        <Image src="/images/logos/avatar-placeholder.png" alt="profile" fill style={{ objectFit: "cover" }} />
      </div>
    </div>
  );
}
