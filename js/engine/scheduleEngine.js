/**
 * Schedule engine — pure functions, no DOM access (portable to Dart/Flutter).
 *
 * Calculates every dose's due date from the patient's DOB using the
 * vaccine schedule table, and assigns each dose a status:
 *   DONE      dose recorded in patient.dosesGiven
 *   OVERDUE   today is after the due date and the dose is not given
 *   DUE_SOON  due today or within the next `dueSoonDays` days
 *   PENDING   due further in the future
 *
 * Depends on: DateUtils, VaccineSchedule.
 */
var ScheduleEngine = (function () {
  var STATUS = {
    DONE: "DONE",
    OVERDUE: "OVERDUE",
    DUE_SOON: "DUE_SOON",
    PENDING: "PENDING"
  };

  var STATUS_LABELS = {
    DONE: "Done",
    OVERDUE: "Overdue",
    DUE_SOON: "Due Soon",
    PENDING: "Pending"
  };

  // Lower number = more urgent. Used to sort patients on the dashboard.
  var STATUS_PRIORITY = {
    OVERDUE: 0,
    DUE_SOON: 1,
    PENDING: 2,
    DONE: 3
  };

  var DEFAULT_DUE_SOON_DAYS = 3;

  function resolveDueSoonDays(dueSoonDays) {
    if (typeof dueSoonDays === "number") return dueSoonDays;
    if (typeof CONFIG !== "undefined" && typeof CONFIG.DUE_SOON_DAYS === "number") {
      return CONFIG.DUE_SOON_DAYS;
    }
    return DEFAULT_DUE_SOON_DAYS;
  }

  /** Status of a single dose. `dateGiven` is a Date or null. */
  function getDoseStatus(dueDate, dateGiven, today, dueSoonDays) {
    if (dateGiven) return STATUS.DONE;
    var daysUntilDue = DateUtils.diffDays(today, dueDate);
    if (daysUntilDue < 0) return STATUS.OVERDUE;
    if (daysUntilDue <= resolveDueSoonDays(dueSoonDays)) return STATUS.DUE_SOON;
    return STATUS.PENDING;
  }

  function findGivenRecord(patient, vaccineCode, doseNumber) {
    var given = patient.dosesGiven || [];
    for (var i = 0; i < given.length; i++) {
      if (given[i].vaccine === vaccineCode && given[i].doseNumber === doseNumber) {
        return given[i];
      }
    }
    return null;
  }

  /**
   * Full dose schedule for a patient, sorted by due date
   * (ties keep the reference-table order of vaccines).
   *
   * Each entry:
   *   { vaccine, vaccineName, doseNumber, recommendedAge,
   *     dueDate, windowEnd, dateGiven, status, daysUntilDue }
   */
  function computeSchedule(patient, today, dueSoonDays) {
    var dob = DateUtils.parseDate(patient.dob);
    var doses = [];

    VaccineSchedule.getAll().forEach(function (vaccine, vaccineIndex) {
      if (patient.registeredVaccines.indexOf(vaccine.code) === -1) return;

      vaccine.doses.forEach(function (doseDef) {
        var dueDate = DateUtils.addMonths(dob, doseDef.minMonths);
        var windowEnd = doseDef.maxMonths === undefined
          ? null
          : DateUtils.addMonths(dob, doseDef.maxMonths);
        var record = findGivenRecord(patient, vaccine.code, doseDef.doseNumber);
        var dateGiven = record ? DateUtils.parseDate(record.dateGiven) : null;

        doses.push({
          vaccine: vaccine.code,
          vaccineName: vaccine.name,
          doseNumber: doseDef.doseNumber,
          recommendedAge: VaccineSchedule.formatDoseAge(doseDef),
          dueDate: dueDate,
          windowEnd: windowEnd,
          dateGiven: dateGiven,
          status: getDoseStatus(dueDate, dateGiven, today, dueSoonDays),
          daysUntilDue: DateUtils.diffDays(today, dueDate),
          _order: vaccineIndex
        });
      });
    });

    doses.sort(function (a, b) {
      return (a.dueDate - b.dueDate) || (a._order - b._order) || (a.doseNumber - b.doseNumber);
    });
    doses.forEach(function (d) { delete d._order; });
    return doses;
  }

  /** Earliest dose that is not yet given, or null if every dose is done. */
  function getNextDue(schedule) {
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i].status !== STATUS.DONE) return schedule[i];
    }
    return null;
  }

  /**
   * A dose can be marked as given only if:
   *  - it is due now (Due Soon or Overdue) — not months/years ahead, and
   *  - it is the earliest outstanding dose of its vaccine
   *    (no skipping ahead, e.g. DTaP 3 before DTaP 2).
   */
  function canMarkGiven(schedule, dose) {
    if (dose.status !== STATUS.OVERDUE && dose.status !== STATUS.DUE_SOON) return false;
    for (var i = 0; i < schedule.length; i++) {
      var d = schedule[i];
      if (d.vaccine === dose.vaccine && d.status !== STATUS.DONE) {
        return d.doseNumber === dose.doseNumber;
      }
    }
    return false;
  }

  /** Whether a reminder can be simulated for this dose. */
  function canRemind(dose) {
    return dose.status === STATUS.OVERDUE || dose.status === STATUS.DUE_SOON;
  }

  /**
   * Everything the dashboard needs for one patient.
   *   { patient, schedule, nextDue, overdueCount, dueSoonCount, allDone }
   */
  function summarizePatient(patient, today, dueSoonDays) {
    var schedule = computeSchedule(patient, today, dueSoonDays);
    var overdueCount = 0;
    var dueSoonCount = 0;
    schedule.forEach(function (d) {
      if (d.status === STATUS.OVERDUE) overdueCount++;
      if (d.status === STATUS.DUE_SOON) dueSoonCount++;
    });
    var nextDue = getNextDue(schedule);
    return {
      patient: patient,
      schedule: schedule,
      nextDue: nextDue,
      overdueCount: overdueCount,
      dueSoonCount: dueSoonCount,
      allDone: nextDue === null
    };
  }

  /** Sort comparator for summaries: most urgent first, then soonest due date, then name. */
  function compareByUrgency(a, b) {
    var pa = a.nextDue ? STATUS_PRIORITY[a.nextDue.status] : STATUS_PRIORITY.DONE;
    var pb = b.nextDue ? STATUS_PRIORITY[b.nextDue.status] : STATUS_PRIORITY.DONE;
    if (pa !== pb) return pa - pb;
    if (a.nextDue && b.nextDue && a.nextDue.dueDate - b.nextDue.dueDate !== 0) {
      return a.nextDue.dueDate - b.nextDue.dueDate;
    }
    return a.patient.name.localeCompare(b.patient.name);
  }

  return {
    STATUS: STATUS,
    STATUS_LABELS: STATUS_LABELS,
    STATUS_PRIORITY: STATUS_PRIORITY,
    getDoseStatus: getDoseStatus,
    computeSchedule: computeSchedule,
    getNextDue: getNextDue,
    canMarkGiven: canMarkGiven,
    canRemind: canRemind,
    summarizePatient: summarizePatient,
    compareByUrgency: compareByUrgency
  };
})();
