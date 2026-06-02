import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import { autoSync } from "@/lib/sheets/auto-sync";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 60초 TTL — 마지막 싱크로부터 60초 경과 시 구글 시트에서 자동 갱신
  await autoSync().catch((e) => console.warn("[layout] auto-sync 실패:", e));

  return (
    <DashboardShell userEmail={user?.email}>
      {children}
    </DashboardShell>
  );
}
