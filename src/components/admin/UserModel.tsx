// src/components/admin/UserModal.tsx
"use client";
import React from "react";

type Course = { id: string; title: string; purchasedAt: string };
type Student = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatar?: string;
  courses: Course[];
};

export default function UserModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const avatar = student.avatar ?? "";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Student details</h3>
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-200">
                {/* plain img avoids Next.js import issues with data-urls */}
                <img src={avatar} alt={student.name} className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 text-center md:text-left">
                <div className="text-lg font-semibold">{student.name}</div>
                <div className="text-sm text-slate-500">{student.email}</div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {student.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-slate-600 mb-2">Purchased courses ({student.courses.length})</div>

              <div className="space-y-3">
                {student.courses.map((c) => (
                  <div key={c.id} className="flex items-start justify-between bg-slate-50 p-3 rounded">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-slate-500">Purchased: {c.purchasedAt}</div>
                    </div>

                    <div className="text-xs text-slate-500">Course ID: {c.id}</div>
                  </div>
                ))}

                {student.courses.length === 0 && (
                  <div className="text-sm text-slate-500">No purchased courses.</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t text-right">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Close</button>
          </div>
        </div>
      </div>
    </>
  );
}
