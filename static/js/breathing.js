/* 4-2-6 호흡 연습 (/breathing/) — 화면 세 개(안내 · 연습 · 완료)를 오가며
   타이머와 물결을 움직인다.

   이 파일에는 글이 없다. 단계 이름·힌트·안내 문구는 전부
   data/breathing.yaml 에 있고, layouts/breathing.html 이 data-* 로 실어 준다.
   문구를 고치려면 yaml 만 고치면 된다.

   시간은 setInterval 이 몇 번 돌았는지가 아니라 Date.now() 로 잰다.
   다른 탭에 가 있는 동안 브라우저가 타이머를 1초에 한 번으로 늦추는데,
   틱을 세는 방식이면 돌아왔을 때 초가 어긋난 채로 계속 간다.

   서버로 아무것도 보내지 않고 저장하지도 않는다. 새로고침하면 처음부터다. */
(function () {
  'use strict';

  var root = document.getElementById('br');
  if (!root) return;

  var PHASES = JSON.parse(root.dataset.phases);
  var CYCLE = PHASES.reduce(function (a, p) { return a + p.sec; }, 0); // 한 사이클 12초

  var el = {
    screens: {
      intro: root.querySelector('[data-screen="intro"]'),
      run: root.querySelector('[data-screen="run"]'),
      done: root.querySelector('[data-screen="done"]')
    },
    rings: document.getElementById('br-rings'),
    phase: document.getElementById('br-phase'),
    count: document.getElementById('br-count'),
    hint: document.getElementById('br-hint'),
    bar: document.getElementById('br-bar'),
    cycle: document.getElementById('br-cycle'),
    elapsed: document.getElementById('br-elapsed'),
    pause: document.getElementById('br-pause'),
    bell: document.getElementById('br-bell'),
    summary: document.getElementById('br-summary'),
    doneCycles: document.getElementById('br-done-cycles'),
    doneTime: document.getElementById('br-done-time')
  };

  var txt = root.dataset;

  // ── 상태 ───────────────────────────────────────────────
  // secs 는 「지금까지 연습한 초」다. 멈추면 그 자리에 멈추고,
  // 이어서 하면 그 자리부터 다시 흐른다.
  var minutes = 3;
  var base = 0;       // 멈출 때까지 쌓인 초
  var from = 0;       // 이번에 다시 시작한 시각(ms)
  var running = false;
  var phaseIdx = -1;  // 마지막으로 화면에 그린 단계. 바뀔 때만 종을 울린다
  var bellOn = true;
  var timer = null;

  function cycles() { return Math.round(minutes * 60 / CYCLE); }
  function secs() { return running ? base + (Date.now() - from) / 1000 : base; }
  function mmss(t) {
    var s = Math.floor(t);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  // ── 종소리 ─────────────────────────────────────────────
  // 파일을 받지 않고 사인파 다섯 개를 그 자리에서 겹쳐 만든다.
  // 아래 옥타브를 두툼하게 깔고 위 배음은 얇게 — 낮고 긴 울림이 된다.
  var ac = null;
  var HARMONICS = [[0.5, 0.9, 1.15], [1, 1, 1], [1.5, 0.3, 0.7], [2.01, 0.16, 0.55], [2.98, 0.05, 0.32]];

  function audio() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function chime(hz, peak, ring) {
    if (!bellOn) return;
    try {
      var c = audio(), t = c.currentTime + 0.02;
      var out = c.createGain(), lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1000; lp.Q.value = 0.2;
      out.gain.value = peak;
      out.connect(lp); lp.connect(c.destination);
      HARMONICS.forEach(function (p) {
        var o = c.createOscillator(), g = c.createGain(), len = ring * p[2];
        o.type = 'sine'; o.frequency.value = hz * p[0];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(p[1], t + 0.02);        // 부드러운 타점
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);  // 긴 여운
        o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
      });
    } catch (e) { /* 소리가 안 나도 연습은 그대로 굴러간다 */ }
  }

  // 단계마다 다른 종. 연습이 진행될수록 함께 작아진다 —
  // 끝날 때쯤이면 소리에 기대지 않고도 리듬이 잡힌다.
  var TONE = [[146.83, 0.085, 5.5], [220, 0.03, 2.6], [98, 0.095, 8]];
  function ringBell(i, cycleNo) {
    var f = 1 - 0.6 * Math.min(1, cycleNo / Math.max(1, cycles() - 1));
    var t = TONE[i] || TONE[0];
    chime(t[0], t[1] * f, t[2]);
  }

  // ── 화면 ───────────────────────────────────────────────
  function show(name) {
    Object.keys(el.screens).forEach(function (k) {
      var s = el.screens[k];
      if (!s) return;
      if (k === name) { s.removeAttribute('hidden'); } else { s.setAttribute('hidden', ''); }
    });
    var cur = el.screens[name];
    if (cur) { cur.setAttribute('tabindex', '-1'); cur.focus({ preventScroll: true }); }
  }

  function full(on) {
    root.classList.toggle('br-full', on);
    if (on) root.scrollTop = 0;
  }

  // 물결에 「지금 어느 단계인지」와 「얼마 동안 움직일지」만 넘긴다.
  // 크기 · 색 · 시차는 site.css 의 .br-ring 이 갖고 있다.
  function paintRings(idx) {
    if (!el.rings) return;
    var p = PHASES[idx];
    if (!running || !p) {
      el.rings.dataset.state = 'idle';
      el.rings.style.setProperty('--br-dur', '600ms');
      el.rings.style.setProperty('--br-ease', 'cubic-bezier(.4, 0, .2, 1)');
      return;
    }
    el.rings.dataset.state = p.key;
    // 단계가 끝나기 조금 전에 움직임이 멎어야 다음 단계로 넘어가는 것이 보인다
    el.rings.style.setProperty('--br-dur', Math.max(600, p.sec * 1000 - 350) + 'ms');
    el.rings.style.setProperty('--br-ease', p.ease);
  }

  function paint() {
    var t = secs();
    var n = cycles();
    var total = n * CYCLE;

    if (t >= total) { finish(true); return; }

    var cycleNo = Math.floor(t / CYCLE);
    var into = t - cycleNo * CYCLE;
    var idx = 0, left = 0, acc = 0;
    for (var i = 0; i < PHASES.length; i++) {
      if (into < acc + PHASES[i].sec) { idx = i; left = acc + PHASES[i].sec - into; break; }
      acc += PHASES[i].sec;
    }

    if (idx !== phaseIdx) {
      phaseIdx = idx;
      paintRings(idx);
      if (running) ringBell(idx, cycleNo);
    }

    el.phase.textContent = running ? PHASES[idx].label : txt.pausedLabel;
    el.count.textContent = Math.max(1, Math.ceil(left));
    el.hint.textContent = running ? PHASES[idx].hint : txt.pausedHint;
    el.bar.style.width = Math.min(100, Math.round(t / total * 100)) + '%';
    el.cycle.textContent = Math.min(cycleNo + 1, n) + ' / ' + n + ' 번째 호흡';
    el.elapsed.textContent = mmss(t);
  }

  // ── 동작 ───────────────────────────────────────────────
  function tick() { if (running) paint(); }

  function go() {
    from = Date.now();
    running = true;
    clearInterval(timer);
    timer = setInterval(tick, 100);
    el.pause.textContent = txt.pause;
    phaseIdx = -1; // 이어서 할 때도 물결과 종을 다시 맞춘다
    paint();
  }

  function hold() {
    base = secs();
    running = false;
    clearInterval(timer);
    timer = null;
    el.pause.textContent = txt.resume;
    paintRings(-1);
    paint();
  }

  function start() {
    base = 0;
    phaseIdx = -1;
    if (bellOn) audio(); // 소리는 손가락을 댄 뒤에만 열린다 — 이 자리가 그 자리다
    show('run');
    full(true);
    go();
  }

  // done: 끝까지 마쳤는지 여부. 중간에 그만둔 것도 완료 화면으로 간다.
  function finish(complete) {
    var t = complete ? cycles() * CYCLE : secs();
    base = t;
    running = false;
    clearInterval(timer);
    timer = null;
    paintRings(-1);

    var doneCycles = Math.min(Math.floor(t / CYCLE), cycles());
    el.summary.textContent = complete ? txt.doneAll : txt.donePartial;
    el.doneCycles.textContent = doneCycles + ' / ' + cycles() + '회';
    el.doneTime.textContent = mmss(t).replace(':', '분 ') + '초';
    if (complete) chime(98, 0.08, 11); // 마지막 종은 가장 길게 남는다
    show('done');
    full(true);
  }

  function home() {
    base = 0;
    running = false;
    clearInterval(timer);
    timer = null;
    phaseIdx = -1;
    paintRings(-1);
    full(false);
    show('intro');
  }

  // ── 단추 ───────────────────────────────────────────────
  root.querySelectorAll('.br-preset').forEach(function (b) {
    b.addEventListener('click', function () {
      minutes = Number(b.dataset.min);
      root.querySelectorAll('.br-preset').forEach(function (o) {
        var on = o === b;
        o.classList.toggle('br-on', on);
        o.setAttribute('aria-pressed', String(on));
      });
    });
  });

  document.getElementById('br-start').addEventListener('click', start);
  el.pause.addEventListener('click', function () { running ? hold() : go(); });
  document.getElementById('br-stop').addEventListener('click', function () { finish(false); });
  document.getElementById('br-again').addEventListener('click', start);
  document.getElementById('br-home').addEventListener('click', home);

  el.bell.addEventListener('click', function () {
    bellOn = !bellOn;
    el.bell.classList.toggle('br-on', bellOn);
    el.bell.setAttribute('aria-checked', String(bellOn));
    if (bellOn) audio();
  });

  // 전체화면을 빠져나가는 길을 하나 더 둔다 — 연습 중에는 그만하기와 같다.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !root.classList.contains('br-full')) return;
    if (!el.screens.done.hasAttribute('hidden')) home(); else finish(false);
  });

  // 페이지를 떠날 때 타이머를 놓고 간다
  window.addEventListener('pagehide', function () { clearInterval(timer); });

  // 처음 들어왔을 때의 「1 / 15 번째 호흡」
  el.cycle.textContent = '1 / ' + cycles() + ' 번째 호흡';
})();
