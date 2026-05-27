#!/usr/bin/env bash
#
# Google OAuth(유저 로그인) 셋업 자동화 스크립트
# - gcloud로 가능한 부분(API 활성화)과 Supabase Management API 주입만 자동화한다.
# - OAuth 클라이언트 ID 생성과 동의화면(Internal) 설정은 gcloud로 안 되므로 콘솔에서 직접 해야 한다.
#
# 사용:
#   1) STAGE 1만 먼저 실행 → 콘솔에서 OAuth 클라이언트 생성 → STAGE 2 실행
#   2) 환경변수를 채운 뒤 ./scripts/setup-google-oauth.sh
#
set -euo pipefail

# ─────────────────────────────────────────────
# 설정값 (실행 전 채우기)
# ─────────────────────────────────────────────
# jocodingax.ai 조직 소속이면서 본인이 권한을 가진 프로젝트 ID.
# (기존 서비스계정 프로젝트 spigen-497602 와 별개여도 됨)
PROJECT_ID="${PROJECT_ID:-}"

# Supabase 자동 주입을 쓸 때만 필요 (안 쓰면 비워두면 STAGE 2 건너뜀)
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"        # 예: abcdefghijklmno
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"      # https://supabase.com/dashboard/account/tokens 에서 발급
GOOGLE_OAUTH_CLIENT_ID="${GOOGLE_OAUTH_CLIENT_ID:-}"    # 콘솔에서 만든 OAuth 클라이언트 ID
GOOGLE_OAUTH_CLIENT_SECRET="${GOOGLE_OAUTH_CLIENT_SECRET:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "PROJECT_ID 를 지정해주세요. 예: PROJECT_ID=my-jax-project ./scripts/setup-google-oauth.sh" >&2
  exit 1
fi

echo "==> 활성 gcloud 계정/프로젝트 확인"
gcloud config get-value account
echo "대상 프로젝트: $PROJECT_ID"

# ─────────────────────────────────────────────
# STAGE 1 — API 활성화 (gcloud, idempotent)
# ─────────────────────────────────────────────
echo "==> STAGE 1: Calendar / Gmail / Drive API 활성화"
gcloud services enable \
  calendar-json.googleapis.com \
  gmail.googleapis.com \
  drive.googleapis.com \
  --project="$PROJECT_ID"
echo "    완료."

cat <<'GUIDE'

──────────────────────────────────────────────
[콘솔에서 직접 — gcloud 불가]
1. console.cloud.google.com → 위 PROJECT_ID 선택
2. API 및 서비스 → OAuth 동의 화면
   - User type: Internal  (jocodingax.ai 내부 전용 → Gmail restricted scope 검증 면제)
3. 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID
   - 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI:
       https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
   - (로컬 테스트용) http://localhost:3000/auth/callback
4. 생성된 클라이언트 ID / 비밀을 복사
   → STAGE 2 환경변수(GOOGLE_OAUTH_CLIENT_ID / _SECRET)에 넣고 이 스크립트 재실행
──────────────────────────────────────────────
GUIDE

# ─────────────────────────────────────────────
# STAGE 2 — Supabase Google provider 주입 (Management API)
# scope는 provider 설정이 아니라 앱 signInWithOAuth 호출에서 지정하므로 여기선 enable + 키만.
# ─────────────────────────────────────────────
if [[ -n "$SUPABASE_PROJECT_REF" && -n "$SUPABASE_ACCESS_TOKEN" \
   && -n "$GOOGLE_OAUTH_CLIENT_ID" && -n "$GOOGLE_OAUTH_CLIENT_SECRET" ]]; then
  echo "==> STAGE 2: Supabase Google provider 활성화"
  curl -sS -X PATCH \
    "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"external_google_enabled\": true,
      \"external_google_client_id\": \"${GOOGLE_OAUTH_CLIENT_ID}\",
      \"external_google_secret\": \"${GOOGLE_OAUTH_CLIENT_SECRET}\"
    }"
  echo ""
  echo "    완료. (scope는 앱 코드 signInWithOAuth options.scopes 에서 지정)"
else
  echo "==> STAGE 2 건너뜀 (Supabase 환경변수 미설정)."
  echo "    OAuth 클라이언트 생성 후 환경변수 채우고 재실행하면 Supabase에 자동 주입됩니다."
fi
