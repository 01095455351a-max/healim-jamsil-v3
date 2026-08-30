# 글 관리 화면(Decap CMS) 사용법

원장 컬럼과 공지사항을 브라우저에서 쓰고 고치는 화면입니다.
저장하면 저장소에 파일이 커밋되고, Cloudflare Pages가 1~2분 뒤 사이트에 반영합니다.

## 주소

```
https://healim-jamsil.com/admin/
```

검색에는 잡히지 않습니다(`noindex`).

## 로그인 — 아직 준비되지 않았습니다

Cloudflare Pages에는 Netlify 같은 로그인 기능이 없어서, GitHub 로그인을 중개하는
코드를 붙여야 합니다. 그전까지는 아래 「내 컴퓨터에서 쓰기」로만 쓸 수 있습니다.

붙이려면 두 가지가 필요합니다.

1. GitHub에서 OAuth App 하나를 만듭니다
   (Settings → Developer settings → OAuth Apps → New OAuth App)
   - Homepage URL: `https://healim-jamsil.com`
   - Authorization callback URL: `https://healim-jamsil.com/api/callback`
   - 저장소가 비공개이면 `repo` 권한이 필요합니다
2. 거기서 나온 Client ID와 Client Secret을 Cloudflare Pages의
   환경 변수(Settings → Environment variables)에 넣습니다
   - `GITHUB_OAUTH_ID`
   - `GITHUB_OAUTH_SECRET`

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
