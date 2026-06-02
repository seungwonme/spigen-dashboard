#!/usr/bin/env node
/**
 * Gmail refresh token 발급 스크립트 (1회 실행)
 *
 * 사전 준비: .env.local 에 OAuth Desktop 클라이언트 자격증명이 있어야 한다.
 *   GMAIL_CLIENT_ID=...
 *   GMAIL_CLIENT_SECRET=...
 *
 * 실행:
 *   node scripts/get-gmail-token.mjs
 *
 * 브라우저가 열리면 sw.an@jocodingax.ai 로 동의한다. 완료되면 발급된
 * GMAIL_REFRESH_TOKEN 이 .env.local 에 자동으로 추가/갱신된다.
 */
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import { google } from "googleapis";

const ENV_PATH = new URL("../.env.local", import.meta.url).pathname;
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

function parseEnv(path) {
  const out = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function upsertEnv(path, key, value) {
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    /* 파일 없으면 새로 만든다 */
  }
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(raw)) {
    raw = raw.replace(re, line);
  } else {
    raw = raw.replace(/\n*$/, "\n") + `${line}\n`;
  }
  writeFileSync(path, raw, "utf8");
}

const env = parseEnv(ENV_PATH);
const clientId = env.GMAIL_CLIENT_ID;
const clientSecret = env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET 가 .env.local 에 없습니다. Cloud Console 에서 Desktop OAuth 클라이언트를 만든 뒤 먼저 채워주세요."
  );
  process.exit(1);
}

const server = http.createServer();
server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  const redirectUri = `http://127.0.0.1:${port}`;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [SCOPE],
  });

  server.on("request", async (req, res) => {
    try {
      const url = new URL(req.url, redirectUri);
      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(400).end("code 누락");
        return;
      }
      const { tokens } = await oauth2.getToken(code);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>완료되었습니다. 터미널로 돌아가세요.</h2>");
      server.close();

      if (!tokens.refresh_token) {
        console.error(
          "refresh_token 이 반환되지 않았습니다. Cloud Console 에서 앱 동의를 한 번 해제(또는 prompt=consent)한 뒤 다시 실행하세요."
        );
        process.exit(1);
      }
      upsertEnv(ENV_PATH, "GMAIL_REFRESH_TOKEN", tokens.refresh_token);
      console.log("GMAIL_REFRESH_TOKEN 을 .env.local 에 저장했습니다.");
      process.exit(0);
    } catch (e) {
      console.error("토큰 교환 실패:", e?.message ?? e);
      process.exit(1);
    }
  });

  console.log("브라우저에서 동의를 진행하세요. 자동으로 열리지 않으면 아래 URL 을 여세요:\n");
  console.log(authUrl, "\n");
  execFile("open", [authUrl], () => {});
});
