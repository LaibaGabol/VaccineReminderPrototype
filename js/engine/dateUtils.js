/**
 * Date utilities — pure functions, no DOM access (portable to Dart/Flutter).
 *
 * All dates are "date-only" values: a Date set to midnight UTC.
 * Working in UTC avoids timezone and daylight-saving shifts, so
 * "2026-06-15" is always the same calendar day wherever the app runs.
 */
var DateUtils = (function () {
  var MS_PER_DAY = 24 * 60 * 60 * 1000;
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function daysInMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  }

  /** "2026-06-15" -> Date (midnight UTC). Throws on malformed input. */
  function parseDate(iso) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) {
      throw new Error("Invalid date string: " + iso);
    }
    var year = Number(match[1]);
    var monthIndex = Number(match[2]) - 1;
    var day = Number(match[3]);
    if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > daysInMonth(year, monthIndex)) {
      throw new Error("Invalid date string: " + iso);
    }
    return new Date(Date.UTC(year, monthIndex, day));
  }

  /** Date -> "2026-06-15". */
  function toISODate(date) {
    return date.getUTCFullYear() + "-" + pad2(date.getUTCMonth() + 1) + "-" + pad2(date.getUTCDate());
  }

  /** Today's local calendar date as a date-only value. */
  function today() {
    var now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * MS_PER_DAY);
  }

  /**
   * Add calendar months, clamping to the last day of the target month.
   * e.g. 2026-01-31 + 1 month -> 2026-02-28.
   */
  function addMonths(date, months) {
    var totalMonths = date.getUTCMonth() + months;
    var year = date.getUTCFullYear() + Math.floor(totalMonths / 12);
    var monthIndex = ((totalMonths % 12) + 12) % 12;
    var day = Math.min(date.getUTCDate(), daysInMonth(year, monthIndex));
    return new Date(Date.UTC(year, monthIndex, day));
  }

  /** Whole days from `from` to `to` (positive if `to` is later). */
  function diffDays(from, to) {
    return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  }

  /** Date -> "15 Jun 2026". */
  function formatDate(date) {
    return date.getUTCDate() + " " + MONTH_NAMES[date.getUTCMonth()] + " " + date.getUTCFullYear();
  }

  /**
   * Relative phrase for a day offset from today:
   * 0 -> "today", 1 -> "tomorrow", 5 -> "in 5 days",
   * -1 -> "1 day ago", -5 -> "5 days ago".
   */
  function formatRelative(days) {
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    if (days > 1) return "in " + days + " days";
    var ago = -days;
    return ago + (ago === 1 ? " day ago" : " days ago");
  }

  /** Completed calendar months between two dates (0 if `to` is before `from`). */
  function monthsBetween(from, to) {
    var months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
                 (to.getUTCMonth() - from.getUTCMonth());
    if (addMonths(from, months).getTime() > to.getTime()) {
      months -= 1;
    }
    return Math.max(0, months);
  }

  /** Age label from DOB: "12 days", "3 months", "1 yr 2 mo", "4 yrs". */
  function formatAge(dob, onDate) {
    var months = monthsBetween(dob, onDate);
    if (months === 0) {
      var days = Math.max(0, diffDays(dob, onDate));
      return days + (days === 1 ? " day" : " days");
    }
    if (months < 12) {
      return months + (months === 1 ? " month" : " months");
    }
    var years = Math.floor(months / 12);
    var rem = months % 12;
    var label = years + (years === 1 ? " yr" : " yrs");
    return rem ? label + " " + rem + " mo" : label;
  }

  return {
    parseDate: parseDate,
    toISODate: toISODate,
    today: today,
    addDays: addDays,
    addMonths: addMonths,
    diffDays: diffDays,
    formatDate: formatDate,
    formatRelative: formatRelative,
    monthsBetween: monthsBetween,
    formatAge: formatAge
  };
})();
