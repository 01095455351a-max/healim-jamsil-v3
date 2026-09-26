# 컬럼 초안 보관함

원장 검수 전이거나 아직 보충할 것이 남은 컬럼 초안을 둔다.

Hugo는 `content/` · `data/` · `layouts/` · `assets/` · `static/`만 읽는다.
**이 폴더의 파일은 빌드에 들어가지 않는다** — `hugo -D`로 빌드해도 화면에 나오지 않고
sitemap에도 없다. 발행할 때 `content/column/`으로 **옮기면** 그때부터 페이지가 생긴다.

```
git mv docs/초안/<파일명>.md content/column/<파일명>.md
```

옮긴 뒤에는 `date`·`lastmod`를 발행일로 고치고, 빌드와 점검을 돌린다.
작성 규칙은 `docs/컬럼-작성-가이드.md`에 있다.

---

## 보관 중인 초안

### `postpartum-depression-when-to-seek-help.md`

**출산 뒤 우울감, 언제 진료를 받아야 할까요?** · 석선희 원장 · 우울장애/칼럼

| | |
|---|---|
| 초안 작성 | 2026-08-29 |
| 상태 | 원장 검수 대기 · 보충 예정 |
| 분량 | 본문 4,823자 (가이드 목표 6,000~7,000자) |
| 금칙어 | 0건 |

**보충할 것** (원장 요청)

1. **한의학적 치료 접근** — 지금은 「기혈이 크게 소모된 시기」로 보고 산후 회복·수면·
   소화·몸의 증상·수유 여부를 확인한다는 정도만 적혀 있다. 실제 진료에서 어떤 방식으로
   접근하는지를 더 적는다. 치료 효과를 단정하는 표현은 쓰지 않는다.
2. **상담 관련 내용** — 상담이 어떻게 진행되는지, 무엇을 이야기하게 되는지, 가족이
   함께 오는 경우를 어떻게 다루는지 등.

이 두 가지를 채우면 목표 분량에도 가까워진다.

**함께 정할 것**

- `content/diseases/depression.md`의 `related_columns`에 이 컬럼을 추가할지 여부.
  추가하면 우울증 페이지 하단에 카드로 붙는다.

**검수가 필요한 내용** (본문에 인용된 값)

- 유병률 — NIMH 7명 중 1명 / CDC 8명 중 1명 / NHS 10명 중 1명 이상
- 증상 시작 시기 — 출산 후 4~8주 (NIMH)
- 산후우울감 2주 이내 소실 / 산후우울증 치료 시 3~6개월 (NHS)
- 위기 연락처 — 정신건강 위기상담전화 1577-0199, 자살예방 상담전화 109

**참고자료 4건은 WebSearch로 주소 존재를 확인했다.**

1. https://www.nimh.nih.gov/health/publications/perinatal-depression
2. https://www.cdc.gov/reproductive-health/depression/resources.html
3. https://www.nhs.uk/mental-health/conditions/postnatal-depression/
4. https://www.nhs.uk/mental-health/conditions/post-partum-psychosis/

### `panic-vs-heart-disease.md`

**공황장애와 심장질환, 두근거림이 있을 때 어떻게 구별할까요?** · 석선희 원장 · 공황장애/칼럼

| | |
|---|---|
| 초안 작성 | 2026-09-26 |
| 상태 | 원장 검수 대기 |
| 분량 | 본문 3,968자 · 소제목 11개 · 자주 묻는 질문 3개 |
| 금칙어 | 0건 |

**겹치는 컬럼** — `why-anxiety-causes-heart-palpitations`의 FAQ 첫 질문이
「불안해서 심장이 뛰는 것과 부정맥은 어떻게 구분하나요?」다. 이 초안은 응급 신호·
검사 순서·두 질환의 공존까지 다뤄 범위가 넓다. 검수 때 한 번 대조한다.

**검수가 필요한 내용**

- 응급 신호 목록(통증 지속·방사·식은땀·구역·실신)과 위험요인
- 심장 검사 설명(심전도·혈액검사·24시간 이상 심전도·심장 초음파·운동 부하 검사)
- 경계(驚悸)·정충(怔忡) 구분 설명

**발행할 때**

- `date`·`lastmod`와 본문 끝 작성일·검토일을 발행일로 채운다
- `content/diseases/anxiety-panic.md`의 `related_columns`에는 이미 한 줄을 넣어 두었다.
  발행 전에는 화면에 나오지 않고, 옮기면 공황장애 페이지 하단에 카드로 붙는다

**참고자료 5건은 WebSearch로 주소 존재를 확인했다.**

1. https://nikom.or.kr/nckm/module/practiceGuide/viewPDF.do?guide_idx=165
2. https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=33
3. https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6770
4. https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack
5. https://www.nimh.nih.gov/health/publications/panic-disorder-when-fear-overwhelms
