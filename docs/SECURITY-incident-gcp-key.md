# 보안 인시던트 — GCP 서비스 계정 private key 노출

> 발견일: 2026-06-02 (보안 점검 중)
> 상태: working tree 정리 완료 / **키 폐기 + 히스토리 purge 는 사용자 실행 대기**

## 무슨 일

`prompts/2026-05-27.json` (세션 로그)에 GCP 서비스 계정 private key 전체가
평문으로 기록되어 git 에 커밋됨. `prompts/` 는 `.gitignore` 에 없어 추적 중이었음.

- 서비스 계정: `spigen-sheets-reader@spigen-497602.iam.gserviceaccount.com`
- 키 ID: `9072a843fa59bb29bfffa82affd6e772c294391b`
- 용도: Google Sheets reader (현재 앱 `src` 코드에서는 미사용 — `rg` 확인)

## 영향

repo / GitHub 읽기 권한자가 키를 추출해 GCP 프로젝트 `spigen-497602` 에서
해당 SA 권한(공유 시트, IAM 바인딩에 따라 그 이상)으로 인증 가능.

## 조치 체크리스트

- [x] working tree 키 마스킹 (`prompts/2026-05-27.json`)
- [x] `.gitignore` 에 `/prompts/` 추가 — 향후 세션 로그 커밋 차단
- [x] `git rm --cached prompts/` — git 추적 해제
- [ ] **GCP 에서 키 폐기** → `bash scripts/revoke-gcp-key.sh` (가장 중요·근본 해결)
- [ ] **git 히스토리 purge** → `bash scripts/purge-git-history.sh` (force push 는 직접)
- [ ] 폐기 후 시트 연동이 필요하면 새 키 발급 → `.env.local` 에만 보관

## 재발 방지

- 터미널 출력을 프롬프트/로그에 붙여넣기 전 키·토큰 포함 여부 확인.
- 세션 로그(`prompts/`)는 git 추적 대상에서 제외(완료).
- 키는 `.env.local`(gitignored) 또는 시크릿 매니저에만. 절대 커밋 금지.
