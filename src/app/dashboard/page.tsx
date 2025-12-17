import ModuleCard from "@/components/admin/ModulCard";
import RecentUsersTable from "@/components/admin/RecentUsersTable";

const modules = [
  { key: "users", title: "Users", total: 124 },
  { key: "brands", title: "Brand Logo", total: 12 },
  { key: "courses", title: "Courses", total: 34 },
  { key: "certificates", title: "Certificates", total: 58 },
  { key: "news", title: "News", total: 8 },
  { key: "settings", title: "Settings", total: 1 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Top Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {modules.map((m) => (
          <ModuleCard
            key={m.key}
            title={m.title}
            total={m.total}
          />
        ))}
      </section>

      {/* Recent Users */}
      <section>
        <h2 className="text-lg font-medium mb-3">
          Recent Users
        </h2>
        <RecentUsersTable />
      </section>
    </div>
  );
}
