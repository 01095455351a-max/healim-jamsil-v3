#!/usr/bin/env node
/*
 * 원장 컬럼의 공유 카드 그림을 만든다.
 *
 *   node tools/make-column-cards.js            없는 것만 만든다
 *   node tools/make-column-cards.js --force    전부 다시 만든다
 *   node tools/make-column-cards.js --only <슬러그>
 *
 * 나오는 곳 : assets/media/column-cards/<슬러그>.webp (1200x630)
 * 쓰이는 곳 : 카카오톡·문자 공유 카드(og:image), 컬럼 목록 썸네일,
 *             구글 검색의 글 대표 이미지(Article image)
 *
 * 글에서 읽는 것 — 제목·질환 태그·원장·작성일. 따로 적을 것이 없다.
 * 카드 문구를 직접 정하고 싶으면 front matter 에 card_headline 을 적는다.
 * 「/」로 줄을 가르면 앞은 흐리게, 뒤는 진하게 나간다.
 *
 *   card_headline: "우리 아이 틱장애, / 그냥 두고 봐도 될까요?"
 *
 * 색은 data/column-cards.yaml 한 곳에 있다.
 *
 * 브라우저로 그려 내보낸다 — Hugo 의 글자 올리기에는 한국어 줄바꿈 규칙이
 * 없어 「어떻게 / 해야 할까요?」처럼 어구 가운데가 갈린다. CSS 의
 * word-break: keep-all 이 그 문제를 푼다. 그래서 Cloudflare 빌드가 아니라
 * GitHub Actions 에서 미리 만들어 저장소에 넣는다.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets/media/column-cards');
/* 무엇으로 만든 카드인지 적어 둔다 — 제목이나 card_headline 을 고치면
   그림도 다시 만들어야 하는데, 파일이 있는지만 보면 옛 그림이 남는다.
   저장소에 함께 커밋한다(화면에 나가지 않는다). */
const STATE = path.join(__dirname, 'column-cards.state.json');
const PORT = 8899;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function readFrontMatter(file) {
  const s = fs.readFileSync(file, 'utf8');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? (yaml.load(m[1]) || {}) : {};
}

/* 제목을 두 토막으로 가른다 — 쉼표가 있으면 거기서, 없으면 뒤 두 어절에서.
   card_headline 의 「/」가 있으면 그것이 우선이다. */
function headline(fm) {
  if (fm.card_headline) {
    const p = String(fm.card_headline).split('/');
    return p.length > 1
      ? [p.slice(0, -1).join('/').trim(), p[p.length - 1].trim()]
      : ['', p[0].trim()];
  }
  const t = String(fm.title || '');

  /* 1. 가운데에 물음표가 있으면 거기서 가른다
        — 「~있나요? 몸으로 / 나타나는 우울증」처럼 갈리는 것을 막는다 */
  const q = t.indexOf('?');
  if (q > 0 && q < t.length - 2) return [t.slice(0, q + 1), t.slice(q + 1).trim()];

  /* 2. 쉼표가 있으면 거기서 */
  const i = t.indexOf(',');
  if (i > 0 && i < t.length - 6) return [t.slice(0, i + 1), t.slice(i + 1).trim()];

  /* 3. 없으면 뒤 두 어절에서. 다만 「어떻게·왜·어떤」 같은 말이 앞 토막
        끝에 홀로 남으면 뒤로 넘긴다 — 「부모는 어떻게 / 해야 할까요?」가
        「부모는 / 어떻게 해야 할까요?」가 된다. */
  const CARRY = ['어떻게', '왜', '얼마나', '어떤', '어디', '언제', '무엇을', '자꾸', '다시', '꼭'];
  /* 「때·것·수」처럼 앞말에 기대는 말이 뒤 토막 첫머리에 오면 경계를 한 칸
     왼쪽으로 민다 — 「왜 긴장할 / 때 심해질까요?」가 「왜 / 긴장할 때 ~」가 된다. */
  const BOUND = ['때', '것', '수', '리', '데', '줄', '바', '중', '뿐', '만큼'];
  const w = t.split(' ');
  if (w.length >= 4) {
    let k = Math.max(1, w.length - 2);
    if (k > 1 && CARRY.includes(w[k - 1])) k -= 1;
    if (k > 1 && BOUND.includes(w[k])) k -= 1;
    return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
  }
  return ['', t];
}

/* 글자 수에 따라 크기를 달리한다 — 짧은 제목은 크게, 긴 제목은 작게 */
function fontSize(a, b) {
  const n = (a + b).replace(/\s/g, '').length;
  return n <= 16 ? 66 : n <= 24 ? 58 : n <= 32 ? 50 : 44;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html({ tag, a, b, t1, t2, size, docName, docPhoto, date }) {
  const u = p => `http://127.0.0.1:${PORT}/${p}`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
 *{margin:0;padding:0;box-sizing:border-box}
 body{width:1200px;height:630px;font-family:'Plus Jakarta Sans','Noto Sans KR',sans-serif}
 .c{width:1200px;height:630px;background-image:linear-gradient(150deg, ${a} 0%, ${b} 62%, #FFFFFF 100%);
    padding:52px 64px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
 .tag{display:inline-flex;font-size:22px;font-weight:600;color:#0F7A7E;background:#FFFFFF;
      border:1px solid #C0FAE6;border-radius:9999px;padding:9px 22px;letter-spacing:-.5px}
 h1{font-size:${size}px;line-height:1.32;letter-spacing:-1.7px;word-break:keep-all;
    text-wrap:balance;max-width:960px}
 h1 .lead{display:block;font-weight:500;color:#4A4A44}
 h1 .main{color:#001E2B;font-weight:600}
 .foot{display:flex;align-items:center;justify-content:space-between}
 .logo{height:46px;width:auto;opacity:.9}
 .by{display:flex;align-items:center;gap:22px}
 .nm{font-size:20px;line-height:1.5;color:#4A4A44;text-align:right}
 .nm b{display:block;font-size:24px;font-weight:600;color:#001E2B;letter-spacing:-.5px}
 .face{width:200px;height:200px;border-radius:9999px;object-fit:cover;border:4px solid #fff;
       box-shadow:0 2px 14px rgba(0,30,43,.14);flex:0 0 auto}
</style></head><body><div class="c">
 <div><span class="tag">${esc(tag)}</span></div>
 <h1>${t1 ? `<span class="lead">${esc(t1)}</span>` : ''}<span class="main">${esc(t2)}</span></h1>
 <div class="foot">
   <img class="logo" src="${u('logo.png')}" alt="">
   <span class="by">
     <span class="nm"><b>${esc(docName)}</b>원장 컬럼${date ? ` · ${esc(date)}` : ''}</span>
     ${docPhoto ? `<img class="face" src="${u(docPhoto)}" alt="">` : ''}
   </span>
 </div>
</div></body></html>`;
}

(async () => {
  const tintData = yaml.load(fs.readFileSync(path.join(ROOT, 'data/column-cards.yaml'), 'utf8'));
  const authors = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'data/authors'))) {
    if (!f.endsWith('.yaml')) continue;
    authors[f.replace(/\.yaml$/, '')] = yaml.load(
      fs.readFileSync(path.join(ROOT, 'data/authors', f), 'utf8'));
  }

  /* 브라우저가 가져갈 그림을 한 곳에 모아 두고 작은 서버로 넘긴다 */
  const serveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cards-'));
  fs.copyFileSync(path.join(ROOT, 'assets/design-v3/logo.png'), path.join(serveDir, 'logo.png'));
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/media/authors'))) {
    if (f.startsWith('card-') && f.endsWith('.jpg'))
      fs.copyFileSync(path.join(ROOT, 'assets/media/authors', f), path.join(serveDir, f));
  }
  const srv = require('http').createServer((req, res) => {
    const p = path.join(serveDir, decodeURIComponent(req.url.slice(1)));
    if (!p.startsWith(serveDir) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': p.endsWith('.png') ? 'image/png' : 'image/jpeg' });
    res.end(fs.readFileSync(p));
  }).listen(PORT, '127.0.0.1');

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  const dir = path.join(ROOT, 'content/column');
  const made = [], skipped = [], problems = [];
  const was = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
  const state = {}, alive = new Set();

  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.md') || file === '_index.md') continue;
    const slug = file.replace(/\.md$/, '');
    if (ONLY && slug !== ONLY) continue;
    const dest = path.join(OUT, slug + '.webp');
    const fm = readFrontMatter(path.join(dir, file));
    const stamp = crypto.createHash('sha1').update(JSON.stringify([
      fm.title, fm.card_headline, fm.tags, fm.authors, String(fm.date || ''),
    ])).digest('hex').slice(0, 16);
    alive.add(slug);
    state[slug] = stamp;
    if (!FORCE && fs.existsSync(dest) && was[slug] === stamp) { skipped.push(slug); continue; }

    const tags = (fm.tags || []).filter(t => t !== '칼럼');
    const tag = tags[0] || '';
    const [a, b] = (tintData.tints || {})[tag] || tintData.default;
    const authorSlug = (fm.authors || [])[0] || '';
    const author = authors[authorSlug];
    if (!author) problems.push(`${slug}: 원장을 찾을 수 없음 (authors: ${authorSlug || '없음'})`);
    if (!tag) problems.push(`${slug}: 질환 태그가 없음`);
    const [t1, t2] = headline(fm);
    const date = String(fm.date || '').slice(0, 10).replace(/-/g, '.');

    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(html({
      tag, a, b, t1, t2, size: fontSize(t1, t2),
      docName: author ? author.name.display : '',
      docPhoto: authorSlug ? `card-${authorSlug}.jpg` : '',
      date,
    }), { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const png = path.join(serveDir, slug + '.png');
    await page.screenshot({ path: png });
    await page.close();

    /* PNG 는 한 장에 수백 KB 다. WebP 로 바꿔 저장소를 가볍게 둔다. */
    execFileSync('convert', [png, '-quality', '82', '-define', 'webp:method=5', dest]);
    fs.unlinkSync(png);
    made.push(slug);
  }

  await browser.close();
  srv.close();
  fs.rmSync(serveDir, { recursive: true, force: true });

  /* 지워진 글의 카드는 남겨 두지 않는다 */
  const gone = [];
  for (const f of fs.readdirSync(OUT)) {
    if (!f.endsWith('.webp')) continue;
    const slug = f.replace(/\.webp$/, '');
    if (!alive.has(slug) && !ONLY) { fs.unlinkSync(path.join(OUT, f)); gone.push(slug); }
  }
  if (!ONLY) fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');

  console.log(`만든 카드 ${made.length}장` + (skipped.length ? `, 그대로 둔 것 ${skipped.length}장` : '')
    + (gone.length ? `, 지운 것 ${gone.length}장` : ''));
  for (const p of problems) console.log('  ! ' + p);
  if (problems.length) process.exitCode = 1;
})();
