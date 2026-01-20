/**
 * =============================================================================
 * File: js/validation.js
 * Purpose: Consolidated validation helpers, UI components, and framework adapters.
 * =============================================================================
 *
 * This file consolidates three previously separate modules:
 *   1. validateHelper.js: Core validation logic (email format, password strength)
 *   2. validationUI.js: DOM manipulation for showing/hiding error messages
 *   3. sopoppedValidate.js: Framework-agnostic adapter for 3rd party compat
 *
 * Exports:
 *   - window.sopoppedValidate (Main namespace)
 *     - emailFormat(value): boolean
 *     - emailChars(value): boolean
 *     - passwordStrength(value): boolean
 *     - emailKeyFilter(event): void
 *     - show(form, text, type): void
 *     - hide(form): void
 *   - window.validationUI (UI Specific)
 *     - showValidateMsg(form, text, type): boolean
 *     - hideValidateMsg(form): boolean
 *     - revealValidateMsg(form): boolean
 *
 * Dependencies:
 *   - jQuery (required)
 * =============================================================================
 */

(function ($) {
  "use strict";

  // ==========================================================================
  // PART 1: CORE VALIDATION HELPERS
  // ==========================================================================

  try {
    window.sopoppedValidate = window.sopoppedValidate || {};

    /**
     * Validate email format (simple regex-free check).
     * @param {string} value - Email string
     * @returns {boolean} True if valid structure
     */
    window.sopoppedValidate.emailFormat = function (value) {
      if (!value) return false;
      try {
        const at = value.indexOf("@");
        if (at <= 0) return false;
        const after = value.slice(at + 1);
        if (after.indexOf(".") === -1) return false;
        if (value.split("@").length !== 2) return false;
        return true;
      } catch (e) {
        return false;
      }
    };

    /**
     * Check if string contains only valid email characters.
     * @param {string} value - Input string
     * @returns {boolean} True if only valid chars
     */
    window.sopoppedValidate.emailChars = function (value) {
      if (!value) return false;
      try {
        return /^[A-Za-z0-9._@]+$/.test(value);
      } catch (e) {
        return false;
      }
    };

    /**
     * Check password strength requirements.
     * Rules: 8-16 chars, 1 upper, 1 lower, 1 number, 1 special char.
     * @param {string} value - Password string
     * @returns {boolean} True if strong enough
     */
    window.sopoppedValidate.passwordStrength = function (value) {
      if (!value) return false;
      try {
        if (value.length < 8 || value.length > 16) return false;
        if (!/[A-Z]/.test(value)) return false;
        if (!/[a-z]/.test(value)) return false;
        if (!/[0-9]/.test(value)) return false;
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(value)) return false;
        return true;
      } catch (e) {
        return false;
      }
    };

    /**
     * Input event handler to block invalid email characters.
     * @param {Event} e - Keydown/Input event
     */
    window.sopoppedValidate.emailKeyFilter = function (e) {
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      if (!key) return;
      const allowed = /[A-Za-z0-9@._]/;
      if (
        [
          "Backspace",
          "Delete",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Tab",
          "Enter",
        ].includes(key)
      )
        return;

      if (key.length === 1 && !allowed.test(key)) {
        e.preventDefault();
      }
    };
  } catch (e) {
    /* noop */
  }

  // ==========================================================================
  // PART 2: UI VALIDATION HELPERS
  // ==========================================================================

  try {
    window.validationUI = window.validationUI || {};

    /**
     * Find the validation message container for a form.
     * Searches for #validate-msg or .validate-msg inside form or parent dialog.
     * @private
     */
    function _getValidateMsgElement($form) {
      try {
        const $f = $($form);
        if ($f && $f.length) {
          const $inForm = $f.find("#validate-msg");
          if ($inForm.length) return $inForm[0];

          const $classInForm = $f.find(".validate-msg");
          if ($classInForm.length) return $classInForm[0];
        }

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

    /**
     * Show a validation message.
     * @param {jQuery} $form - Form element
     * @param {string} text - Message text
     * @param {string} type - 'success', 'warning', 'danger' (default)
     * @returns {boolean} True if element found and updated
     */
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
              : "alert-danger",
        );
        $el.text(text || "");
        return true;
      } catch (e) {
        return false;
      }
    };

    /**
     * Hide and clear validation message.
     * @param {jQuery} $form - Form element
     */
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

    /**
     * Reveal validation message container without changing content.
     * @param {jQuery} $form - Form element
     */
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

    // Alias for backward compatibility
    window.sopoppedUI = window.validationUI;
  } catch (e) {
    console.error("Error initializing validationUI:", e);
  }

  // ==========================================================================
  // PART 3: FRAMEWORK ADAPTERS
  // ==========================================================================

  // Adapter: Show message (delegates to internal jQuery impl if available)
  if (typeof window.sopoppedValidate.show !== "function") {
    window.sopoppedValidate.show = function (formOrEl, text, type) {
      try {
        if (
          window.sopoppedValidate._jq &&
          typeof window.sopoppedValidate._jq.show === "function"
        ) {
          try {
            var $form =
              window.jQuery && formOrEl && formOrEl.jquery
                ? formOrEl
                : window.jQuery
                  ? window.jQuery(formOrEl)
                  : null;
            return window.sopoppedValidate._jq.show($form, text, type);
          } catch (e) {
            return window.sopoppedValidate._jq.show(null, text, type);
          }
        }
      } catch (e) {}
      return false;
    };
  }

  // Adapter: Hide message
  if (typeof window.sopoppedValidate.hide !== "function") {
    window.sopoppedValidate.hide = function (formOrEl) {
      try {
        if (
          window.sopoppedValidate._jq &&
          typeof window.sopoppedValidate._jq.hide === "function"
        ) {
          try {
            var $form =
              window.jQuery && formOrEl && formOrEl.jquery
                ? formOrEl
                : window.jQuery
                  ? window.jQuery(formOrEl)
                  : null;
            return window.sopoppedValidate._jq.hide($form);
          } catch (e) {
            return window.sopoppedValidate._jq.hide(null);
          }
        }
      } catch (e) {}
      return false;
    };
  }
})(jQuery);
