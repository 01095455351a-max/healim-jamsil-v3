// 원장 컬럼 목록 페이지의 분류 필터 칩 — 네이티브 방식으로 구현할 마땅한 대안이 없어
// CLAUDE-CODE-BRIEF.md의 "zero-JS 가능한 곳까지" 원칙의 예외로 작은 vanilla JS 사용.
(function () {
  var wrap = document.getElementById('column-filters');
  var grid = document.getElementById('column-grid');
  if (!wrap || !grid) return;

  var ACTIVE = { border: '#0F7A7E', background: '#E3FCF7', color: '#0F7A7E' };
  var INACTIVE = { border: '#E8EDEB', background: '#FFFFFF', color: '#4A4A44' };

  function setActive(btn, on) {
    var s = on ? ACTIVE : INACTIVE;
    btn.style.borderColor = s.border;
    btn.style.background = s.background;
    btn.style.color = s.color;
  }

  wrap.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    var filter = btn.dataset.filter;

    Array.prototype.forEach.call(wrap.querySelectorAll('button[data-filter]'), function (b) {
      setActive(b, b === btn);
    });

    Array.prototype.forEach.call(grid.children, function (card) {
      var tags = (card.dataset.tags || '').split(',');
      var show = filter === 'all' || tags.indexOf(filter) !== -1;
      card.style.display = show ? '' : 'none';
    });
  });
})();
