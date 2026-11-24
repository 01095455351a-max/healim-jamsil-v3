/* 치료 방법 팝업 딥링크 — /#treatment-<slug> 로 들어오면 해당 팝업을 바로 연다.
   치료법은 별도 상세 페이지 없이 홈의 팝업으로만 제공되므로, 원장 컬럼 등
   다른 페이지에서 특정 치료법을 링크할 때 이 해시를 쓴다. */
(function () {
  var PREFIX = '#treatment-';

  function openFromHash() {
    if (location.hash.indexOf(PREFIX) !== 0) return;
    var dialog = document.getElementById('modal-' + location.hash.slice(PREFIX.length));
    if (!dialog) return;

    /* 홈에 머문 채 다른 치료법 해시로 옮겨 가면 팝업이 겹쳐 쌓인다.
       새로 열기 전에 열려 있는 다른 팝업을 닫는다. */
    Array.prototype.forEach.call(document.querySelectorAll('dialog[open]'), function (d) {
      if (d !== dialog) d.close();
    });

    if (!dialog.open) dialog.showModal();
  }

  document.addEventListener('DOMContentLoaded', openFromHash);
  window.addEventListener('hashchange', openFromHash);

  /* 팝업을 닫으면 해시를 지운다 — 남겨두면 뒤로가기·새로고침 때 다시 열린다.
     close 이벤트는 버블링하지 않으므로 캡처 단계에서 받는다.

     단, 다른 팝업으로 갈아타는 중에는 지우지 않는다. 위에서 이전 팝업을
     닫을 때도 이 처리가 불리는데, 그때 해시를 지우면 방금 연 팝업의
     주소가 사라져 새로고침이나 공유가 어긋난다. 열린 팝업이 하나도
     남지 않았을 때만 지운다. */
  document.addEventListener('close', function (event) {
    if (event.target.tagName !== 'DIALOG') return;
    if (location.hash.indexOf(PREFIX) !== 0) return;
    if (document.querySelector('dialog[open]')) return;
    history.replaceState(null, '', location.pathname + location.search);
  }, true);
})();
