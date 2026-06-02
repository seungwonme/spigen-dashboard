import { type NextRequest, NextResponse } from "next/server";
import { detectFileType } from "@/lib/parsers/detect-type";
import { ingest } from "@/lib/parsers/ingest";
import { dbClearAll } from "@/lib/supabase/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 수동 CSV/XLSX 업로드. 클라이언트에서 파싱한 행을 받아 서버(service_role)로 적재한다.
// RLS상 authenticated 역할은 읽기만 가능하므로 쓰기/삭제는 반드시 이 서버 라우트를 거친다.
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  if (!(await requireUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: Record<string, unknown>[];
  try {
    const body = await request.json();
    rows = body?.rows;
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "파일이 비어 있습니다." }, { status: 400 });
  }

  const headers = Object.keys(rows[0] as object);
  const type = detectFileType(headers);
  if (!type) {
    return NextResponse.json(
      { error: `파일 유형 감지 실패. 컬럼: ${headers.slice(0, 5).join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { inserted, skipped, error } = await ingest(type, rows, admin);
  if (error) {
    return NextResponse.json({ error: `저장 실패: ${error}` }, { status: 500 });
  }
  return NextResponse.json({ type, inserted, skipped, total: rows.length });
}

export async function DELETE() {
  if (!(await requireUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  await dbClearAll(admin);
  return NextResponse.json({ ok: true });
}
