/**
 * Reminder engine — pure functions, no DOM access (portable to Dart/Flutter).
 *
 * Decides which reminders a daily reminder job would send on a given date,
 * and builds the message text. Nothing is actually sent in this prototype.
 *
 * Reminder stages for a dose that has not been given
 * (daysUntilDue = due date − date of the check):
 *   ADVANCE        1–3 days before the due date
 *   DUE_TODAY      on the due date
 *   OVERDUE        3–6 days past the due date
 *   OVERDUE_FINAL  7+ days past the due date (last reminder; staff should call)
 *
 * Each stage is sent at most once per dose. Stages only move forward, so if
 * a later stage has already been sent the earlier ones are skipped. When the
 * job has not run for a while (e.g. on first launch) it sends only the most
 * recent applicable stage — a "catch-up", not a flood of old reminders.
 * Once a dose is given, no further reminders are sent for it.
 *
 * Depends on: DateUtils, ScheduleEngine.
 */
var ReminderEngine = (function () {
  var STAGE = {
    ADVANCE: "ADVANCE",
    DUE_TODAY: "DUE_TODAY",
    OVERDUE: "OVERDUE",
    OVERDUE_FINAL: "OVERDUE_FINAL"
  };

  var STAGE_ORDER = {
    ADVANCE: 1,
    DUE_TODAY: 2,
    OVERDUE: 3,
    OVERDUE_FINAL: 4
  };

  var STAGE_LABELS = {
    ADVANCE: "Due soon",
    DUE_TODAY: "Due today",
    OVERDUE: "Overdue",
    OVERDUE_FINAL: "Overdue – final notice"
  };

  var ADVANCE_DAYS = 3;
  var OVERDUE_DAYS = 3;
  var FINAL_OVERDUE_DAYS = 7;

  /** Stage that applies to a dose by the trigger rules, or null. */
  function getStage(dose) {
    if (dose.status === ScheduleEngine.STATUS.DONE) return null;
    var d = dose.daysUntilDue;
    if (d >= 1 && d <= ADVANCE_DAYS) return STAGE.ADVANCE;
    if (d === 0) return STAGE.DUE_TODAY;
    if (d <= -FINAL_OVERDUE_DAYS) return STAGE.OVERDUE_FINAL;
    if (d <= -OVERDUE_DAYS) return STAGE.OVERDUE;
    return null;
  }

  /**
   * Stage used when staff manually preview a reminder for a Due Soon or
   * Overdue dose (no timing rules, just the dose's current situation).
   */
  function getPreviewStage(dose) {
    if (dose.daysUntilDue > 0) return STAGE.ADVANCE;
    if (dose.daysUntilDue === 0) return STAGE.DUE_TODAY;
    return STAGE.OVERDUE;
  }

  /** Key identifying one dose of one patient, for the sent-stages map. */
  function doseKey(patientId, vaccine, doseNumber) {
    return patientId + "|" + vaccine + "|" + doseNumber;
  }

  /**
   * Reminders the daily job would send on `date`.
   *
   * @param patients    patient records
   * @param date        date of the reminder check
   * @param sentStages  map doseKey -> highest stage already sent (not modified)
   * @param options     { hospitalName, hospitalPhone, dueSoonDays } (optional)
   * @returns array of reminders, one per patient that needs one:
   *   { patient, items: [{ dose, stage }], stage, message }
   *   `stage` is the most urgent stage among the items.
   */
  function getRemindersForDate(patients, date, sentStages, options) {
    var reminders = [];

    patients.forEach(function (patient) {
      var schedule = ScheduleEngine.computeSchedule(patient, date, options && options.dueSoonDays);
      var items = [];

      schedule.forEach(function (dose) {
        var stage = getStage(dose);
        if (!stage) return;
        var alreadySent = sentStages[doseKey(patient.id, dose.vaccine, dose.doseNumber)];
        if (alreadySent && STAGE_ORDER[alreadySent] >= STAGE_ORDER[stage]) return;
        items.push({ dose: dose, stage: stage });
      });

      if (items.length === 0) return;

      reminders.push({
        patient: patient,
        items: items,
        stage: mostUrgentStage(items),
        message: buildMessage(patient, items, date, options)
      });
    });

    return reminders;
  }

  /** New sent-stages map with this reminder's stages recorded. */
  function recordSent(sentStages, reminder) {
    var next = Object.assign({}, sentStages);
    reminder.items.forEach(function (item) {
      next[doseKey(reminder.patient.id, item.dose.vaccine, item.dose.doseNumber)] = item.stage;
    });
    return next;
  }

  function mostUrgentStage(items) {
    var best = items[0].stage;
    items.forEach(function (item) {
      if (STAGE_ORDER[item.stage] > STAGE_ORDER[best]) best = item.stage;
    });
    return best;
  }

  function resolveHospital(options) {
    var hasConfig = typeof CONFIG !== "undefined";
    return {
      name: (options && options.hospitalName) || (hasConfig ? CONFIG.HOSPITAL_NAME : "the hospital"),
      phone: (options && options.hospitalPhone) || (hasConfig ? CONFIG.HOSPITAL_PHONE : "")
    };
  }

  function doseLabel(dose) {
    return dose.vaccine + " Dose " + dose.doseNumber;
  }

  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }

  /** One-line description of a single dose's timing, for list messages. */
  function describeItem(item) {
    var dose = item.dose;
    var due = DateUtils.formatDate(dose.dueDate);
    if (item.stage === STAGE.ADVANCE) return doseLabel(dose) + " – due " + due;
    if (item.stage === STAGE.DUE_TODAY) return doseLabel(dose) + " – due today";
    return doseLabel(dose) + " – overdue since " + due + " (" + plural(-dose.daysUntilDue, "day") + ")";
  }

  /**
   * Message text as the guardian would receive it.
   * `items` is [{ dose, stage }]; one item gives a single-dose message,
   * several give a combined message listing each dose.
   */
  function buildMessage(patient, items, date, options) {
    var hospital = resolveHospital(options);
    var greeting = "Dear " + (patient.guardianName || "Parent/Guardian") + ",";
    var closing = hospital.phone
      ? "For queries call " + hospital.phone + ". – " + hospital.name
      : "– " + hospital.name;
    var stage = mostUrgentStage(items);
    var urgent = stage === STAGE.OVERDUE || stage === STAGE.OVERDUE_FINAL;
    var body;

    if (items.length === 1) {
      var dose = items[0].dose;
      var due = DateUtils.formatDate(dose.dueDate);
      if (stage === STAGE.ADVANCE) {
        body = patient.name + "'s " + doseLabel(dose) + " vaccine is due on " + due +
               " (" + DateUtils.formatRelative(dose.daysUntilDue) + ").";
      } else if (stage === STAGE.DUE_TODAY) {
        body = patient.name + "'s " + doseLabel(dose) + " vaccine is due today (" + due + ").";
      } else {
        body = patient.name + "'s " + doseLabel(dose) + " vaccine was due on " + due +
               " and is now " + plural(-dose.daysUntilDue, "day") + " overdue.";
      }
    } else {
      body = patient.name + " has vaccines " + (urgent ? "pending" : "coming up") + ":\n" +
             items.map(function (item) { return "• " + describeItem(item); }).join("\n");
    }

    var action = urgent
      ? "Please visit the vaccination center as soon as possible."
      : "Please visit the vaccination center on time.";
    if (stage === STAGE.OVERDUE_FINAL) {
      action += " Our staff will contact you to arrange the visit.";
    }

    return "Reminder from " + hospital.name + "\n" +
           greeting + "\n" +
           body + "\n" +
           action + "\n" +
           closing;
  }

  /** Message for a manual "Simulate Reminder" on a single dose. */
  function buildPreviewMessage(patient, dose, date, options) {
    return buildMessage(patient, [{ dose: dose, stage: getPreviewStage(dose) }], date, options);
  }

  return {
    STAGE: STAGE,
    STAGE_LABELS: STAGE_LABELS,
    getStage: getStage,
    getPreviewStage: getPreviewStage,
    doseKey: doseKey,
    getRemindersForDate: getRemindersForDate,
    recordSent: recordSent,
    buildMessage: buildMessage,
    buildPreviewMessage: buildPreviewMessage
  };
})();
