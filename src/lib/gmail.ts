import { google } from "googleapis";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value || value.includes("여기에_")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// 도메인 위임(DWD): 서비스 계정이 GMAIL_SENDER 사용자를 "대신해서" 발송한다.
// sheets.ts의 JWT 패턴과 동일하되, subject(위임 대상)와 gmail.send 스코프가 추가됨.
// 이 코드가 동작하려면 Workspace Admin Console에서 SA 클라이언트 ID에
// gmail.send 스코프가 위임돼 있어야 한다(코드만으로는 부족).
function getAuth(sender: string) {
  return new google.auth.JWT({
    email: getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: getRequiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: [GMAIL_SEND_SCOPE],
    subject: sender,
  });
}

// 비ASCII 제목은 RFC 2047(=?UTF-8?B?...?=)로 인코딩해야 깨지지 않는다.
function encodeHeaderWord(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function toAddressList(value: string | string[]) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export type SendMailInput = {
  to: string | string[];
  subject: string;
  /** html 또는 text 중 하나는 반드시 있어야 한다. 둘 다 주면 html 우선. */
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  /** 발신 명의 override. 생략 시 env GMAIL_SENDER. 위임된 도메인 계정이어야 함. */
  from?: string;
  replyTo?: string;
};

function buildRawMessage(input: SendMailInput, sender: string) {
  const body = input.html ?? input.text ?? "";
  const contentType = input.html ? "text/html" : "text/plain";

  const headers = [
    `From: ${sender}`,
    `To: ${toAddressList(input.to)}`,
    input.cc ? `Cc: ${toAddressList(input.cc)}` : null,
    input.bcc ? `Bcc: ${toAddressList(input.bcc)}` : null,
    input.replyTo ? `Reply-To: ${input.replyTo}` : null,
    `Subject: ${encodeHeaderWord(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
  ].filter((line): line is string => line !== null);

  // 본문은 base64로 인코딩하고 76자마다 줄바꿈(RFC 2045).
  const encodedBody =
    Buffer.from(body, "utf-8")
      .toString("base64")
      .match(/.{1,76}/g)
      ?.join("\r\n") ?? "";

  const message = `${headers.join("\r\n")}\r\n\r\n${encodedBody}`;
  return Buffer.from(message, "utf-8").toString("base64url");
}

export type SendMailResult = {
  id: string;
  threadId: string;
  from: string;
};

// 메일을 발송하고 Gmail 메시지 id/threadId를 반환한다.
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const sender = (input.from ?? getRequiredEnv("GMAIL_SENDER")).trim();
  if (!input.to || (Array.isArray(input.to) && input.to.length === 0)) {
    throw new Error("Recipient (to) is required");
  }
  if (!input.subject?.trim()) {
    throw new Error("Subject is required");
  }
  if (!input.html && !input.text) {
    throw new Error("Either html or text body is required");
  }

  const gmail = google.gmail({ version: "v1", auth: getAuth(sender) });
  const res = await gmail.users.messages.send({
    userId: "me", // subject로 위임된 사용자
    requestBody: { raw: buildRawMessage(input, sender) },
  });

  return {
    id: res.data.id ?? "",
    threadId: res.data.threadId ?? "",
    from: sender,
  };
}
