import "server-only";
import snowflake from "snowflake-sdk";
import crypto from "node:crypto";
import fs from "node:fs";

// SDK 기본 INFO 로깅 억제 — 화면 공유 터미널에 연결 메타(계정·유저·역할) 노출 방지
snowflake.configure({ logLevel: "ERROR" });

// 키페어 인증: 파일에서만 읽고 base64 DER / PEM 자동 판별 → PEM 정규화. 키 문자열은 로그 금지.
function loadPrivateKey(): string {
  const raw = (process.env.SNOWFLAKE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    ?? (process.env.SNOWFLAKE_PRIVATE_KEY_PATH
      ? fs.readFileSync(process.env.SNOWFLAKE_PRIVATE_KEY_PATH, "utf8")
      : "")).trim();
  if (!raw) throw new Error("SNOWFLAKE_PRIVATE_KEY or SNOWFLAKE_PRIVATE_KEY_PATH env is required");
  if (raw.includes("BEGIN")) return raw;
  return crypto
    .createPrivateKey({ key: Buffer.from(raw.replace(/\s+/g, ""), "base64"), format: "der", type: "pkcs8" })
    .export({ format: "pem", type: "pkcs8" })
    .toString();
}

// 조회 전용(TUTOR_USER). 데모용 per-request 연결.
// spartan: 요청마다 연결, 트래픽 늘면 풀링. 강의 시연엔 충분.
export function sfQuery<T = Record<string, unknown>>(sqlText: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const conn = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT as string,
      username: process.env.SNOWFLAKE_USER as string,
      role: process.env.SNOWFLAKE_ROLE,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      authenticator: "SNOWFLAKE_JWT",
      privateKey: loadPrivateKey(),
    });
    conn.connect((err) => {
      if (err) return reject(err);
      conn.execute({
        sqlText,
        complete: (qerr, _stmt, rows) => {
          conn.destroy(() => {});
          if (qerr) return reject(qerr);
          resolve((rows ?? []) as T[]);
        },
      });
    });
  });
}
