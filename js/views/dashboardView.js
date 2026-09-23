/**
 * Patient dashboard — every patient with their next due vaccine,
 * due date and color-coded status, most urgent first.
 */
(function () {
  var S = ScheduleEngine.STATUS;

  // Filter chips; "COMPLETE" = every registered dose given.
  var FILTERS = [
    { key: "ALL", label: "All patients" },
    { key: S.OVERDUE, label: "Overdue" },
    { key: S.DUE_SOON, label: "Due Soon" },
    { key: S.PENDING, label: "Pending" },
    { key: "COMPLETE", label: "Complete" }
  ];

  // View state kept across re-renders (reset when leaving the screen).
  var filter = "ALL";
  var query = "";

  function patientStatusKey(summary) {
    return summary.allDone ? "COMPLETE" : summary.nextDue.status;
  }

  function countBy(summaries) {
    var counts = { ALL: summaries.length, COMPLETE: 0 };
    counts[S.OVERDUE] = 0;
    counts[S.DUE_SOON] = 0;
    counts[S.PENDING] = 0;
    summaries.forEach(function (s) { counts[patientStatusKey(s)]++; });
    return counts;
  }

  function matchesQuery(summary) {
    if (!query) return true;
    var q = query.toLowerCase();
    var p = summary.patient;
    return p.name.toLowerCase().indexOf(q) !== -1 ||
           p.id.toLowerCase().indexOf(q) !== -1 ||
           (p.guardianName || "").toLowerCase().indexOf(q) !== -1;
  }

  // ---------- templates ----------

  function shellTemplate() {
    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">Patient Dashboard</h1>' +
          '<p class="page-subtitle">Registered vaccine patients and their next due dose</p>' +
        "</div>" +
      "</div>" +
      '<div data-slot="simulator"></div>' +
      '<div class="stat-grid" data-slot="stats"></div>' +
      '<div class="toolbar">' +
        '<div class="chips" role="group" aria-label="Filter by status" data-slot="chips"></div>' +
        '<input type="search" class="search" placeholder="Search name, ID or guardian" aria-label="Search patients" data-slot="search">' +
      "</div>" +
      '<div data-slot="table"></div>'
    );
  }

  function statsTemplate(counts) {
    var cards = [
      { key: S.OVERDUE, label: "Overdue", hint: "patients with a missed dose", cls: "stat--overdue" },
      { key: S.DUE_SOON, label: "Due Soon", hint: "next dose within " + CONFIG.DUE_SOON_DAYS + " days", cls: "stat--duesoon" },
      { key: S.PENDING, label: "Pending", hint: "next dose later", cls: "stat--pending" },
      { key: "ALL", label: "Total patients", hint: counts.COMPLETE + " fully vaccinated", cls: "stat--total" }
    ];
    return cards.map(function (c) {
      return (
        '<button type="button" class="stat ' + c.cls + (filter === c.key ? " is-active" : "") + '" data-filter="' + c.key + '">' +
          '<span class="stat__value">' + counts[c.key] + "</span>" +
          '<span class="stat__label">' + c.label + "</span>" +
          '<span class="stat__hint">' + UI.escapeHtml(c.hint) + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function chipsTemplate(counts) {
    return FILTERS.map(function (f) {
      var active = filter === f.key;
      return '<button type="button" class="chip' + (active ? " is-active" : "") + '" data-filter="' + f.key + '" aria-pressed="' + active + '">' +
             f.label + ' <span class="chip__count">' + counts[f.key] + "</span></button>";
    }).join("");
  }

  function nextDueCells(summary) {
    var e = UI.escapeHtml;
    if (summary.allDone) {
      return (
        '<td data-label="Next due">—</td>' +
        '<td data-label="Due date">—</td>' +
        '<td data-label="Status"><span class="badge badge--done">Complete</span></td>'
      );
    }
    var dose = summary.nextDue;
    var extraOverdue = summary.overdueCount - (dose.status === S.OVERDUE ? 1 : 0);
    var extra = extraOverdue > 0
      ? '<span class="cell-sub cell-sub--alert">+' + extraOverdue + " more overdue</span>"
      : "";
    return (
      '<td data-label="Next due">' +
        '<span class="cell-main">' + e(dose.vaccine) + " – Dose " + dose.doseNumber + "</span>" +
        '<span class="cell-sub">' + e(dose.vaccineName) + " · " + e(dose.recommendedAge) + "</span>" +
      "</td>" +
      '<td data-label="Due date">' +
        '<span class="cell-main">' + DateUtils.formatDate(dose.dueDate) + "</span>" +
        '<span class="cell-sub">' + DateUtils.formatRelative(dose.daysUntilDue) + "</span>" +
      "</td>" +
      '<td data-label="Status">' + UI.statusBadge(dose.status) + extra + "</td>"
    );
  }

  function rowTemplate(summary) {
    var e = UI.escapeHtml;
    var p = summary.patient;
    // The reminder preview modal is added in a later step; hide the button until it exists.
    var canRemind = window.ReminderModal && summary.nextDue && ScheduleEngine.canRemind(summary.nextDue);
    var today = AppState.getToday();
    return (
      '<tr class="is-clickable" data-patient="' + e(p.id) + '" tabindex="0">' +
        '<td data-label="Patient">' +
          '<span class="cell-main">' + e(p.name) + "</span>" +
          '<span class="cell-sub">' + e(p.id) + " · Guardian: " + e(p.guardianName) + "</span>" +
        "</td>" +
        '<td data-label="Age">' +
          '<span class="cell-main">' + DateUtils.formatAge(DateUtils.parseDate(p.dob), today) + "</span>" +
          '<span class="cell-sub">DOB ' + DateUtils.formatDate(DateUtils.parseDate(p.dob)) + "</span>" +
        "</td>" +
        nextDueCells(summary) +
        '<td class="cell-actions" data-label="Actions">' +
          '<a class="btn btn--secondary" href="#/patient/' + encodeURIComponent(p.id) + '">View</a>' +
          (canRemind
            ? '<button type="button" class="btn btn--primary" data-remind="' + e(p.id) + '">Simulate Reminder</button>'
            : "") +
        "</td>" +
      "</tr>"
    );
  }

  function tableTemplate(rows) {
    if (rows.length === 0) {
      return '<div class="empty card"><p>No patients match the current filter.</p></div>';
    }
    return (
      '<div class="table-wrap">' +
        '<table class="table table--responsive">' +
          "<thead><tr>" +
            "<th>Patient</th><th>Age</th><th>Next due vaccine</th><th>Due date</th><th>Status</th>" +
            '<th class="visually-hidden-th">Actions</th>' +
          "</tr></thead>" +
          "<tbody>" + rows.map(rowTemplate).join("") + "</tbody>" +
        "</table>" +
      "</div>"
    );
  }

  // ---------- rendering ----------

  function update(container) {
    var summaries = AppState.getSummaries();
    var counts = countBy(summaries);
    var rows = summaries.filter(function (s) {
      return (filter === "ALL" || patientStatusKey(s) === filter) && matchesQuery(s);
    });

    var sim = container.querySelector('[data-slot="simulator"]');
    sim.innerHTML = DateSimulator.html();
    DateSimulator.bind(sim);

    container.querySelector('[data-slot="stats"]').innerHTML = statsTemplate(counts);
    container.querySelector('[data-slot="chips"]').innerHTML = chipsTemplate(counts);
    container.querySelector('[data-slot="table"]').innerHTML = tableTemplate(rows);
  }

  function openPatient(id) {
    Router.navigate("/patient/" + encodeURIComponent(id));
  }

  /** Delegated listeners on the persistent section element — attached once. */
  function bindOnce(container) {
    if (container.dataset.bound === "true") return;
    container.dataset.bound = "true";

    container.addEventListener("click", function (event) {
      var filterBtn = event.target.closest("[data-filter]");
      if (filterBtn) {
        var key = filterBtn.getAttribute("data-filter");
        filter = filter === key && key !== "ALL" ? "ALL" : key;
        update(container);
        return;
      }

      var remindBtn = event.target.closest("[data-remind]");
      if (remindBtn) {
        var summary = AppState.getSummary(remindBtn.getAttribute("data-remind"));
        ReminderModal.open(summary.patient, summary.nextDue);
        return;
      }

      if (event.target.closest("a, button")) return;

      var row = event.target.closest("tr[data-patient]");
      if (row) openPatient(row.getAttribute("data-patient"));
    });

    container.addEventListener("keydown", function (event) {
      var row = event.target.closest && event.target.closest("tr[data-patient]");
      if (row && event.target === row && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openPatient(row.getAttribute("data-patient"));
      }
    });

    container.addEventListener("input", function (event) {
      if (event.target.matches('[data-slot="search"]')) {
        query = event.target.value.trim();
        update(container);
      }
    });
  }

  Router.register("dashboard", {
    render: function (container) {
      // Build the shell once so the search box keeps focus while typing.
      if (container.dataset.rendered !== "true") {
        container.innerHTML = shellTemplate();
        container.dataset.rendered = "true";
        container.querySelector('[data-slot="search"]').value = query;
        bindOnce(container);
      }
      update(container);
    },
    reset: function (container) {
      // Keep filter/search when visiting a patient and coming back,
      // but rebuild the shell (listeners are re-attached on render).
      container.innerHTML = "";
      container.dataset.rendered = "";
    }
  });

  AppState.subscribe(function () {
    // Clear filter and search on logout.
    if (!AppState.isLoggedIn()) {
      filter = "ALL";
      query = "";
    }
  });
})();
