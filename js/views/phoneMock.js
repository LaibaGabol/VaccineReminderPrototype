/**
 * Phone mock — shows reminder messages as the guardian would see them,
 * in SMS or WhatsApp style. Used by the reminder preview modal and the
 * guardian phone panel.
 *
 * The chosen channel is a per-viewer preference (localStorage), shared by
 * every phone mock on the page.
 */
var PhoneMock = (function () {
  var CHANNELS = {
    SMS: "SMS",
    WHATSAPP: "WHATSAPP"
  };
  var STORAGE_KEY = "vaxicare.channel";
  var listeners = [];

  var channel = (function () {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved === CHANNELS.WHATSAPP ? CHANNELS.WHATSAPP : CHANNELS.SMS;
    } catch (e) {
      return CHANNELS.SMS;
    }
  })();

  function getChannel() {
    return channel;
  }

  function setChannel(value) {
    if (value !== CHANNELS.SMS && value !== CHANNELS.WHATSAPP) return;
    if (value === channel) return;
    channel = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      // Preference just won't be remembered.
    }
    listeners.forEach(function (fn) { fn(channel); });
  }

  /** Listen for channel changes: fn(channel). */
  function onChannelChange(fn) {
    listeners.push(fn);
  }

  /** SMS / WhatsApp segmented toggle. */
  function toggleHtml() {
    function option(value, label) {
      var active = channel === value;
      return '<button type="button" class="seg__btn' + (active ? " is-active" : "") + '" data-channel="' + value +
             '" aria-pressed="' + active + '">' + label + "</button>";
    }
    return '<div class="seg" role="group" aria-label="Message style">' +
           option(CHANNELS.SMS, "SMS") + option(CHANNELS.WHATSAPP, "WhatsApp") + "</div>";
  }

  /** Message text -> HTML; the first line ("Reminder from …") is bold. */
  function formatText(text) {
    var lines = String(text).split("\n").map(UI.escapeHtml);
    if (lines.length) lines[0] = "<strong>" + lines[0] + "</strong>";
    return lines.join("<br>");
  }

  function bubble(message) {
    var isNew = message.isNew ? " is-new" : "";
    var ticks = channel === CHANNELS.WHATSAPP ? '<span class="msg__ticks" aria-hidden="true">✓✓</span>' : "";
    return (
      '<div class="msg' + isNew + '"' + (message.id ? ' data-msg-id="' + message.id + '"' : "") + ">" +
        '<p class="msg__text">' + formatText(message.text) + "</p>" +
        '<span class="msg__meta">' + UI.escapeHtml(message.time || "") + ticks + "</span>" +
      "</div>"
    );
  }

  /**
   * Phone frame HTML.
   * options: {
   *   messages: [{ id?, text, time, dateLabel?, isNew? }]  (oldest first),
   *   contact:  name shown at the top of the chat,
   *   emptyText: shown when there are no messages
   * }
   */
  function html(options) {
    var contact = options.contact || CONFIG.HOSPITAL_NAME;
    var messages = options.messages || [];
    var body = "";
    var lastDate = null;

    messages.forEach(function (m) {
      if (m.dateLabel && m.dateLabel !== lastDate) {
        body += '<div class="msg-date">' + UI.escapeHtml(m.dateLabel) + "</div>";
        lastDate = m.dateLabel;
      }
      body += bubble(m);
    });
    if (!messages.length) {
      body = '<p class="phone__empty">' + UI.escapeHtml(options.emptyText || "No messages yet.") + "</p>";
    }

    var isWa = channel === CHANNELS.WHATSAPP;
    return (
      '<div class="phone phone--' + (isWa ? "whatsapp" : "sms") + '">' +
        '<div class="phone__notch" aria-hidden="true"></div>' +
        '<div class="phone__bar">' +
          '<img class="phone__avatar" src="assets/vaxicare-emblem.png" alt="">' +
          '<span class="phone__contact">' +
            '<strong>' + UI.escapeHtml(contact) + "</strong>" +
            "<small>" + (isWa ? "Business account" : "Text message") + "</small>" +
          "</span>" +
        "</div>" +
        '<div class="phone__screen" data-phone-screen>' + body + "</div>" +
      "</div>"
    );
  }

  return {
    CHANNELS: CHANNELS,
    getChannel: getChannel,
    setChannel: setChannel,
    onChannelChange: onChannelChange,
    toggleHtml: toggleHtml,
    html: html
  };
})();
