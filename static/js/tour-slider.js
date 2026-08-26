// 원내 둘러보기 / 후기 슬라이더 화살표 — CLAUDE-CODE-BRIEF.md가 명시한 대로
// scroll-snap + scrollBy({behavior:'smooth'})가 이 환경에서 불안정하여
// requestAnimationFrame으로 수동 스크롤 애니메이션을 구현함.
(function () {
  function animateScroll(el, delta, duration) {
    var start = el.scrollLeft;
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.scrollLeft = start + delta * ease;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  window.tourSlide = function (direction) {
    var track = document.getElementById('tour-track');
    if (!track) return;
    var card = track.querySelector('figure');
    var step = card ? card.getBoundingClientRect().width + 16 : 316;
    animateScroll(track, direction * step, 320);
  };
})();
