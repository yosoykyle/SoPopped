/*
 * File: js/dialogUI.js
 * Purpose: Handles dialog sizing/positioning and provides dialog option factory
 *           (for jQuery UI or custom dialogs).
 *
 * Exports (window.dialogUI):
 *   - dialogMaxHeightOffset(): pixel offset from viewport height.
 *   - dialogOptions(width): returns config object for dialog init.
 *
 * Dependencies:
 *   - None required. Uses jQuery if available; falls back to DOM APIs.
 *
 * Usage:
 *   - Load before any dialog creation code to access dialogUI.
 *   - Keeps a small global namespace: window.dialogUI.
 */

(function () {
  "use strict";

  if (typeof window === "undefined") return;
  window.dialogUI = window.dialogUI || {};

  window.dialogUI.dialogMaxHeightOffset = function () {
    const nav = document.querySelector(".navbar");
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return Math.max(120, navHeight + 40);
  };

  window.dialogUI.dialogOptions = function (width) {
    const maxH = window.innerHeight - window.dialogUI.dialogMaxHeightOffset();
    const opts = {
      autoOpen: false,
      modal: true,
      width: Math.min(width, window.innerWidth - 40),
      height: "auto",
      maxHeight: maxH,
      draggable: true,
      resizable: true,
      classes: {
        "ui-dialog": "rounded-3",
        "ui-widget-overlay": "custom-overlay",
      },
      open: function () {
        // prefer jQuery parent positioning when available
        const nav = document.querySelector(".navbar");
        const topOffset = nav ? nav.getBoundingClientRect().height + 10 : 10;
        try {
          if (window.jQuery) {
            window
              .jQuery(this)
              .parent()
              .css({ top: topOffset + "px" });
          } else if (this && this.parentNode && this.parentNode.style) {
            this.parentNode.style.top = topOffset + "px";
          }
        } catch (e) {}
      },
    };
    return opts;
  };

  // BACKWARDS COMPATIBILITY (Temporary)
  window.uiHelpers = window.dialogUI;
})();
