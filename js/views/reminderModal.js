/**
 * Reminder preview modal — "Simulate Reminder" on a Due Soon / Overdue dose
 * shows the exact message the guardian would receive. Nothing is sent.
 */
var ReminderModal = (function () {
  var e = UI.escapeHtml;

  function bodyTemplate(patient, dose, message, stage) {
    return (
      '<div class="reminder-preview">' +
        '<div class="reminder-preview__info">' +
          '<dl class="info-list">' +
            "<dt>To</dt><dd>" + e(patient.guardianName) + "<br><span class=\"text-muted\">" + e(patient.phone) + "</span></dd>" +
            "<dt>Patient</dt><dd>" + e(patient.name) + " <span class=\"text-muted\">(" + e(patient.id) + ")</span></dd>" +
            "<dt>Vaccine</dt><dd>" + e(dose.vaccine) + " – Dose " + dose.doseNumber + "<br><span class=\"text-muted\">" + e(dose.vaccineName) + "</span></dd>" +
            "<dt>Due date</dt><dd>" + DateUtils.formatDate(dose.dueDate) + " " + UI.statusBadge(dose.status) + "</dd>" +
            "<dt>Reminder</dt><dd>" + e(ReminderEngine.STAGE_LABELS[stage]) + "</dd>" +
          "</dl>" +
          '<div class="reminder-preview__channel">' +
            '<span class="sim-bar__label">Message style</span>' +
            PhoneMock.toggleHtml() +
          "</div>" +
          '<p class="sim-notice" role="note"><strong>Simulation only.</strong> No message has been sent – this is how it would appear on the guardian\'s phone.</p>' +
        "</div>" +
        '<div class="reminder-preview__phone" data-slot="phone">' + phoneHtml(patient, message) + "</div>" +
      "</div>"
    );
  }

  function phoneHtml(patient, message) {
    return PhoneMock.html({
      messages: [{
        text: message,
        time: "Preview",
        dateLabel: DateUtils.formatDate(AppState.getToday())
      }]
    });
  }

  function copyText(text, button) {
    function done(ok) {
      button.textContent = ok ? "Copied" : "Copy failed";
      setTimeout(function () { button.textContent = "Copy message"; }, 1500);
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        return;
      }
    } catch (err) {
      // fall through to the legacy path
    }
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    area.remove();
    done(ok);
  }

  /** Open the preview for one dose of one patient. */
  function open(patient, dose) {
    var stage = ReminderEngine.getPreviewStage(dose);
    var message = ReminderEngine.buildPreviewMessage(patient, dose, AppState.getToday());

    Modal.open({
      title: "Reminder preview",
      className: "modal--wide",
      body: bodyTemplate(patient, dose, message, stage),
      footer:
        '<button type="button" class="btn btn--secondary" data-copy>Copy message</button>' +
        '<button type="button" class="btn btn--primary" data-modal-close>Close</button>',
      onOpen: function (dialog) {
        dialog.addEventListener("click", function (event) {
          var channelBtn = event.target.closest("[data-channel]");
          if (channelBtn) {
            PhoneMock.setChannel(channelBtn.getAttribute("data-channel"));
            dialog.querySelector(".seg").outerHTML = PhoneMock.toggleHtml();
            dialog.querySelector('[data-slot="phone"]').innerHTML = phoneHtml(patient, message);
            dialog.querySelector('[data-channel="' + PhoneMock.getChannel() + '"]').focus();
            return;
          }
          var copyBtn = event.target.closest("[data-copy]");
          if (copyBtn) copyText(message, copyBtn);
        });
      }
    });
  }

  return { open: open };
})();
