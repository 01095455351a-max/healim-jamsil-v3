// 히어로 원내 사진 — 같은 자리에서 여러 장을 서서히 겹쳐 넘긴다.
(function () {
  var INTERVAL = 4500;
  var timer = null;

  window.initHeroSlides = function () {
    if (timer) { clearInterval(timer); timer = null; }
    var wrap = document.querySelector('.hero-slides');
    if (!wrap) return;
    var slides = wrap.querySelectorAll('img');
    if (slides.length < 2) return;

    var current = 0;
    slides[0].classList.add('is-active');

    // 화면 움직임을 줄이도록 설정한 사용자에게는 첫 장만 보여준다.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    timer = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, INTERVAL);
  };

  document.addEventListener('DOMContentLoaded', window.initHeroSlides);
})();
