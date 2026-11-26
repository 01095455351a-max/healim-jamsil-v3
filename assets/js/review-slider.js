// 자필 후기 스캔 — 가로로 넘겨 보는 띠.
// 넘기기 자체는 CSS(overflow-x + scroll-snap)가 하고, 여기서는 데스크톱용
// 좌우 버튼만 붙인다. 버튼은 한 화면 폭만큼 부드럽게 밀고, 양끝에 닿으면 숨는다.
(function () {
  window.initReviewSlider = function () {
    var slider = document.querySelector('.review-slider');
    if (!slider) return;
    var strip = slider.querySelector('.review-strip');
    var prev = slider.querySelector('.review-arrow-prev');
    var next = slider.querySelector('.review-arrow-next');
    if (!strip || !prev || !next) return;

    function step() {
      // 한 번에 화면 폭의 80%만 옮겨 앞뒤 장이 걸쳐 보이게 한다.
      return Math.max(200, Math.round(strip.clientWidth * 0.8));
    }
    function slide(dir) {
      strip.scrollBy({ left: dir * step(), behavior: 'smooth' });
    }
    function sync() {
      var max = strip.scrollWidth - strip.clientWidth;
      prev.hidden = strip.scrollLeft <= 4;
      next.hidden = strip.scrollLeft >= max - 4;
    }

    prev.addEventListener('click', function () { slide(-1); });
    next.addEventListener('click', function () { slide(1); });
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  };

  document.addEventListener('DOMContentLoaded', window.initReviewSlider);
})();
