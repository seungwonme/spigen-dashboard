import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/google/gmail";

/**
 * POST /api/email
 *
 * 이 라우트는 middleware 로 보호된다(로그인 세션 없으면 /login 리다이렉트).
 *
 * Body(JSON):
 *   to       string | string[]   (필수)
 *   subject  string              (필수)
 *   text     string              (text 또는 html 중 하나 필수)
 *   html     string
 *   cc       string | string[]
 *   bcc      string | string[]
 *   from     string              (미지정 시 GMAIL_SENDER)
 *   replyTo  string
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const { to, subject, text, html, cc, bcc, from, replyTo } = body as {
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
    from?: string;
    replyTo?: string;
  };

  if (!to || !subject || (!text && !html)) {
    return NextResponse.json(
      { ok: false, error: "to, subject, 그리고 text 또는 html 이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await sendEmail({ to, subject, text, html, cc, bcc, from, replyTo });
    return NextResponse.json({ ok: true, id: result.id, threadId: result.threadId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "메일 발송에 실패했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
