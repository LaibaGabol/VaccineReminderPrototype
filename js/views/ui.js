/**
 * Small shared UI helpers used by the views.
 */
var UI = (function () {
  var ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  /** Escape text for safe insertion into HTML. */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) { return ESCAPES[ch]; });
  }

  var BADGE_CLASSES = {
    OVERDUE: "badge--overdue",
    DUE_SOON: "badge--duesoon",
    PENDING: "badge--pending",
    DONE: "badge--done"
  };

  /** Status badge HTML (text + color, never color alone). */
  function statusBadge(status) {
    return '<span class="badge ' + BADGE_CLASSES[status] + '">' +
           escapeHtml(ScheduleEngine.STATUS_LABELS[status]) + "</span>";
  }

  var STAGE_BADGE_CLASSES = {
    ADVANCE: "badge--duesoon",
    DUE_TODAY: "badge--duesoon",
    OVERDUE: "badge--overdue",
    OVERDUE_FINAL: "badge--overdue badge--solid"
  };

  /** Reminder stage badge HTML ("Due soon", "Due today", "Overdue", …). */
  function stageBadge(stage) {
    return '<span class="badge ' + STAGE_BADGE_CLASSES[stage] + '">' +
           escapeHtml(ReminderEngine.STAGE_LABELS[stage]) + "</span>";
  }

  return {
    escapeHtml: escapeHtml,
    statusBadge: statusBadge,
    stageBadge: stageBadge
  };
})();
