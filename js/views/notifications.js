/**
 * Toast notifications for simulated reminders, with an optional chime.
 * Listens to AppState.onReminders; clicking a reminder toast opens the
 * guardian phone panel on that guardian's messages.
 */
var Notifications = (function () {
  var MAX_REMINDER_TOASTS = 3;   // per batch; the rest are summarised
  var MAX_VISIBLE = 4;           // oldest toasts leave so the stack stays short
  var STAGGER_MS = 450;
  var TOAST_LIFETIME_MS = 7000;
  var SOUND_KEY = "vaxicare.sound";

  var STAGE_TEXT = {
    ADVANCE: "due soon",
    DUE_TODAY: "due today",
    OVERDUE: "overdue",
    OVERDUE_FINAL: "overdue – final notice"
  };

  var STAGE_CLASS = {
    ADVANCE: "toast--duesoon",
    DUE_TODAY: "toast--duesoon",
    OVERDUE: "toast--overdue",
    OVERDUE_FINAL: "toast--overdue"
  };

  var root = null;
  var audioCtx = null;
  var soundOn = (function () {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) { return true; }
  })();
  var pendingTimers = [];

  // ---------- sound ----------

  function isSoundOn() {
    return soundOn;
  }

  function setSound(on) {
    soundOn = !!on;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch (e) { /* not remembered */ }
  }

  /** Short two-note chime generated with Web Audio (no sound files needed). */
  function chime() {
    if (!soundOn) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      var now = audioCtx.currentTime;
      [880, 1318.5].forEach(function (freq, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        var start = now + i * 0.12;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (e) {
      // Audio unavailable — silent is fine.
    }
  }

  // ---------- toasts ----------

  function ensureRoot() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "toast-root";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
    return root;
  }

  function dismiss(toast) {
    if (!toast.isConnected || toast.classList.contains("is-leaving")) return;
    toast.classList.add("is-leaving");
    setTimeout(function () { toast.remove(); }, 250);
  }

  /**
   * Show a toast.
   * options: { title, text (HTML), className, icon, onClick }
   */
  function show(options) {
    var toast = document.createElement(options.onClick ? "button" : "div");
    if (options.onClick) toast.type = "button";
    toast.className = "toast " + (options.className || "");
    toast.innerHTML =
      '<span class="toast__icon" aria-hidden="true">' + (options.icon || "🔔") + "</span>" +
      '<span class="toast__content">' +
        '<span class="toast__title">' + UI.escapeHtml(options.title) + "</span>" +
        '<span class="toast__text">' + options.text + "</span>" +
      "</span>" +
      '<span class="toast__close" aria-hidden="true">×</span>';

    toast.addEventListener("click", function (event) {
      if (!event.target.closest(".toast__close") && options.onClick) options.onClick();
      dismiss(toast);
    });

    var container = ensureRoot();
    container.appendChild(toast);
    var active = container.querySelectorAll(".toast:not(.is-leaving)");
    for (var i = 0; i < active.length - MAX_VISIBLE; i++) dismiss(active[i]);
    setTimeout(function () { dismiss(toast); }, TOAST_LIFETIME_MS);
    return toast;
  }

  function doseList(entry) {
    return entry.doses.map(function (d) { return d.vaccine + " Dose " + d.doseNumber; }).join(", ");
  }

  function reminderToast(entry) {
    var e = UI.escapeHtml;
    show({
      title: "Reminder sent · " + DateUtils.formatDate(DateUtils.parseDate(entry.date)),
      text:
        "To <strong>" + e(entry.guardianName) + "</strong> (" + e(entry.phone) + ")<br>" +
        e(entry.patientName) + " – " + e(doseList(entry)) + " " + e(STAGE_TEXT[entry.stage]) +
        '<span class="toast__hint">Simulated · tap to view on phone</span>',
      className: STAGE_CLASS[entry.stage],
      onClick: function () {
        if (window.GuardianPhone) GuardianPhone.open(entry.patientId);
      }
    });
    chime();
  }

  function clearPending() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
  }

  function later(fn, ms) {
    pendingTimers.push(setTimeout(fn, ms));
  }

  function onBatch(entries, source) {
    clearPending();
    var delay = 0;

    if (source === "daily-check") {
      show({
        title: "Daily reminder check · " + DateUtils.formatDate(AppState.getToday()),
        text: "<strong>" + entries.length + (entries.length === 1 ? " reminder" : " reminders") +
              "</strong> queued for guardians (simulated, nothing sent).",
        className: "toast--info",
        onClick: function () { Router.navigate("/reminders"); }
      });
      delay = STAGGER_MS;
    }

    // Newest reminders are the most relevant after a fast-forward.
    var shown = entries.slice(-MAX_REMINDER_TOASTS);
    shown.forEach(function (entry, i) {
      later(function () {
        if (AppState.isLoggedIn()) reminderToast(entry);
      }, delay + i * STAGGER_MS);
    });

    var hidden = entries.length - shown.length;
    if (hidden > 0) {
      later(function () {
        if (!AppState.isLoggedIn()) return;
        show({
          title: "+" + hidden + " more " + (hidden === 1 ? "reminder" : "reminders"),
          text: "Sent on earlier simulated days. Open the Reminder Log to see all.",
          className: "toast--info",
          onClick: function () { Router.navigate("/reminders"); }
        });
      }, delay + shown.length * STAGGER_MS);
    }
  }

  function clearAll() {
    clearPending();
    if (root) root.innerHTML = "";
  }

  function start() {
    AppState.onReminders(onBatch);
    AppState.subscribe(function () {
      if (!AppState.isLoggedIn()) clearAll();
    });
  }

  return {
    start: start,
    show: show,
    chime: chime,
    isSoundOn: isSoundOn,
    setSound: setSound
  };
})();
