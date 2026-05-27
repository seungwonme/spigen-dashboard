# (선택) Google OAuth 추가 + Google 개인 데이터 받아오기

# 1. 이 단계에서 하는 것

- 3번에서 만든 이메일 로그인 위에 **'Google로 로그인'**을 얹기
- Google 로그인 한 번으로 **Gmail · Calendar · Drive 같은 '내 개인 데이터'**를 대시보드가 읽어오는 흐름을 설계하기

<aside>
💡 **왜 따로 분리했나:** 시트 읽기(4번)는 **서비스 계정**(공유받은 시트)이라 로그인과 무관해요. 하지만 Gmail·Calendar·Drive는 **'내 계정 데이터'**라 본인이 직접 **Google OAuth로 로그인**해서 권한을 줘야 합니다. 콘솔에서 OAuth 클라이언트를 만드는 설정이 더 필요해서 선택 단계로 뺐어요.

</aside>

# 2. Supabase + Google Cloud Console 설정

## Supabase

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%201.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%202.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%203.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%204.png)

## Google Cloud Console

[](https://console.cloud.google.com/)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%205.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%206.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%207.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%208.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%209.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2010.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2011.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2012.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2013.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2014.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2015.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2016.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2017.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2018.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2019.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2020.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2021.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2022.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2023.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2024.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2025.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2026.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2027.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2028.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2029.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2030.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2031.png)

![image.png]((%EC%84%A0%ED%83%9D)%20Supabase%EC%97%90%20Google%20OAuth%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%20%EB%B6%99%EC%97%AC%EB%B3%B4%EA%B8%B0/image%2032.png)

# 3. 개인 데이터 받아오는 흐름 설계

핵심은 **로그인할 때 필요한 권한(scope)을 같이 요청**하고, 로그인 후 받은 **토큰(provider_token)**을 **서버에서** Google API 호출에 쓰는 거예요.

```
[로그인] Google OAuth + scope(gmail/calendar/drive) 요청
   ↓
[발급]   provider_token (이 사람의 Google 데이터 접근 토큰)
   ↓
[호출]   서버에서 그 토큰으로 Gmail/Calendar/Drive API 호출 → 대시보드에 표시
```

**Claude Code에 아래 프롬프트를 그대로 입력합니다.**

```markdown
Context7 MCP로 Supabase Google OAuth 모범 사례(Next.js App Router)를 확인해줘.

그 다음, 기존 /login 페이지에 'Google로 로그인' 버튼을 추가하고(signInWithOAuth, provider: google),
로그인할 때 Gmail/Calendar/Drive 읽기 scope를 함께 요청해줘.
로그인 후 받은 provider_token을 서버에서 꺼내 쓸 수 있게 연결해줘.
```

<aside>
⚠️ Google 로그인 scope에 Gmail/Calendar/Drive를 추가하면 **민감 권한**이라 데모 때 '미확인 앱' 경고가 떠요. **테스트 사용자**로 본인 계정을 등록하면 통과됩니다. (운영은 Google 앱 검증 필요)

</aside>

# 4. 실습 — 개인 데이터 기능 붙여보기

3번에서 받은 토큰(provider_token)으로 실제 기능을 하나씩 붙여봅니다. 전부 카드 없이 무료예요.

### 4-1. Gmail — 인사이트 메일 발송

```markdown
'AI 인사이트' 결과를 지정한 메일로 보내는 버튼을 추가해줘.
Context7로 Gmail API 인증·발송 모범 사례를 확인하고 진행해줘.
```

### 4-2. Calendar — 점검 일정 자동 등록

```markdown
재고 위험 상품이 있으면 내 구글 캘린더에 '재고 점검' 일정을 잡는 기능을 추가해줘.
```

### 4-3. Drive / Docs — 분석 결과 문서화

```markdown
'AI 인사이트'를 구글 문서로 저장하고 공유 링크를 만들어주는 기능을 추가해줘.
```

<aside>
⚠️ **키·토큰 호출은 반드시 서버 쪽에서.** 브라우저(클라이언트)에 노출되면 안 됨 → '서버에서 처리해줘' 문구를 꼭 포함하세요.

</aside>