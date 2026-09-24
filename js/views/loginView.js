/**
 * Login screen — demo only, checks the hardcoded staff account in CONFIG.
 * On success AppState notifies the router, which moves to the dashboard.
 */
(function () {
  function template() {
    var e = UI.escapeHtml;
    return (
      '<div class="login">' +
        '<div class="login__panel">' +
          '<div class="login__brand">' +
            '<img class="login__logo" src="assets/vaxicare-logo.jpg" alt="' + e(CONFIG.APP_NAME) + ' – Protecting Generations">' +
            '<h1 class="visually-hidden">' + e(CONFIG.APP_NAME) + "</h1>" +
            '<p class="login__subtitle">' + e(CONFIG.APP_TAGLINE) + "</p>" +
            '<p class="login__hospital">' + e(CONFIG.HOSPITAL_NAME) + "</p>" +
          "</div>" +

          '<form class="login__form" novalidate>' +
            '<h2 class="login__heading">Staff sign in</h2>' +
            '<p class="form-error" role="alert" hidden></p>' +
            '<div class="field">' +
              '<label for="login-username">Username</label>' +
              '<input id="login-username" name="username" type="text" autocomplete="username" autofocus>' +
            "</div>" +
            '<div class="field">' +
              '<label for="login-password">Password</label>' +
              '<div class="password-wrap">' +
                '<input id="login-password" name="password" type="password" autocomplete="current-password">' +
                '<button type="button" class="btn btn--ghost password-toggle" aria-label="Show password">Show</button>' +
              "</div>" +
            "</div>" +
            '<button type="submit" class="btn btn--primary btn--block">Sign in</button>' +
            '<p class="login__hint">Demo account: <strong>' + e(CONFIG.DEMO_USERNAME) +
              "</strong> / <strong>" + e(CONFIG.DEMO_PASSWORD) + "</strong></p>" +
          "</form>" +
        "</div>" +
        '<p class="login__footer">Prototype for demonstration only – no real patient data, no messages are sent.</p>' +
      "</div>"
    );
  }

  function bind(container) {
    var form = container.querySelector("form");
    var username = container.querySelector("#login-username");
    var password = container.querySelector("#login-password");
    var error = container.querySelector(".form-error");
    var toggle = container.querySelector(".password-toggle");

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
    }

    toggle.addEventListener("click", function () {
      var showing = password.type === "text";
      password.type = showing ? "password" : "text";
      toggle.textContent = showing ? "Show" : "Hide";
      toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });

    [username, password].forEach(function (input) {
      input.addEventListener("input", function () { error.hidden = true; });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var result = AppState.login(username.value, password.value);
      if (!result.ok) {
        showError(result.error);
        password.value = "";
        (username.value.trim() ? password : username).focus();
      }
    });
  }

  Router.register("login", {
    render: function (container) {
      // Build once so typed input survives re-renders; reset after logout.
      if (container.dataset.rendered === "true") return;
      container.innerHTML = template();
      container.dataset.rendered = "true";
      bind(container);
      container.querySelector("#login-username").focus();
    },
    reset: function (container) {
      container.dataset.rendered = "";
    }
  });
})();
