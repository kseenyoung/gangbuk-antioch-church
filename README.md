# 강북안디옥교회 홈페이지

Figma 시안을 바탕으로 만든 정적 홈페이지입니다. GitHub Pages에서 무료로 호스팅하고, 회원 인증과 사이트 콘텐츠는 Supabase 무료 프로젝트를 사용합니다.

## 기능

- 반응형 교회 홈페이지
- Supabase 이메일 회원가입·로그인
- 관리자 권한 확인과 관리자 전용 콘텐츠 편집
- 교회 소개, 연락처, 주소와 지도 좌표 수정
- 예배 시간과 교회 소식 관리
- NAVER Maps JavaScript API를 페이지 안에 표시

일반 회원은 사이트를 수정할 수 없습니다. `public.admin_users`에 등록된 계정만 관리 화면에 들어갈 수 있습니다. 브라우저에는 Supabase publishable 키만 사용하며, `service_role` 또는 secret 키는 포함하지 않습니다.

## Supabase 및 관리자 설정

이 사이트는 무료 요금제의 `gangbuk-antioch-church` 프로젝트에 연결되어 있고, 콘텐츠 테이블과 RLS 정책이 적용되어 있습니다. 다른 프로젝트를 사용할 경우 SQL Editor에서 [`supabase/schema.sql`](./supabase/schema.sql)을 실행하고 `public/config.js`의 URL과 publishable 키를 갱신하세요.

1. Supabase Authentication의 Site URL을 `https://kseenyoung.github.io/gangbuk-antioch-church/`로 설정합니다.
2. Additional Redirect URLs에 `https://kseenyoung.github.io/gangbuk-antioch-church/**`를 추가합니다.
3. 처음 사용할 관리자 계정으로 [관리자 가입](https://kseenyoung.github.io/gangbuk-antioch-church/admin.html?mode=signup) 후 이메일 인증을 마칩니다.
4. Supabase SQL Editor에서 해당 계정을 관리자로 등록합니다.

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where lower(email) = lower('관리자이메일@example.com')
   on conflict do nothing;
   ```

5. [관리자 로그인](https://kseenyoung.github.io/gangbuk-antioch-church/admin.html?mode=login)으로 사이트 콘텐츠를 관리합니다.

## NAVER 지도 설정

1. [NAVER Cloud Platform](https://console.ncloud.com/)에서 Maps 애플리케이션을 만들고 **Web Dynamic Map**을 사용 설정합니다.
2. 웹 서비스 URL에 `https://kseenyoung.github.io`를 등록합니다.
3. 발급된 Client ID를 `public/config.js`의 `naverMapClientId`에 넣고 `main`에 push합니다.
4. 관리자 페이지에서 주소와 위도·경도를 실제 교회 위치로 확인하고 수정합니다.

Client ID가 설정되기 전에는 사이트 안에서 지도 영역에 안내 문구가 표시됩니다. 초기 좌표는 마포구 월드컵북로8길 32 인근의 임시값이므로 실제 위치를 확인하세요.

## GitHub Pages

이 저장소는 공개 저장소이며 Pages 주소는 [https://kseenyoung.github.io/gangbuk-antioch-church/](https://kseenyoung.github.io/gangbuk-antioch-church/)입니다. Repository Settings → Pages에서 **Deploy from a branch**, `main`, `/(root)`로 게시합니다. 이 설정은 이미 저장소에 적용되어 있습니다. 이후 `main` 브랜치에 push하면 GitHub Pages가 자동으로 게시합니다.

## 로컬 미리보기

`public/config.js`에는 공개 브라우저용 설정만 들어 있습니다. 프로젝트 폴더에서 다음 명령을 사용할 수 있습니다.

```sh
npx serve .
```

그 다음 표시된 로컬 주소를 브라우저에서 엽니다.
