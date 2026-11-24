// 원장 컬럼 목록의 질환 필터 칩과 쪽 번호.
// 네이티브 방식으로 만들 마땅한 대안이 없어 「JS는 최소한으로」의 예외로 둔 작은 스크립트다.
//
// 쪽 번호를 서버(Hugo)가 아니라 여기서 나누는 이유 — 필터가 화면에 있는 카드를
// 숨겼다 보였다 하는 방식이라, 서버에서 쪽을 나누면 「불면증」을 눌러도 그 쪽에
// 있는 9장 중에서만 걸러진다. 여기서 나누면 거른 결과를 다시 쪽으로 나눈다.
// HTML 에는 34편이 다 들어 있어 검색엔진은 전부 본다. 그림은 지연 로딩이라
// 안 보이는 카드는 받아오지 않는다.
//
// 마크업에서 주는 것 (칩 묶음의 data-)
//   data-grid      카드 격자의 id
//   data-per-page  한 쪽에 보일 개수. 없으면 쪽을 나누지 않는다
//   data-pager     쪽 번호를 그릴 자리의 id
//
// 스크립트가 꺼져 있으면 카드가 전부 보인다 — 쪽 번호만 없을 뿐 망가지지 않는다.
(function () {
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  var ACTIVE = { border: '#0F7A7E', background: '#E3FCF7', color: '#0F7A7E' };
  var INACTIVE = { border: '#E8EDEB', background: '#FFFFFF', color: '#4A4A44' };

  function setActive(btn, on) {
    var s = on ? ACTIVE : INACTIVE;
    btn.style.borderColor = s.border;
    btn.style.background = s.background;
    btn.style.color = s.color;
  }

  function init(wrap) {
    var grid = document.getElementById(wrap.dataset.grid);
    if (!grid) return;
    var per = parseInt(wrap.dataset.perPage || '0', 10) || 0;
    var pager = wrap.dataset.pager ? document.getElementById(wrap.dataset.pager) : null;
    var filter = 'all';
    var page = 1;

    function matches(card) {
      if (filter === 'all') return true;
      return (card.dataset.tags || '').split(',').indexOf(filter) !== -1;
    }

    function drawPager(pages, total) {
      if (!pager) return;
      pager.textContent = '';
      if (pages < 2) return;

      var nav = document.createElement('nav');
      nav.className = 'pager';
      nav.setAttribute('aria-label', '쪽 번호');

      function btn(label, to, opts) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pager-btn' + (opts && opts.current ? ' is-current' : '');
        b.textContent = label;
        if (opts && opts.current) b.setAttribute('aria-current', 'page');
        if (opts && opts.disabled) b.disabled = true;
        if (opts && opts.label) b.setAttribute('aria-label', opts.label);
        b.addEventListener('click', function () { go(to); });
        nav.appendChild(b);
      }

      btn('‹', page - 1, { disabled: page === 1, label: '이전 쪽' });
      for (var i = 1; i <= pages; i++) btn(String(i), i, { current: i === page });
      btn('›', page + 1, { disabled: page === pages, label: '다음 쪽' });

      var count = document.createElement('p');
      count.className = 'pager-count';
      count.textContent = total + '편 중 ' + ((page - 1) * per + 1)
        + '–' + Math.min(page * per, total) + '편';

      pager.appendChild(nav);
      pager.appendChild(count);
    }

    function render() {
      var shown = [];
      each(grid.children, function (card) { if (matches(card)) shown.push(card); });
      var pages = per ? Math.max(1, Math.ceil(shown.length / per)) : 1;
      if (page > pages) page = pages;

      each(grid.children, function (card) { card.style.display = 'none'; });
      var start = per ? (page - 1) * per : 0;
      var end = per ? start + per : shown.length;
      for (var i = start; i < end && i < shown.length; i++) shown[i].style.display = '';

      drawPager(pages, shown.length);
    }

    /* 쪽을 넘기면 목록 맨 위로 올린다 — 안 그러면 넘긴 자리가 목록 중간이라
       어디로 갔는지 알기 어렵다. 칩 묶음이 목록의 첫머리다. */
    function go(to) {
      page = to;
      render();
      var y = wrap.getBoundingClientRect().top + window.pageYOffset - 24;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      filter = btn.dataset.filter;
      page = 1;
      each(wrap.querySelectorAll('button[data-filter]'), function (b) { setActive(b, b === btn); });
      render();
    });

    render();
  }

  /* 다시 부를 수 있게 열어 둔다 */
  window.initColumnFilters = function () {
    each(document.querySelectorAll('[data-grid]'), init);
  };
  window.initColumnFilters();
})();
