# 글 관리 화면(Decap CMS) 사용법

원장 컬럼과 공지사항을 브라우저에서 쓰고 고치는 화면입니다.
저장하면 저장소에 파일이 커밋되고, Cloudflare Pages가 1~2분 뒤 사이트에 반영합니다.

## 주소

```
https://healim-jamsil.com/admin/
```

검색에는 잡히지 않습니다(`noindex`).

## 로그인 붙이기 — 한 번만 하면 됩니다

중개 코드(`functions/api/auth.js`·`callback.js`)는 저장소에 들어 있습니다.
남은 것은 GitHub에서 열쇠를 발급받아 Cloudflare에 넣는 일입니다.

### 1. GitHub OAuth App 만들기

github.com 로그인 → 오른쪽 위 프로필 → **Settings** → 왼쪽 맨 아래
**Developer settings** → **OAuth Apps** → **New OAuth App**

| 칸 | 넣을 값 |
|---|---|
| Application name | `해아림한의원 잠실점 글 관리` |
| Homepage URL | `https://healim-jamsil.com` |
| Authorization callback URL | `https://healim-jamsil.com/api/callback` |

**Register application**을 누릅니다.

### 2. 열쇠 두 개 받기

만들어진 화면에서

- **Client ID** — 바로 보입니다. 복사해 둡니다
- **Client secret** — **Generate a new client secret**을 눌러 만듭니다.
  **이 값은 그 화면을 떠나면 다시 볼 수 없습니다.** 바로 복사하세요

### 3. Cloudflare에 넣기

Cloudflare 대시보드 → **Workers & Pages → healim-jamsil → Settings →
Environment variables** → **Add variable** (Production)

| 이름 | 값 | 종류 |
|---|---|---|
| `GITHUB_OAUTH_ID` | Client ID | Text |
| `GITHUB_OAUTH_SECRET` | Client secret | **Secret (암호화)** ← 반드시 |

저장한 뒤 **한 번 다시 배포해야** 값이 반영됩니다
(Deployments → 맨 위 배포의 ⋯ → Retry deployment).

### 4. 확인

`https://healim-jamsil.com/admin/` → **Login with GitHub** → GitHub 창에서
승인 → 관리 화면이 열리면 끝입니다.

### 알아둘 것

- 저장소가 **비공개**이면 GitHub가 `repo` 권한을 요구합니다. 승인 화면에
  저장소 접근 항목이 나오는 것이 정상입니다
- Client secret은 Cloudflare에만 두고 **저장소에 적지 않습니다**
- 이 저장소에 쓰기 권한이 있는 GitHub 계정만 로그인됩니다.
  다른 사람에게 맡기려면 그 계정을 저장소 협력자로 추가하면 됩니다

## 내 컴퓨터에서 쓰기 (로그인 없이)

터미널 두 개를 엽니다.

```
npx decap-server          # 첫 번째 창 — 파일을 읽고 쓰는 중개 서버
hugo server --port 1315   # 두 번째 창 — 사이트
```

브라우저에서 `http://localhost:1315/admin/` 을 엽니다.
「로그인」을 누르면 계정 없이 바로 들어갑니다. 고친 내용은 내 컴퓨터의
파일에 바로 반영되므로, 확인한 뒤 직접 커밋해야 사이트에 올라갑니다.

## 쓸 때 지켜야 할 것

**주소에 쓸 영문 이름** — 새 글에만 적습니다. 예를 들어 `why-tics-wax-and-wane`
이라고 적으면 주소가 `/column/why-tics-wax-and-wane/` 이 됩니다.
**이미 있는 글은 비워 두세요.** 주소가 바뀌면 검색 순위가 처음부터 다시 쌓입니다.

**본문은 Markdown으로 씁니다.** 위지윅 편집기가 아닙니다.

```
## 소제목
**굵게**  ·  [첫 내원 안내](/first-visit/)  ·  - 목록
```

내부 링크는 `/first-visit/` 처럼 주소로 적습니다. 그래야 사이트 안에서 이어집니다.

**자주 묻는 질문**에 적은 내용은 검색엔진에 FAQ 정보로 나갑니다. 질문과 답변을
짝으로 채웁니다.

**효과를 단정하지 않습니다.** 「좋아집니다」「치료됩니다」 같은 표현은 쓰지 않고
「살펴봅니다」「돕습니다」처럼 적습니다. 발행 전 검토 단계에서 이 부분을 봅니다.

## 새 항목을 추가할 때 — 반드시 함께 고칠 것

Decap은 **설정에 없는 front matter 항목을 저장할 때 지웁니다.**
`content/`의 글에 새 항목을 추가하면 `static/admin/config.yml`에도 반드시
같은 이름으로 넣어야 합니다. 넣지 않으면 그 항목이 조용히 사라집니다.

## 건드리지 않는 것

레이아웃, `assets/css/site.css`, `_partials/kr.html`, `_partials/schema.html`,
`data/`의 파일들은 이 화면에서 다루지 않습니다. 고칠 일이 있으면 개발 쪽에 맡깁니다.
