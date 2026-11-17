document.querySelectorAll(".dropdown-toggle").forEach(function (toggle) {
  var menu = document.getElementById(toggle.getAttribute("aria-controls"));
  if (!menu) return;

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = !menu.hidden;
    menu.hidden = open;
    toggle.setAttribute("aria-expanded", String(!open));
  });

  document.addEventListener("click", function (e) {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});

var LYDIA_URL_KEY = "potachill-lydia-url";

function applyLydiaUrl() {
  var url = localStorage.getItem(LYDIA_URL_KEY);
  if (!url) return;
  document.querySelectorAll("[id^='lydia-link']").forEach(function (link) {
    link.href = url;
  });
}

applyLydiaUrl();
