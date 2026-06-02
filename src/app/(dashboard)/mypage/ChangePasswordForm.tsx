"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/supabase/actions";

type Msg = { type: "error" | "success"; text: string };

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<Msg | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.append("password", password);
    fd.append("confirm", confirm);
    startTransition(async () => {
      const result = await changePassword(fd);
      if (result?.error) {
        setMsg({ type: "error", text: result.error });
      } else if (result?.message) {
        setMsg({ type: "success", text: result.message });
        setPassword("");
        setConfirm("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {msg && (
        <div className={`rounded-lg px-3 py-2.5 text-sm ${
          msg.type === "error"
            ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            : "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
        }`}>
          {msg.text}
        </div>
      )}
      <div>
        <label htmlFor="new-password" className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">새 비밀번호</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="6자 이상"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900 transition"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">비밀번호 확인</label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="비밀번호 재입력"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900 transition"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-semibold px-4 py-2 text-sm transition-colors disabled:opacity-50"
      >
        {isPending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
