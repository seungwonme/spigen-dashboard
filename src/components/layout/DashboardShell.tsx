"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import GlobalFilter from "./GlobalFilter";
import LogoutButton from "./LogoutButton";

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 모바일 사이드바 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex">
      {/* 모바일 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바: 모바일=fixed 드로어, 데스크톱=relative 고정 */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:block ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar userEmail={userEmail} />
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 바 */}
        <div className="flex items-center bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          {/* 햄버거 버튼 (모바일 전용) */}
          <button
            className="md:hidden flex items-center justify-center w-11 h-11 shrink-0 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect width="18" height="2" rx="1" fill="currentColor" />
              <rect y="6" width="18" height="2" rx="1" fill="currentColor" />
              <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          {/* GlobalFilter: 넘치면 가로 스크롤 */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            <GlobalFilter />
          </div>
          <div className="pr-3 shrink-0">
            <LogoutButton />
          </div>
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
