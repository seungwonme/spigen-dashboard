#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# 슈피겐 — git 히스토리에서 유출 키 파일 완전 제거
# ------------------------------------------------------------
# working tree 마스킹/추적해제만으로는 과거 커밋에 키가 남는다.
# 이 스크립트는 prompts/ 전체를 모든 히스토리에서 제거한다.
#
# !! 주의 !!
# - 히스토리를 재작성한다. 협업자가 있으면 사전 공지 필수.
# - 키 자체를 먼저 폐기(scripts/revoke-gcp-key.sh)하는 게 더 중요하다.
#   원격(GitHub)에 이미 푸시됐다면 포크/캐시에 키가 남을 수 있으므로,
#   히스토리 purge 는 보조 수단이고 폐기가 근본 해결이다.
# ============================================================

cd "$(dirname "$0")/.."

echo "==> 백업 (mirror clone)"
BACKUP="../$(basename "$PWD")-backup-$(git rev-parse --short HEAD).git"
git clone --mirror . "$BACKUP"
echo "백업 위치: $BACKUP"

echo ""
echo "==> prompts/2026-05-27.json 가 포함된 커밋:"
git log --oneline -- prompts/2026-05-27.json || true

echo ""
read -r -p "히스토리에서 prompts/ 전체를 제거합니다. 계속하려면 yes: " ans
[ "$ans" = "yes" ] || { echo "취소됨"; exit 1; }

git filter-repo --path prompts/ --invert-paths --force

echo ""
echo "[로컬 히스토리 정리 완료]"
echo "git filter-repo 는 안전을 위해 origin 리모트를 제거합니다. 원격 반영 절차:"
echo "  git remote add origin <원격 URL>"
echo "  git push origin --force --all"
echo "  git push origin --force --tags"
echo ""
echo "푸시 후 GitHub 에 협업자가 있으면 모두 새로 clone 받도록 공지하세요."
