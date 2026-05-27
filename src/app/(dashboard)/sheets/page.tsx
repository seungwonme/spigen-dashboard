"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";

type SheetRow = Record<string, string>;

interface SpreadsheetInfo {
  id: string;
  name: string;
  modifiedTime: string;
}

interface ListResponse {
  sheets?: SpreadsheetInfo[];
  error?: string;
}

interface TabsResponse {
  tabs?: string[];
  error?: string;
}

interface SheetsResponse {
  tab?: string;
  rows?: SheetRow[];
  count?: number;
  error?: string;
}

const PREFERRED_TAB = "주문";
const SELECT_CLASS =
  "h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-yellow-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

export default function SheetsPage() {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);

  // 1. 서비스 계정에 공유된 스프레드시트 목록 로드
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/sheets/list", { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as ListResponse;
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "시트 목록을 불러오지 못했습니다.");
        }

        const list = body.sheets ?? [];
        setSpreadsheets(list);
        setError(null);
        if (list.length > 0) {
          setSpreadsheetId((current) => current || list[0].id);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingList(false);
      });

    return () => controller.abort();
  }, []);

  // 2. 선택한 스프레드시트의 탭 목록 로드
  useEffect(() => {
    if (!spreadsheetId) return;
    const controller = new AbortController();

    fetch(
      `/api/sheets/tabs?spreadsheetId=${encodeURIComponent(spreadsheetId)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const body = (await response.json()) as TabsResponse;
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "탭 목록을 불러오지 못했습니다.");
        }

        const list = body.tabs ?? [];
        setTabs(list);
        setError(null);
        setActiveTab(list.includes(PREFERRED_TAB) ? PREFERRED_TAB : (list[0] ?? ""));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setTabs([]);
        setActiveTab("");
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => controller.abort();
  }, [spreadsheetId]);

  // 3. 선택한 탭 데이터 로드
  useEffect(() => {
    if (!spreadsheetId || !activeTab) {
      setRows([]);
      return;
    }
    const controller = new AbortController();
    setLoadingRows(true);

    fetch(
      `/api/sheets?spreadsheetId=${encodeURIComponent(spreadsheetId)}&tab=${encodeURIComponent(activeTab)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const body = (await response.json()) as SheetsResponse;
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "Google Sheets 데이터를 불러오지 못했습니다.");
        }

        setRows(body.rows ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRows([]);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRows(false);
      });

    return () => controller.abort();
  }, [spreadsheetId, activeTab, refreshToken]);

  const columns = useMemo<Column<Record<string, unknown>>[]>(() => {
    const headers = Object.keys(rows[0] ?? {});
    return headers.map((header) => ({
      key: header,
      header,
      sortable: false,
      render: (row) => (
        <span className="block max-w-56 truncate" title={String(row[header] ?? "")}>
          {String(row[header] ?? "")}
        </span>
      ),
    }));
  }, [rows]);

  function refresh() {
    setError(null);
    setRefreshToken((value) => value + 1);
  }

  const statusText = loadingList
    ? "시트 목록 불러오는 중..."
    : spreadsheets.length === 0
      ? "서비스 계정에 공유된 시트가 없습니다"
      : `${activeTab || "—"} 탭 · ${loadingRows ? "불러오는 중" : `${rows.length.toLocaleString("ko-KR")}행`}`;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            Google Sheets 원본
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {statusText}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={spreadsheetId}
            onChange={(event) => setSpreadsheetId(event.target.value)}
            disabled={loadingList || spreadsheets.length === 0}
            className={SELECT_CLASS}
            aria-label="스프레드시트 선택"
          >
            {spreadsheets.length === 0 && <option value="">시트 없음</option>}
            {spreadsheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>

          <select
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value)}
            disabled={tabs.length === 0}
            className={SELECT_CLASS}
            aria-label="탭 선택"
          >
            {tabs.length === 0 && <option value="">탭 없음</option>}
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={refresh}
            className="h-9 rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        {loadingList || loadingRows ? (
          <div className="p-8 text-center text-neutral-400">로딩 중...</div>
        ) : (
          <DataTable
            columns={columns}
            data={rows as Record<string, unknown>[]}
            pageSize={25}
          />
        )}
      </div>
    </div>
  );
}
