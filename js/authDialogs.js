/**
 * =============================================================================
 * File: js/authDialogs.js
 * Purpose: UI initialization, Validation rules, and Dialog behavior.
 * =============================================================================
 *
 * This file acts as the "Controller" for the authentication UI. It:
 *   1. Initializes jQuery UI dialogs for Login/Signup.
 *   2. Sets up jQuery Validate rules for forms.
 *   3. Connects form submissions to handlers in `authHandlers.js`.
 *   4. Manages UI interactions like Password Toggle and Window Resize.
 *   5. Processes URL parameters for login/signup results (e.g. after redirect).
 *
 * It delegates core logic to:
 *   - authHandlers.js: API interaction, Cart merging, User existence checks
 *   - validation.js: Validation helpers and UI message control
 *   - dialogUI.js: Dialog sizing and positioning
 *
 * TABLE OF CONTENTS:
 *   1. GLOBAL HELPERS (Logout, Error Reporting)
 *   2. CONFIGURATION (Dialog Options)
 *   3. VALIDATION & FORM INITIALIZATION (Rules, Defaults, Handlers)
 *   4. UI BEHAVIORS (Dialog Init, URL Params, Resize, Password Toggle)
 * =============================================================================
 */

(function ($) {
  "use strict";

  $(function () {
    // =========================================================================
    // 1. GLOBAL HELPERS
    // =========================================================================

    /**
     * Global Logout Function
     * Clears local cart and calls server logout API.
     * Exposed globally for navbar onclick events.
     */
    if (typeof window.logout !== "function") {
      window.logout = function () {
        try {
          if (!confirm("Are you sure you want to logout?")) return;
        } catch (e) {}

        // Clear client-side cart (will be cleared on server by session destroy)
        try {
          localStorage.removeItem("sopopped_cart_v1");
        } catch (e) {}

        // Call API
        const basePath = window.location.pathname.includes("/admin/")
          ? "../"
          : "./";

        if (window.sopoppedFetch && window.sopoppedFetch.request) {
          window.sopoppedFetch
            .request(basePath + "api/logout.php", { method: "POST" })
            .then((resp) => {
              const ok = resp && (resp.response ? resp.response.ok : resp.ok);
              const target =
                basePath +
                "home.php" +
                (ok
                  ? "?logout_result=success&logout_message=" +
                    encodeURIComponent("You have been logged out successfully.")
                  : "");
              window.location.href = target;
            })
            .catch(() => {
              window.location.href = basePath + "home.php";
            });
        } else {
          window.location.href = basePath + "home.php";
        }
      };
    }

    // Global Error Handlers (Non-blocking)
    window.addEventListener("unhandledrejection", (ev) =>
      console.error("Unhandled promise:", ev.reason),
    );
    window.addEventListener("error", (ev) =>
      console.error("Uncaught error:", ev.error),
    );

    // =========================================================================
    // 2. CONFIGURATION
    // =========================================================================

    // Delegate to dialogUI.js + Add Form Reset on Close
    function dialogOptions(width) {
      const opts =
        window.dialogUI && window.dialogUI.dialogOptions
          ? window.dialogUI.dialogOptions(width)
          : { width: width, modal: true };

      opts.close = function () {
        const $form = $(this).find("form");
        if ($form.length) {
          $form[0].reset();
          // Clear CSS classes
          $form.find(".is-invalid").removeClass("is-invalid");
          $form.find(".is-valid").removeClass("is-valid");
          // Clear validation/success messages
          if (window.validationUI && window.validationUI.hideValidateMsg) {
            window.validationUI.hideValidateMsg($form);
          }
          $form.find("#success-msg").addClass("d-none");
          // Clear data attributes for user checks
          $form
            .find("input")
            .removeData("exists")
            .removeData("archived")
            .removeData("last-checked");
        }
      };
      return opts;
    }

    // =========================================================================
    // 3. VALIDATION & FORM INITIALIZATION
    // =========================================================================

    function initValidation() {
      if (!$.fn.validate) return; // Not ready yet
      if ($("#loginForm").data("validator")) return; // Already initialized

      // 3.1 - Register Custom Validation Methods (Idempotent)
      // Defer to validation.js logic via window.sopoppedValidate
      if (!$.validator.methods.emailChars) {
        $.validator.addMethod(
          "emailChars",
          function (value, element) {
            return (
              this.optional(element) ||
              window.sopoppedValidate.emailChars(value)
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
            return window.sopoppedValidate.emailFormat(value);
          },
          "Please enter a valid email address.",
        );

        $.validator.addMethod(
          "passwordStrength",
          function (value, element) {
            return (
              this.optional(element) ||
              window.sopoppedValidate.passwordStrength(value)
            );
          },
          "Password must be 8-16 chars, include uppercase, lowercase, number, and special char.",
        );

        $.validator.addMethod(
          "phoneFormat",
          function (value, element) {
            return this.optional(element) || /^\d{4}-\d{3}-\d{4}$/.test(value);
          },
          "Format: 0000-000-0000",
        );
      }

      // 3.2 - Set Validator Defaults
      $.validator.setDefaults({
        errorClass: "is-invalid",
        validClass: "is-valid",
        errorElement: "div",
        errorPlacement: function (error, element) {
          element.addClass("is-invalid").removeClass("is-valid");
          const $form = element.closest("form");
          const shown = window.validationUI.showValidateMsg(
            $form,
            error.text(),
            "danger",
          );
          if (!shown) {
            error.addClass("invalid-feedback");
            if (element.parent(".input-group").length) {
              error.insertAfter(element.parent());
            } else {
              error.insertAfter(element);
            }
          }
        },
        highlight: function (element, errorClass, validClass) {
          $(element).addClass(errorClass).removeClass(validClass);
          window.validationUI.revealValidateMsg($(element).closest("form"));
        },
        unhighlight: function (element, errorClass, validClass) {
          $(element).removeClass(errorClass).addClass(validClass);
          const $form = $(element).closest("form");
          const validator = $form.data("validator");
          if (validator && validator.numberOfInvalids() === 0) {
            window.validationUI.hideValidateMsg($form);
          }
        },
      });

      // 3.3 - Email Blur Handlers (User Existence Check)
      // Remove previous handlers to avoid duplicates if re-init
      $(document)
        .off("blur", "#loginEmail")
        .on("blur", "#loginEmail", function () {
          const $el = $(this);
          const email = $el.val().trim();
          if (email === $el.data("last-checked")) return;

          // Clear any previous timer
          const timer = $el.data("checkTimer");
          if (timer) clearTimeout(timer);

          $el.data("last-checked", email);
          const newTimer = setTimeout(() => {
            window.sopoppedAuth.checkUserExists(email, null, {
              $field: $el,
              context: "login",
            });
          }, 300);
          $el.data("checkTimer", newTimer);
        });

      $(document)
        .off("blur", "#signupEmail")
        .on("blur", "#signupEmail", function () {
          const $el = $(this);
          window.sopoppedAuth.checkUserExists($el.val().trim(), null, {
            $field: $el,
            context: "signup",
          });
        });

      // 4.1 - Login Form
      $("#loginForm").validate({
        rules: {
          email: {
            required: true,
            email: true,
            emailChars: true,
            emailFormat: true,
          },
          password: { required: true },
        },
        messages: {
          email: { required: "Please enter your email" },
          password: { required: "Please enter your password" },
        },
        submitHandler: window.sopoppedAuth.createLoginSubmitHandler({
          submitBtnSelector: "#loginSubmit",
        }),
      });

      // 4.2 - Signup Form
      $("#signupForm").validate({
        rules: {
          name: { required: true, minlength: 2 },
          last: { required: true, minlength: 2 },
          email: {
            required: true,
            email: true,
            emailChars: true,
            emailFormat: true,
          },
          phone: { required: true, phoneFormat: true },
          password: { required: true, passwordStrength: true },
          password2: {
            required: true,
            equalTo: "#signupPassword",
            passwordStrength: true,
          },
        },
        messages: {
          password2: { equalTo: "Passwords do not match" },
        },
        submitHandler: window.sopoppedAuth.createSignupSubmitHandler({
          submitBtnSelector: "#signupSubmit",
        }),
      });

      // 4.3 - Checkout Form
      $("#checkoutForm").validate({
        rules: {
          firstName: { required: true, minlength: 2 },
          lastName: { required: true, minlength: 2 },
          email: { required: true, email: true },
          address: { required: true, minlength: 5 },
          province: { required: true },
          city: { required: true },
          barangay: { required: true },
          paymentMethod: { required: true },
        },
        submitHandler: window.sopoppedAuth.createCheckoutSubmitHandler(),
      });

      // 4.4 - Contact Form
      $("#contactForm").validate({
        rules: {
          name: { required: true, minlength: 2 },
          email: { required: true, email: true },
          message: { required: true, minlength: 10, maxlength: 100 },
        },
        submitHandler: function (form) {
          const $form = $(form);
          const body = $form.serialize();
          window.sopoppedFetch
            .postForm("./api/contact_submit.php", body)
            .then((resp) => {
              if (resp && resp.success) {
                window.validationUI.hideValidateMsg($form);
                $form
                  .find("#success-msg")
                  .removeClass("d-none")
                  .text("Message sent!");
                form.reset();
                setTimeout(
                  () => $form.find("#success-msg").addClass("d-none"),
                  3500,
                );
              } else {
                window.validationUI.showValidateMsg(
                  $form,
                  "Failed to send message.",
                  "danger",
                );
              }
            })
            .catch(() =>
              window.validationUI.showValidateMsg(
                $form,
                "Network error.",
                "danger",
              ),
            );
        },
      });

      // UX handlers
      $(document).on("input blur", "form input, form textarea", function () {
        if ($(this).val() === "") $(this).removeClass("is-valid");
      });

      $(document).on("focus input", "form input", function () {
        const $form = $(this).closest("form");
        if ($form.data("message-shown")) {
          window.validationUI.hideValidateMsg($form);
          $form.find("#success-msg").addClass("d-none");
          $form.removeData("message-shown");
        }
      });
    }

    // Attempt init immediately
    initValidation();

    // Re-attempt when ready
    document.addEventListener("jquery-ui-loaded", initValidation);

    // =========================================================================
    // 4. UI BEHAVIORS
    // =========================================================================

    // 4.1 - Initialize Dialogs Function (Idempotent)
    function initDialogs() {
      if ($.fn.dialog) {
        // Only init if not already turned into a widget
        if (!$("#loginDialog").data("ui-dialog")) {
          $("#loginDialog").dialog(dialogOptions(400));
        }
        if (!$("#signupDialog").data("ui-dialog")) {
          $("#signupDialog").dialog(dialogOptions(520));
        }

        // Remove Bootstrap modal classes if they were added as fallback
        $("#loginDialog, #signupDialog")
          .removeClass("modal fade")
          .removeAttr("tabindex");
      }
    }

    // Attempt init immediately
    initDialogs();

    // Re-attempt init when loadComponents.js finishes lazy loading
    document.addEventListener("jquery-ui-loaded", initDialogs);

    // 4.2 - Process URL Parameters (e.g. Login Results)
    (function processUrlParams() {
      try {
        const p = new URLSearchParams(window.location.search);

        // Login Result
        if (p.has("login_result")) {
          const res = p.get("login_result");
          const msg = p.get("login_message") || "Login successful!";
          const $d = $("#loginDialog");

          if (res === "success") {
            // Show success and trigger cart merge
            $d.find("#success-msg").removeClass("d-none").text(msg);

            // Wait for dialog logic if needed
            if ($.fn.dialog && !$("#loginDialog").data("ui-dialog"))
              initDialogs();

            if ($.fn.dialog) $d.dialog("open");
            else $d.show(); // Fallback visibility

            // Delegate cart merge to authHandlers
            window.sopoppedAuth.mergeCartAfterLoginAndUpdateUI().finally(() => {
              setTimeout(() => {
                if ($.fn.dialog) $d.dialog("close");
                else $d.hide();
                window.location.href = window.location.pathname; // Clear params
              }, 1200);
            });
          } else if (res === "error") {
            window.validationUI.showValidateMsg($("#loginForm"), msg, "danger");
            if ($.fn.dialog) {
              if (!$("#loginDialog").data("ui-dialog")) initDialogs();
              $d.dialog("open");
            } else {
              $d.show();
            }
          }
        }

        // Signup Result
        if (p.has("signup_result")) {
          const res = p.get("signup_result");
          const msg = p.get("signup_message") || "Account created!";
          const $d = $("#signupDialog");

          if (res === "success") {
            $d.find("#success-msg").removeClass("d-none").text(msg);

            if ($.fn.dialog && !$("#signupDialog").data("ui-dialog"))
              initDialogs();

            if ($.fn.dialog) $d.dialog("open");
            else $d.show();

            setTimeout(() => {
              if ($.fn.dialog) $d.dialog("close");
              else $d.hide();
              window.location.href = window.location.pathname;
            }, 3000);
          } else if (res === "error") {
            window.validationUI.showValidateMsg(
              $("#signupForm"),
              msg,
              "danger",
            );

            if ($.fn.dialog && !$("#signupDialog").data("ui-dialog"))
              initDialogs();

            if ($.fn.dialog) $d.dialog("open");
            else $d.show();
          }
        }
      } catch (e) {
        console.warn("URL param processing error", e);
      }
    })();

    // 4.3 - Navbar Button Handlers
    $("#loginBtn").on("click", (e) => {
      e.preventDefault();
      if ($.fn.dialog) {
        if (!$("#loginDialog").data("ui-dialog")) initDialogs();
        $("#loginDialog").dialog("open");
      } else {
        // Fallback: Bootstrap or simple show
        // If we added .modal class, we can try bootstrap logic, or just show()
        // Here we just use basic show() as emergency fallback if UI failed to load
        console.warn("jQuery UI not ready, using simple visibility toggle");
        $("#loginDialog").show().css({
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          padding: "20px",
          "z-index": 1050,
          border: "1px solid #ccc",
          "box-shadow": "0 0 10px rgba(0,0,0,0.5)",
        });
      }
    });

    $("#signupBtn").on("click", (e) => {
      e.preventDefault();
      if ($.fn.dialog) {
        if (!$("#signupDialog").data("ui-dialog")) initDialogs();
        $("#signupDialog").dialog("open");
      } else {
        console.warn("jQuery UI not ready, using simple visibility toggle");
        $("#signupDialog").show().css({
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          padding: "20px",
          "z-index": 1050,
          border: "1px solid #ccc",
          "box-shadow": "0 0 10px rgba(0,0,0,0.5)",
        });
      }
    });

    // Switch between dialogs
    $("#openSignup").on("click", (e) => {
      e.preventDefault();
      if ($.fn.dialog) {
        $("#loginDialog").dialog("close");
        if (!$("#signupDialog").data("ui-dialog")) initDialogs();
        $("#signupDialog").dialog("open");
      } else {
        $("#loginDialog").hide();
        $("#signupDialog").show();
      }
    });

    $("#openLogin").on("click", (e) => {
      e.preventDefault();
      if ($.fn.dialog) {
        $("#signupDialog").dialog("close");
        if (!$("#loginDialog").data("ui-dialog")) initDialogs();
        $("#loginDialog").dialog("open");
      } else {
        $("#signupDialog").hide();
        $("#loginDialog").show();
      }
    });

    // 4.4 - Password Visibility Toggle
    // Returns emoji-based toggling (Monkey See/No-See)
    function togglePassword(buttonSelector, fallbackInputSelector) {
      $(document).on("click", buttonSelector, function (e) {
        e.preventDefault();
        const $btn = $(this);

        // Prefer explicit data attributes if provided
        const explicit = $btn.attr("data-target") || $btn.attr("data-input");
        let $inp = null;
        if (explicit) {
          try {
            $inp = $(explicit);
          } catch (e) {
            $inp = null;
          }
        }

        // If no explicit target, try to find an input within the same form/dialog
        if (!($inp && $inp.length)) {
          const $form = $btn.closest("form, .ui-dialog, .modal");
          if ($form && $form.length) {
            $inp = $form.find("input[type='password']").first();
          }
        }

        // Use provided selector as a final option
        if (!($inp && $inp.length) && fallbackInputSelector) {
          $inp = $(fallbackInputSelector);
        }

        if (!($inp && $inp.length)) return;

        // Only toggle the first matched input
        const $first = $inp.eq(0);
        const isPassword = $first.attr("type") === "password";
        $first.attr("type", isPassword ? "text" : "password");
        $btn.text(isPassword ? "🙉" : "🙈");
      });
    }

    // Bind handlers for known toggles.
    togglePassword("#toggleLoginPassword", "#loginPassword");
    togglePassword("#toggleSignupPassword", "#signupPassword");
    togglePassword("#toggleSignupPassword2", "#signupPassword2");
    togglePassword("#toggleUserPassword", "#userPassword");

    // 4.5 - Responsive Resize
    $(window).on("resize", function () {
      if ($.fn.dialog) {
        $(".ui-dialog-content").each(function () {
          const $d = $(this);
          if ($d.data("ui-dialog") && $d.dialog("isOpen")) {
            // Re-apply max height logic from dialogUI
            const maxH =
              window.innerHeight -
              (window.dialogUI.dialogMaxHeightOffset
                ? window.dialogUI.dialogMaxHeightOffset()
                : 100);
            $d.dialog("option", "maxHeight", maxH);
            $d.dialog("option", "position", {
              my: "center",
              at: "center",
              of: window,
            });
          }
        });
      }
    });

    // 4.6 - Bootstrap Modal Fallback (Init Only)
    if (!$.fn.dialog) {
      // Temporarily mark as bootstrap modal until UI loads
      $("#loginDialog, #signupDialog")
        .addClass("modal fade")
        .attr("tabindex", "-1");
    }
  });
})(jQuery);
