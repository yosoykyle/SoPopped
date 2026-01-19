// Dialog, validation and UI behaviors. Uses jQuery UI/jQuery Validate when available
// but is framework-agnostic: it falls back to Bootstrap modals and plain DOM APIs
// when jQuery UI or validation plugins are missing. Exposes `window.sopoppedUI` and
// registers adapters so other scripts can reuse the same helpers.
(function ($) {
  $(function () {
    // Ensure a safe global logout function exists even if jQuery UI or the
    // dialog initialization is skipped. Navbar uses `onclick="window.logout()"`.
    // Keep implementation small and tolerant: try AJAX logout via sopoppedFetch
    // when available, otherwise fall back to a simple redirect.
    if (typeof window.logout !== "function") {
      window.logout = function () {
        try {
          if (!confirm("Are you sure you want to logout?")) return;
        } catch (e) {
          /* non-blocking */
        }
        try {
          localStorage.removeItem("sopopped_cart_v1");
        } catch (e) {}
        if (
          window.sopoppedFetch &&
          typeof window.sopoppedFetch.request === "function"
        ) {
          // Use absolute path to work from both customer and admin pages
          const basePath = window.location.pathname.includes("/admin/")
            ? "../"
            : "./";
          window.sopoppedFetch
            .request(basePath + "api/logout.php", { method: "POST" })
            .then(function (resp) {
              try {
                var ok =
                  resp && resp.response ? resp.response.ok : resp && resp.ok;
                if (ok)
                  window.location.href =
                    basePath +
                    "home.php?logout_result=success&logout_message=" +
                    encodeURIComponent(
                      "You have been logged out successfully."
                    );
                else window.location.href = basePath + "home.php";
              } catch (e) {
                window.location.href = basePath + "home.php";
              }
            })
            .catch(function () {
              window.location.href = basePath + "home.php";
            });
        } else {
          // No AJAX helper available — simple redirect
          const basePath = window.location.pathname.includes("/admin/")
            ? "../"
            : "./";
          window.location.href = basePath + "home.php";
        }
      };
    }
    // Global error handlers: log and optionally report without breaking UX.
    window.addEventListener("unhandledrejection", function (ev) {
      try {
        const err = ev && ev.reason ? ev.reason : ev;
        console.error("Unhandled promise rejection", err);
        if (
          window.sopoppedUI &&
          typeof window.sopoppedUI.reportError === "function"
        ) {
          try {
            window.sopoppedUI.reportError(err);
          } catch (e) {}
        }
      } catch (e) {}
    });

    window.addEventListener("error", function (ev) {
      try {
        const err = ev && ev.error ? ev.error : ev;
        console.error("Uncaught error", err);
        if (
          window.sopoppedUI &&
          typeof window.sopoppedUI.reportError === "function"
        ) {
          try {
            window.sopoppedUI.reportError(err);
          } catch (e) {}
        }
      } catch (e) {}
    });
    // ===== INITIALIZATION =====
    // Use shared uiHelpers if available, otherwise fall back to local implementations
    function dialogOptions(width) {
      try {
        if (
          window.dialogUI &&
          typeof window.dialogUI.dialogOptions === "function"
        ) {
          return window.dialogUI.dialogOptions(width);
        }
      } catch (e) {}

      // local implementation (default)
      const nav = document.querySelector(".navbar");
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;
      const maxH = window.innerHeight - Math.max(120, navHeight + 40);
      return {
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
          const nav = document.querySelector(".navbar");
          const topOffset = nav ? nav.getBoundingClientRect().height + 10 : 10;
          try {
            $(this)
              .parent()
              .css({ top: topOffset + "px" });
          } catch (e) {}
        },
      };
    }

    function setupDialogs() {
      // Validation setup should run regardless of jQuery UI presence

      // ===== VALIDATION SETUP =====
      // 1.1 - Setup validation methods and form validation rules
      if ($.validator) {

        // 1.6 - Set default validation settings for Bootstrap compatibility
        $.validator.setDefaults({
          errorClass: "is-invalid",
          validClass: "is-valid",
          errorElement: "div",
          // Custom error placement to use the validate-msg div
          errorPlacement: function (error, element) {
            // Add the error class to the input
            element.addClass("is-invalid").removeClass("is-valid");

            // Try to show message in the form-local validate-msg; otherwise use default placement
            const $form = element.closest("form");
            const shown =
              window.validationUI && window.validationUI.showValidateMsg
                ? window.validationUI.showValidateMsg(
                    $form,
                    error.text(),
                    "danger"
                  )
                : false;
            if (!shown) {
              // Use original placement if no validate-msg div found
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

            // Reveal the form-local validate-msg if it exists
            const $form = $(element).closest("form");
            if (window.validationUI && window.validationUI.revealValidateMsg) {
              window.validationUI.revealValidateMsg($form);
            }
          },
          unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

            // Check if there are other errors in the form
            let $form = $(element).closest("form");
            let validator = $form.data("validator") || $form.validate();

            if (validator && validator.numberOfInvalids() === 0) {
              // Hide the form-local validate-msg if no more errors
              if (window.validationUI && window.validationUI.hideValidateMsg) {
                window.validationUI.hideValidateMsg($form);
              }
            }
          },
        });

        // Local validation functions removed in favor of window.validationUI

        // Aliasing window.sopoppedUI to window.validationUI (already done in validationUI.js, but ensuring here)
        // Wrappers removed since they were redundant.

        // If a global non-jQuery adapter exists, register the jQuery helpers so it can delegate to them
        try {
          if (
            window &&
            window.sopoppedValidate &&
            typeof window.sopoppedValidate === "object"
          ) {
            window.sopoppedValidate._jq = {
              show: function ($form, text, type) {
                try {
                  if (
                    window.validationUI &&
                    typeof window.validationUI.showValidateMsg === "function"
                  ) {
                    return window.validationUI.showValidateMsg(
                      $form,
                      text,
                      type
                    );
                  }
                  return false;
                } catch (e) {
                  return false;
                }
              },
              hide: function ($form) {
                try {
                  if (
                    window.validationUI &&
                    typeof window.validationUI.hideValidateMsg === "function"
                  ) {
                    return window.validationUI.hideValidateMsg($form);
                  }
                  return false;
                } catch (e) {
                  return false;
                }
              },
            };
          }
        } catch (e) {
          /* noop */
        }

        // Helper: check whether an email exists on the server and update the field's data attributes.
        // opts: { $field, $form, context: 'login'|'signup' }
        function checkUserExists(email, cb, opts) {
          opts = opts || {};
          const $field = opts.$field || $(opts.selector || "#loginEmail");
          // Derive $form only from opts.$form or $field.closest('form') to avoid brittle global heuristics
          const $form =
            opts.$form ||
            ($field && $field.closest ? $field.closest("form") : null);
          if ((!$form || !$form.length) && !opts.$form) {
            try {
              console.warn(
                "checkUserExists: no form provided or derivable from field; messages may not display"
              );
            } catch (e) {}
          }
          const context = opts.context || "login";
          if (!email) {
            if ($field && $field.length) {
              $field.data("exists", undefined);
              $field.data("archived", undefined);
            }
            if ($form && $form.length) {
              if (window.validationUI && window.validationUI.hideValidateMsg)
                window.validationUI.hideValidateMsg($form);
            }
            if (typeof cb === "function") cb({});
            return;
          }
          // Use centralized fetch helper to simplify AJAX code.
          const _checkUserExistsFetcher = window.sopoppedFetch.postForm(
            "./api/check_user_exists.php",
            new URLSearchParams({ email: email })
          );

          Promise.resolve(_checkUserExistsFetcher)
            .then((json) => {
              try {
                const exists =
                  json && typeof json.exists === "boolean"
                    ? json.exists
                    : undefined;
                const archived =
                  json && typeof json.is_archived !== "undefined"
                    ? !!json.is_archived
                    : false;
                if (exists === true) {
                  if ($field && $field.length) {
                    $field.data("exists", true);
                    $field.data("archived", archived);
                  }
                  // For signup flow, show a helpful message
                  if (context === "signup") {
                    if (
                      window.validationUI &&
                      window.validationUI.showValidateMsg
                    ) {
                      window.validationUI.showValidateMsg(
                        $form,
                        archived
                          ? "This email belongs to an archived account — creating a new account with the same email is not allowed."
                          : "An account already exists with that email address.",
                        "danger"
                      );
                    }
                  } else if (context === "login") {
                    // For login, show message if archived (non-archived active accounts can proceed)
                    if (archived) {
                      showValidateMsg(
                        $form,
                        "This account has been deactivated. Please contact support to reactivate your account.",
                        "danger"
                      );
                    } else {
                      // Active account - clear any previous messages
                      if (
                        window.validationUI &&
                        window.validationUI.hideValidateMsg
                      )
                        window.validationUI.hideValidateMsg($form);
                    }
                  }
                } else {
                  // Account does not exist
                  if ($field && $field.length) {
                    $field.data("exists", false);
                    $field.data("archived", false);
                  }
                  // For login flow, show message that account doesn't exist
                  if (context === "login") {
                    if (
                      window.validationUI &&
                      window.validationUI.showValidateMsg
                    ) {
                      window.validationUI.showValidateMsg(
                        $form,
                        "No account found with that email address.",
                        "danger"
                      );
                    }
                  } else {
                    if (
                      window.validationUI &&
                      window.validationUI.hideValidateMsg
                    )
                      window.validationUI.hideValidateMsg($form);
                  }
                }
              } catch (e) {
                console.warn("check_user_exists processing failed", e);
              }
              if (typeof cb === "function") cb(json || {});
            })
            .catch((err) => {
              console.warn("check_user_exists failed", err);
              if ($field && $field.length) {
                $field.data("exists", undefined);
                $field.data("archived", undefined);
              }
              if (typeof cb === "function") cb({});
            });
        }

        // --- VALIDATION HELPERS (Aliases to window.validationUI) ---
        // These fix the ReferenceErrors where the code calls showValidateMsg directly.
        function showValidateMsg($form, msg, type) {
          if (window.validationUI && window.validationUI.showValidateMsg) {
            return window.validationUI.showValidateMsg($form, msg, type);
          }
          // Fallback if UI helper missing: minimally show alert
          try {
            const $el = $form.find("#validate-msg");
            $el
              .removeClass("d-none alert-success alert-danger")
              .addClass("alert-" + (type || "danger"))
              .text(msg);
            return true;
          } catch (e) {}
        }

        function hideValidateMsg($form) {
          if (window.validationUI && window.validationUI.hideValidateMsg) {
            return window.validationUI.hideValidateMsg($form);
          }
          try {
            $form.find("#validate-msg").addClass("d-none").text("");
          } catch (e) {}
        }

        // 1.7.1 - Remote check for login email existence (improves UX)
        // Use debouncing to prevent multiple rapid calls
        let loginEmailCheckTimeout;
        let loginEmailCheckPending = false;
        $(document).on("blur", "#loginEmail", function () {
          const $el = $(this);
          const email = $el.val().trim();
          const lastChecked = $el.data("last-checked-email");

          // Only check if email changed
          if (email === lastChecked) {
            return;
          }

          // Clear any pending check
          if (loginEmailCheckTimeout) clearTimeout(loginEmailCheckTimeout);

          // Store the email being checked
          $el.data("last-checked-email", email);

          // Mark check as pending
          loginEmailCheckPending = true;

          // Debounce: wait 300ms before checking
          loginEmailCheckTimeout = setTimeout(function () {
            checkUserExists(
              email,
              function () {
                // Mark as complete when callback fires
                loginEmailCheckPending = false;
              },
              { $field: $el, $form: $el.closest("form"), context: "login" }
            );
          }, 300);
        });

        // 1.7.2 - Remote check for signup email to prevent duplicate registrations
        $(document).on("blur", "#signupEmail", function () {
          const $el = $(this);
          const email = $el.val().trim();
          checkUserExists(email, null, {
            $field: $el,
            $form: $el.closest("form"),
            context: "signup",
          });
        });

        // Common validation pieces to avoid duplication
        const commonEmailRules = {
          required: true,
          email: true,
          emailChars: true,
          emailFormat: true,
        };

        const commonEmailMessages = {
          required: "Please enter your email address",
          email: "Please enter a valid email address",
          emailChars:
            "Email can only contain letters, numbers, underscores, periods, and @ symbol",
          emailFormat: "Email must have a valid format with @ and domain",
        };

        // 1.7 - Setup login form validation rules and messages
        if ($.fn.validate) {
          $("#loginForm").validate({
            rules: {
              email: {
                ...commonEmailRules,
              },
              password: {
                required: true,
              },
            },
            messages: {
              email: {
                ...commonEmailMessages,
              },
              password: {
                required: "Please enter your password",
              },
            },
            submitHandler: function (form) {
              // Show loading state
              const submitBtn = $("#loginSubmit");
              const originalText = submitBtn.text();
              submitBtn.prop("disabled", true).text("Logging in...");

              // Hide any previous error messages in this form
              const $form = $(form);
              if (window.validationUI && window.validationUI.hideValidateMsg)
                window.validationUI.hideValidateMsg($form);

              // Check if we already know the email doesn't exist (from blur validation)
              const emailExists = $form.find("#loginEmail").data("exists");
              const emailArchived = $form.find("#loginEmail").data("archived");

              // If check is still pending, wait for it
              if (loginEmailCheckPending) {
                submitBtn.prop("disabled", false).text(originalText);
                setTimeout(function () {
                  // Re-trigger submit after a short delay
                  $form.submit();
                }, 500);
                return false;
              }

              if (emailExists === false) {
                if (
                  window.validationUI &&
                  window.validationUI.showValidateMsg
                ) {
                  window.validationUI.showValidateMsg(
                    $form,
                    "No account found with that email address.",
                    "danger"
                  );
                }
                submitBtn.prop("disabled", false).text(originalText);
                return false;
              }

              // Check if account is archived BEFORE submitting
              if (emailExists === true && emailArchived === true) {
                if (
                  window.validationUI &&
                  window.validationUI.showValidateMsg
                ) {
                  window.validationUI.showValidateMsg(
                    $form,
                    "This account has been deactivated. Please contact support to reactivate your account.",
                    "danger"
                  );
                }
                submitBtn.prop("disabled", false).text(originalText);
                return false;
              }

              // Submit via AJAX (server will validate email existence if not cached)
              ajaxLogin();
              return false;

              // Session polling configuration (easy to tweak for slower/dev machines)
              // Session polling defaults: 2000ms total wait, 200ms interval — good for local dev
              const SESSION_POLL_TIMEOUT_MS = 2000; // total time to wait for session to appear
              const SESSION_POLL_INTERVAL_MS = 200; // polling interval

              // Wait for the server session to be ready after AJAX login.
              // Polls `api/session_info.php` every `interval` ms until `logged_in:true` or timeout.
              async function waitForSessionReady(
                timeout = SESSION_POLL_TIMEOUT_MS,
                interval = SESSION_POLL_INTERVAL_MS
              ) {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                  try {
                    // Prefer the shared helper when available. The helper is defined
                    // in `js/sessionHelper.js` and performs the fetch to the server.
                    const si = await window.sopoppedSession.fetchInfo();
                    if (si && si.logged_in) return true;
                  } catch (e) {
                    // network error - ignore and retry until timeout
                  }
                  await new Promise((r) => setTimeout(r, interval));
                }
                return false;
              }

              function ajaxLogin() {
                const fd = new FormData(form);
                const body = new URLSearchParams();
                for (const pair of fd.entries()) body.append(pair[0], pair[1]);

                // Use centralized request helper
                const _loginRequest = window.sopoppedFetch.request(
                  "./api/login_submit.php",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                    body: body,
                  }
                );

                Promise.resolve(_loginRequest)
                  .then(async ({ response, ok, status, json: payload }) => {
                    if (!ok) {
                      // Check if we know the email doesn't exist (from cached blur check)
                      const emailExists = $form
                        .find("#loginEmail")
                        .data("exists");
                      let msg;

                      if (emailExists === false) {
                        // Use specific message for non-existent account
                        msg = "No account found with that email address.";
                      } else {
                        // Use server message or generic message for other errors
                        msg =
                          (payload &&
                            (payload.error ||
                              (payload.errors &&
                                JSON.stringify(payload.errors)))) ||
                          "Invalid email or password.";
                      }

                      // Show error using consistent helper
                      showValidateMsg($form, msg, "danger");
                      $form.data("message-shown", true);
                      submitBtn.prop("disabled", false).text(originalText);
                      return;
                    }
                    if (payload && payload.success) {
                      // Hide error message and show success
                      $form.find("#validate-msg").addClass("d-none").text("");
                      const successMsg =
                        (payload && payload.message) || "Login successful!";
                      $form
                        .find("#success-msg")
                        .removeClass("d-none")
                        .text(successMsg);
                      $form.data("message-shown", true);
                      // Login succeeded — wait for session readiness and then merge local cart into server cart
                      (async function () {
                        const ready = await waitForSessionReady();
                        if (!ready) {
                          // If the session didn't become ready in time, reload the page to ensure consistent state
                          window.location.reload();
                          return false;
                        }
                        return window.cartHelpers.mergeCartAfterLoginAndUpdateUI();
                      })()
                        .then((ok) => {
                          try {
                            // Aggressive cleanup
                            const $dlg = $("#loginDialog");
                            if (
                              $dlg.length &&
                              $dlg.dialog &&
                              $dlg.hasClass("ui-dialog-content")
                            ) {
                              $dlg.dialog("close");
                            }
                            $(".modal-backdrop").remove();
                            $(".ui-widget-overlay").remove();
                            $("body").removeClass("modal-open");
                          } catch (e) {}
                          if (payload && payload.redirect) {
                            window.location.href = payload.redirect;
                          } else {
                            window.location.reload();
                          }
                        })
                        .catch(() => {
                          $(".modal-backdrop").remove();
                          $("body").removeClass("modal-open");
                          if (payload && payload.redirect) {
                            window.location.href = payload.redirect;
                          } else {
                            window.location.reload();
                          }
                        });
                    } else {
                      const err =
                        (payload &&
                          (payload.error ||
                            (payload.errors &&
                              JSON.stringify(payload.errors)))) ||
                        "Invalid email or password.";
                      // Show error using consistent helper
                      showValidateMsg($form, err, "danger");
                      $form.data("message-shown", true);
                      submitBtn.prop("disabled", false).text(originalText);
                    }
                  })
                  .catch((err) => {
                    console.error("Login request failed", err);
                    try {
                      showValidateMsg(
                        $form,
                        "Network or server error. Please try again later.",
                        "danger"
                      );
                    } catch (e) {}
                    $form.data("message-shown", true);
                    submitBtn.prop("disabled", false).text(originalText);
                  });
              }

              // Submit via AJAX
              ajaxLogin();
              // Prevent default since we've handled submission via fetch
              return false;
            },
          });
        } // end if ($.fn.validate) for loginForm

        // 1.8 - Setup signup form validation rules and messages
        $("#signupForm").validate({
          rules: {
            name: {
              required: true,
              minlength: 2,
            },
            last: {
              required: true,
              minlength: 2,
            },
            email: {
              ...commonEmailRules,
            },
            phone: {
              required: true,
              phoneFormat: true,
            },
            password: {
              required: true,
              passwordStrength: true,
            },
            password2: {
              required: true,
              equalTo: "#signupPassword",
              passwordStrength: true,
            },
          },
          messages: {
            name: {
              required: "Please enter your first name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            last: {
              required: "Please enter your last name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              ...commonEmailMessages,
            },
            phone: {
              required: "Please enter your phone number",
              phoneFormat: "Please enter phone in format: 0000-000-0000",
            },
            password: {
              required: "Please enter a password",
              passwordStrength:
                "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)",
            },
            password2: {
              required: "Please confirm your password",
              equalTo: "Passwords do not match",
              passwordStrength:
                "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)",
            },
          },
          submitHandler: function (form) {
            // Show loading state
            const submitBtn = $("#signupSubmit");
            const originalText = submitBtn.text();
            submitBtn.prop("disabled", true).text("Creating Account...");

            // Hide any previous error messages
            const $form = $(form);
            hideValidateMsg($form);
            // If we have an explicit existence check and it says the account exists, block submit
            const emailExists = $form.find("#signupEmail").data("exists");
            if (typeof emailExists !== "undefined" && emailExists === true) {
              showValidateMsg(
                $form,
                "An account already exists with that email address.",
                "danger"
              );
              submitBtn.prop("disabled", false).text(originalText);
              return false; // prevent submit
            }

            // If we don't have a cached existence result, perform a final check before submitting
            if (typeof emailExists === "undefined") {
              const email = $form.find("#signupEmail").val().trim();
              if (email) {
                checkUserExists(
                  email,
                  function (json) {
                    if (json && typeof json.exists === "boolean") {
                      if (json.exists) {
                        $form.find("#signupEmail").data("exists", true);
                        // helper already shows archived/existing message, but ensure button state
                        submitBtn.prop("disabled", false).text(originalText);
                        return;
                      }
                      // proceed to submit via AJAX if explicitly false
                      $form.find("#signupEmail").data("exists", false);
                      ajaxSignup();
                    } else {
                      // network error or unknown result: attempt AJAX submit
                      ajaxSignup();
                    }
                  },
                  {
                    $field: $form.find("#signupEmail"),
                    $form: $form,
                    context: "signup",
                  }
                );
                return false; // will submit (or block) after async check
              }
            }

            // Helper: perform AJAX signup using new JSON endpoint
            function ajaxSignup() {
              const fd = new FormData(form);
              const body = new URLSearchParams();
              for (const pair of fd.entries()) body.append(pair[0], pair[1]);

              const _signupRequest = window.sopoppedFetch.request(
                "./api/signup_submit.php",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/x-www-form-urlencoded;charset=UTF-8",
                  },
                  body: body,
                }
              );

              Promise.resolve(_signupRequest)
                .then(({ response, ok, json: payload }) => {
                  if (!ok) {
                    const msg =
                      (payload &&
                        (payload.error ||
                          (payload.errors &&
                            JSON.stringify(payload.errors)))) ||
                      "Failed to create account. Please try again.";
                    // Show error using consistent helper
                    showValidateMsg($form, msg, "danger");
                    $form.data("message-shown", true);
                    submitBtn.prop("disabled", false).text(originalText);
                    return;
                  }
                  if (payload && payload.success) {
                    // Hide error message and show success
                    $form.find("#validate-msg").addClass("d-none").text("");
                    const successMsg =
                      payload.message ||
                      "Account created successfully! Please log in.";
                    $form
                      .find("#success-msg")
                      .removeClass("d-none")
                      .text(successMsg);
                    $form.data("message-shown", true);
                    try {
                      form.reset();
                    } catch (e) {}
                    setTimeout(function () {
                      try {
                        const $loginDialog = $("#loginDialog");
                        if ($loginDialog && $loginDialog.length) {
                          $loginDialog.dialog("open");
                        }
                      } catch (e) {}
                    }, 1200);
                    submitBtn.prop("disabled", false).text(originalText);
                  } else {
                    const err =
                      (payload &&
                        (payload.error ||
                          (payload.errors &&
                            JSON.stringify(payload.errors)))) ||
                      "Failed to create account.";
                    // Show error using consistent helper
                    showValidateMsg($form, err, "danger");
                    $form.data("message-shown", true);
                    submitBtn.prop("disabled", false).text(originalText);
                  }
                })
                .catch((err) => {
                  console.error("Signup request failed", err);
                  try {
                    showValidateMsg(
                      $form,
                      "Network or server error. Please try again later.",
                      "danger"
                    );
                  } catch (e) {}
                  $form.data("message-shown", true);
                  submitBtn.prop("disabled", false).text(originalText);
                });
            }

            // Submit via AJAX and prevent default
            ajaxSignup();
            return false;
          },
        });

        // 1.9 - Setup contact form validation rules and messages
        $("#contactForm").validate({
          rules: {
            name: {
              required: true,
              minlength: 2,
            },
            email: {
              ...commonEmailRules,
            },
            message: {
              required: true,
              minlength: 10,
              maxlength: 100,
            },
          },
          messages: {
            name: {
              required: "Please enter your name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              // Slightly different required message for contact form
              required: "Please enter your email",
              ...commonEmailMessages,
            },
            message: {
              required: "Please enter your message",
              minlength: jQuery.validator.format(
                "Message must be at least {0} characters long"
              ),
              maxlength: jQuery.validator.format(
                "Message must be no more than {0} characters long"
              ),
            },
          },
          submitHandler: function (form) {
            // Send contact message via AJAX to server endpoint
            var $form = $(form);
            // Replace jQuery.ajax with fetch helper (POST form-encoded)
            const bodyStr = $form.serialize();
            const _contactRequest = window.sopoppedFetch.postForm(
              "./api/contact_submit.php",
              bodyStr
            );

            Promise.resolve(_contactRequest)
              .then(function (resp) {
                if (resp && resp.success) {
                  // Hide error message and show success
                  $form.find("#validate-msg").addClass("d-none").text("");
                  $form
                    .find("#success-msg")
                    .removeClass("d-none")
                    .text("Message sent — thank you!");
                  $form.data("message-shown", true);
                  form.reset();
                  setTimeout(function () {
                    $form.find("#success-msg").addClass("d-none").text("");
                    $form.removeData("message-shown");
                  }, 3500);
                } else if (resp && resp.errors) {
                  var first = Object.keys(resp.errors)[0];
                  // Show error using consistent helper
                  showValidateMsg($form, resp.errors[first], "danger");
                  $form.data("message-shown", true);
                } else {
                  // Show error using consistent helper
                  showValidateMsg(
                    $form,
                    "Unable to send message. Please try again later.",
                    "danger"
                  );
                  $form.data("message-shown", true);
                }
              })
              .catch(function () {
                // Show error using consistent helper
                showValidateMsg(
                  $form,
                  "Network or server error. Please try again later.",
                  "danger"
                );
                $form.data("message-shown", true);
              });
          },
        });

        // 1.12 - Setup checkout form (cart) validation rules and messages
        // Removed redundant errorClass, validClass, errorElement, errorPlacement, highlight, unhighlight options
        $("#checkoutForm").validate({
          rules: {
            firstName: { required: true, minlength: 2 },
            lastName: { required: true, minlength: 2 },
            email: {
              ...commonEmailRules,
            },
            address: { required: true, minlength: 5 },
            province: { required: true },
            city: { required: true },
            barangay: { required: true },
            paymentMethod: { required: true },
          },
          messages: {
            firstName: {
              required: "Please enter your first name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            lastName: {
              required: "Please enter your last name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              ...commonEmailMessages,
            },
            address: {
              required: "Please enter your address",
              minlength: jQuery.validator.format(
                "Address must be at least {0} characters long"
              ),
            },
            province: { required: "Please select a province" },
            city: { required: "Please select a city or municipality" },
            barangay: { required: "Please select a barangay" },
            paymentMethod: { required: "Please select a payment method" },
          },
          submitHandler: function (form) {
            // Gather cart from localStorage and submit via AJAX to the checkout API
            try {
              const cartJson = localStorage.getItem("sopopped_cart_v1") || "[]";
              const cart = JSON.parse(cartJson);
              if (!Array.isArray(cart) || cart.length === 0) {
                alert("Your cart is empty. Add items before checkout.");
                return false;
              }

              // Ensure hidden input exists and set value
              const cartInput = form.querySelector("#cart_items_input");
              if (cartInput) cartInput.value = JSON.stringify(cart);

              // Use shared show/hide helpers for checkout messages

              // Simplified sendCheckout: handle server JSON and show messages via helper
              function sendCheckout() {
                const fd = new FormData(form);
                // Use sopoppedFetch.request when available so we can inspect res.ok/status
                const _checkoutReq = window.sopoppedFetch.request(form.action, {
                  method: "POST",
                  body: fd,
                });

                Promise.resolve(_checkoutReq)
                  .then(async (result) => {
                    // result may be a Response (native fetch) or an object returned by sopoppedFetch.request
                    let res =
                      result && result.response ? result.response : result;
                    let payload = null;
                    try {
                      payload = await (result && result.json
                        ? Promise.resolve(result.json)
                        : res.json());
                    } catch (e) {
                      /* no body */
                    }

                    if (res && res.ok === false) {
                      const msg =
                        (payload &&
                          (payload.error ||
                            (payload.errors &&
                              JSON.stringify(payload.errors)))) ||
                        "Failed to place order. Please try again.";

                      // Only show login message in validate-msg, others use alert
                      if (res.status === 401) {
                        const $form = $(form);
                        showValidateMsg(
                          $form,
                          "You need an account to proceed with checkout.",
                          "danger"
                        );
                        $form.data("message-shown", true);
                      } else {
                        alert(msg);
                      }
                      throw { handled: true };
                    }

                    const data = payload;
                    if (data && data.success) {
                      const orderId = data.order_id || data.id || "";
                      // Use server-provided purchased_ids when available; otherwise fall back to submitted cart ids
                      try {
                        const storedJson =
                          localStorage.getItem("sopopped_cart_v1") || "[]";
                        const stored = JSON.parse(storedJson) || [];
                        let purchasedIds = [];
                        if (
                          data &&
                          Array.isArray(data.purchased_ids) &&
                          data.purchased_ids.length
                        ) {
                          purchasedIds = data.purchased_ids.map(String);
                        } else {
                          purchasedIds = Array.isArray(cart)
                            ? cart.map((i) => String(i.id))
                            : [];
                        }
                        const remaining = Array.isArray(stored)
                          ? stored.filter(
                              (s) => !purchasedIds.includes(String(s.id))
                            )
                          : [];
                        if (Array.isArray(remaining) && remaining.length) {
                          localStorage.setItem(
                            "sopopped_cart_v1",
                            JSON.stringify(remaining)
                          );
                        } else {
                          localStorage.removeItem("sopopped_cart_v1");
                        }
                      } catch (e) {
                        try {
                          localStorage.removeItem("sopopped_cart_v1");
                        } catch (e) {}
                      }
                      // Redirect to the order success page (no alert popup)
                      if (orderId) {
                        window.location.href =
                          "order_success.php?order_id=" +
                          encodeURIComponent(orderId);
                      } else {
                        window.location.href = "order_success.php";
                      }
                    } else {
                      const err =
                        (data &&
                          (data.error ||
                            (data.errors && JSON.stringify(data.errors)))) ||
                        "Failed to place order. Please try again.";
                      alert(err);
                    }
                  })
                  .catch((err) => {
                    if (err && err.handled) return;
                    console.error("Checkout submit failed", err);
                    alert(
                      "Network error while submitting order. Please try again."
                    );
                  });
              }

              // Check login state, show UI message for guests; prefer form-local message
              const _sessCheck = window.sopoppedFetch.json(
                "./api/session_info.php"
              );

              Promise.resolve(_sessCheck)
                .then((sess) => {
                  if (!sess || !sess.logged_in) {
                    // ONLY purpose of validate-msg: show login required message
                    const $form = $(form);
                    showValidateMsg(
                      $form,
                      "You need an account to proceed with checkout.",
                      "danger"
                    );
                    $form.data("message-shown", true);
                    return;
                  }
                  sendCheckout();
                })
                .catch(function (err) {
                  console.warn("Failed to check session before checkout", err);
                  alert("Network error while checking session.");
                });
            } catch (e) {
              console.error("Checkout submit error", e);
              alert("Unexpected error preparing order.");
            }
            // Prevent default form submission since we handled it via fetch
            return false;
          },
        });

        // 1.11 - Handle input changes to remove success color when field is empty
        $(document).on(
          "input blur",
          "form input, form textarea, form select",
          function () {
            const $input = $(this);
            const $form = $input.closest("form");
            const validator = $form.data("validator");

            // If input is empty, remove the success color
            if ($input.val() === "") {
              $input.removeClass("is-valid");
            } else if (validator && validator.element($input) === true) {
              // If input has value and passes validation, add success color
              $input.addClass("is-valid").removeClass("is-invalid");
            }
          }
        );

        // 1.12 - Clear form messages when user starts typing (better UX)
        $(document).on(
          "focus input",
          "form input, form textarea, form select",
          function () {
            const $input = $(this);
            const $form = $input.closest("form");
            // Only clear messages on first interaction after they're shown
            if ($form.data("message-shown")) {
              $form.find("#validate-msg").addClass("d-none").text("");
              $form.find("#success-msg").addClass("d-none").text("");
              $form.removeData("message-shown");
            }
          }
        );
      }

      // 2.3 - Initialize login and signup dialogs with specific widths
      if ($.fn.dialog) {
        $("#loginDialog").dialog(dialogOptions(400));
        $("#signupDialog").dialog(dialogOptions(520));
      }

      // 2.4 - Process potential URL params for login result (moved from inline component script)
      function processLoginUrlParams() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const loginResult = urlParams.get("login_result");
          const loginMessage = urlParams.get("login_message");
          const $loginDialog = $("#loginDialog");
          const $form = $loginDialog.find("#loginForm");
          const $success = $form.find("#success-msg");

          if (loginResult === "success") {
            $success
              .removeClass("d-none")
              .text(loginMessage || "Login successful!");
            $loginDialog.dialog("open");
            if ($form && $form.length && $form[0].reset) $form[0].reset();
            // Merge local cart with server cart and save merged result server-side
            try {
              const localJson =
                localStorage.getItem("sopopped_cart_v1") || "[]";
              const local = JSON.parse(localJson) || [];
              if (!Array.isArray(local) || local.length === 0) {
                setTimeout(function () {
                  $loginDialog.dialog("close");
                  window.location.reload();
                }, 1200);
              } else {
                // Use cartHelpers.mergeLocalWithServer when available
                try {
                  if (
                    window.cartHelpers &&
                    typeof window.cartHelpers.mergeLocalWithServer ===
                      "function"
                  ) {
                    window.cartHelpers
                      .mergeLocalWithServer(
                        "sopopped_cart_v1",
                        "./api/cart_load.php",
                        "./api/cart_save.php"
                      )
                      .then(function () {
                        setTimeout(function () {
                          $loginDialog.dialog("close");
                          window.location.reload();
                        }, 1200);
                      })
                      .catch(function () {
                        setTimeout(function () {
                          $loginDialog.dialog("close");
                          window.location.reload();
                        }, 1200);
                      });
                  } else {
                    // Use centralized fetch helper directly to load and save cart
                    window.sopoppedFetch
                      .json("./api/cart_load.php")
                      .then(function (serverResp) {
                        let server = [];
                        if (
                          serverResp &&
                          serverResp.success &&
                          Array.isArray(serverResp.cart)
                        )
                          server = serverResp.cart;
                        const map = {};
                        server.forEach((it) => {
                          map[String(it.id)] = it;
                        });
                        local.forEach((it) => {
                          if (!map[String(it.id)]) map[String(it.id)] = it;
                        });
                        const merged = Object.keys(map).map((k) => map[k]);

                        const _saveReq = window.sopoppedFetch.postJSON(
                          "./api/cart_save.php",
                          merged
                        );

                        Promise.resolve(_saveReq).finally(function () {
                          try {
                            localStorage.setItem(
                              "sopopped_cart_v1",
                              JSON.stringify(merged)
                            );
                          } catch (e) {}
                          setTimeout(function () {
                            $loginDialog.dialog("close");
                            window.location.reload();
                          }, 1200);
                        });
                      })
                      .catch((err) => {
                        setTimeout(function () {
                          $loginDialog.dialog("close");
                          window.location.reload();
                        }, 1200);
                      });
                  }
                } catch (e) {
                  setTimeout(function () {
                    $loginDialog.dialog("close");
                    window.location.reload();
                  }, 1200);
                }
              }
            } catch (e) {
              setTimeout(function () {
                $loginDialog.dialog("close");
                window.location.reload();
              }, 1200);
            }
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } else if (loginResult === "error") {
            // show error message in form-local validate-msg (helper will fall back to global)
            showValidateMsg(
              $form,
              loginMessage || "Login failed. Please try again.",
              "danger"
            );
            $loginDialog.dialog("open");
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } catch (e) {
          console.warn("processLoginUrlParams error", e);
        }
      }

      // run at init in case the page was redirected
      processLoginUrlParams();

      // Process signup and logout URL params as well
      function processSignupUrlParams() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const signupResult = urlParams.get("signup_result");
          const signupMessage = urlParams.get("signup_message");
          const $signupDialog = $("#signupDialog");
          const $form = $signupDialog.find("#signupForm");
          const $success = $form.find("#success-msg");

          if (signupResult === "success") {
            if ($success && $success.length) {
              $success
                .removeClass("d-none")
                .text(
                  signupMessage ||
                    "Account created successfully! You can now log in."
                );
            }
            $signupDialog.dialog("open");
            if ($form && $form.length && $form[0].reset) $form[0].reset();
            setTimeout(function () {
              $signupDialog.dialog("close");
            }, 3000);
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } else if (signupResult === "error") {
            // show error message in form-local validate-msg (helper will fall back to global)
            showValidateMsg(
              $form,
              signupMessage || "An error occurred. Please try again.",
              "danger"
            );
            $signupDialog.dialog("open");
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } catch (e) {
          console.warn("processSignupUrlParams error", e);
        }
      }

      function processLogoutUrlParams() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const logoutResult = urlParams.get("logout_result");
          const logoutMessage = urlParams.get("logout_message");
          if (logoutResult === "success") {
            // Silently clean up URL params after logout
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } catch (e) {
          console.warn("processLogoutUrlParams error", e);
        }
      }

      // expose a global logout function for navbar onclick
      window.logout = function () {
        if (confirm("Are you sure you want to logout?")) {
          // Clear client-side cart on logout to avoid showing another user's saved cart in local storage
          try {
            localStorage.removeItem("sopopped_cart_v1");
          } catch (e) {
            /* ignore */
          }
          // Use correct path for both customer and admin pages
          const basePath = window.location.pathname.includes("/admin/")
            ? "../"
            : "./";
          window.location.href = basePath + "api/logout.php";
        }
      };

      // run additional processors
      processSignupUrlParams();
      processLogoutUrlParams();

      // Reset button state when dialog opens (moved from inline script)
      $("#loginDialog").on("dialogopen", function () {
        $("#loginSubmit").prop("disabled", false).text("Login");
      });

      // ===== UI BEHAVIORS =====
      // 3.1 - Open login dialog when navbar button is clicked (delegated)
      $(document).on(
        "click",
        '[data-bs-target="#loginModal"], #loginBtn',
        function (e) {
          e.preventDefault();
          $("#loginDialog").dialog("open");
        }
      );

      // 3.2 - Link from login dialog to signup dialog
      $(document).on("click", "#openSignup", function (e) {
        e.preventDefault();
        $("#loginDialog").dialog("close");
        $("#signupDialog").dialog("open");
      });

      // 3.6 - Format phone input for signup form (user experience, not validation)
      $(document).on("input", "#signupPhone", function () {
        let v = $(this).val().replace(/\D/g, ""); // remove non-digits
        if (v.length >= 8) {
          v =
            v.substring(0, 4) +
            "-" +
            v.substring(4, 7) +
            "-" +
            v.substring(7, 11);
        } else if (v.length >= 5) {
          v = v.substring(0, 4) + "-" + v.substring(4, 7);
        }
        $(this).val(v);
      });

      // 3.7 - Restrict email input to only allow letters, numbers, @, ., and _ on keydown
      // 3.8 - Apply email key filter to all email fields using shared helper
      $(document).on(
        "keydown",
        '#loginEmail, #signupEmail, #contactForm input[type="email"], #checkoutForm input[type="email"]',
        function (e) {
          if (
            window.sopoppedValidate &&
            typeof window.sopoppedValidate.emailKeyFilter === "function"
          ) {
            window.sopoppedValidate.emailKeyFilter(e);
          }
        }
      );
    }

    // ===== INITIALIZATION =====
    // 4.1 - Initialize dialogs/validation
    // If jQuery UI or validator already loaded, init now
    if (($.ui && $.ui.dialog) || $.validator) setupDialogs();

    // 4.2 - Watch for jQuery UI load and initialize when ready
    // Otherwise watch for script load and init
    $(document).on("jquery-ui-loaded", function () {
      setupDialogs();
    });

    // ===== WINDOW EVENTS =====
    // 5.1 - Recompute dialog sizes/positions on window resize
    $(window).on("resize", function () {
      if ($.ui && $.ui.dialog) {
        $(".ui-dialog-content").each(function () {
          const $d = $(this);
          const api = $d.dialog("instance");
          if (api) {
            const opts = dialogOptions(api.options.width || 400);
            $d.dialog("option", "maxHeight", opts.maxHeight);
            $d.dialog(
              "option",
              "width",
              Math.min(opts.width, window.innerWidth - 40)
            );
            // reposition below navbar
            const nav = document.querySelector(".navbar");
            const topOffset = nav
              ? nav.getBoundingClientRect().height + 10
              : 10;
            $d.parent().css({ top: topOffset + "px" });
          }
        });
      }
    });
  });
})(jQuery);

// Global handlers for toggling password visibility.
// These are outside the jQuery UI init so they always work even if dialogs
// are injected later or jQuery UI is loaded after this script.
(function ($) {
  // Reusable toggle function that prefers data attributes on the button for target
  // If button has data-target or data-input, use that selector; otherwise find
  // the closest form/dialog and toggle only the associated input to avoid
  // toggling multiple inputs globally.
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

      // Only toggle the first matched input (avoid toggling multiple inputs)
      const $first = $inp.eq(0);
      const isPassword = $first.attr("type") === "password";
      $first.attr("type", isPassword ? "text" : "password");
      // Swap emoji: show closed-eyes when visible, monkey when hidden
      $btn.text(isPassword ? "🙉" : "🙈");
    });
  }

  // Bind handlers for known toggles. Prefer data attributes on buttons in markup when possible.
  togglePassword("#toggleLoginPassword", "#loginPassword");
  togglePassword("#toggleSignupPassword", "#signupPassword");
  togglePassword("#toggleSignupPassword2", "#signupPassword2");
  // Bind user modal password toggle
  togglePassword("#toggleUserPassword", "#userPassword");
})(jQuery);
