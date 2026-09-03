/* 문진표 — 묶음별 화면 이동, 브라우저 저장, 진료용 요약 만들기.
 *
 * 서버로 아무것도 보내지 않는다. 답은 localStorage 한 곳에만 쓴다.
 *
 * 문항을 늘릴 때 이 파일을 고칠 일은 없다 — data/survey.yaml 에 문항을 더하면
 * layouts/_partials/survey-item.html 이 같은 겉껍데기(.sv-item[data-k][data-t]
 * [data-short])로 그려 주고, 아래 코드는 그 껍데기만 본다.
 *
 * 다시 부를 수 있게 window.initSurvey 로 내놓는다(사이트의 다른 스크립트와 같은 방식).
 */
(function () {
  'use strict';

  var KEY = 'healim-survey';

  function initSurvey() {
    var form = document.getElementById('sv-form');
    if (!form || form.dataset.ready === '1') return;
    form.dataset.ready = '1';

    var steps = Array.prototype.slice.call(form.querySelectorAll('.sv-step'));
    var items = Array.prototype.slice.call(form.querySelectorAll('.sv-item'));
    if (!steps.length) return;

    var bar = document.getElementById('sv-progress-bar');
    var label = document.getElementById('sv-progress-label');
    var count = document.getElementById('sv-progress-count');
    var summaryEl = document.getElementById('sv-summary');
    var at = 0;

    /* 문항 구성이 바뀌면 예전에 저장된 답은 버린다 — 문항이 바뀐 답을
       엉뚱한 칸에 되살리지 않기 위해서다. */
    var fingerprint = items.map(function (el) { return el.dataset.k; }).join('|');

    /* 진행 막대는 sticky 라 헤더 바로 아래에 앉아야 한다. 헤더 높이를 재서
       넣는다 — 헤더를 고쳐도 여기를 따라 고칠 일이 없다. */
    function setTop() {
      var header = document.querySelector('header');
      if (header) form.style.setProperty('--sv-top', Math.round(header.getBoundingClientRect().height) + 'px');
    }
    setTop();
    window.addEventListener('resize', setTop);

    form.classList.add('sv-on');
    show(form.querySelector('.sv-progress'));
    steps.forEach(function (s) { show(s.querySelector('.sv-nav')); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    /* ── 저장·복원 ──────────────────────────────────────────── */

    function fields() {
      return Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    }

    function save() {
      var data = {};
      fields().forEach(function (el) {
        if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.checked) (data[el.name] = data[el.name] || []).push(el.value);
        } else if (el.value.trim()) {
          data[el.name] = el.value;
        }
      });
      try {
        localStorage.setItem(KEY, JSON.stringify({ fp: fingerprint, at: at, data: data }));
      } catch (e) { /* 사생활 보호 모드 등 — 저장만 못 하고 작성은 그대로 된다 */ }
    }

    function restore() {
      var saved;
      try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return; }
      if (!saved || saved.fp !== fingerprint) return;
      var data = saved.data || {};
      fields().forEach(function (el) {
        var v = data[el.name];
        if (v === undefined) return;
        if (el.type === 'radio' || el.type === 'checkbox') {
          el.checked = Array.isArray(v) && v.indexOf(el.value) !== -1;
        } else {
          el.value = v;
        }
      });
      if (typeof saved.at === 'number') at = Math.min(saved.at, steps.length - 1);
    }

    /* ── 성별 조건(when: female) ───────────────────────────────
       숨긴 문항의 답은 지우지 않는다. 성별을 다시 바꾸면 그대로 살아 있고,
       숨어 있는 동안에는 요약에 들어가지 않는다. */

    function isFemale() {
      var sex = form.querySelector('.sv-item[data-role="sex"] input:checked');
      return !!sex && sex.value === '여성';
    }

    function applyConditions() {
      var female = isFemale();
      items.forEach(function (el) {
        if (el.dataset.when === 'female') el.hidden = !female;
      });
    }

    /* ── 문항 하나의 답 읽기 ───────────────────────────────────
       화면 표기가 아니라 요약 표기(data-s / data-short)로 돌려준다. */

    function fill(tpl, values) {
      var i = 0;
      var out = String(tpl).replace(/\{\}/g, function () { return values[i++] || ''; });
      return out.trim();
    }

    function readItem(el) {
      var k = el.dataset.k;
      var type = el.dataset.t;
      var short = el.dataset.short || '';
      var body = '';

      if (type === 'choice') {
        var picked = el.querySelector('input[name="' + k + '"]:checked');
        if (!picked) return null;
        body = fill(short, [picked.dataset.s]);
      } else if (type === 'multi') {
        var on = Array.prototype.slice.call(el.querySelectorAll('input[name="' + k + '"]:checked'));
        if (!on.length) return null;
        body = fill(short, [on.map(function (i) { return i.dataset.s; }).join('·')]);
      } else if (type === 'check') {
        var box = el.querySelector('input[name="' + k + '"]');
        if (!box || !box.checked) return null;
        body = short;
      } else if (type === 'number') {
        var vals = Array.prototype.slice.call(el.querySelectorAll('.sv-num'))
          .map(function (i) { return i.value.trim(); });
        if (!vals.some(function (v) { return v; })) return null;
        /* 비운 칸은 ? 로 남긴다 — 원본 문진표가 헷갈리는 항목에 쓰는 표시다 */
        body = fill(short, vals.map(function (v) { return v || '?'; }));
      } else if (type === 'text' || type === 'textarea') {
        var one = el.querySelector('[name="' + k + '"]');
        if (!one || !one.value.trim()) return null;
        body = fill(short, [one.value.trim()]);
      } else if (type === 'symptoms') {
        var marks = ['①', '②', '③', '④', '⑤'];
        var lines = [];
        for (var n = 1; n <= 5; n++) {
          var sym = el.querySelector('[name="' + k + '__s' + n + '"]');
          if (!sym || !sym.value.trim()) continue;
          var dur = el.querySelector('[name="' + k + '__d' + n + '"]');
          var d = dur && dur.value.trim();
          lines.push(marks[n - 1] + ' ' + sym.value.trim() + (d ? ', ' + d : ''));
        }
        if (!lines.length) return null;
        return { kind: 'block', lines: lines };
      } else {
        return null;
      }

      /* 「언제?」 서술칸과 「→」 하위 택1을 뒤에 붙인다 */
      var note = el.querySelector('[name="' + k + '__note"]');
      if (note && note.value.trim()) body += '(' + note.value.trim() + ')';
      var follow = el.querySelector('input[name="' + k + '__f"]:checked');
      if (follow) body += ' → ' + follow.dataset.s;

      var block = type === 'text' || type === 'textarea';
      return { kind: block ? 'block' : 'inline', lines: [body] };
    }

    /* ── 요약 만들기 ───────────────────────────────────────────
       묶음별로 모으고, 짧은 항목(체크·택1·숫자)은 한 줄에 「·」로 이어 붙인다.
       서술 항목은 줄을 따로 쓴다. */

    function collect() {
      var out = [];
      steps.forEach(function (step) {
        var name = step.dataset.group;
        if (!name) return;
        var lines = [];
        var pending = [];
        Array.prototype.slice.call(step.querySelectorAll('.sv-item')).forEach(function (el) {
          if (el.hidden) return;
          var r = readItem(el);
          if (!r) return;
          if (r.kind === 'inline') {
            pending.push(r.lines[0]);
          } else {
            if (pending.length) { lines.push(pending.join(' · ')); pending = []; }
            r.lines.forEach(function (l) { lines.push(l); });
          }
        });
        if (pending.length) lines.push(pending.join(' · '));
        if (lines.length) out.push({ name: name, lines: lines });
      });
      return out;
    }

    function answered() {
      return items.filter(function (el) { return !el.hidden && readItem(el); }).length;
    }

    function render() {
      var groups = collect();
      summaryEl.innerHTML = '';
      if (!groups.length) {
        var empty = document.createElement('p');
        empty.className = 'sv-summary-empty';
        empty.textContent = '아직 표시한 항목이 없습니다. 이전으로 돌아가 해당하는 항목에 표시해 주세요.';
        summaryEl.appendChild(empty);
        return;
      }
      groups.forEach(function (g) {
        var row = document.createElement('div');
        row.className = 'sv-summary-row';
        var h = document.createElement('div');
        h.className = 'sv-summary-name';
        h.textContent = g.name;
        var body = document.createElement('div');
        body.className = 'sv-summary-body';
        g.lines.forEach(function (l) {
          var p = document.createElement('p');
          p.textContent = l;
          body.appendChild(p);
        });
        row.appendChild(h);
        row.appendChild(body);
        summaryEl.appendChild(row);
      });
    }

    function asText() {
      var d = new Date();
      var stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      var out = ['문진표 ' + stamp, ''];
      collect().forEach(function (g) {
        out.push('▸ ' + g.name);
        g.lines.forEach(function (l) { out.push(l); });
      });
      return out.join('\n');
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    /* ── 화면 이동 ─────────────────────────────────────────── */

    function show(el) { if (el) el.hidden = false; }

    function go(next, scroll) {
      at = Math.max(0, Math.min(next, steps.length - 1));
      steps.forEach(function (s, i) { s.classList.toggle('sv-current', i === at); });
      var total = steps.length;
      if (label) label.textContent = at + 1 < total ? steps[at].dataset.group : '정리된 내용';
      if (count) count.textContent = (at + 1) + ' / ' + total + ' · ' + answered() + '개 표시';
      if (bar) bar.style.width = Math.round(((at + 1) / total) * 100) + '%';
      steps[at].querySelectorAll('.sv-prev').forEach(function (b) { b.disabled = at === 0; });
      if (at === steps.length - 1) render();
      if (scroll) {
        var top = form.getBoundingClientRect().top + window.pageYOffset - 84;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      save();
    }

    form.addEventListener('click', function (e) {
      var t = e.target.closest('.sv-next, .sv-prev');
      if (!t) return;
      go(at + (t.classList.contains('sv-next') ? 1 : -1), true);
    });

    /* ── 입력 반응 ─────────────────────────────────────────── */

    form.addEventListener('change', function (e) {
      var el = e.target;
      var item = el.closest('.sv-item');

      /* 체크를 풀면 그 문항에 딸린 서술칸·하위 택1을 함께 비운다.
         비우지 않으면 :has(input:checked) 때문에 열린 채로 남는다. */
      if (item && (el.type === 'checkbox' || el.type === 'radio') && el.name === item.dataset.k) {
        var anyOn = item.querySelector('input[name="' + item.dataset.k + '"]:checked');
        if (!anyOn) {
          var note = item.querySelector('[name$="__note"]');
          if (note) note.value = '';
          item.querySelectorAll('input[name$="__f"]').forEach(function (r) { r.checked = false; });
        }
      }

      if (item && item.dataset.role === 'sex') applyConditions();
      if (count) count.textContent = (at + 1) + ' / ' + steps.length + ' · ' + answered() + '개 표시';
      if (at === steps.length - 1) render();
      save();
    });

    form.addEventListener('input', function (e) {
      if (e.target.matches('input[type="text"], textarea')) save();
    });

    /* 고른 택1을 다시 누르면 선택이 풀린다 — 「해당하는 항목에만 표시」라
       실수로 고른 답을 지울 방법이 있어야 한다. */
    form.addEventListener('mousedown', markRadio, true);
    form.addEventListener('touchstart', markRadio, { capture: true, passive: true });
    function markRadio(e) {
      var t = e.target;
      var chip = t.closest ? t.closest('.sv-chip') : null;
      var r = chip ? chip.querySelector('input[type="radio"]') : (t.type === 'radio' ? t : null);
      if (r) r.dataset.was = r.checked ? '1' : '';
    }
    form.addEventListener('click', function (e) {
      var r = e.target;
      if (r.type !== 'radio') return;
      if (r.dataset.was === '1') {
        r.checked = false;
        r.dataset.was = '';
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    /* ── 결과 화면의 버튼 ──────────────────────────────────── */

    var msg = document.getElementById('sv-copy-msg');

    function copy() {
      var text = asText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
      }
      return Promise.resolve(fallback());

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        return ok;
      }
    }

    function tell(ok) {
      if (!msg) return;
      msg.textContent = ok
        ? '복사했습니다. 카카오톡 대화창에 붙여넣어 주세요.'
        : '복사가 되지 않았습니다. 위 내용을 직접 선택해 복사해 주세요.';
    }

    var copyBtn = document.getElementById('sv-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () { copy().then(tell); });

    var kakao = document.getElementById('sv-kakao');
    if (kakao) kakao.addEventListener('click', function () { copy().then(tell); });

    var printBtn = document.getElementById('sv-print');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    var reset = document.getElementById('sv-reset');
    if (reset) reset.addEventListener('click', function () {
      if (!window.confirm('작성한 내용을 모두 지우고 처음부터 다시 쓸까요?')) return;
      try { localStorage.removeItem(KEY); } catch (e) { /* 지울 것이 없으면 그대로 */ }
      form.reset();
      applyConditions();
      go(0, true);
    });

    /* ── 시작 ─────────────────────────────────────────────── */

    restore();
    applyConditions();
    go(at, false);
  }

  window.initSurvey = initSurvey;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSurvey);
  } else {
    initSurvey();
  }
})();
