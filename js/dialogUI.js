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

(function ($) {
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

  if (!$) return;
  $(function () {
    // Fallback: ensure #loginBtn always opens a dialog even when jQuery UI is not present.
    $(document).on("click", "#loginBtn", function (e) {
      e.preventDefault();
      const $dlg = $("#loginDialog");
      if (!$dlg || !$dlg.length) return;

      if ($.ui && $.ui.dialog && $dlg.dialog) {
        try {
          $dlg.dialog("open");
        } catch (e) {}
        return;
      }

      const modalId = "loginFallbackModal";
      let $modal = $(document.getElementById(modalId));
      if (!$modal || !$modal.length) {
        const wrapper = `
          <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content rounded-3">
                <div class="modal-header">
                  <h5 class="modal-title">Login to So Popped</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body"></div>
              </div>
            </div>
          </div>`;
        $("body").append(wrapper);
        $modal = $(document.getElementById(modalId));
        $modal.on("hidden.bs.modal", function () {
          try {
            const $inner = $modal.find("#loginDialog");
            if ($inner && $inner.length) {
              $inner.detach().hide().appendTo("body");
            }
          } catch (e) {}
          try {
            $modal.remove();
          } catch (e) {}
        });
      }

      try {
        const $body = $modal.find(".modal-body");
        $dlg.detach().show().appendTo($body);
        const bs = new bootstrap.Modal($modal[0]);
        bs.show();
      } catch (e) {
        try {
          $dlg.show();
        } catch (e) {}
      }
    });
  });
})(jQuery);
