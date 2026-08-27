#!/usr/bin/env python3
"""모바일 규칙 빠짐 점검.

이 사이트는 스타일이 인라인 style로 들어가 있어, 모바일(767px 이하)에서
글자·여백을 줄이는 규칙을 site.css가 속성 선택자로 덮는 구조다.

    [style*="font-size: 34px"] { font-size: 25px !important; }

편한 대신 약점이 하나 있다. 레이아웃에 **새로운 px 값**을 쓰면 모바일
규칙이 조용히 안 걸린다(데스크톱 크기 그대로 나온다). 값을 34px에서
33px로 바꿔도 마찬가지다.

이 스크립트가 그 빠짐을 찾아 준다. 레이아웃을 고친 뒤 실행하면 된다.

    python3 tools/check-mobile.py

빠진 값이 있으면 목록과 함께 종료 코드 1을 돌려준다.
"""
import re, sys, glob, collections

# 이 값보다 작은 글자·여백은 모바일에서 줄이지 않는다(버튼·칩·설명글).
FONT_MIN = 19
PAD_MIN = 20

def scan(pattern):
    found = collections.Counter()
    for f in sorted(glob.glob('layouts/**/*.html', recursive=True)):
        text = open(f, encoding='utf-8').read()
        for m in re.findall(pattern, text):
            found[m.strip()] += 1
    return found

def first_px(value):
    try:
        return int(value.split('px')[0].split()[0])
    except ValueError:
        return 0

css = open('assets/css/site.css', encoding='utf-8').read()
missing = []

fonts = scan(r'font-size:\s*(\d+px)')
rules = set(re.findall(r'\[style\*="font-size:\s*(\d+px)"\]', css))
for value, count in sorted(fonts.items(), key=lambda x: -first_px(x[0])):
    if first_px(value) >= FONT_MIN and value not in rules:
        missing.append(('font-size', value, count))

pads = scan(r'padding:\s*([0-9][^;"]*)')
rules = set(m.strip() for m in re.findall(r'\[style\*="padding:\s*([^"]+)"\]', css))
for value, count in sorted(pads.items(), key=lambda x: -first_px(x[0])):
    if first_px(value) >= PAD_MIN and value not in rules:
        missing.append(('padding', value, count))

if not missing:
    print('모바일 규칙 빠짐 없음 —', len(fonts), '개 글자 크기,', len(pads), '개 여백 확인')
    sys.exit(0)

print('모바일 규칙이 없는 값:\n')
for prop, value, count in missing:
    print(f'  {prop}: {value}   (레이아웃에서 {count}곳 사용)')
print('\nassets/css/site.css의 "모바일 정돈" 블록에 규칙을 추가하세요.')
sys.exit(1)
