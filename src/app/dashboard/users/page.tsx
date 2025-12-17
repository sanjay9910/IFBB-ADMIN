// src/app/admin/users/page.tsx
import React from "react";
import RecentUsersTable from "@/components/admin/RecentUsersTable";

export default function UsersPage() {
  return (
    <div  className="bg-white h-full">
      <RecentUsersTable />
    </div>
  );
}
