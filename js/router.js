/**
 * Hash router.
 *
 * Routes:
 *   #/login            login screen (public)
 *   #/dashboard        patient dashboard
 *   #/patient/P001     patient detail
 *   #/reminders        reminder log
 *
 * Every route except login requires a staff session; logged-out users are
 * sent to #/login, and logged-in users visiting #/login go to the dashboard.
 *
 * Views register with Router.register(name, { render(container, params), reset?(container) }).
 * `reset` (optional) is called when the user navigates away from the view.
 * The current view is re-rendered whenever AppState changes.
 */
var Router = (function () {
  var ROUTES = [
    { name: "login", pattern: /^\/login$/, section: "view-login", public: true, title: "Staff sign in" },
    { name: "dashboard", pattern: /^\/dashboard$/, section: "view-dashboard", title: "Patient Dashboard" },
    { name: "patient", pattern: /^\/patient\/([^/]+)$/, section: "view-patient", params: ["id"], title: "Patient" },
    { name: "reminders", pattern: /^\/reminders$/, section: "view-reminders", title: "Reminder Log" }
  ];

  function pageTitle(matched) {
    var title = matched.route.title;
    if (matched.route.name === "patient") {
      var patient = AppState.getPatient(matched.params.id);
      title = patient ? patient.name : "Patient not found";
    }
    return title + " – " + CONFIG.APP_NAME;
  }

  var DEFAULT_PATH = "/dashboard";
  var LOGIN_PATH = "/login";

  var views = {};
  var current = null;

  function register(name, view) {
    views[name] = view;
  }

  function navigate(path) {
    if (window.location.hash === "#" + path) {
      resolve();
    } else {
      window.location.hash = path;
    }
  }

  function currentPath() {
    return window.location.hash.replace(/^#/, "") || DEFAULT_PATH;
  }

  function match(path) {
    for (var i = 0; i < ROUTES.length; i++) {
      var m = ROUTES[i].pattern.exec(path);
      if (m) {
        var params = {};
        (ROUTES[i].params || []).forEach(function (key, idx) {
          params[key] = decodeURIComponent(m[idx + 1]);
        });
        return { route: ROUTES[i], params: params };
      }
    }
    return null;
  }

  function resolve() {
    var matched = match(currentPath());

    if (!matched) {
      navigate(AppState.isLoggedIn() ? DEFAULT_PATH : LOGIN_PATH);
      return;
    }
    if (!matched.route.public && !AppState.isLoggedIn()) {
      navigate(LOGIN_PATH);
      return;
    }
    if (matched.route.name === "login" && AppState.isLoggedIn()) {
      navigate(DEFAULT_PATH);
      return;
    }

    if (current && current.route !== matched.route) {
      var leaving = views[current.route.name];
      if (leaving && leaving.reset) {
        leaving.reset(document.getElementById(current.route.section));
      }
    }

    var changedScreen = !current || current.route !== matched.route ||
                        JSON.stringify(current.params) !== JSON.stringify(matched.params);
    current = matched;
    render();

    // New screen: start at the top and move keyboard focus to the content.
    if (changedScreen && !matched.route.public) {
      window.scrollTo(0, 0);
      var main = document.getElementById("main");
      if (main) main.focus({ preventScroll: true });
    }
  }

  function render() {
    if (!current) return;

    ROUTES.forEach(function (route) {
      document.getElementById(route.section).hidden = route !== current.route;
    });
    document.getElementById("app-header").hidden = current.route.public === true;
    document.body.setAttribute("data-route", current.route.name);
    document.title = pageTitle(current);

    var container = document.getElementById(current.route.section);
    var view = views[current.route.name];
    if (view) {
      view.render(container, current.params);
    } else {
      container.innerHTML = '<div class="card"><p class="text-muted">This screen is coming in a later build step.</p></div>';
    }
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    AppState.subscribe(function () {
      // A login/logout changes which routes are allowed; anything else just re-renders.
      var allowed = current && (current.route.public ? !AppState.isLoggedIn() : AppState.isLoggedIn());
      if (allowed) {
        render();
      } else {
        resolve();
      }
    });
    resolve();
  }

  return {
    register: register,
    navigate: navigate,
    start: start
  };
})();
