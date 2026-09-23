/**
 * Patient detail — patient info, a vaccine-by-dose overview grid, and the
 * full dose timeline (past + upcoming) with a "today" marker.
 */
(function () {
  var S = ScheduleEngine.STATUS;
  var e = UI.escapeHtml;

  var DOT_CLASSES = {
    OVERDUE: "tl-item--overdue",
    DUE_SOON: "tl-item--duesoon",
    PENDING: "tl-item--pending",
    DONE: "tl-item--done"
  };

  function fmt(date) {
    return DateUtils.formatDate(date);
  }

  // ---------- info card ----------

  function infoTemplate(summary) {
    var p = summary.patient;
    var today = AppState.getToday();
    var dob = DateUtils.parseDate(p.dob);
    var given = summary.schedule.filter(function (d) { return d.status === S.DONE; }).length;
    var total = summary.schedule.length;
    var pct = total ? Math.round((given / total) * 100) : 0;

    var vaccines = p.registeredVaccines.map(function (code) {
      var v = VaccineSchedule.getVaccine(code);
      return '<span class="tag" title="' + e(v ? v.name : code) + '">' + e(code) + "</span>";
    }).join("");

    var next = summary.allDone
      ? '<p class="info-next__value">All registered doses given</p>'
      : '<p class="info-next__value">' + e(summary.nextDue.vaccine) + " – Dose " + summary.nextDue.doseNumber +
        " " + UI.statusBadge(summary.nextDue.status) + "</p>" +
        '<p class="info-next__sub">' + fmt(summary.nextDue.dueDate) + " · " +
        DateUtils.formatRelative(summary.nextDue.daysUntilDue) + "</p>";

    return (
      '<aside class="card info-card">' +
        '<div class="info-card__head">' +
          '<span class="avatar" aria-hidden="true">' + e(initials(p.name)) + "</span>" +
          "<div>" +
            '<h1 class="info-card__name">' + e(p.name) + "</h1>" +
            '<p class="info-card__id">' + e(p.id) + "</p>" +
          "</div>" +
        "</div>" +

        '<div class="info-next">' +
          '<p class="info-next__label">Next due</p>' + next +
        "</div>" +

        '<dl class="info-list">' +
          "<dt>Age</dt><dd>" + DateUtils.formatAge(dob, today) + "</dd>" +
          "<dt>Date of birth</dt><dd>" + fmt(dob) + "</dd>" +
          "<dt>Registered</dt><dd>" + fmt(DateUtils.parseDate(p.registrationDate || p.dob)) + "</dd>" +
          "<dt>Guardian</dt><dd>" + e(p.guardianName) + "</dd>" +
          "<dt>Phone</dt><dd>" + e(p.phone) + "</dd>" +
          "<dt>Vaccines</dt><dd class=\"tag-list\">" + vaccines + "</dd>" +
        "</dl>" +

        '<div class="progress-block">' +
          '<div class="progress-block__row"><span>Doses given</span><strong>' + given + " / " + total + "</strong></div>" +
          '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total +
            '" aria-valuenow="' + given + '" aria-label="Doses given"><span style="width:' + pct + '%"></span></div>' +
          (summary.overdueCount
            ? '<p class="progress-block__alert">' + summary.overdueCount + (summary.overdueCount === 1 ? " dose" : " doses") + " overdue</p>"
            : "") +
        "</div>" +
      "</aside>"
    );
  }

  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase();
  }

  // ---------- overview grid (vaccine × dose) ----------

  function overviewTemplate(summary) {
    var codes = summary.patient.registeredVaccines;
    var maxDoses = 0;
    var byVaccine = {};
    summary.schedule.forEach(function (d) {
      (byVaccine[d.vaccine] = byVaccine[d.vaccine] || []).push(d);
    });
    VaccineSchedule.getAll().forEach(function (v) {
      if (codes.indexOf(v.code) !== -1) maxDoses = Math.max(maxDoses, v.doses.length);
    });

    var head = "<th>Vaccine</th>";
    for (var i = 1; i <= maxDoses; i++) head += "<th>Dose " + i + "</th>";

    var rows = VaccineSchedule.getAll().filter(function (v) {
      return codes.indexOf(v.code) !== -1;
    }).map(function (v) {
      var doses = (byVaccine[v.code] || []).slice().sort(function (a, b) { return a.doseNumber - b.doseNumber; });
      var cells = "";
      for (var n = 1; n <= maxDoses; n++) {
        var d = doses[n - 1];
        if (!d) {
          cells += '<td class="ov-cell ov-cell--none" aria-label="No dose">–</td>';
          continue;
        }
        var label = ScheduleEngine.STATUS_LABELS[d.status];
        cells += '<td class="ov-cell ov-cell--' + d.status.toLowerCase().replace("_", "") + '" title="' +
                 e(v.code + " Dose " + n + ": " + label + " · due " + fmt(d.dueDate)) + '">' +
                 '<span class="ov-cell__dose">Dose ' + n + "</span>" +
                 '<span class="ov-cell__age">' + e(d.recommendedAge) + "</span>" +
                 '<span class="ov-cell__status">' + label + "</span></td>";
      }
      return '<tr><th scope="row"><span class="cell-main">' + e(v.code) + '</span><span class="cell-sub">' + e(v.name) + "</span></th>" + cells + "</tr>";
    }).join("");

    return (
      '<section class="card section-card">' +
        '<h2 class="section-title">Vaccine overview</h2>' +
        '<div class="ov-wrap"><table class="ov-table"><thead><tr>' + head + "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      "</section>"
    );
  }

  // ---------- timeline ----------

  function timelineItem(summary, dose) {
    var p = summary.patient;
    var windowText = dose.windowEnd
      ? " · window until " + fmt(dose.windowEnd)
      : "";

    var when;
    if (dose.status === S.DONE) {
      when = "Given " + fmt(dose.dateGiven) +
             '<span class="tl-item__muted"> · scheduled ' + fmt(dose.dueDate) + "</span>";
    } else if (dose.status === S.OVERDUE) {
      when = "Due " + fmt(dose.dueDate) + ' <span class="tl-item__alert">· ' + (-dose.daysUntilDue) +
             (dose.daysUntilDue === -1 ? " day" : " days") + " overdue</span>";
    } else {
      when = "Due " + fmt(dose.dueDate) + '<span class="tl-item__muted"> · ' + DateUtils.formatRelative(dose.daysUntilDue) + "</span>";
    }

    var canRemind = window.ReminderModal && ScheduleEngine.canRemind(dose);
    var canMark = ScheduleEngine.canMarkGiven(summary.schedule, dose);
    var actions = "";
    if (canRemind) {
      actions += '<button type="button" class="btn btn--secondary" data-remind="' + e(dose.vaccine) + "|" + dose.doseNumber + '">Simulate Reminder</button>';
    }
    if (canMark) {
      actions += '<button type="button" class="btn btn--primary" data-mark="' + e(dose.vaccine) + "|" + dose.doseNumber + '">Mark as Given</button>';
    }

    return (
      '<li class="tl-item ' + DOT_CLASSES[dose.status] + '" data-dose="' + e(p.id + "|" + dose.vaccine + "|" + dose.doseNumber) + '">' +
        '<span class="tl-item__dot" aria-hidden="true"></span>' +
        '<div class="tl-item__body">' +
          '<div class="tl-item__top">' +
            '<span class="tl-item__title">' + e(dose.vaccine) + " – Dose " + dose.doseNumber + "</span>" +
            UI.statusBadge(dose.status) +
          "</div>" +
          '<p class="tl-item__meta">' + e(dose.vaccineName) + " · recommended at " + e(dose.recommendedAge) + e(windowText) + "</p>" +
          '<p class="tl-item__when">' + when + "</p>" +
          (actions ? '<div class="tl-item__actions">' + actions + "</div>" : "") +
        "</div>" +
      "</li>"
    );
  }

  function todayMarker() {
    return (
      '<li class="tl-today" aria-label="Today">' +
        '<span class="tl-today__label">Today · ' + fmt(AppState.getToday()) + "</span>" +
      "</li>"
    );
  }

  function timelineTemplate(summary) {
    var items = "";
    var markerPlaced = false;
    summary.schedule.forEach(function (dose) {
      if (!markerPlaced && dose.daysUntilDue >= 0) {
        items += todayMarker();
        markerPlaced = true;
      }
      items += timelineItem(summary, dose);
    });
    if (!markerPlaced) items += todayMarker();

    return (
      '<section class="card section-card">' +
        '<div class="section-head">' +
          '<h2 class="section-title">Dose timeline</h2>' +
          '<div class="legend" aria-label="Status legend">' +
            UI.statusBadge(S.OVERDUE) + UI.statusBadge(S.DUE_SOON) + UI.statusBadge(S.PENDING) + UI.statusBadge(S.DONE) +
          "</div>" +
        "</div>" +
        '<ol class="timeline">' + items + "</ol>" +
      "</section>"
    );
  }

  // ---------- page ----------

  function notFoundTemplate(id) {
    return (
      '<a class="back-link" href="#/dashboard">← Back to dashboard</a>' +
      '<div class="card empty"><p>No patient found with ID <strong>' + e(id) + "</strong>.</p></div>"
    );
  }

  function pageTemplate(summary) {
    return (
      '<a class="back-link" href="#/dashboard">← Back to dashboard</a>' +
      '<div data-slot="simulator"></div>' +
      '<div class="detail-layout">' +
        infoTemplate(summary) +
        '<div class="detail-main">' +
          overviewTemplate(summary) +
          timelineTemplate(summary) +
        "</div>" +
      "</div>"
    );
  }

  function findDose(summary, key) {
    var parts = key.split("|");
    return summary.schedule.filter(function (d) {
      return d.vaccine === parts[0] && d.doseNumber === Number(parts[1]);
    })[0];
  }

  /** Confirm, then record the dose as given on the (demo) date. */
  function confirmMarkGiven(patient, dose) {
    var today = AppState.getToday();
    var label = dose.vaccine + " – Dose " + dose.doseNumber;
    var late = dose.daysUntilDue < 0
      ? '<p class="text-sm text-muted">This dose is being given ' + (-dose.daysUntilDue) +
        (dose.daysUntilDue === -1 ? " day" : " days") + " after its due date (" + fmt(dose.dueDate) + ").</p>"
      : "";

    Modal.open({
      title: "Mark dose as given",
      body:
        "<p>Record <strong>" + e(label) + "</strong> (" + e(dose.vaccineName) + ") for <strong>" +
        e(patient.name) + "</strong> as given on <strong>" + fmt(today) + "</strong>?</p>" +
        late +
        '<p class="sim-notice">Reminders for this dose will stop, and the next dose becomes due on schedule.</p>',
      footer:
        '<button type="button" class="btn btn--secondary" data-modal-close>Cancel</button>' +
        '<button type="button" class="btn btn--primary" data-confirm>Mark as given</button>',
      onOpen: function (dialog) {
        dialog.querySelector("[data-confirm]").addEventListener("click", function () {
          var result = AppState.markDoseGiven(patient.id, dose.vaccine, dose.doseNumber);
          Modal.close();
          if (!result.ok) {
            Notifications.show({ title: "Not recorded", text: e(result.error), className: "toast--overdue", icon: "⚠️" });
            return;
          }
          var next = AppState.getSummary(patient.id).nextDue;
          Notifications.show({
            title: "Dose recorded · " + fmt(today),
            text: "<strong>" + e(label) + "</strong> given to " + e(patient.name) + ". Reminders for this dose stopped." +
                  (next
                    ? "<br>Next due: " + e(next.vaccine) + " – Dose " + next.doseNumber + " on " + fmt(next.dueDate)
                    : "<br>All registered doses are now complete."),
            className: "toast--success",
            icon: "✅"
          });
        });
      }
    });
  }

  /** Delegated listeners on the persistent section element — attached once. */
  function bindOnce(container) {
    if (container.dataset.bound === "true") return;
    container.dataset.bound = "true";

    container.addEventListener("click", function (event) {
      var id = container.dataset.patientId;
      var remindBtn = event.target.closest("[data-remind]");
      if (remindBtn) {
        var summary = AppState.getSummary(id);
        ReminderModal.open(summary.patient, findDose(summary, remindBtn.getAttribute("data-remind")));
        return;
      }
      var markBtn = event.target.closest("[data-mark]");
      if (markBtn) {
        var current = AppState.getSummary(id);
        confirmMarkGiven(current.patient, findDose(current, markBtn.getAttribute("data-mark")));
      }
    });
  }

  Router.register("patient", {
    render: function (container, params) {
      bindOnce(container);
      container.dataset.patientId = params.id;

      var summary = AppState.getSummary(params.id);
      if (!summary) {
        container.innerHTML = notFoundTemplate(params.id);
        return;
      }
      container.innerHTML = pageTemplate(summary);
      var sim = container.querySelector('[data-slot="simulator"]');
      sim.innerHTML = DateSimulator.html();
      DateSimulator.bind(sim);
    }
  });
})();
