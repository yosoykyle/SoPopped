/**
 * =============================================================================
 * File: js/dialogUI.js
 * Purpose: Handles dialog sizing, positioning, and option factory.
 * =============================================================================
 *
 * This utility provides helper functions for configuring jQuery UI dialogs to
 * be responsive and consistently styled across the application.
 *
 * Exports (window.dialogUI):
 *   - dialogMaxHeightOffset(): Calculate max height based on viewport
 *   - dialogOptions(width): Factory for standard dialog config object
 *
 * Dependencies:
 *   - jQuery UI (implied usage for options)
 * =============================================================================
 */

(function () {
  "use strict";

  if (typeof window === "undefined") return;
  window.dialogUI = window.dialogUI || {};

  /**
   * Calculate maximum height for dialogs relative to viewport.
   * Ensures dialog doesn't cover navbar or overflow bottom.
   * @returns {number} Pixel offset to subtract from window height
   */
  window.dialogUI.dialogMaxHeightOffset = function () {
    const nav = document.querySelector(".navbar");
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return Math.max(120, navHeight + 40);
  };

  /**
   * Generate standard configuration object for jQuery UI Dialog.
   * @param {number} width - Desired dialog width (max constrained by viewport)
   * @returns {Object} jQuery UI Dialog options object
   */
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
      // Reposition on open to account for navbar
      open: function () {
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

  // BACKWARDS COMPATIBILITY (Temporary alias)
  window.uiHelpers = window.dialogUI;
})();
