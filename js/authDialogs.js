/**
 * =============================================================================
 * File: js/authDialogs.js
 * Purpose: The "Face" of Authentication.
 * =============================================================================
 *
 * NOTE:
 * This file handles the "Visual" part of logging in and signing up.
 * It doesn't do the heavy lifting (database checks) itself; it delegates that to `authHandlers.js`.
 *
 * Instead, this file focuses on:
 *   1. Windows: Creating the Popups (Dialogs) for Login/Signup.
 *   2. Validation: Attaching rules to the forms (Email required, Password strength).
 *   3. UX: Making things nice (Password Eye toggle, Error messages).
 * =============================================================================
 */

(function ($) {
  "use strict";

  $(function () {
    // -------------------------------------------------------------------------
    // STEP 1: GLOBAL ACTIONS
    // -------------------------------------------------------------------------

    // ACTION: Logout
    // We attach this to the global window object so the Navbar "Logout" button can call it easily.
    if (typeof window.logout !== "function") {
      window.logout = function () {
        try {
          if (!confirm("Are you sure you want to logout?")) return;
        } catch (e) {}

        // 1. Clear the browser's memory of the cart
        try {
          localStorage.removeItem("sopopped_cart_v1");
        } catch (e) {}

        // 2. Tell the server to destroy the session
        // Note: We check if we are in the Admin folder or Root folder to set the correct path.
        const basePath = window.location.pathname.includes("/admin/")
          ? "../"
          : "./";

        if (window.sopoppedFetch && window.sopoppedFetch.request) {
          window.sopoppedFetch
            .request(basePath + "api/logout.php", { method: "POST" })
            .then((resp) => {
              // 3. Redirect to Home
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

    // -------------------------------------------------------------------------
    // STEP 2: SETUP DIALOGS (The Popups)
    // -------------------------------------------------------------------------

    // Helper: configures the popup window settings (Width, Modal, Close behavior)
    function dialogOptions(width) {
      const opts =
        window.dialogUI && window.dialogUI.dialogOptions
          ? window.dialogUI.dialogOptions(width)
          : { width: width, modal: true };

      // When the user closes the popup, we want to reset the form.
      // E.g. Clear the typed password so it's fresh next time.
      opts.close = function () {
        const $form = $(this).find("form");
        if ($form.length) {
          $form[0].reset();
          // Clear red error boxes
          $form.find(".is-invalid").removeClass("is-invalid");
          $form.find(".is-valid").removeClass("is-valid");
          if (window.validationUI && window.validationUI.hideValidateMsg) {
            window.validationUI.hideValidateMsg($form);
          }
          $form.find("#success-msg").addClass("d-none");
        }
      };
      return opts;
    }

    // Initialize the actual jQuery UI Dialog widgets
    function initDialogs() {
      if ($.fn.dialog) {
        // Login Popup
        if (!$("#loginDialog").data("ui-dialog")) {
          $("#loginDialog").dialog(dialogOptions(400));
        }
        // Signup Popup (Bit wider for more fields)
        if (!$("#signupDialog").data("ui-dialog")) {
          $("#signupDialog").dialog(dialogOptions(520));
        }

        // Cleanup: Removing Bootstrap classes to avoid style conflicts
        $("#loginDialog, #signupDialog")
          .removeClass("modal fade")
          .removeAttr("tabindex");
      }
    }

    // Run immediately, and also listen for lazy-loaded scripts
    initDialogs();
    document.addEventListener("jquery-ui-loaded", initDialogs);

    // -------------------------------------------------------------------------
    // STEP 3: SETUP VALIDATION (The Rules)
    // -------------------------------------------------------------------------

    function initValidation() {
      if (!$.fn.validate) return; // Wait for library to load
      if ($("#loginForm").data("validator")) return; // Don't run twice

      // 3.1: Define Custom Rules (e.g. "EmailChars", "PasswordStrength")

      $("#loginSubmit, #signupSubmit")
        .off("click.safeguard")
        .on("click.safeguard", function (e) {
          // Legacy click handler - kept for older browsers or double safety
          const $form = $(this).closest("form");
          // ... (existing click logic if needed, but submit handler covers most)
        });

      // 3.2: Configure Behavior (Where to show errors)
      $.validator.setDefaults({
        errorClass: "is-invalid",
        validClass: "is-valid",
        errorElement: "div", // Errors are wrapped in a <div>
        errorPlacement: function (error, element) {
          element.addClass("is-invalid").removeClass("is-valid");
          const $form = element.closest("form");

          // Try to show the main alert box first
          const shown = window.validationUI.showValidateMsg(
            $form,
            error.text(),
            "danger",
          );

          // If no main box, show inline below the input
          if (!shown) {
            error.addClass("invalid-feedback");
            if (element.parent(".input-group").length) {
              error.insertAfter(element.parent());
            } else {
              error.insertAfter(element);
            }
          }
        },
        // Turn input red on error
        highlight: function (element, errorClass, validClass) {
          $(element).addClass(errorClass).removeClass(validClass);
          window.validationUI.revealValidateMsg($(element).closest("form"));
        },
        // Turn input green/normal when fixed
        unhighlight: function (element, errorClass, validClass) {
          $(element).removeClass(errorClass).addClass(validClass);
          const $form = $(element).closest("form");
          const validator = $form.data("validator");
          // Only hide error box if EVERYTHING is fixed
          if (validator && validator.numberOfInvalids() === 0) {
            window.validationUI.hideValidateMsg($form);
          }
        },
      });

      // 3.3: Live "User Exists" Check
      // When user types an email and clicks away ("blur"), we ask server: "Does this exist?"
      $(document)
        .off("blur", "#loginEmail")
        .on("blur", "#loginEmail", function () {
          const $el = $(this);
          const email = $el.val().trim();
          if (email === $el.data("last-checked")) return; // Don't check same email twice

          // Call the logic in authHandlers.js
          setTimeout(() => {
            window.sopoppedAuth.checkUserExists(email, null, {
              $field: $el,
              context: "login",
            });
          }, 300);
          $el.data("last-checked", email);
        })
        .on(
          "keydown",
          "#loginEmail, #signupEmail",
          window.sopoppedValidate.emailKeyFilter,
        );

      $(document)
        .off("blur", "#signupEmail")
        .on("blur", "#signupEmail", function () {
          const $el = $(this);
          window.sopoppedAuth.checkUserExists($el.val().trim(), null, {
            $field: $el,
            context: "signup",
          });
        });

      // 3.4: Attach Rules to Specific Forms

      // LOGIN FORM
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

      // SIGNUP FORM
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
          }, // Must match first password
        },
        messages: {
          password2: { equalTo: "Passwords do not match" },
        },
        submitHandler: window.sopoppedAuth.createSignupSubmitHandler({
          submitBtnSelector: "#signupSubmit",
        }),
      });

      // CHECKOUT FORM
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
        submitHandler: function (form) {
          if (!confirm("Are you sure you want to checkout?")) return false;
          return window.sopoppedAuth.createCheckoutSubmitHandler()(form);
        },
      });

      // CONTACT FORM
      $("#contactForm").validate({
        rules: {
          name: { required: true, minlength: 2 },
          email: { required: true, email: true },
          message: { required: true, minlength: 10, maxlength: 100 },
        },
        submitHandler: function (form) {
          // Simple inline handler for contact form
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
    }

    // Try to init now, and again later if scripts load slowly
    initValidation();
    document.addEventListener("jquery-ui-loaded", initValidation);

    // -------------------------------------------------------------------------
    // STEP 4: UI UX FEATURES
    // -------------------------------------------------------------------------

    // 4.1: URL Parameter Handler
    // If user is redirected here (e.g. "home.php?login_result=success"), show a message.
    (function processUrlParams() {
      try {
        const p = new URLSearchParams(window.location.search);

        if (p.has("login_result")) {
          const res = p.get("login_result");
          const msg = p.get("login_message") || "Login successful!";
          const $d = $("#loginDialog");

          if (res === "success") {
            // Show Success Message
            $d.find("#success-msg").removeClass("d-none").text(msg);
            if ($.fn.dialog) {
              if (!$("#loginDialog").data("ui-dialog")) initDialogs();
              $d.dialog("open");
            } else $d.show();

            // Perform Cart Merge then Close
            window.sopoppedAuth.mergeCartAfterLoginAndUpdateUI().finally(() => {
              setTimeout(() => {
                if ($.fn.dialog) $d.dialog("close");
                else $d.hide();
                window.location.href = window.location.pathname; // Clean URL
              }, 1200);
            });
          } else if (res === "error") {
            window.validationUI.showValidateMsg($("#loginForm"), msg, "danger");
            if ($.fn.dialog) {
              if (!$("#loginDialog").data("ui-dialog")) initDialogs();
              $d.dialog("open");
            } else $d.show();
          }
        }

        // Similar logic for Signup...
        if (p.has("signup_result")) {
          const res = p.get("signup_result");
          const msg = p.get("signup_message") || "Account created!";
          const $d = $("#signupDialog");

          if (res === "success") {
            $d.find("#success-msg").removeClass("d-none").text(msg);
            if ($.fn.dialog) {
              if (!$("#signupDialog").data("ui-dialog")) initDialogs();
              $d.dialog("open");
            } else $d.show();
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
            if ($.fn.dialog) {
              if (!$("#signupDialog").data("ui-dialog")) initDialogs();
              $d.dialog("open");
            } else $d.show();
          }
        }
      } catch (e) {
        console.warn("URL param processing error", e);
      }
    })();

    // 4.2: Button Click Handlers
    $("#loginBtn").on("click", (e) => {
      e.preventDefault();
      $("#loginDialog").data("ui-dialog")
        ? $("#loginDialog").dialog("open")
        : $("#loginDialog").show();
    });

    $("#signupBtn").on("click", (e) => {
      e.preventDefault();
      $("#signupDialog").data("ui-dialog")
        ? $("#signupDialog").dialog("open")
        : $("#signupDialog").show();
    });

    // 4.3: Dialog Switching (Login <-> Signup)
    $(document).on("click", "#openSignup", function (e) {
      e.preventDefault();
      if ($.fn.dialog && $("#loginDialog").data("ui-dialog")) {
        $("#loginDialog").dialog("close");
        $("#signupDialog").dialog("open");
      } else {
        $("#loginDialog").hide();
        $("#signupDialog").show();
      }
    });

    $(document).on("click", "#openLogin", function (e) {
      e.preventDefault();
      if ($.fn.dialog && $("#signupDialog").data("ui-dialog")) {
        $("#signupDialog").dialog("close");
        $("#loginDialog").dialog("open");
      } else {
        $("#signupDialog").hide();
        $("#loginDialog").show();
      }
    });

    // 4.4: Toggle Password Visibility (Monkey Emoji)
    function togglePassword(buttonSelector, fallbackInputSelector) {
      $(document).on("click", buttonSelector, function (e) {
        e.preventDefault();
        const $btn = $(this);
        // Find the input associated with this button
        let $inp = $(
          $btn.data("target") || $btn.data("input") || fallbackInputSelector,
        );

        // Toggle Type: password <-> text
        const isPassword = $inp.attr("type") === "password";
        $inp.attr("type", isPassword ? "text" : "password");
        $btn.text(isPassword ? "🙉" : "🙈"); // Monkey See / Monkey No See
      });
    }

    togglePassword("#toggleLoginPassword", "#loginPassword");
    togglePassword("#toggleSignupPassword", "#signupPassword");
    togglePassword("#toggleSignupPassword2", "#signupPassword2");
    togglePassword("#toggleUserPassword", "#userPassword");

    // 4.4: Responsive Resize
    // If window resizes, ensure dialogs don't overflow the screen
    $(window).on("resize", function () {
      if ($.fn.dialog) {
        $(".ui-dialog-content").each(function () {
          const $d = $(this);
          if ($d.data("ui-dialog") && $d.dialog("isOpen")) {
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
  });
})(jQuery);
