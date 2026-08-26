# 해아림한의원 잠실점 홈페이지

Hugo(extended)로 만든 정적 사이트. 테마를 쓰지 않고 레이아웃을 직접 작성했다.

## 실행

```
run-hugo-server.bat          # Windows. http://127.0.0.1:1315
hugo server --disableFastRender --bind 127.0.0.1 --port 1315
```

Hugo **0.146.0 이상**이 필요하다. `layouts/_partials/`, `layouts/_default/` 구조가
0.146에서 도입된 배치를 따른다. `.bat`은 실패해도 창이 닫히지 않고 원인을 표시한다.

서버를 띄운 채 `git pull`하면 파일 변경이 감지되어 브라우저가 자동으로 새로고침된다.

## 구조

```
content/         질환 9 · 후기 17 · 컬럼 12 · 원장 2 · 공지 2 · 첫 내원 1
data/
  clinic.yaml            연락처·진료시간·주소·좌표·예약 링크. 거의 모든 레이아웃이 참조
  treatments.yaml        치료 방법 9종. 홈의 팝업 내용
  authors/<slug>.yaml    원장 정보. 프로필·진료분야·연구 이력·논문
layouts/
  index.html             홈 (11개 구역)
  _partials/             header · footer · kakao-map · image · paper-row · treatment 등
  <섹션>/single|list.html
assets/
  css/site.css           전역 CSS. 인라인 style로 덮이지 않는 부분만 담당
  design-v3/, media/     원본 이미지. Hugo가 WebP로 변환해 내보낸다
static/js/               hero-slides · treatment-modal · filters
```

## 이 프로젝트의 규칙

**디자인은 Claude Design mockup(`handoff/design-v3/`)이 원본이다.**
색상·폰트·여백·카드 스타일을 임의로 바꾸지 않는다. 새 요구가 들어오면
기존 컴포넌트를 재사용하는 쪽을 먼저 찾는다. (mockup 원본 파일은 저장소에 없다.
로컬에 있으면 커밋해 두는 것이 좋다.)

**스타일은 인라인 style이 기본이다.** mockup이 인라인 기반이라 그대로 옮겼다.
site.css는 hover·반응형·컴포넌트 동작처럼 인라인으로 표현할 수 없는 것만 담는다.
인라인 style을 CSS에서 덮어야 할 때는 `!important`가 필요하다 — 기존 코드가 이미
그 방식을 쓴다.

**JS는 최소한으로.** 가능하면 체크박스+CSS로 해결한다(헤더 햄버거, 논문 더보기).
스크립트가 필요하면 `window.init...`을 노출해 다시 호출할 수 있게 한다.

**의료광고 표현.** 논문·후기를 근거로 치료 효과를 단정하지 않는다.
"참여했습니다 / 보고했습니다 / 연구했습니다"처럼 사실만 적는다.

**사실이 아닌 내용을 채워 넣지 않는다.** 실제 정보가 없으면 비워 두고 표시하지
않는다(논문 URL이 그 예). 자리표시자를 남길 때는 화면에서 구분되게 한다.

## 지금까지의 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 치료 방법 상세 | 개별 페이지 없이 홈의 팝업 | 이미 팝업으로 제작됨 |
| 치료법 링크 | `/#treatment-<slug>` 딥링크 | 팝업을 유지하면서 외부에서 링크 가능 |
| 팝업 폭(데스크톱) | `max-width: 708px` | box-sizing 수정 전 렌더 폭 유지 |
| 팝업(모바일) | 하단 시트 + 제목·닫기 고정 | 폭이 화면을 넘어 닫기 버튼이 사라지던 문제 |
| 학술 논문 | 홈에만 표시, 원장 데이터에서 취합 | 두 곳에 두면 어긋남 |
| 논문 순서 | 석선희 원장 제1저자 먼저 | 파일에 적힌 순서대로 표시됨 |
| 원내 사진 | 히어로 한 자리에서 슬라이드, 둘러보기 구역 폐지 | 사진이 크게 보이고 구역이 하나 줄어듦 |
| 이미지 | 원본은 assets/, 화면 크기에 맞춰 WebP 변환 | 31MB → 0.3MB |

## 이미지 다루기

`static/`이 아니라 **`assets/`**에 둔다. 마크업에서는 partial을 쓴다.

```
{{ partial "image.html" (dict "src" "design-v3/disease-adhd.png" "w" 760
    "alt" "ADHD" "style" "width: 100%; height: 100%; object-fit: cover;") }}
```

`w`는 화면 표시 폭의 2배를 준다. 첫 화면에 보이는 이미지는 `"eager" true`.
원본을 압축하지 말고 그대로 넣으면 된다.

## 아직 남은 일

- **원내 사진이 구 사이트(`home-c-e67.pages.dev`) 링크다.** 히어로 슬라이드 4장이
  전부 외부 의존이라 구 사이트를 내리면 첫 화면이 깨진다. `assets/media/clinic/`으로
  가져와야 한다.
- **개인정보처리방침·이용약관·비급여안내 페이지가 없다.** 푸터와 상담 폼의 동의
  문구가 구 사이트를 가리킨다. 상담 폼이 개인정보를 수집하므로 반드시 필요하다.
- **논문 원문(KCI) 주소가 비어 있다.** `data/authors/seok-seonhui.yaml`의 `url`을
  채우면 카드에 "논문 상세보기" 버튼이 생긴다. 확인된 주소만 넣는다.
- **`baseURL`이 `https://example.org/`다.** 도메인이 정해지면 바꾼다. sitemap 주소가
  이 값을 따른다.
- **SEO 태그가 없다.** canonical·og·twitter·JSON-LD(MedicalClinic)·robots.txt.
  `data/clinic.yaml`에 주소·좌표·진료시간이 있어 구조화 데이터를 바로 만들 수 있다.
- **구 사이트 URL 구조가 다르다.** 같은 도메인을 쓴다면 `/about/doctors/`,
  `/guide/...`에 aliases를 걸어야 기존 유입이 끊기지 않는다.
- **미완 기능**: 자필 후기 네이버·카카오 로그인(버튼 비활성), 상담 신청 폼(전송 없음).
- **후기 이미지 없음.** front matter의 `image:` 경로에 해당하는 파일이 없다.
  현재 목록이 블러 처리된 자리표시자라 화면에는 영향이 없다.

## 확인 방법

변경 후에는 빌드가 통과하는지, 내부 링크가 살아 있는지, 모바일에서 넘치지 않는지를
본다. 링크는 빌드 산출물의 `href="/..."`를 파일 존재 여부와 대조하면 된다.
