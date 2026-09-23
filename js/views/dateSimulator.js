/**
 * Date simulator bar — moves the demo's "today" forward so staff can watch
 * statuses change and reminders fire as the schedule triggers them.
 * Shared by the dashboard and patient detail screens.
 */
var DateSimulator = (function () {
  var lastResult = null; // { days, count } from the most recent jump

  AppState.subscribe(function () {
    // A reset (offset back to 0) clears the last-jump message.
    if (AppState.getDayOffset() === 0) lastResult = null;
  });

  function describeOffset(offset) {
    if (offset === 0) return '<span class="sim-pill sim-pill--real">Real date</span>';
    return '<span class="sim-pill sim-pill--ahead">Simulated · ' + offset + (offset === 1 ? " day" : " days") + " ahead</span>";
  }

  function describeResult() {
    if (!lastResult) {
      return "Fast-forward to watch statuses change and reminders fire as doses come due.";
    }
    var span = lastResult.days === 1 ? "1 day" : lastResult.days + " days";
    if (lastResult.count === 0) {
      return "Moved " + span + " ahead – no reminders were triggered.";
    }
    return "Moved " + span + " ahead – <strong>" + lastResult.count +
           (lastResult.count === 1 ? " reminder" : " reminders") +
           '</strong> simulated. <a href="#/reminders">View Reminder Log</a>';
  }

  function html() {
    var today = AppState.getToday();
    return (
      '<div class="sim-bar" role="region" aria-label="Demo date simulator">' +
        '<div class="sim-bar__date">' +
          '<span class="sim-bar__label">Demo date</span>' +
          '<strong class="sim-bar__value">' + DateUtils.formatDate(today) + "</strong>" +
          describeOffset(AppState.getDayOffset()) +
        "</div>" +
        '<p class="sim-bar__note" aria-live="polite">' + describeResult() + "</p>" +
        '<div class="sim-bar__actions">' +
          '<button type="button" class="btn btn--secondary" data-sim="1">+1 day</button>' +
          '<button type="button" class="btn btn--secondary" data-sim="7">+1 week</button>' +
          '<button type="button" class="btn btn--ghost" data-sim="reset">Reset demo</button>' +
        "</div>" +
      "</div>"
    );
  }

  function confirmReset() {
    Modal.open({
      title: "Reset the demo?",
      body:
        "<p>This restores:</p>" +
        '<ul class="plain-list">' +
          "<li>the real date (" + DateUtils.formatDate(AppState.getRealToday()) + ")</li>" +
          "<li>the original sample patients – doses marked as given are undone</li>" +
          "<li>a fresh reminder log – today's daily reminder check runs again</li>" +
        "</ul>",
      footer:
        '<button type="button" class="btn btn--secondary" data-modal-close>Cancel</button>' +
        '<button type="button" class="btn btn--primary" data-confirm-reset>Reset demo</button>',
      onOpen: function (dialog) {
        dialog.querySelector("[data-confirm-reset]").addEventListener("click", function () {
          Modal.close();
          AppState.resetDemo();
          // Re-run the daily check for the real date, as happens after login.
          AppState.runReminderCheck();
        });
      }
    });
  }

  /** Attach button handlers inside `root` (call after inserting html()). */
  function bind(root) {
    root.querySelectorAll("[data-sim]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-sim");
        if (action === "reset") {
          confirmReset();
          return;
        }
        var days = Number(action);
        var entries = AppState.advanceDays(days);
        lastResult = { days: days, count: entries.length };
        // advanceDays already re-rendered with the old message; refresh the note.
        var note = document.querySelector(".sim-bar__note");
        if (note) note.innerHTML = describeResult();
      });
    });
  }

  return { html: html, bind: bind };
})();
