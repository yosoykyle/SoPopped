/*
 * File: js/validationUI.js
 * Purpose: Handles form validation messages (show, hide, reveal)
 *           for auth dialogs and other forms.
 *
 * Exports (window.validationUI):
 *   - showValidateMsg($form, text, type): show message ('success' | 'warning' | else = 'error')
 *   - hideValidateMsg($form): clear & hide message
 *   - revealValidateMsg($form): unhide message text
 *
 * Behavior:
 *   - Finds #validate-msg or first .validate-msg in form
 *   - Uses Bootstrap alerts (danger/success/warning) + toggles d-none
 *   - Returns boolean for success/fallback handling
 *
 * Requirements:
 *   - jQuery required
 *   - Load after jQuery and CSS for .validate-msg + Bootstrap alerts
 */

(function ($) {
  "use strict";

  try {
    window.validationUI = window.validationUI || {};

    // Helper: Find the message element
    // Priority: 1) #validate-msg inside form, 2) .validate-msg inside form, 3) global #validate-msg
    function _getValidateMsgElement($form) {
      try {
        const $f = $($form);
        if ($f && $f.length) {
          // First try inside form
          const $inForm = $f.find("#validate-msg");
          if ($inForm.length) return $inForm[0];

          const $classInForm = $f.find(".validate-msg");
          if ($classInForm.length) return $classInForm[0];
        }

        // Fallback: look for global #validate-msg (in dialog or modal parent)
        if ($f && $f.length) {
          const $dialog = $f.closest(".ui-dialog, .modal");
          if ($dialog.length) {
            const $inDialog = $dialog.find("#validate-msg");
            if ($inDialog.length) return $inDialog[0];
          }
        }

        return null;
      } catch (e) {
        return null;
      }
    }

    window.validationUI.showValidateMsg = function ($form, text, type) {
      try {
        const el = _getValidateMsgElement($form);
        if (!el) return false;
        const $el = $(el);
        $el.removeClass("d-none");
        $el.removeClass("alert-danger alert-success alert-warning alert-info");
        $el.addClass(
          type === "success"
            ? "alert-success"
            : type === "warning"
            ? "alert-warning"
            : "alert-danger"
        );
        $el.text(text || "");
        return true;
      } catch (e) {
        return false;
      }
    };

    window.validationUI.hideValidateMsg = function ($form) {
      try {
        const el = _getValidateMsgElement($form);
        if (!el) return false;
        const $el = $(el);
        $el.text("");
        $el.addClass("d-none");
        return true;
      } catch (e) {
        return false;
      }
    };

    window.validationUI.revealValidateMsg = function ($form) {
      try {
        const el = _getValidateMsgElement($form);
        if (!el) return false;
        const $el = $(el);
        $el.removeClass("d-none");
        return true;
      } catch (e) {
        return false;
      }
    };

    // BACKWARDS COMPATIBILITY (Temporary) - checking if sopoppedUI is used elsewhere
    window.sopoppedUI = window.validationUI;
  } catch (e) {
    console.error("Error initializing validationUI:", e);
  }
})(jQuery);
