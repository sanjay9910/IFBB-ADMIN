// src/components/admin/SearchInput.tsx
"use client";
import React, { useState } from "react";

export default function SearchInput({ onSearch }: { onSearch?: (q: string) => void }) {
  const [q, setQ] = useState("");
  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    onSearch?.(q);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex items-center bg-slate-100 rounded-md px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="bg-transparent outline-none w-full text-sm text-slate-700"
        />
        <button type="submit" className="text-sm text-slate-700">Search</button>
      </div>
    </form>
  );
}
