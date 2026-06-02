"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPassword, signUp, signInWithOtp } from "@/lib/supabase/actions";

type Tab = "password" | "magic";
type Msg = { type: "error" | "success"; text: string };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  // URL 파라미터 에러는 고정 메시지만 허용 (피싱용 임의 메시지 주입 차단)
  const urlError = searchParams.get("error")
    ? "링크가 만료되었거나 유효하지 않습니다. 다시 시도해 주세요."
    : null;

  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<Msg | null>(
    urlError ? { type: "error", text: urlError } : null
  );
  const [isPending, startTransition] = useTransition();

  function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);
    startTransition(async () => {
      const result = await signInWithPassword(fd);
      if (result?.error) setMsg({ type: "error", text: result.error });
    });
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);
    startTransition(async () => {
      const result = await signUp(fd);
      if (result?.error) setMsg({ type: "error", text: result.error });
      else if (result?.message) setMsg({ type: "success", text: result.message });
    });
  }

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.append("email", email);
    startTransition(async () => {
      const result = await signInWithOtp(fd);
      if (result?.error) setMsg({ type: "error", text: result.error });
      else if (result?.message) setMsg({ type: "success", text: result.message });
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Spigen DE</p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">광고 대시보드</h1>
        </div>

        {/* 카드 */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-700">
            {([
              { id: "password", label: "이메일 로그인" },
              { id: "magic", label: "매직 링크" },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setMsg(null); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t.id
                    ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {/* 메시지 */}
            {msg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                msg.type === "error"
                  ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  : "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              }`}>
                {msg.text}
              </div>
            )}

            {/* 이메일 + 패스워드 탭 */}
            {tab === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-semibold py-2.5 text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "로그인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isPending}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium py-2.5 text-sm transition-colors disabled:opacity-50"
                >
                  회원가입
                </button>
              </form>
            )}

            {/* 매직 링크 탭 */}
            {tab === "magic" && (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  이메일을 입력하면 로그인 링크를 발송합니다. 비밀번호가 필요하지 않습니다.
                </p>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-semibold py-2.5 text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "발송 중..." : "매직 링크 발송"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
