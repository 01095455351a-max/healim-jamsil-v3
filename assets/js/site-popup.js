/* 홈 안내 팝업 — 첫 화면이 자리 잡은 뒤 잠깐 두고 연다.
   바로 띄우면 읽기도 전에 닫는다. 「오늘 하루 보지 않기」는 이 브라우저에만
   남고(localStorage) 서버로 가지 않는다. data-key가 바뀌면(=기간이 바뀌면)
   전에 닫아 둔 기록과 무관하게 다시 뜬다. */
(function () {
  var d = document.getElementById('site-popup');
  if (!d) return;

  var KEY = 'popup-hide:' + (d.dataset.key || '');

  function stored(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  var until = stored(KEY);
  if (until && Date.now() < Number(until)) return;

  setTimeout(function () {
    /* 그 사이에 치료 방법 팝업이 열렸으면 겹치지 않게 물러난다. */
    if (document.querySelector('dialog[open]')) return;
    d.showModal();
  }, 1200);

  d.addEventListener('close', function () {
    var cb = document.getElementById('site-popup-hide');
    if (!cb || !cb.checked) return;
    try { localStorage.setItem(KEY, String(Date.now() + 86400000)); } catch (e) {}
  });
})();
