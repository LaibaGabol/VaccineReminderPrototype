/**
 * Reminder Log — every reminder the simulated daily job has "sent",
 * newest first, with filters and CSV export. Nothing is actually sent.
 */
(function () {
  var STAGE = ReminderEngine.STAGE;
  var DAILY_JOB_TIME = "9:00 AM";

  var FILTERS = [
    { key: "ALL", label: "All" },
    { key: STAGE.ADVANCE, label: "Due soon" },
    { key: STAGE.DUE_TODAY, label: "Due today" },
    { key: STAGE.OVERDUE, label: "Overdue" },
    { key: STAGE.OVERDUE_FINAL, label: "Final notice" }
  ];

  // View state kept across re-renders.
  var filter = "ALL";
  var patientFilter = "ALL";
  var query = "";

  function doseList(entry) {
    return entry.doses.map(function (d) { return d.vaccine + " Dose " + d.doseNumber; });
  }

  function matches(entry) {
    if (filter !== "ALL" && entry.stage !== filter) return false;
    if (patientFilter !== "ALL" && entry.patientId !== patientFilter) return false;
    if (!query) return true;
    var q = query.toLowerCase();
    return [entry.patientName, entry.patientId, entry.guardianName, entry.phone, doseList(entry).join(" ")]
      .some(function (text) { return String(text).toLowerCase().indexOf(q) !== -1; });
  }

  function countBy(log) {
    var counts = { ALL: log.length };
    FILTERS.forEach(function (f) { if (f.key !== "ALL") counts[f.key] = 0; });
    log.forEach(function (entry) { counts[entry.stage]++; });
    return counts;
  }

  // ---------- templates ----------

  function shellTemplate() {
    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">Reminder Log</h1>' +
          '<p class="page-subtitle">Every reminder the daily job would have sent to guardians – simulated, nothing is actually sent</p>' +
        "</div>" +
        '<button type="button" class="btn btn--secondary" data-action="export">Download CSV</button>' +
      "</div>" +
      '<div data-slot="simulator"></div>' +
      '<div class="toolbar">' +
        '<div class="chips" role="group" aria-label="Filter by reminder type" data-slot="chips"></div>' +
        '<div class="toolbar__right">' +
          '<label class="visually-hidden" for="log-patient">Patient</label>' +
          '<select id="log-patient" class="select select--inline" data-slot="patient"></select>' +
          '<input type="search" class="search" placeholder="Search patient, guardian, phone, vaccine" aria-label="Search reminders" data-slot="search">' +
        "</div>" +
      "</div>" +
      '<p class="log-summary" data-slot="summary"></p>' +
      '<div data-slot="table"></div>'
    );
  }

  function chipsTemplate(counts) {
    return FILTERS.map(function (f) {
      var active = filter === f.key;
      return '<button type="button" class="chip' + (active ? " is-active" : "") + '" data-filter="' + f.key + '" aria-pressed="' + active + '">' +
             f.label + ' <span class="chip__count">' + counts[f.key] + "</span></button>";
    }).join("");
  }

  function patientOptions() {
    var e = UI.escapeHtml;
    var options = '<option value="ALL">All patients</option>';
    AppState.getPatients().forEach(function (p) {
      options += '<option value="' + e(p.id) + '"' + (patientFilter === p.id ? " selected" : "") + ">" +
                 e(p.name + " (" + p.id + ")") + "</option>";
    });
    return options;
  }

  function rowTemplate(entry) {
    var e = UI.escapeHtml;
    var date = DateUtils.parseDate(entry.date);
    var doses = doseList(entry).map(function (d) { return '<span class="tag">' + e(d) + "</span>"; }).join("");
    return (
      "<tr>" +
        '<td data-label="Sent">' +
          '<span class="cell-main">' + DateUtils.formatDate(date) + "</span>" +
          '<span class="cell-sub">' + DAILY_JOB_TIME + " · #" + entry.id + "</span>" +
        "</td>" +
        '<td data-label="Patient">' +
          '<span class="cell-main">' + e(entry.patientName) + "</span>" +
          '<span class="cell-sub">' + e(entry.patientId) + "</span>" +
        "</td>" +
        '<td data-label="Recipient">' +
          '<span class="cell-main">' + e(entry.guardianName) + "</span>" +
          '<span class="cell-sub">' + e(entry.phone) + "</span>" +
        "</td>" +
        '<td data-label="Doses"><span class="tag-list">' + doses + "</span></td>" +
        '<td data-label="Type">' + UI.stageBadge(entry.stage) +
          '<span class="status-pill status-pill--below">' + e(entry.status) + "</span>" +
        "</td>" +
        '<td data-label="Message">' +
          '<details class="log-msg">' +
            "<summary>Show message</summary>" +
            '<pre class="log-msg__text">' + e(entry.message) + "</pre>" +
          "</details>" +
        "</td>" +
        '<td class="cell-actions" data-label="Actions">' +
          '<button type="button" class="btn btn--secondary" data-phone="' + e(entry.patientId) + '">View on phone</button>' +
        "</td>" +
      "</tr>"
    );
  }

  function tableTemplate(rows, totalCount) {
    if (totalCount === 0) {
      return (
        '<div class="card empty">' +
          "<p><strong>No reminders yet.</strong></p>" +
          "<p>The daily reminder check runs when staff log in. Use <strong>+1 day</strong> or <strong>+1 week</strong> above to move the demo date forward and watch reminders appear here.</p>" +
        "</div>"
      );
    }
    if (rows.length === 0) {
      return '<div class="card empty"><p>No reminders match the current filters.</p></div>';
    }
    return (
      '<div class="table-wrap">' +
        '<table class="table table--responsive table--log">' +
          "<thead><tr>" +
            "<th>Sent</th><th>Patient</th><th>Recipient</th><th>Doses</th><th>Type / status</th><th>Message</th>" +
            '<th class="visually-hidden-th">Actions</th>' +
          "</tr></thead>" +
          "<tbody>" + rows.map(rowTemplate).join("") + "</tbody>" +
        "</table>" +
      "</div>"
    );
  }

  // ---------- CSV export ----------

  function csvCell(value) {
    var text = String(value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function exportCsv(entries) {
    var header = ["ID", "Date", "Time", "Patient ID", "Patient", "Guardian", "Phone", "Doses", "Type", "Status", "Message"];
    var lines = [header.join(",")];
    entries.slice().reverse().forEach(function (entry) {
      lines.push([
        entry.id, entry.date, DAILY_JOB_TIME, entry.patientId, entry.patientName, entry.guardianName,
        entry.phone, doseList(entry).join("; "), ReminderEngine.STAGE_LABELS[entry.stage], entry.status, entry.message
      ].map(csvCell).join(","));
    });

    // BOM so Excel opens the UTF-8 file (dashes, bullets) correctly.
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "reminder-log-" + DateUtils.toISODate(AppState.getToday()) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------- rendering ----------

  function filtered() {
    return AppState.getReminderLog().filter(matches);
  }

  function update(container) {
    var log = AppState.getReminderLog();
    var rows = log.filter(matches);

    var sim = container.querySelector('[data-slot="simulator"]');
    sim.innerHTML = DateSimulator.html();
    DateSimulator.bind(sim);

    container.querySelector('[data-slot="chips"]').innerHTML = chipsTemplate(countBy(log));
    container.querySelector('[data-slot="patient"]').innerHTML = patientOptions();

    var guardians = {};
    rows.forEach(function (entry) { guardians[entry.patientId] = true; });
    var guardianCount = Object.keys(guardians).length;
    container.querySelector('[data-slot="summary"]').textContent = log.length
      ? "Showing " + rows.length + " of " + log.length + (log.length === 1 ? " reminder" : " reminders") +
        " · " + guardianCount + (guardianCount === 1 ? " guardian" : " guardians") + " · newest first"
      : "";

    container.querySelector('[data-slot="table"]').innerHTML = tableTemplate(rows, log.length);
    container.querySelector('[data-action="export"]').disabled = rows.length === 0;
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
      var phoneBtn = event.target.closest("[data-phone]");
      if (phoneBtn) {
        GuardianPhone.open(phoneBtn.getAttribute("data-phone"));
        return;
      }
      if (event.target.closest('[data-action="export"]')) {
        exportCsv(filtered());
      }
    });

    container.addEventListener("input", function (event) {
      if (event.target.matches('[data-slot="search"]')) {
        query = event.target.value.trim();
        update(container);
      }
    });

    container.addEventListener("change", function (event) {
      if (event.target.matches('[data-slot="patient"]')) {
        patientFilter = event.target.value;
        update(container);
      }
    });
  }

  Router.register("reminders", {
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
      container.innerHTML = "";
      container.dataset.rendered = "";
    }
  });

  AppState.subscribe(function () {
    // Clear filters on logout.
    if (!AppState.isLoggedIn()) {
      filter = "ALL";
      patientFilter = "ALL";
      query = "";
    }
  });
})();
