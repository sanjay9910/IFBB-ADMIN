// src/components/admin/ModuleCard.tsx
import React from "react";

export default function ModuleCard({ title, total }: { title: string; total: number }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col items-start">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{total}</div>
    </div>
  );
}
