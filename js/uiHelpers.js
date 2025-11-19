/*
 * File: js/uiHelpers.js
 * Purpose: Handles dialog sizing/positioning and provides dialog option factory
 *           (for jQuery UI or custom dialogs).
 *
 * Exports (window.uiHelpers):
 *   - dialogMaxHeightOffset(): pixel offset from viewport height.
 *   - dialogOptions(width): returns config object for dialog init.
 *
 * Dependencies:
 *   - None required. Uses jQuery if available; falls back to DOM APIs.
 *
 * Usage:
 *   - Load before any dialog creation code to access uiHelpers.
 *   - Keeps a small global namespace: window.uiHelpers.
 *
 * Note:
 *   - Similar name to js/uiHelper.js (singular). This one handles dialogs;
 *     that one handles form validation messages.
 */


(function () {
  if (typeof window === 'undefined') return;
  window.uiHelpers = window.uiHelpers || {};

  window.uiHelpers.dialogMaxHeightOffset = function () {
    const nav = document.querySelector('.navbar');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return Math.max(120, navHeight + 40);
  };

  window.uiHelpers.dialogOptions = function (width) {
    const maxH = window.innerHeight - window.uiHelpers.dialogMaxHeightOffset();
    const opts = {
      autoOpen: false,
      modal: true,
      width: Math.min(width, window.innerWidth - 40),
      height: 'auto',
      maxHeight: maxH,
      draggable: true,
      resizable: true,
      classes: {
        'ui-dialog': 'rounded-3',
        'ui-widget-overlay': 'custom-overlay',
      },
      open: function () {
        // prefer jQuery parent positioning when available
        const nav = document.querySelector('.navbar');
        const topOffset = nav ? nav.getBoundingClientRect().height + 10 : 10;
        try {
          if (window.jQuery) {
            window.jQuery(this).parent().css({ top: topOffset + 'px' });
          } else if (this && this.parentNode && this.parentNode.style) {
            this.parentNode.style.top = topOffset + 'px';
          }
        } catch (e) {}
      },
    };
    return opts;
  };
})();
