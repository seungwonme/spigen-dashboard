import { google } from "googleapis";

/**
 * Gmail API 발송 모듈 (OAuth2 + refresh token 방식)
 *
 * 필요한 환경변수 (.env.local):
 * - GMAIL_CLIENT_ID      : OAuth 클라이언트 ID
 * - GMAIL_CLIENT_SECRET  : OAuth 클라이언트 시크릿
 * - GMAIL_REFRESH_TOKEN  : scripts/get-gmail-token.mjs 로 발급한 refresh token
 * - GMAIL_SENDER         : 기본 발신 주소 (예: sw.an@jocodingax.ai)
 *
 * consent screen 이 "Internal"(jocodingax.ai org) 이므로 Google 검증 없이
 * gmail.send scope 를 사용하며, refresh token 은 만료되지 않는다.
 */

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  /** text 또는 html 중 하나는 반드시 있어야 한다. */
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  /** 미지정 시 GMAIL_SENDER 사용 */
  from?: string;
  replyTo?: string;
}

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail OAuth 환경변수가 없습니다. GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN 을 .env.local 에 설정하세요."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

function joinAddrs(v?: string | string[]): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v.join(", ") : v;
}

/** 비ASCII 헤더(제목 등)를 RFC 2047 형식으로 인코딩 */
function encodeHeaderWord(value: string): string {
  // ASCII 만 있으면 그대로 둔다.
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function buildRawMessage(p: SendEmailParams): string {
  const from = p.from ?? process.env.GMAIL_SENDER;
  if (!from) {
    throw new Error("발신 주소가 없습니다. from 인자 또는 GMAIL_SENDER 를 설정하세요.");
  }

  const to = joinAddrs(p.to);
  if (!to) throw new Error("수신자(to)가 없습니다.");

  const cc = joinAddrs(p.cc);
  const bcc = joinAddrs(p.bcc);
  const isHtml = typeof p.html === "string" && p.html.length > 0;
  const body = isHtml ? p.html! : (p.text ?? "");

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    p.replyTo ? `Reply-To: ${p.replyTo}` : null,
    `Subject: ${encodeHeaderWord(p.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
  ].filter((h): h is string => h !== null);

  const encodedBody = Buffer.from(body, "utf8").toString("base64");
  return `${headers.join("\r\n")}\r\n\r\n${encodedBody}`;
}

export interface SendEmailResult {
  id: string;
  threadId: string;
}

/** Gmail API 로 메일 1건을 발송한다. */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth });

  const raw = Buffer.from(buildRawMessage(params), "utf8").toString("base64url");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return {
    id: res.data.id ?? "",
    threadId: res.data.threadId ?? "",
  };
}
