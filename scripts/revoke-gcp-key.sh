#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# 슈피겐 — 유출된 GCP 서비스 계정 키 폐기 (rotate)
# ------------------------------------------------------------
# 노출 경위: prompts/2026-05-27.json 에 private key 평문이 커밋됨.
#            (working tree 는 이미 마스킹 + git 추적 해제 완료)
# 이 스크립트는 GCP 에서 해당 키를 실제로 폐기한다.
# 키를 폐기하면 평문이 어디에 유출됐든 즉시 무효화된다 — 가장 확실한 조치.
# ============================================================

ACCOUNT="sw.an@jocodingax.ai"
PROJECT="spigen-497602"
SA="spigen-sheets-reader@spigen-497602.iam.gserviceaccount.com"
KEY_ID="9072a843fa59bb29bfffa82affd6e772c294391b"

echo "==> 1) 재인증 (브라우저가 열립니다)"
gcloud auth login "$ACCOUNT"

echo ""
echo "==> 2) 현재 키 목록 (폐기 전 확인)"
gcloud iam service-accounts keys list \
  --iam-account="$SA" --project="$PROJECT" --account="$ACCOUNT"

echo ""
echo "==> 3) 노출된 키($KEY_ID) 폐기"
gcloud iam service-accounts keys delete "$KEY_ID" \
  --iam-account="$SA" --project="$PROJECT" --account="$ACCOUNT"

echo ""
echo "[완료] 키 폐기됨. 평문이 유출돼도 이제 무효입니다."
echo "시트 연동이 다시 필요하면 새 키를 발급하고 .env.local 에만 보관하세요:"
echo "  gcloud iam service-accounts keys create ~/spigen-sa-new.json --iam-account=$SA --project=$PROJECT"
