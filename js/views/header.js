/**
 * App header: navigation, logged-in staff name and logout.
 * (The brand name is filled in by app.js from CONFIG.)
 */
var Header = (function () {
  var NAV = [
    { path: "/dashboard", label: "Dashboard", match: /^#\/(dashboard|patient\/)/ },
    { path: "/reminders", label: "Reminder Log", match: /^#\/reminders/ }
  ];

  function render() {
    var el = document.getElementById("app-header-user");
    var session = AppState.getSession();
    if (!session) {
      el.innerHTML = "";
      return;
    }

    var hash = window.location.hash;
    var nav = NAV.map(function (item) {
      var active = item.match.test(hash);
      return '<a href="#' + item.path + '" class="nav-link' + (active ? " is-active" : "") + '"' +
             (active ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("");

    el.innerHTML =
      '<nav class="app-nav" aria-label="Main">' + nav + "</nav>" +
      '<span class="app-header__staff">' + UI.escapeHtml(session.staffName) + "</span>" +
      '<button type="button" class="btn btn--secondary" data-action="logout">Log out</button>';

    el.querySelector('[data-action="logout"]').addEventListener("click", function () {
      AppState.logout();
    });
  }

  function start() {
    window.addEventListener("hashchange", render);
    AppState.subscribe(render);
    render();
  }

  return { start: start };
})();
