# Git/GitHub로 버전 관리 + Vercel로 배포하기

# **1. 이전 버전으로 되돌리기**

## Claude Code에서 버전 되돌리는 방법

- `/rewind` (Esc + Esc)
- `/resume` (터미널 환경에서만 가능)

**→ 가끔 에러가 나거나, 돌아가는 데 한계가 있음**

## Git이란?

[Git](https://git-scm.com/)

- Git은 코드의 변경 사항을 추적하고 저장하는 도구
- 코드를 수정할 때마다 돌아갈 수 있도록 기록(체크포인트)을 남겨두는 도구
- Git 사용 방법
    1. `git init`: 깃을 현재 코드에 설치
    2. `git add`: ~~버전을 저장할 파일을 고르기~~ → 그냥 다 저장하기 (`git add .`)
    3. `git commit`: 버전을 저장하기
    4. `git push`: 로컬(현재 컴퓨터)에 저장된 깃 저장소를 원격 깃 저장소에 업로드
- 용어 정리
    - 저장소 (Repository): 프로젝트 폴더의 "버전 관리 모드".
    - 커밋 (Commit): "여기까지 안전하다" 체크포인트. 나중에 이 지점으로 돌아올 수 있음.
    - 푸시 (Push): 내 컴퓨터 → 클라우드(GitHub)로 체크포인트를 올리는 동작.

**현재 저장소를 깃 저장소로 만들기**

```markdown
현재 프로젝트에 깃 설치해줘
```

```markdown
깃으로 바뀐 파일들을 모두 커밋해줘
```

## 깃허브란?

[GitHub · Change is constant. GitHub keeps you ahead.](https://github.com/)

- Git으로 관리하는 코드를 온라인에 저장하고 관리할 수 있는 클라우드 서비스
- 구글 드라이브에 문서를 저장하듯이, GitHub는 코드를 저장하는 온라인 공간 → 협업에 용이

<aside>
💡

![image.png](Git%20GitHub%EB%A1%9C%20%EB%B2%84%EC%A0%84%20%EA%B4%80%EB%A6%AC%20+%20Vercel%EB%A1%9C%20%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0/image.png)

**Git(로컬, 버전관리) → 내 컴퓨터 (로컬)**

**Github(클라우드에서 관리하는 버전관리) → 구글드라이브**

</aside>

# 2. gh CLI를 사용하여 깃허브에 저장소 만들기

## gh CLI

**GitHub에서 공식적으로 제공하는 명령어**.

웹 브라우저 접속 없이 터미널 안에서 직접 GitHub의 핵심 기능들을 제어하고 자동화할 수 있습니다.

**→ Claude Code가 조작 가능**

<aside>
💡

**CLI(Command-Line Interface)**

**텍스트 명령어**를 입력해 컴퓨터나 프로그램을 제어하는 인터페이스

</aside>

```markdown
gh cli를 활용해서 현재 프로젝트를 올릴 깃허브 저장소로 만들고 푸시까지 해줘.
절대로 .env 파일은 커밋하면 안 돼.
```

**체크리스트**

- [ ]  github.com에서 spigen-dashboard 저장소가 생긴 것 확인
- [ ]  저장소 파일 목록에 .env/.env.local 파일이 없음 확인 (있으면 즉시 삭제 요청)

# 3. 배포하기

<aside>
💡

**배포란?**

Claude Code로 작업한 소스 코드는 **내 컴퓨터 안에만 있는 상태**입니다.

다른 사람에게 보여주기 위해선, **인터넷 어딘가(서버)**에 올려야 하는데요.

이걸 배포라고 합니다.

</aside>

## Vercel이란

[vercel-tutorial.jsx](https://claude.ai/public/artifacts/0afda160-6ca3-42f0-a433-cbd5403e2c30)

![image.png](Git%20GitHub%EB%A1%9C%20%EB%B2%84%EC%A0%84%20%EA%B4%80%EB%A6%AC%20+%20Vercel%EB%A1%9C%20%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0/image%201.png)

`Vercel`은 쉽게 말해서 **웹 사이트를 전 세계에 공개**할 수 있게 해주는 `클라우드 배포 서비스` 입니다.

근데 단순한 배포 플랫폼이 아니라, **우리가 사용했던 도구(`Next.js`)까지 만든 회사**입니다.

**`Vercel`에서 `Next.js` 코드를 배포하는 게 매우 간단**합니다. (자기들이 만든 도구라 잘 붙게 되어 있거든요 😎)

- 로컬호스트 = 내 컴퓨터에서만 접속 가능 / Vercel 배포 URL = 인터넷 어디서든 접속 가능.
- GitHub 저장소를 연결하면 자동으로 빌드·배포해줍니다.
- git push만 하면 매번 자동 재배포.
- 무료 도메인(xxxx.vercel.app) 기본 제공.

## Vercel에서 깃허브 코드 배포하기

1. vercel.com에 GitHub 계정으로 로그인.
2. Add New → Project.
3. 깃허브 저장소 옆의 Import 버튼 클릭.
4. Environment Variables 섹션 펼치고 .env 업로드하기
5. Deploy → 1~2분 정도 대기.

<aside>
⚠️ 환경변수를 누락하면 배포는 성공해도 데이터가 빈 상태로 보입니다. 그때는 Vercel 대시보드 → Settings → Environment Variables → 추가 → Deployments 탭에서 Redeploy.

</aside>

**체크리스트**

- [ ]  스마트폰 브라우저에서 Vercel URL 접속 → 차트가 보이는지 확인
- [ ]  Supabase Table Editor에서 데이터가 저장되는지 확인

# 4. 알아서 버전이 저장되게 하기

[CLAUDE.md](http://claude.md/) 파일은 프로젝트에 대해 Claude에 **지속적인 지침**을 제공하는 마크다운 파일입니다.

작성하면 Claude Code가 모든 세션의 시작 시 읽습니다.

[Claude가 프로젝트를 기억하는 방법 - Claude Code Docs](https://code.claude.com/docs/ko/memory)

1. `/init` 명령어로 현재 프로젝트에 맞는 [CLAUDE.md](http://CLAUDE.md) 만들기
    - https://www.fullstackfamily.com/@urstory/posts/13980/CLAUDEmd-%EC%93%B0%EB%8A%94-%EA%B2%8C-%EB%A7%9E%EC%8A%B5%EB%8B%88%EA%B9%8C-%EB%85%BC%EB%AC%B8%EC%9D%B4-%EB%92%A4%EC%A7%91%EC%9D%80-%EC%83%81%EC%8B%9D%EA%B3%BC-%EC%8B%A4%EC%A0%84-%EA%B0%80%EC%9D%B4%EB%93%9C
    - https://addyosmani.com/blog/agents-md/
    - https://arxiv.org/abs/2602.11988
2. 가장 하단에 아래 텍스트를 추가
    
    ```markdown
    파일을 수정할 때마다 깃에 커밋해줘.
    ```


# 5. 그런데 — 누구나 데이터를 볼 수 있다

배포하고 나니 좋은데, 한 가지 문제가 생겼어요. **URL만 알면 누구나** 들어와서 실제 업무 데이터를 볼 수 있습니다.

다음 단계는 **로그인으로 외부인을 막는 것** — '로그인 기능 추가하기'로 이어집니다.