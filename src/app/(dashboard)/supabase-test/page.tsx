import { createClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();

  let status: "connected" | "error" = "error";
  let message = "";
  let projectUrl = "";
  let elapsed = 0;

  try {
    const start = Date.now();
    const { error } = await supabase.from("_supabase_test_ping").select("*").limit(1);
    elapsed = Date.now() - start;

    // 어떤 에러든 Supabase가 응답했으면 연결 성공
    if (!error || error.message.includes("Could not find the table") || error.code === "PGRST116" || error.code === "42P01" || error.code === "PGRST200") {
      status = "connected";
      message = "Supabase 데이터베이스에 성공적으로 연결되었습니다.";
    } else {
      message = error.message;
    }
    projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch (e) {
    message = e instanceof Error ? e.message : "알 수 없는 오류";
  }

  return (
    <div className="p-8 max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
        Supabase 연결 테스트
      </h1>

      <div
        className={`rounded-xl border p-6 flex items-start gap-4 ${
          status === "connected"
            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
            : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950"
        }`}
      >
        <span className="text-3xl">{status === "connected" ? "✅" : "❌"}</span>
        <div>
          <p
            className={`font-semibold text-lg ${
              status === "connected"
                ? "text-green-800 dark:text-green-300"
                : "text-red-800 dark:text-red-300"
            }`}
          >
            {status === "connected" ? "연결 성공" : "연결 실패"}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{message}</p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <dt className="text-neutral-500">프로젝트 URL</dt>
          <dd className="font-mono text-neutral-800 dark:text-neutral-200 truncate max-w-xs">
            {projectUrl}
          </dd>
        </div>
        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <dt className="text-neutral-500">리전</dt>
          <dd className="text-neutral-800 dark:text-neutral-200">ap-northeast-2 (서울)</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <dt className="text-neutral-500">응답 시간</dt>
          <dd className="text-neutral-800 dark:text-neutral-200">{elapsed}ms</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">클라이언트</dt>
          <dd className="text-neutral-800 dark:text-neutral-200">@supabase/ssr (Server Component)</dd>
        </div>
      </dl>
    </div>
  );
}
