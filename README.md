# 강북안디옥교회 홈페이지

Figma 시안을 바탕으로 만든 정적 홈페이지입니다. 공개 사이트는 GitHub Pages, 인증과 콘텐츠 DB는 Supabase, 지도는 NAVER Maps JavaScript API를 사용합니다.

## 기능

- 반응형 교회 홈페이지
- Supabase 이메일 회원가입·로그인
- 관리자 권한 확인과 관리자 전용 콘텐츠 편집
- 교회 소개, 연락처, 주소와 지도 좌표 수정
- 예배 시간 추가·수정·삭제
- 교회 소식 작성·게시·수정·삭제
- GitHub Actions를 이용한 GitHub Pages 배포

일반 회원가입 계정은 사이트를 수정할 수 없습니다. `public.admin_users`에 등록된 계정만 관리 화면에 들어갈 수 있습니다. 서비스 키는 브라우저 코드나 Git에 넣지 않습니다.

## Supabase 설정

1. [Supabase](https://supabase.com/dashboard)에 무료 프로젝트를 만듭니다.
2. SQL Editor에서 [`supabase/schema.sql`](./supabase/schema.sql)을 실행합니다.
3. 프로젝트 URL과 publishable/anon 키를 확보합니다. `service_role` 또는 secret 키는 사용하지 않습니다.
4. 처음 사용할 관리자 계정으로 `admin.html?mode=signup`에서 가입하고 이메일 인증을 마칩니다.
5. SQL Editor에서 그 이메일을 관리자 목록에 추가합니다.

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where lower(email) = lower('관리자이메일@example.com')
   on conflict do nothing;
   ```

6. [관리자 로그인](./admin.html?mode=login) 후 콘텐츠를 관리합니다.

Supabase 무료 요금제에서 프로젝트가 일정 기간 비활성 상태면 일시 중지될 수 있습니다. 무료 요금제의 현재 한도는 [요금 안내](https://supabase.com/pricing)를 확인하세요.

## NAVER 지도 설정

1. [NAVER Cloud Platform](https://console.ncloud.com/)에서 Maps 애플리케이션을 등록하고 **Web Dynamic Map**을 사용 설정합니다.
2. 웹 서비스 URL에 배포할 사이트 도메인을 등록합니다. 등록한 도메인과 실제 접속 주소가 일치해야 지도가 표시됩니다.
3. 발급된 Client ID를 `NAVER_MAP_CLIENT_ID` 설정에 입력합니다. 페이지에서는 현재 API 매개변수인 `ncpKeyId`로 로드합니다.
4. 관리자 페이지의 주소와 위도·경도를 확인하고 필요한 경우 수정합니다.

초기 위치는 공개 장소 데이터로 채운 마포구 월드컵북로8길 32 좌표입니다. 공개 전 실제 교회 주소인지 확인해 주세요.

## GitHub Pages 배포

저장소 Settings → Secrets and variables → Actions → Repository secrets에 다음 값을 추가합니다.

| 이름 | 값 |
| --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | Supabase publishable/anon 클라이언트 키 |
| `NAVER_MAP_CLIENT_ID` | NAVER Maps 애플리케이션 Client ID |

GitHub Pages 배포 소스를 **GitHub Actions**로 설정한 뒤 `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 설정 파일을 생성하고 사이트를 배포합니다. 실제 키는 생성된 공개 배포 파일에 포함되므로, Supabase RLS 정책과 Naver 웹 도메인 제한이 반드시 설정되어 있어야 합니다. Supabase `service_role` 키는 절대 추가하지 않습니다.

## 로컬 설정

```sh
cp public/config.example.js public/config.js
```

복사한 `public/config.js`에 Supabase URL·클라이언트 키와 Naver Client ID를 입력합니다. `public/config.js`는 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다. 사이트 레이아웃만 빠르게 보려면 프로젝트 폴더에서 `open index.html`을 실행할 수 있습니다. API 기능은 HTTP 또는 HTTPS 주소에서 설정된 뒤 사용할 수 있습니다.
