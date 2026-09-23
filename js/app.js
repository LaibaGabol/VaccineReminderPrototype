/**
 * App bootstrap: branding, state, notifications, then routing.
 */
(function () {
  // Pause before the daily reminder check so the dashboard is visible first.
  var DAILY_CHECK_DELAY_MS = 700;

  function applyBranding() {
    document.title = CONFIG.APP_NAME + " – " + CONFIG.APP_TAGLINE;
    document.querySelectorAll("[data-app-name]").forEach(function (el) {
      el.textContent = CONFIG.APP_NAME;
    });
    document.querySelectorAll("[data-hospital-name]").forEach(function (el) {
      el.textContent = CONFIG.HOSPITAL_NAME;
    });
  }

  /** Run the simulated daily reminder job whenever a staff session begins. */
  function scheduleDailyCheckOnLogin() {
    var wasLoggedIn = false;

    function check() {
      var loggedIn = AppState.isLoggedIn();
      if (loggedIn && !wasLoggedIn) {
        setTimeout(function () {
          if (AppState.isLoggedIn()) AppState.runReminderCheck();
        }, DAILY_CHECK_DELAY_MS);
      }
      wasLoggedIn = loggedIn;
    }

    AppState.subscribe(check);
    check();
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyBranding();
    AppState.init();
    Header.start();
    Notifications.start();
    GuardianPhone.start();
    Router.start();
    scheduleDailyCheckOnLogin();
  });
})();
