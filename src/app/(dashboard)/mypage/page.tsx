import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const createdAt = new Date(user.created_at).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("ko-KR", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;
  const isPasswordUser = user.app_metadata?.provider === "email";

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">마이페이지</h1>
        <p className="text-sm text-neutral-400 mt-0.5">계정 정보를 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* 계정 정보 */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">계정 정보</h2>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <Row label="이메일" value={user.email ?? "—"} />
          <Row label="가입일" value={createdAt} />
          {lastSignIn && <Row label="마지막 로그인" value={lastSignIn} />}
          <Row label="로그인 방식" value={isPasswordUser ? "이메일 + 비밀번호" : "매직 링크 / 소셜"} />
        </div>
      </section>

      {/* 비밀번호 변경 — 이메일+비밀번호 유저만 */}
      {isPasswordUser && (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">비밀번호 변경</h2>
          </div>
          <div className="px-5 py-4">
            <ChangePasswordForm />
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <span className="text-xs text-neutral-400 w-28 shrink-0">{label}</span>
      <span className="text-sm text-neutral-800 dark:text-neutral-200 break-all">{value}</span>
    </div>
  );
}
