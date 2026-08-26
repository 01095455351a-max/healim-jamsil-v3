/* 치료 방법 팝업 딥링크 — /#treatment-<slug> 로 들어오면 해당 팝업을 바로 연다.
   치료법은 별도 상세 페이지 없이 홈의 팝업으로만 제공되므로, 원장 컬럼 등
   다른 페이지에서 특정 치료법을 링크할 때 이 해시를 쓴다. */
(function () {
  var PREFIX = '#treatment-';

  function openFromHash() {
    if (location.hash.indexOf(PREFIX) !== 0) return;
    var dialog = document.getElementById('modal-' + location.hash.slice(PREFIX.length));
    if (dialog && !dialog.open) dialog.showModal();
  }

  document.addEventListener('DOMContentLoaded', openFromHash);
  window.addEventListener('hashchange', openFromHash);

  /* 팝업을 닫으면 해시를 지운다 — 남겨두면 뒤로가기·새로고침 때 다시 열린다.
     close 이벤트는 버블링하지 않으므로 캡처 단계에서 받는다. */
  document.addEventListener('close', function (event) {
    if (event.target.tagName === 'DIALOG' && location.hash.indexOf(PREFIX) === 0) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }, true);
})();
