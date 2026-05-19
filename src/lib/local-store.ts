// Browser localStorage 기반 데이터 저장소.
// 각 테이블은 `spigen:<table>` 키 하나에 JSON 배열로 저장된다.

export type TableName =
  | "ad_campaigns"
  | "attribution"
  | "orders"
  | "listing"
  | "inventory"
  | "traffic";

const PREFIX = "spigen:";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getTable<T = Record<string, unknown>>(name: TableName): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(PREFIX + name);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeTable<T = Record<string, unknown>>(name: TableName, rows: T[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PREFIX + name, JSON.stringify(rows));
}

// 키 매칭으로 upsert. keyOf가 동일한 기존 행이 있으면 교체, 없으면 추가.
export function upsertRows<T extends Record<string, unknown>>(
  name: TableName,
  rows: T[],
  keyOf: (r: T) => string,
): { inserted: number; replaced: number } {
  const existing = getTable<T>(name);
  const map = new Map<string, T>();
  for (const r of existing) map.set(keyOf(r), r);

  let inserted = 0;
  let replaced = 0;
  for (const r of rows) {
    const k = keyOf(r);
    if (map.has(k)) replaced++;
    else inserted++;
    map.set(k, r);
  }

  writeTable(name, Array.from(map.values()));
  return { inserted, replaced };
}

// orders 처럼 유니크 키가 없는 테이블용: 그냥 append.
export function appendRows<T extends Record<string, unknown>>(name: TableName, rows: T[]): void {
  const existing = getTable<T>(name);
  writeTable(name, [...existing, ...rows]);
}

export function clearAllTables(): void {
  if (!isBrowser()) return;
  const tables: TableName[] = ["ad_campaigns", "attribution", "orders", "listing", "inventory", "traffic"];
  for (const t of tables) window.localStorage.removeItem(PREFIX + t);
}

export function getTableCount(name: TableName): number {
  return getTable(name).length;
}
