/**
 * =============================================================================
 * File: js/dialogUI.js
 * Purpose: The "Architect" for Pop-up Windows.
 * =============================================================================
 *
 * NOTE:
 * Managing popups (Modals/Dialogs) is tricky because screens come in different sizes.
 * If a popup is too tall, the "Close" button might be off-screen.
 *
 * This file acts as an Architect. It calculates:
 *   1. Max Height: "How tall can I be without covering user controls?"
 *   2. Width: "Fit the content, but don't overflow mobile screens."
 *   3. Position: "Open in the center, but respect the Navbar."
 * =============================================================================
 */

(function () {
  "use strict";

  if (typeof window === "undefined") return;
  window.dialogUI = window.dialogUI || {};

  /**
   * METHOD: dialogMaxHeightOffset
   * Purpose: Calculate safe space from top.
   * Logic: Measure the Navigation Bar + some breathing room.
   */
  window.dialogUI.dialogMaxHeightOffset = function () {
    const nav = document.querySelector(".navbar");
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    // Always leave at least 120px or (Nav + 40px), whichever is bigger.
    return Math.max(120, navHeight + 40);
  };

  /**
   * METHOD: dialogOptions
   * Purpose: Generate the Blueprints (Options Object) for a new Dialog.
   * Inputs: Desired width.
   * Outputs: A configuration object for jQuery UI.
   */
  window.dialogUI.dialogOptions = function (width) {
    // Determine screen limits
    const maxH = window.innerHeight - window.dialogUI.dialogMaxHeightOffset();

    const opts = {
      autoOpen: false, // Don't show immediately
      modal: true, // "Grey out" the background
      width: Math.min(width, window.innerWidth - 40), // Responsive width
      height: "auto",
      maxHeight: maxH, // Enforce height limit
      draggable: true,
      resizable: true,
      classes: {
        "ui-dialog": "rounded-3",
        "ui-widget-overlay": "custom-overlay",
      },
      // Event: When opening...
      open: function () {
        // ...Push it down below the Navbar so it's not hidden.
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

  // BACKWARDS COMPATIBILITY
  window.uiHelpers = window.dialogUI;
})();
