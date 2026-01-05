/**
 * Admin Panel Validation Logic
 *
 * NOTE: Global validation methods (emailChars, emailFormat, passwordStrength)
 * and default settings (errorPlacement, etc.) are already initialized by
 * `js/authDialogs.js`, which is loaded before this script in footer.php.
 * This file uses window.validationUI when available for consistent message display.
 */
(function ($) {
  "use strict";
  $(function () {
    if (!$.validator) return;

    // Helper to use validationUI or fallback
    const ui = window.validationUI || null;

    // Configure default validation behavior to use #validate-msg with friendly summary
    $.validator.setDefaults({
      errorElement: "div",
      errorClass: "is-invalid",
      validClass: "is-valid",
      errorPlacement: function (error, element) {
        const form = $(element).closest("form");

        // Try using validationUI first
        if (ui && ui.showValidateMsg) {
          const shown = ui.showValidateMsg(form, error.text(), "danger");
          if (shown) return;
        }

        // Fallback: Collect all errors and put them in #validate-msg
        const msgContainer = form.find("#validate-msg");
        if (msgContainer.length) {
          msgContainer.removeClass("d-none");
          const text = error.text();
          // Avoid duplicates
          if (msgContainer.text().indexOf(text) === -1) {
            const currentText = msgContainer.html();
            msgContainer.html((currentText ? currentText + "<br>" : "") + text);
          }
        } else {
          error.insertAfter(element);
        }
      },
      highlight: function (element, errorClass, validClass) {
        $(element).addClass(errorClass).removeClass(validClass);

        // Reveal validate-msg if using validationUI
        const form = $(element).closest("form");
        if (ui && ui.revealValidateMsg) {
          ui.revealValidateMsg(form);
        }
      },
      unhighlight: function (element, errorClass, validClass) {
        $(element).removeClass(errorClass).addClass(validClass);

        // Hide validate-msg if no more errors
        const form = $(element).closest("form");
        const validator = form.data("validator");
        if (validator && validator.numberOfInvalids() === 0) {
          if (ui && ui.hideValidateMsg) {
            ui.hideValidateMsg(form);
          } else {
            form.find("#validate-msg").addClass("d-none").html("");
          }
        }
      },
      showErrors: function (errorMap, errorList) {
        const form = $(this.currentForm);
        const msgContainer = form.find("#validate-msg");

        // 1. Clear container first so we don't accumulate old errors
        if (msgContainer.length && errorList.length > 0) {
          msgContainer.html("");
          msgContainer.removeClass("d-none");
        } else if (msgContainer.length && errorList.length === 0) {
          msgContainer.addClass("d-none").html("");
        }

        // 2. Let default logic run (triggers errorPlacement for each error)
        this.defaultShowErrors();

        // 3. If multiple errors exist, replace specific list with a friendly summary
        if (msgContainer.length && errorList.length > 1) {
          msgContainer.text("Please fill out all required fields.");
        }
      },
    });

    // 1. User Modal Validation
    $("#userForm").validate({
      rules: {
        first_name: { required: true, minlength: 2 },
        last_name: { required: true, minlength: 2 },
        email: {
          required: true,
          email: true,
          emailChars: true,
          emailFormat: true,
        },
        password: {
          // Password required for new users (no ID), optional for edits
          required: function (element) {
            return !$("#userId").val();
          },
          passwordStrength: true,
        },
        role: "required",
      },
      messages: {
        first_name: "First name is required and must be at least 2 characters",
        last_name: "Last name is required and must be at least 2 characters",
        email: {
          required: "Please enter an email address",
          email: "Please enter a valid email address",
          emailChars: "Email contains invalid characters",
          emailFormat: "Email format is invalid",
        },
        password: {
          required: "Password is required for new users",
          passwordStrength:
            "Password is too weak (8-16 chars, mixed case, numbers, symbols)",
        },
      },
      invalidHandler: function (event, validator) {
        var errors = validator.numberOfInvalids();
        if (errors > 1) {
          var $form = $(validator.currentForm);
          var $msg = $form.find("#validate-msg");
          if ($msg.length) {
            $msg
              .removeClass("d-none alert-success alert-danger alert-info")
              .addClass("alert alert-danger")
              .text("Please fill in all required fields.")
              .show();
          }
        }
      },
    });

    // 2. Product Modal Validation
    $("#productForm").validate({
      rules: {
        name: "required",
        price: { required: true, number: true, min: 0 },
        quantity: { required: true, digits: true, min: 1 },
      },
      messages: {
        name: "Product name is required",
        price: {
          required: "Price is required",
          min: "Price cannot be negative",
        },
        quantity: {
          required: "Stock is required",
          min: "Stock must be at least 1",
        },
      },
    });

    // 3. Input Restriction & Formatting
    // Apply shared email filter to admin email field
    $(document).on("keydown", "#email", function (e) {
      if (
        window.sopoppedValidate &&
        typeof window.sopoppedValidate.emailKeyFilter === "function"
      ) {
        window.sopoppedValidate.emailKeyFilter(e);
      }
    });

    // --- FALLBACK for Missing Validation Methods ---
    // Removed: Validation methods are now guaranteed by authDialogs.js / validateHelper.js
  });
})(jQuery);
