/**
 * Guardian phone panel — a slide-in drawer showing a guardian's phone with
 * every simulated reminder they have received, in SMS or WhatsApp style.
 * New reminders pop in live when the daily check runs or the demo date is
 * fast-forwarded. A floating button shows the unread count.
 */
var GuardianPhone = (function () {
  var DAILY_JOB_TIME = "9:00 AM";
  var ANIMATION_MS = 700;

  var fab = null;
  var drawer = null;
  var isOpen = false;
  var selectedId = null;
  var seen = {};        // log id -> true once shown in the open panel
  var animate = {};     // log ids to animate on next render

  // ---------- data ----------

  function entriesFor(patientId) {
    return AppState.getReminderLog().filter(function (entry) {
      return entry.patientId === patientId;
    }).reverse(); // oldest first, like a chat
  }

  function unreadFor(patientId) {
    return entriesFor(patientId).filter(function (entry) { return !seen[entry.id]; }).length;
  }

  function totalUnread() {
    return AppState.getReminderLog().filter(function (entry) { return !seen[entry.id]; }).length;
  }

  /** Patient whose guardian got the most recent unread message, if any. */
  function latestUnreadPatient() {
    var log = AppState.getReminderLog(); // newest first
    for (var i = 0; i < log.length; i++) {
      if (!seen[log[i].id]) return log[i].patientId;
    }
    return null;
  }

  // ---------- rendering ----------

  function optionsHtml() {
    return AppState.getPatients().map(function (p) {
      var unread = unreadFor(p.id);
      var label = p.guardianName + " – guardian of " + p.name + (unread ? " (" + unread + " new)" : "");
      return '<option value="' + UI.escapeHtml(p.id) + '"' + (p.id === selectedId ? " selected" : "") + ">" +
             UI.escapeHtml(label) + "</option>";
    }).join("");
  }

  function renderFab() {
    var count = totalUnread();
    var badge = fab.querySelector(".fab__badge");
    badge.textContent = count;
    badge.hidden = count === 0;
    fab.setAttribute("aria-label", "Guardian phone" + (count ? ", " + count + " new messages" : ""));
    fab.hidden = !AppState.isLoggedIn() || isOpen;
  }

  function renderDrawer() {
    if (!isOpen) return;
    var patient = AppState.getPatient(selectedId);
    var entries = entriesFor(selectedId);

    // Everything shown is now read (before building the unread counts).
    // Animation flags are cleared shortly after, so a re-render during the
    // pop-in doesn't cut it off.
    entries.forEach(function (entry) {
      seen[entry.id] = true;
      if (animate[entry.id]) {
        setTimeout(function () { delete animate[entry.id]; }, ANIMATION_MS);
      }
    });

    var messages = entries.map(function (entry) {
      return {
        id: entry.id,
        text: entry.message,
        time: DAILY_JOB_TIME,
        dateLabel: DateUtils.formatDate(DateUtils.parseDate(entry.date)),
        isNew: !!animate[entry.id]
      };
    });

    drawer.querySelector('[data-slot="select"]').innerHTML = optionsHtml();
    drawer.querySelector('[data-slot="toggle"]').innerHTML = PhoneMock.toggleHtml();
    drawer.querySelector('[data-slot="sound"]').setAttribute("aria-pressed", String(Notifications.isSoundOn()));
    drawer.querySelector('[data-slot="sound"]').textContent = Notifications.isSoundOn() ? "🔔 Sound on" : "🔕 Sound off";
    drawer.querySelector('[data-slot="number"]').textContent = patient ? patient.phone : "";
    drawer.querySelector('[data-slot="phone"]').innerHTML = PhoneMock.html({
      messages: messages,
      emptyText: "No reminders yet for this guardian. Use +1 day / +1 week to move the demo date forward."
    });

    var screen = drawer.querySelector("[data-phone-screen]");
    screen.scrollTop = screen.scrollHeight;
    renderFab();
  }

  // ---------- open / close ----------

  function open(patientId) {
    selectedId = patientId || latestUnreadPatient() || selectedId ||
                 (AppState.getPatients()[0] && AppState.getPatients()[0].id);
    // Animate this guardian's unread messages as they appear.
    entriesFor(selectedId).forEach(function (entry) {
      if (!seen[entry.id]) animate[entry.id] = true;
    });
    isOpen = true;
    drawer.hidden = false;
    document.body.classList.add("has-drawer");
    renderDrawer();
    drawer.querySelector(".drawer__close").focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    drawer.hidden = true;
    document.body.classList.remove("has-drawer");
    renderFab();
    fab.focus();
  }

  // ---------- setup ----------

  function build() {
    fab = document.createElement("button");
    fab.type = "button";
    fab.className = "phone-fab";
    fab.hidden = true;
    fab.innerHTML = '<span aria-hidden="true">📱</span> Guardian phone <span class="fab__badge" hidden>0</span>';
    fab.addEventListener("click", function () { open(); });

    drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.hidden = true;
    drawer.setAttribute("aria-label", "Guardian phone preview");
    drawer.innerHTML =
      '<div class="drawer__header">' +
        "<div>" +
          '<h2 class="drawer__title">Guardian\'s phone</h2>' +
          '<p class="drawer__subtitle">Simulated reminders as received · <span data-slot="number"></span></p>' +
        "</div>" +
        '<button type="button" class="modal__close drawer__close" aria-label="Close guardian phone">×</button>' +
      "</div>" +
      '<div class="drawer__controls">' +
        '<label class="visually-hidden" for="guardian-select">Guardian</label>' +
        '<select id="guardian-select" class="select" data-slot="select"></select>' +
        '<div class="drawer__row">' +
          '<span data-slot="toggle"></span>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-slot="sound" aria-pressed="true"></button>' +
        "</div>" +
      "</div>" +
      '<div class="drawer__phone" data-slot="phone"></div>' +
      '<p class="drawer__note">Nothing is actually sent – reminders go out at ' + DAILY_JOB_TIME + " each (simulated) day.</p>";

    drawer.addEventListener("click", function (event) {
      if (event.target.closest(".drawer__close")) {
        close();
        return;
      }
      var channelBtn = event.target.closest("[data-channel]");
      if (channelBtn) {
        PhoneMock.setChannel(channelBtn.getAttribute("data-channel"));
        return;
      }
      if (event.target.closest('[data-slot="sound"]')) {
        Notifications.setSound(!Notifications.isSoundOn());
        renderDrawer();
      }
    });
    drawer.addEventListener("change", function (event) {
      if (event.target.matches('[data-slot="select"]')) {
        selectedId = event.target.value;
        entriesFor(selectedId).forEach(function (entry) {
          if (!seen[entry.id]) animate[entry.id] = true;
        });
        renderDrawer();
      }
    });
    drawer.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !Modal.isOpen()) close();
    });

    document.body.appendChild(fab);
    document.body.appendChild(drawer);
  }

  function start() {
    build();

    AppState.onReminders(function (entries) {
      entries.forEach(function (entry) { animate[entry.id] = true; });
      if (isOpen) {
        // Follow the newest message if the current guardian got nothing new.
        var forSelected = entries.some(function (entry) { return entry.patientId === selectedId; });
        if (!forSelected) selectedId = entries[entries.length - 1].patientId;
        renderDrawer();
      } else {
        renderFab();
      }
    });

    PhoneMock.onChannelChange(function () {
      if (isOpen) renderDrawer();
    });

    AppState.subscribe(function () {
      if (!AppState.isLoggedIn()) {
        if (isOpen) close();
        seen = {};
        animate = {};
        selectedId = null;
      }
      if (AppState.getReminderLog().length === 0) {
        // Demo reset: log ids restart, so forget what was seen.
        seen = {};
        animate = {};
      }
      if (isOpen) {
        renderDrawer();
      } else {
        renderFab();
      }
    });

    renderFab();
  }

  return { start: start, open: open, close: close };
})();
