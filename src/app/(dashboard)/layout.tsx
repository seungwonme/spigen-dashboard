import Sidebar from "@/components/layout/Sidebar";
import GlobalFilter from "@/components/layout/GlobalFilter";
import LogoutButton from "@/components/layout/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex-1 min-w-0">
            <GlobalFilter />
          </div>
          <div className="pr-4 shrink-0">
            <LogoutButton />
          </div>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
