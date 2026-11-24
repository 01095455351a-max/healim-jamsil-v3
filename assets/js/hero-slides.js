// 히어로 원내 사진 — 같은 자리에서 여러 장을 겹쳐 넘긴다.
//
// 새 장이 옛 장 "위에서" 서서히 나타나게 한다. 두 장을 동시에
// 흐리게 하면 중간에 배경이 비쳐 한 번 흐려지는데, 옛 장을 불투명한
// 채로 아래에 깔아 두면 그 순간이 없어진다(site.css의 .is-prev).
(function () {
  var INTERVAL = 3500;   // 한 장이 머무는 시간
  var FADE = 900;        // 새 장이 나타나는 데 걸리는 시간 (site.css와 같은 값)
  var timer = null;
  var cleanup = null;

  window.initHeroSlides = function () {
    if (timer) { clearInterval(timer); timer = null; }
    if (cleanup) { clearTimeout(cleanup); cleanup = null; }
    var wrap = document.querySelector('.hero-slides');
    if (!wrap) return;
    var slides = wrap.querySelectorAll('img');
    if (slides.length < 2) return;

    var current = 0;
    slides.forEach(function (s) { s.classList.remove('is-active', 'is-prev'); });
    slides[0].classList.add('is-active');

    // 화면 움직임을 줄이도록 설정한 사용자에게는 첫 장만 보여준다.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    timer = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      var prev = slides[current];
      current = (current + 1) % slides.length;

      prev.classList.remove('is-active');
      prev.classList.add('is-prev');       // 불투명한 채로 아래에 남는다
      slides[current].classList.add('is-active');

      // 새 장이 다 나타난 뒤에 옛 장을 치운다. 이미 가려져 있어 보이지 않는다.
      cleanup = setTimeout(function () { prev.classList.remove('is-prev'); }, FADE);
    }, INTERVAL);
  };

  document.addEventListener('DOMContentLoaded', window.initHeroSlides);
})();
