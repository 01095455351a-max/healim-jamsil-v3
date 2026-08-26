// 원내 둘러보기 슬라이더 — 일정 시간마다 한 장씩 부드럽게 넘어가고,
// 끝에 닿으면 처음으로 돌아온다. 좌우 화살표로 직접 넘길 수도 있다.
//
// scroll-snap + scrollBy({behavior:'smooth'})가 이 환경에서 불안정해
// requestAnimationFrame으로 수동 스크롤 애니메이션을 구현한다.
(function () {
  var INTERVAL = 4000;   // 다음 사진까지 머무는 시간
  var DURATION = 700;    // 한 장 넘어가는 데 걸리는 시간
  var REWIND = 900;      // 마지막에서 처음으로 되돌아가는 시간

  var timer = null;
  var animating = false;
  var paused = false;

  function animateScrollTo(el, target, duration) {
    var start = el.scrollLeft;
    var delta = target - start;
    if (Math.abs(delta) < 1) return;
    var startTime = null;
    animating = true;
    function frame(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.scrollLeft = start + delta * ease;
      if (progress < 1) requestAnimationFrame(frame);
      else animating = false;
    }
    requestAnimationFrame(frame);
  }

  function cardStep(track) {
    var card = track.querySelector('figure');
    return card ? card.getBoundingClientRect().width + 16 : 316;
  }

  function maxScroll(track) {
    return track.scrollWidth - track.clientWidth;
  }

  // 사진이 적어 화면에 다 들어오면(넘길 여지가 반 장도 안 되면) 넘기지 않는다.
  function scrollable(track) {
    return maxScroll(track) > cardStep(track) * 0.5;
  }

  // 화살표는 조금이라도 가려진 사진이 있으면 보여준다.
  // (자동 넘김은 반 장 이상 여유가 있을 때만 — 몇 십 px씩 움찔거리지 않도록)
  function syncControls(track) {
    var controls = document.getElementById('tour-controls');
    if (controls) controls.style.display = maxScroll(track) > 4 ? 'flex' : 'none';
  }

  function advance(track) {
    if (animating || !scrollable(track)) return;
    var limit = maxScroll(track);
    if (track.scrollLeft >= limit - 4) {
      animateScrollTo(track, 0, REWIND);
    } else {
      animateScrollTo(track, Math.min(track.scrollLeft + cardStep(track), limit), DURATION);
    }
  }

  function restartTimer(track) {
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      if (!paused && document.visibilityState !== 'hidden') advance(track);
    }, INTERVAL);
  }

  // 좌우 화살표 — 누르면 자동 넘김 시간을 처음부터 다시 센다.
  window.tourSlide = function (direction) {
    var track = document.getElementById('tour-track');
    if (!track) return;
    var target = track.scrollLeft + direction * cardStep(track);
    animateScrollTo(track, Math.max(0, Math.min(target, maxScroll(track))), DURATION);
    if (timer) restartTimer(track);
  };

  // 페이지가 바뀔 때도 다시 호출할 수 있도록 초기화를 밖으로 노출한다.
  window.initTourSlider = function () {
    if (timer) { clearInterval(timer); timer = null; }
    animating = false;
    paused = false;

    var track = document.getElementById('tour-track');
    if (!track) return;

    // 사진을 보는 중에는 멈춘다 — 마우스를 올리거나, 손으로 넘기거나, 키보드 포커스가 들어왔을 때.
    ['mouseenter', 'focusin', 'pointerdown'].forEach(function (e) {
      track.addEventListener(e, function () { paused = true; });
    });
    ['mouseleave', 'focusout', 'pointerup', 'pointercancel'].forEach(function (e) {
      track.addEventListener(e, function () { paused = false; });
    });

    syncControls(track);
    window.addEventListener('resize', function () { syncControls(track); });

    // 화면 움직임을 줄이도록 설정한 사용자에게는 자동으로 넘기지 않는다.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    restartTimer(track);
  };

  document.addEventListener('DOMContentLoaded', window.initTourSlider);
})();
