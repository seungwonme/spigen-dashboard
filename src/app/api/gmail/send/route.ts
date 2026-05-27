import { sendMail, type SendMailInput } from "@/lib/gmail";
import type { NextRequest } from "next/server";

// googleapis는 Node 패키지이므로 Node.js 런타임 강제(Edge 불가).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Partial<SendMailInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { to, subject, html, text, cc, bcc, from, replyTo } = body;

  if (!to || !subject || (!html && !text)) {
    return Response.json(
      { error: "Required fields: to, subject, and html or text" },
      { status: 400 },
    );
  }

  try {
    const result = await sendMail({
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      from,
      replyTo,
    });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
