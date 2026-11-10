#!/usr/bin/env python3
"""원장 컬럼 점검 — 검색(구글·네이버)과 AI 답변·인용에 필요한 형식을 확인한다.

    python3 tools/check-column.py                       컬럼 전부
    python3 tools/check-column.py content/column/x.md   특정 글만

CMS 초안이 올라오면 .github/workflows/column-check.yml 이 바뀐 글만 돌린다.
기준은 docs/컬럼-작성-가이드.md 의 front matter 표·의료광고 표와 같다.
가이드를 고치면 아래 「기준」 구역도 함께 고친다 — 기준은 이 구역 한 곳에만 둔다.

  오류  발행하면 검색 노출이 깨지거나 화면에 문제가 생기는 것. 검사가 실패한다.
  주의  사람이 보고 판단할 것. 검사는 통과한다.
"""
import datetime
import os
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent

# ── 기준 ────────────────────────────────────────────────────────
TITLE_SEO_MAX = 17          # 뒤에 「| 해아림한의원 잠실점」(13자)이 붙어 30자
SUMMARY_MAX = 160           # 가이드 front matter 표
SUMMARY_MIN = 60            # 이보다 짧으면 검색 결과 설명이 빈약하다
AUTHORS = {"seok-seonhui", "ryu-seokgyun"}
TOPIC_TAGS = {"자율신경실조증", "불안장애", "다한증", "공황장애", "불면증",
              "ADHD", "우울장애", "신경성 질환", "강박장애", "틱장애"}
OVERLAP = 0.45              # 제목 글자쌍 겹침 비율. 넘으면 주제 중복 주의
# 의료광고에서 쓰지 않는 표현. 「보장할 수 없습니다」처럼 부정 맥락은 괜찮으므로
# 오류가 아니라 주의로 알린다.
BANNED = ["완치", "100%", "부작용 없는", "부작용이 없는", "최고의", "유일한", "반드시 좋아"]
# ────────────────────────────────────────────────────────────────

FM = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.S)
LINK = re.compile(r"\]\((/[^)#?\s]*)")


def load(path):
    m = FM.match(path.read_text(encoding="utf-8"))
    if not m:
        return None, ""
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def bigrams(s):
    s = re.sub(r"[\s\W_]+", "", str(s))
    return {s[i:i + 2] for i in range(len(s) - 1)}


def jaccard(a, b):
    a, b = bigrams(a), bigrams(b)
    return len(a & b) / len(a | b) if a and b else 0.0


def page_exists(url):
    """/diseases/tic/ 같은 내부 주소가 실제 content 파일이나 출력물에 있는가."""
    p = url.strip("/")
    if p == "":
        return True
    c = ROOT / "content"
    if (c / f"{p}.md").exists() or (c / p / "_index.md").exists() or (c / p / "index.md").exists():
        return True
    if (ROOT / "static" / p).exists():
        return True
    return p in {"llms.txt", "sitemap.xml", "index.xml"}


def check(path, others):
    err, warn = [], []
    fm, body = load(path)
    if fm is None:
        return ["front matter(--- 사이의 항목)를 읽지 못했습니다"], warn

    title = str(fm.get("title") or "").strip()
    if not title:
        err.append("제목(title)이 비어 있습니다")

    seo = str(fm.get("title_seo") or "").strip()
    if not seo:
        err.append("검색 결과 제목(title_seo)이 비어 있습니다 — 글 제목이 그대로 쓰여 검색 결과에서 잘립니다")
    elif len(seo) > TITLE_SEO_MAX:
        err.append(f"검색 결과 제목이 {len(seo)}자입니다 — {TITLE_SEO_MAX}자 이내여야 한의원 이름이 잘리지 않습니다: 「{seo}」")

    summary = re.sub(r"\s+", " ", str(fm.get("summary") or "")).strip()
    if not summary:
        err.append("요약(summary)이 비어 있습니다 — 검색 결과 설명과 구조화 데이터에 쓰입니다")
    elif len(summary) > SUMMARY_MAX:
        err.append(f"요약이 {len(summary)}자입니다 — {SUMMARY_MAX}자 이하로 줄여 주세요")
    elif len(summary) < SUMMARY_MIN:
        warn.append(f"요약이 {len(summary)}자로 짧습니다 — 글이 무엇을 알려 주는지 {SUMMARY_MIN}자 이상으로 구체적으로 쓰면 검색 결과에서 눈에 띕니다")

    today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
    date = fm.get("date")
    if not date:
        err.append("작성일(date)이 비어 있습니다")
    else:
        d = date if isinstance(date, datetime.datetime) else datetime.datetime.fromisoformat(str(date))
        if d.tzinfo is None:
            d = d.replace(tzinfo=today.tzinfo)
        if d > today + datetime.timedelta(days=1):
            err.append(f"작성일이 미래({d:%Y-%m-%d})입니다 — 그날까지 화면에 나오지 않습니다")
    if not fm.get("lastmod"):
        warn.append("수정일(lastmod)이 비어 있습니다 — 작성일과 같게 적어 두면 검색엔진이 최신성을 판단합니다")

    authors = fm.get("authors") or []
    if not authors:
        err.append("원장(authors)이 비어 있습니다 — 빌드 전체가 멈춥니다")
    for a in authors:
        if a not in AUTHORS:
            err.append(f"원장 값 「{a}」가 data/authors/ 의 파일명과 다릅니다")

    tags = set(fm.get("tags") or [])
    topics = tags - {"칼럼"}
    if not topics:
        err.append("질환 주제 태그가 없습니다 — 목록 필터와 구조화 데이터(about)에 쓰입니다")
    for t in topics - TOPIC_TAGS:
        err.append(f"정해진 주제 태그가 아닙니다: 「{t}」")

    faqs = fm.get("faqs") or []
    for i, f in enumerate(faqs, 1):
        if not str((f or {}).get("question") or "").strip() or not str((f or {}).get("answer") or "").strip():
            err.append(f"FAQ {i}번의 질문 또는 답변이 비어 있습니다 — FAQ 구조화 데이터에서 빠집니다")
    if not faqs:
        warn.append("FAQ가 없습니다 — 본문에서 다루지 않은 질문이 있으면 한두 개 넣으면 AI 답변에 인용되기 쉽습니다")

    links = LINK.findall(body)
    if not any(l.startswith("/diseases/") for l in links):
        err.append("본문에 질환 페이지(/diseases/...) 링크가 없습니다 — 첫 문단에서 관련 질환으로 한 번 연결해 주세요")
    for l in sorted(set(links)):
        if not page_exists(l):
            err.append(f"본문의 내부 링크가 없는 주소를 가리킵니다: {l}")

    if re.search(r"^##\s*마무리\s*$", body, re.M):
        warn.append("「## 마무리」 소제목은 쓰지 않습니다(가이드 「마지막」)")
    for w in BANNED:
        if w in body or w in summary or any(w in str(f) for f in faqs):
            warn.append(f"의료광고 주의 표현 「{w}」이 있습니다 — 부정 맥락(「~할 수 없습니다」)인지 확인해 주세요")

    # 주제 중복 — 같은 질환 태그를 단 글 가운데 제목이 많이 겹치는 것
    for op, ofm in others:
        if op == path:
            continue
        if not topics & set(ofm.get("tags") or []):
            continue
        # 질환명은 같은 태그 글이면 늘 겹치므로 빼고 비교한다
        def strip(x):
            x = str(x or "")
            for t in TOPIC_TAGS:
                x = x.replace(t, "")
            return x
        s = max(jaccard(strip(title), strip(ofm.get("title"))), jaccard(strip(seo), strip(ofm.get("title_seo"))))
        if s >= OVERLAP:
            warn.append(f"주제가 겹칠 수 있습니다: 「{ofm.get('title')}」({op.stem}) — 검색에서 서로 순위를 나눠 가집니다. 다른 점을 분명히 하거나 서로 링크해 주세요")

    # 질환 페이지 연결은 자동이 아니다(가이드 「발행 전 점검」)
    slug = path.stem
    for dp in sorted((ROOT / "content/diseases").glob("*.md")):
        dfm, _ = load(dp)
        if dfm and any(t in str(dfm.get("title", "")) for t in topics):
            if slug not in str(dfm.get("related_columns") or ""):
                warn.append(f"질환 페이지 {dp.name} 의 related_columns 에 이 글이 아직 없습니다 — 발행 뒤 연결해 주세요")
    return err, warn


def main(argv):
    col = ROOT / "content/column"
    all_cols = [p for p in sorted(col.glob("*.md")) if p.name != "_index.md"]
    others = [(p, load(p)[0] or {}) for p in all_cols]
    targets = [Path(a).resolve() for a in argv] or all_cols
    targets = [p for p in targets if p.exists() and p.name != "_index.md"]

    gha = os.environ.get("GITHUB_ACTIONS") == "true"
    lines, n_err = [], 0
    for p in targets:
        err, warn = check(p, others)
        n_err += len(err)
        rel = p.relative_to(ROOT)
        mark = "❌" if err else ("⚠️" if warn else "✅")
        print(f"{mark} {rel}")
        lines.append(f"### {mark} `{rel}`")
        for kind, msgs in (("오류", err), ("주의", warn)):
            for m in msgs:
                print(f"   {kind}: {m}")
                lines.append(f"- **{kind}** {m}")
                if gha:
                    level = "error" if kind == "오류" else "warning"
                    print(f"::{level} file={rel},title=컬럼 점검::{m}")
        if not err and not warn:
            lines.append("- 문제 없음")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("## 컬럼 점검\n\n" + "\n".join(lines) + "\n")
    print(f"\n{len(targets)}편 점검 · 오류 {n_err}건")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
