/**
 * Generic modal dialog: one at a time, closes on Esc, backdrop click or
 * any [data-modal-close] element, and returns focus to where it was.
 */
var Modal = (function () {
  var root = null;
  var lastFocus = null;
  var lastFocusSelector = null;
  var onCloseCallback = null;

  /**
   * Selector that finds an equivalent element again if the original was
   * re-rendered while the dialog was open (e.g. [data-remind="P003"]).
   */
  function selectorFor(el) {
    if (!el || !el.attributes) return null;
    if (el.id) return "#" + CSS.escape(el.id);
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (attr.name.indexOf("data-") === 0) {
        return "[" + attr.name + '="' + CSS.escape(attr.value) + '"]';
      }
    }
    return null;
  }

  function focusables(el) {
    return Array.prototype.filter.call(
      el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (node) { return !node.disabled && node.offsetParent !== null; }
    );
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      // Keep keyboard focus inside the dialog.
      var items = focusables(root);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  /**
   * Open a dialog.
   * options: { title, body (HTML), footer (HTML), className, onOpen(dialogEl), onClose() }
   */
  function open(options) {
    close();
    lastFocus = document.activeElement;
    lastFocusSelector = selectorFor(lastFocus);
    onCloseCallback = options.onClose || null;

    root = document.createElement("div");
    root.className = "modal-backdrop";
    root.innerHTML =
      '<div class="modal ' + (options.className || "") + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal__header">' +
          '<h2 id="modal-title" class="modal__title">' + UI.escapeHtml(options.title) + "</h2>" +
          '<button type="button" class="modal__close" data-modal-close aria-label="Close">×</button>' +
        "</div>" +
        '<div class="modal__body">' + options.body + "</div>" +
        (options.footer ? '<div class="modal__footer">' + options.footer + "</div>" : "") +
      "</div>";

    root.addEventListener("click", function (event) {
      if (event.target === root || event.target.closest("[data-modal-close]")) close();
    });
    document.addEventListener("keydown", onKeydown);
    document.getElementById("modal-root").appendChild(root);
    document.body.classList.add("has-modal");

    var dialog = root.querySelector(".modal");
    if (options.onOpen) options.onOpen(dialog);
    root.querySelector("[data-modal-close]").focus();
    return dialog;
  }

  function close() {
    if (!root) return;
    document.removeEventListener("keydown", onKeydown);
    root.remove();
    root = null;
    document.body.classList.remove("has-modal");
    if (onCloseCallback) {
      var cb = onCloseCallback;
      onCloseCallback = null;
      cb();
    }
    var target = lastFocus && document.body.contains(lastFocus)
      ? lastFocus
      : (lastFocusSelector && document.querySelector(lastFocusSelector));
    if (target) target.focus();
    lastFocus = null;
    lastFocusSelector = null;
  }

  function isOpen() {
    return root !== null;
  }

  return { open: open, close: close, isOpen: isOpen };
})();
