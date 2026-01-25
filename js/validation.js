/**
 * =============================================================================
 * File: js/validation.js
 * Purpose: The "Rule Book" and "Referee".
 * =============================================================================
 *
 * NOTE:
 * Form inputs can be messy. Users make typos.
 * This file contains the "Rules of the Game":
 *   1. What does a valid email look like? (@ and .)
 *   2. What is a strong password? (Upper, Lower, Number, Symbol)
 *   3. How do we show the Red Error Box if they break the rules?
 *
 * It consolidates logic for "Checking" (Validation) and "Showing" (UI) errors.
 * =============================================================================
 */

(function ($) {
  "use strict";

  // ==========================================================================
  // PART 1: THE RULES (Core Logic)
  // ==========================================================================
  // These functions answer Yes/No questions about data quality.

  try {
    window.sopoppedValidate = window.sopoppedValidate || {};
    window.validationUI = window.validationUI || {};

    /**
     * Action: Reveal Validate Message (make visible without changing text)
     */
    window.validationUI.revealValidateMsg = function ($form) {
      try {
        // Re-use logic from _getValidateMsgElement if available, or duplicate simplistic lookup
        // Since _getValidateMsgElement is internal to this closure, we can't call it if we define this function early.
        // So we will define it later with the others.
        // Placeholder to be overwritten below.
        return false;
      } catch (e) {
        return false;
      }
    };

    /**
     * RULE: Email Format
     * Question: Does this string look like an email?
     * Logic: Must have an '@' and a '.' after it.
     */
    window.sopoppedValidate.emailFormat = function (value) {
      if (!value) return false;
      try {
        const at = value.indexOf("@");
        if (at <= 0) return false; // '@' cannot be the first char
        const after = value.slice(at + 1);
        if (after.indexOf(".") === -1) return false; // Domain must have a dot
        if (value.split("@").length !== 2) return false; // Only one '@' allowed
        return true;
      } catch (e) {
        return false;
      }
    };

    /**
     * RULE: Email Characters
     * Question: Are there any illegal characters?
     * Logic: Only letters, numbers, @, ., and _ allowed.
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
     * RULE: Password Strength
     * Question: Is this password safe enough?
     * Logic: 8+ chars, Uppercase, Lowercase, Number, Special Char.
     */
    window.sopoppedValidate.passwordStrength = function (value) {
      if (!value) return false;
      try {
        if (value.length < 8 || value.length > 16) return false;
        if (!/[A-Z]/.test(value)) return false; // Missing Uppercase
        if (!/[a-z]/.test(value)) return false; // Missing Lowercase
        if (!/[0-9]/.test(value)) return false; // Missing Number
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(value)) return false; // Missing Symbol
        return true;
      } catch (e) {
        return false;
      }
    };

    /**
     * RULE: Input Filter
     * Action: Block typing of illegal characters in real-time.
     */
    window.sopoppedValidate.emailKeyFilter = function (e) {
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      if (!key) return;
      // Allow only letters, numbers, @, ., and _
      const allowed = /[A-Za-z0-9@._]/;

      // Allow navigation keys (Backspace, Arrows, etc)
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

      // If key is not allowed, prevent it from appearing.
      if (key.length === 1 && !allowed.test(key)) {
        e.preventDefault();
      }
    };
  } catch (e) {
    /* noop */
  }

  // ==========================================================================
  // PART 2: THE REFEREE (UI Display)
  // ==========================================================================
  // These functions handle showing the "Red Card" (Error Message) on the screen.

  try {
    window.validationUI = window.validationUI || {};

    /**
     * Helper: Find the message box
     * Looks for a div with id="validate-msg" or class="validate-msg".
     */
    function _getValidateMsgElement($form) {
      try {
        const $f = $($form);
        if ($f && $f.length) {
          // Look inside the form first
          const $inForm = $f.find("#validate-msg");
          if ($inForm.length) return $inForm[0];

          const $classInForm = $f.find(".validate-msg");
          if ($classInForm.length) return $classInForm[0];
        }

        // Fallback: Look in the parent dialog (Modal)
        if ($f && $f.length) {
          const $dialog = $f.closest(".ui-dialog, .modal");
          if ($dialog.length) {
            const $inDialog = $dialog.find("#validate-msg");
            if ($inDialog.length) return $inDialog[0];
          }
        }
        return null; // Can't find it
      } catch (e) {
        return null;
      }
    }

    /**
     * Action: Show Validate Message
     * Displays text in Green (Success), Red (Danger), or Yellow (Warning).
     */
    window.validationUI.showValidateMsg = function ($form, text, type) {
      try {
        const el = _getValidateMsgElement($form);
        if (!el) return false;
        const $el = $(el);
        $el.removeClass("d-none"); // Make visible
        // Reset colors
        $el.removeClass("alert-danger alert-success alert-warning alert-info");
        // Apply new color
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
     * Action: Hide Message
     * Clears the text and hides the box.
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
     * Action: Reveal Message (Unhide)
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
  // PART 3: ADAPTERS (Compatibility)
  // ==========================================================================
  // Connects our custom logic to jQuery Validation plugin if installed.

  if (typeof window.sopoppedValidate.show !== "function") {
    window.sopoppedValidate.show = function (formOrEl, text, type) {
      // Delegate to internal implementation
      return window.validationUI.showValidateMsg(formOrEl, text, type);
    };
  }

  if ($.validator) {
    if (!$.validator.methods.emailChars) {
      $.validator.addMethod(
        "emailChars",
        function (value, element) {
          return (
            this.optional(element) ||
            (window.sopoppedValidate &&
              window.sopoppedValidate.emailChars &&
              window.sopoppedValidate.emailChars(value))
          );
        },
        "Email contains invalid characters.",
      );

      $.validator.addMethod(
        "emailFormat",
        function (value, element) {
          if (this.optional(element)) return true;
          if (!value.includes("@")) return "Email must contain @";
          if ((value.match(/@/g) || []).length > 1)
            return "Multiple @ symbols not allowed";
          return (
            window.sopoppedValidate &&
            window.sopoppedValidate.emailFormat &&
            window.sopoppedValidate.emailFormat(value)
          );
        },
        "Please enter a valid email address.",
      );

      $.validator.addMethod(
        "passwordStrength",
        function (value, element) {
          return (
            this.optional(element) ||
            (window.sopoppedValidate &&
              window.sopoppedValidate.passwordStrength &&
              window.sopoppedValidate.passwordStrength(value))
          );
        },
        "Password must be 8-16 chars, include uppercase, lowercase, number, and special char.",
      );

      $.validator.addMethod(
        "phoneFormat",
        function (value, element) {
          return (
            this.optional(element) ||
            /^(09|\+639)\d{2}[-\s]?\d{3}[-\s]?\d{4}$/.test(value) ||
            /^\d{4}[-\s]?\d{3}[-\s]?\d{4}$/.test(value)
          );
        },
        "Please enter a valid phone number (e.g. 0917-123-4567 or 09171234567)",
      );
    }
  }

  if (typeof window.sopoppedValidate.hide !== "function") {
    window.sopoppedValidate.hide = function (formOrEl) {
      return window.validationUI.hideValidateMsg(formOrEl);
    };
  }
})(jQuery);
