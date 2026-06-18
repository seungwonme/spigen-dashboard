// 리허설: node snowflake-sdk 연결 검증 (키는 파일에서만 읽음, 화면 출력 금지)
// 실행: SNOWFLAKE_*=... node scripts/sf-node-test.mjs
import snowflake from "snowflake-sdk";
import crypto from "node:crypto";
import fs from "node:fs";

snowflake.configure({ logLevel: "ERROR" });

const raw = fs.readFileSync(process.env.SNOWFLAKE_PRIVATE_KEY_PATH, "utf8").trim();
// base64 DER(헤더 없음) 또는 PEM 자동 판별 → PEM으로 정규화
const privateKey = raw.includes("BEGIN")
  ? raw
  : crypto
      .createPrivateKey({ key: Buffer.from(raw.replace(/\s+/g, ""), "base64"), format: "der", type: "pkcs8" })
      .export({ format: "pem", type: "pkcs8" })
      .toString();

const conn = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  role: process.env.SNOWFLAKE_ROLE,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  authenticator: "SNOWFLAKE_JWT",
  privateKey,
});

const sql =
  "SELECT COUNTRY_CODE, COUNT(*) AS orders FROM S3.AMAZON_SELLER.FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL GROUP BY 1 ORDER BY 2 DESC LIMIT 5";

conn.connect((err) => {
  if (err) {
    console.error("연결 실패:", err.message);
    process.exit(1);
  }
  conn.execute({
    sqlText: sql,
    complete: (qerr, _stmt, rows) => {
      if (qerr) {
        console.error("쿼리 실패:", qerr.message);
        process.exit(1);
      }
      console.log("node 연결 OK · 지역별 주문수:");
      console.table(rows);
      conn.destroy(() => process.exit(0));
    },
  });
});
