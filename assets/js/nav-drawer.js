/* 모바일 서랍 — 링크를 누르면 서랍을 닫는다.
   서랍은 체크박스(#nav-toggle)로 여닫고 CSS만으로 동작하지만,
   같은 페이지 안(/#doctors 등)으로 가는 링크는 페이지가 새로 뜨지 않아
   서랍이 열린 채로 남는다. 헤더가 sticky라 서랍이 화면을 덮어
   "눌러도 아무 반응이 없다"처럼 보이던 문제를 이 다섯 줄이 막는다. */
document.querySelector(".mobile-drawer")?.addEventListener("click", function (e) {
  if (!e.target.closest("a")) return;
  var toggle = document.getElementById("nav-toggle");
  if (toggle) toggle.checked = false;
});
