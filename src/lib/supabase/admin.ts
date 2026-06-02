import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버 전용. service_role 키로 RLS를 우회해 동기화 적재(쓰기)에 사용한다.
// 이 모듈은 절대 클라이언트 컴포넌트에서 import 하지 않는다 (키 노출 방지).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
