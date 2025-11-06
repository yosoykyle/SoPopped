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
    if (typeof window.logout !== 'function') {
      window.logout = function () {
        try {
          if (!confirm('Are you sure you want to logout?')) return;
        } catch (e) { /* non-blocking */ }
        try { localStorage.removeItem('sopopped_cart_v1'); } catch (e) {}
        if (window.sopoppedFetch && typeof window.sopoppedFetch.request === 'function') {
          window.sopoppedFetch.request('./api/logout.php', { method: 'POST' })
            .then(function (resp) {
              try {
                var ok = resp && resp.response ? resp.response.ok : (resp && resp.ok);
                if (ok) window.location.href = 'home.php?logout_result=success&logout_message=' + encodeURIComponent('You have been logged out successfully.');
                else window.location.href = 'home.php';
              } catch (e) { window.location.href = 'home.php'; }
            })
            .catch(function () { window.location.href = 'home.php'; });
        } else {
          // No AJAX helper available — simple redirect
          window.location.href = 'home.php';
        }
      };
    }
    // ===== INITIALIZATION =====
    function setupDialogs() {
      // Only initialize if jQuery UI is available
      if (!$.ui || !$.ui.dialog) return;

      // ===== VALIDATION SETUP =====
      // 1.1 - Setup validation methods and form validation rules
      if ($.validator) {
        // 1.2 - Add custom validation method for allowed email characters
        $.validator.addMethod(
          "emailChars",
          function (value, element) {
            return this.optional(element) || /^[A-Za-z0-9_.@]+$/.test(value);
          },
          "Email can only contain letters, numbers, underscores, periods, and @ symbol"
        );

        // Small reusable helpers for email/password validation to keep the
        // addMethod callbacks shorter and easier to read. They preserve the
        // exact same checks as the inline versions below.
        // Prefer centralized validation helpers if available (defined in js/validateHelper.js)
        window.sopoppedValidateEmailFormat = function (value) {
          try {
            if (window.sopoppedValidate && typeof window.sopoppedValidate.emailFormat === 'function') {
              return window.sopoppedValidate.emailFormat(value);
            }
          } catch (e) { /* fallback below */ }
          if (!value || typeof value !== 'string') return false;
          if (!value.includes("@")) return false;
          if ((value.match(/@/g) || []).length > 1) return false;
          const parts = value.split("@");
          if (parts.length !== 2) return false;
          const domain = parts[1];
          if (!domain.includes(".") || domain.split(".").pop().length < 2) return false;
          return true;
        };

        window.sopoppedValidatePasswordStrength = function (value) {
          try {
            if (window.sopoppedValidate && typeof window.sopoppedValidate.passwordStrength === 'function') {
              return window.sopoppedValidate.passwordStrength(value);
            }
          } catch (e) { /* fallback below */ }
          if (!value || typeof value !== 'string') return false;
          if (value.length < 8 || value.length > 16) return false;
          if (!/[A-Z]/.test(value)) return false;
          if (!/[a-z]/.test(value)) return false;
          if (!/\d/.test(value)) return false;
          if (!/[!@#$%^&*(),.?":{}|<>\[\];'\/\\]/.test(value)) return false;
          return true;
        };

        // 1.3 - Add enhanced email validation for TLD, multiple @, and missing @
        $.validator.addMethod(
          "emailFormat",
          function (value, element) {
            if (this.optional(element)) return true;
            return (window.sopoppedValidateEmailFormat ? window.sopoppedValidateEmailFormat(value) : false);
          },
          function (value, element) {
            if (!value.includes("@")) {
              return "Email must contain an @ symbol";
            }
            if ((value.match(/@/g) || []).length > 1) {
              return "Email cannot contain multiple @ symbols";
            }
            const parts = value.split("@");
            if (parts.length === 2) {
              const domain = parts[1];
              if (!domain.includes(".") || domain.split(".").pop().length < 2) {
                return "Email must have a valid domain with a top-level domain (e.g., .com, .org)";
              }
            }
            return "Please enter a valid email address";
          }
        );

        // 1.4 - Add custom validation method for phone format
        $.validator.addMethod(
          "phoneFormat",
          function (value, element) {
            return this.optional(element) || /^\d{4}-\d{3}-\d{4}$/.test(value);
          },
          "Please enter phone in format: 0000-000-0000"
        );

        // 1.5 - Add password strength validation with requirements
        $.validator.addMethod(
          "passwordStrength",
          function (value, element) {
            if (this.optional(element)) return true;
            return (window.sopoppedValidatePasswordStrength ? window.sopoppedValidatePasswordStrength(value) : false);
          },
          "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)"
        );

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
            const shown = showValidateMsg($form, error.text(), "danger");
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
            revealValidateMsg($form);
          },
          unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

            // Check if there are other errors in the form
            let $form = $(element).closest("form");
            let validator = $form.data("validator") || $form.validate();

            if (validator && validator.numberOfInvalids() === 0) {
              // Hide the form-local validate-msg if no more errors
              hideValidateMsg($form);
            }
          },
        });

        // Helper: get the jQuery validate message element for a form (returns jQuery or null)
        function getValidateMsg($form) {
          if ($form && $form.length) {
            const $m = $form.find('#validate-msg');
            if ($m && $m.length) return $m;
          }
          const $global = $('#validate-msg');
          return $global && $global.length ? $global : null;
        }

        // Helper: show a message inside a form's #validate-msg (uses getValidateMsg)
        // Delegate validate message display to centralized UI helpers when available
        function showValidateMsg($form, text, type = 'danger') {
          try {
            if (window.sopoppedUI && typeof window.sopoppedUI.showValidateMsg === 'function') {
              return window.sopoppedUI.showValidateMsg($form, text, type);
            }
          } catch (e) {}
          const $msg = getValidateMsg($form);
          if ($msg) {
            $msg
              .removeClass('d-none alert-success alert-danger alert-info')
              .addClass('alert alert-' + type)
              .text(text)
              .show();
            try { $msg[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
            return true;
          }
          return false;
        }

        function hideValidateMsg($form) {
          try {
            if (window.sopoppedUI && typeof window.sopoppedUI.hideValidateMsg === 'function') {
              return window.sopoppedUI.hideValidateMsg($form);
            }
          } catch (e) {}
          const $msg = getValidateMsg($form);
          if ($msg) {
            $msg.addClass('d-none').removeClass('alert alert-success alert-danger alert-info').text('');
            return true;
          }
          return false;
        }

        function revealValidateMsg($form) {
          try {
            if (window.sopoppedUI && typeof window.sopoppedUI.revealValidateMsg === 'function') {
              return window.sopoppedUI.revealValidateMsg($form);
            }
          } catch (e) {}
          const $msg = getValidateMsg($form);
          if ($msg) {
            $msg.removeClass('d-none').show();
            return true;
          }
          return false;
        }

        // Expose small validate-msg helpers and a session fetch helper for reuse
        // These wrappers keep the same behavior but make other code clearer.
        try {
          // Prefer centralized ui helpers when available, otherwise expose the
          // local wrappers that call the in-file functions above. This keeps
          // behavior identical while allowing optional extraction into
          // `js/uiHelper.js`.
          window.sopoppedUI = window.sopoppedUI || {};
          window.sopoppedUI.showValidateMsg = function ($form, text, type) {
            try {
              if (window.uiHelper && typeof window.uiHelper.showValidateMsg === 'function') {
                return window.uiHelper.showValidateMsg($form, text, type);
              }
              return showValidateMsg($form, text, type);
            } catch (e) { return false; }
          };
          window.sopoppedUI.hideValidateMsg = function ($form) {
            try {
              if (window.uiHelper && typeof window.uiHelper.hideValidateMsg === 'function') {
                return window.uiHelper.hideValidateMsg($form);
              }
              return hideValidateMsg($form);
            } catch (e) { return false; }
          };
          window.sopoppedUI.revealValidateMsg = function ($form) {
            try {
              if (window.uiHelper && typeof window.uiHelper.revealValidateMsg === 'function') {
                return window.uiHelper.revealValidateMsg($form);
              }
              return revealValidateMsg($form);
            } catch (e) { return false; }
          };
        } catch (e) { /* noop */ }

        // If a global non-jQuery adapter exists, register the jQuery helpers so it can delegate to them
        try {
          if (window && window.sopoppedValidate && typeof window.sopoppedValidate === "object") {
            window.sopoppedValidate._jq = {
              show: function ($form, text, type) {
                try {
                  if (window.sopoppedUI && typeof window.sopoppedUI.showValidateMsg === 'function') {
                    return window.sopoppedUI.showValidateMsg($form, text, type);
                  }
                  return showValidateMsg($form, text, type);
                } catch (e) {
                  return false;
                }
              },
              hide: function ($form) {
                try {
                  if (window.sopoppedUI && typeof window.sopoppedUI.hideValidateMsg === 'function') {
                    return window.sopoppedUI.hideValidateMsg($form);
                  }
                  return hideValidateMsg($form);
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
          const $field = opts.$field || $(opts.selector || '#loginEmail');
          // Derive $form only from opts.$form or $field.closest('form') to avoid brittle global heuristics
          const $form = opts.$form || ($field && $field.closest ? $field.closest('form') : null);
          if ((!$form || !$form.length) && !opts.$form) {
            try { console.warn('checkUserExists: no form provided or derivable from field; messages may not display'); } catch (e) {}
          }
          const context = opts.context || "login";
          if (!email) {
            if ($field && $field.length) {
              $field.data("exists", undefined);
              $field.data("archived", undefined);
            }
            if ($form && $form.length) {
              hideValidateMsg($form);
            }
            if (typeof cb === "function") cb({});
            return;
          }
          // Use centralized fetch helper to simplify AJAX code.
          const _checkUserExistsFetcher = window.sopoppedFetch.postForm('./api/check_user_exists.php', new URLSearchParams({ email: email }));

          Promise.resolve(_checkUserExistsFetcher).then((json) => {
              try {
                const exists = json && typeof json.exists === 'boolean' ? json.exists : undefined;
                const archived = json && typeof json.archived !== 'undefined' ? !!json.archived : false;
                if (exists === true) {
                  if ($field && $field.length) {
                    $field.data('exists', true);
                    $field.data('archived', archived);
                  }
                  // For signup flow, show a helpful message. For login flow we keep
                  // the UX minimal (server will validate on submit).
                  if (context === 'signup') {
                    showValidateMsg($form,
                      archived
                        ? "This email belongs to an archived account — creating a new account with the same email is not allowed."
                        : "An account already exists with that email address.",
                      "danger"
                    );
                    console.debug("check_user_exists (signup): exists=true for", email, "archived=", archived);
                  } else {
                    console.debug("check_user_exists (login): exists=true for", email, "archived=", archived);
                  }
                } else {
                  // not existing
                  if ($field && $field.length) {
                    $field.data('exists', false);
                    $field.data('archived', false);
                  }
                  hideValidateMsg($form);
                  if (context === 'signup') console.debug("check_user_exists (signup): exists=false for", email);
                }
              } catch (e) {
                console.warn("check_user_exists processing failed", e);
              }
              if (typeof cb === 'function') cb(json || {});
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

        // 1.7.1 - Remote check for login email existence (improves UX)
        $(document).on("blur", "#loginEmail", function () {
          const $el = $(this);
          const email = $el.val().trim();
          checkUserExists(email, null, { $field: $el, $form: $el.closest("form"), context: "login" });
        });

        // 1.7.2 - Remote check for signup email to prevent duplicate registrations
        $(document).on("blur", "#signupEmail", function () {
          const $el = $(this);
          const email = $el.val().trim();
          checkUserExists(email, null, { $field: $el, $form: $el.closest("form"), context: "signup" });
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
          emailChars: "Email can only contain letters, numbers, underscores, periods, and @ symbol",
          emailFormat: "Email must have a valid format with @ and domain",
        };

        // 1.7 - Setup login form validation rules and messages
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
            hideValidateMsg($form);

            // If we have an explicit existence check and it says the account doesn't exist, block submit
            const emailExists = $form.find("#loginEmail").data("exists");
            if (typeof emailExists !== "undefined" && emailExists === false) {
              showValidateMsg($form, "No account found with that email address.", "danger");
              // Re-enable button
              submitBtn.prop("disabled", false).text(originalText);
              return false; // prevent submit
            }

            // Helper: perform AJAX login using new JSON endpoint
            // Helper: cart merge utilities used after successful login
            function _getLocalCartArray() {
              try {
                const raw = localStorage.getItem('sopopped_cart_v1') || '[]';
                const arr = JSON.parse(raw);
                return Array.isArray(arr) ? arr : [];
              } catch (e) { return []; }
            }

            function _setLocalCartArray(arr) {
              try { localStorage.setItem('sopopped_cart_v1', JSON.stringify(Array.isArray(arr) ? arr : [])); } catch (e) {}
            }

            function _itemId(it) {
              if (!it) return null;
              return (it.id || it.product_id || it.productId || it.productId || null);
            }

            function _itemQty(it) {
              if (!it) return 0;
              return Number(it.quantity ?? it.qty ?? it.count ?? 0) || 0;
            }

            async function _fetchServerCart() {
              const resp = await window.sopoppedFetch.request('./api/cart_load.php', { method: 'GET' }).catch(() => null);
              if (!resp || !resp.ok) throw new Error('Failed to fetch server cart');
              const j = resp.json;
              if (j && j.success && Array.isArray(j.cart)) return j.cart;
              if (j && Array.isArray(j)) return j;
              return [];
            }

                async function _saveServerCartArray(arr) {
              // Send JSON array to cart_save.php via centralized helper
              const j = await window.sopoppedFetch.postJSON('./api/cart_save.php', arr || []).catch(() => null);
              if (!j) throw new Error('Failed to save server cart');
              return j;
            }

            // Session polling configuration (easy to tweak for slower/dev machines)
            // Session polling defaults: 2000ms total wait, 200ms interval — good for local dev
            const SESSION_POLL_TIMEOUT_MS = 2000; // total time to wait for session to appear
            const SESSION_POLL_INTERVAL_MS = 200; // polling interval

            // Wait for the server session to be ready after AJAX login.
            // Polls `api/session_info.php` every `interval` ms until `logged_in:true` or timeout.
            async function waitForSessionReady(timeout = SESSION_POLL_TIMEOUT_MS, interval = SESSION_POLL_INTERVAL_MS) {
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
                await new Promise(r => setTimeout(r, interval));
              }
              return false;
            }

            function _mergeCartsSumming(localArr, serverArr) {
              const map = new Map();
              // Prefer to preserve other item fields from server, but sum quantities
              (serverArr || []).forEach((it) => {
                const id = String(_itemId(it) ?? '');
                if (!id) return;
                const qty = _itemQty(it);
                map.set(id, Object.assign({}, it, { id: Number(id), quantity: qty }));
              });
              (localArr || []).forEach((it) => {
                const idRaw = _itemId(it);
                if (idRaw === null || idRaw === undefined) return;
                const id = String(idRaw);
                const qty = _itemQty(it) || 0;
                if (map.has(id)) {
                  const existing = map.get(id);
                  existing.quantity = (Number(existing.quantity || 0) || 0) + qty;
                  map.set(id, existing);
                } else {
                  // normalize local item to have id and quantity
                  const normalized = Object.assign({}, it, { id: Number(id), quantity: qty });
                  map.set(id, normalized);
                }
              });
              return Array.from(map.values());
            }

            async function mergeCartAfterLoginAndUpdateUI() {
              try {
                const local = _getLocalCartArray();
                // If local empty, simply refresh session info UI
                if (!Array.isArray(local) || local.length === 0) {
                  // dispatch cart-changed to refresh badge
                  document.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: 0 } }));
                  // Attempt to refresh session info via API and update minimal UI
                    try {
                    const si = await window.sopoppedSession.fetchInfo();
                    if (si && si.logged_in) {
                      // try UI helpers
                      if (window.uiHelpers && typeof window.uiHelpers.updateSessionUI === 'function') {
                        try { window.uiHelpers.updateSessionUI(si); } catch(e) {}
                      }
                    }
                  } catch(e) {}
                  return true;
                }

                const server = await _fetchServerCart().catch(()=>[]);
                const merged = _mergeCartsSumming(local, server);

                // Save merged to server
                const saveResp = await _saveServerCartArray(merged);
                if (!saveResp || (typeof saveResp.success !== 'undefined' && !saveResp.success)) {
                  // treat as failure
                  throw new Error('Server failed to save merged cart');
                }

                // Persist locally
                _setLocalCartArray(merged);

                // Notify UI of cart change (count)
                try { document.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: merged.length } })); } catch (e) {}

                // Refresh session info and update UI minimally
                try {
                  const si = await window.sopoppedSession.fetchInfo();
                  if (si && si.logged_in) {
                    if (window.uiHelpers && typeof window.uiHelpers.updateSessionUI === 'function') {
                      try { window.uiHelpers.updateSessionUI(si); } catch(e) {}
                    } else {
                      // Minimal DOM update: replace login button with username dropdown to match server-rendered navbar
                      try {
                        const $loginBtn = $('#loginBtn');
                        if ($loginBtn && $loginBtn.length) {
                          const userName = si.user_name || '';
                          const dropdown = `\
                            <div class="dropdown">\
                              <button class="btn btn-warning dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">\
                                <i class="bi bi-person-circle me-1"></i>${userName}\
                              </button>\
                              <ul class="dropdown-menu">\
                                <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>\
                              </ul>\
                            </div>`;
                          $loginBtn.replaceWith(dropdown);
                        }
                      } catch (e) { /* ignore DOM update failures */ }
                    }
                  }
                } catch (e) {}

                return true;
              } catch (err) {
                console.error('Cart merge after login failed', err);
                return false;
              }
            }

            function ajaxLogin() {
              const fd = new FormData(form);
              const body = new URLSearchParams();
              for (const pair of fd.entries()) body.append(pair[0], pair[1]);

              // Use centralized request helper
              const _loginRequest = window.sopoppedFetch.request('./api/login_submit.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: body });

              Promise.resolve(_loginRequest).then(async ({ response, ok, status, json: payload }) => {
                  if (!ok) {
                    const msg = (payload && (payload.error || (payload.errors && JSON.stringify(payload.errors)))) || 'Failed to log in. Please try again.';
                    showValidateMsg($form, msg, 'danger');
                    submitBtn.prop('disabled', false).text(originalText);
                    return;
                  }
                  if (payload && payload.success) {
                    // Login succeeded — wait for session readiness and then merge local cart into server cart
                    (async function(){
                      const ready = await waitForSessionReady();
                        if (!ready) {
                        // If the session didn't become ready in time, reload the page to ensure consistent state
                        window.location.reload();
                        return false;
                      }
                      return mergeCartAfterLoginAndUpdateUI();
                    })().then((ok) => {
                      try {
                        // close dialog if present
                        const $dlg = $('#loginDialog');
                        if ($dlg && $dlg.length && $dlg.dialog) $dlg.dialog('close');
                      } catch (e) {}
                      window.location.reload();
                    }).catch(()=>{ window.location.reload(); });
                  } else {
                    const err = (payload && (payload.error || (payload.errors && JSON.stringify(payload.errors)))) || 'Invalid email or password.';
                    showValidateMsg($form, err, 'danger');
                    submitBtn.prop('disabled', false).text(originalText);
                  }
                }).catch((err) => {
                  console.error('Login request failed', err);
                  showValidateMsg($form, 'Network or server error. Please try again later.', 'danger');
                  submitBtn.prop('disabled', false).text(originalText);
                });
            }

            // If we don't have a cached existence result, perform a final check before submitting
            if (typeof emailExists === "undefined") {
              const email = $form.find("#loginEmail").val().trim();
              if (email) {
                checkUserExists(
                  email,
                  function (json) {
                    // json may be {} on network error
                    if (json && typeof json.exists === "boolean") {
                      if (json.exists) {
                        // proceed to submit via AJAX
                        $form.find("#loginEmail").data("exists", true);
                        ajaxLogin();
                        return;
                      }
                      // explicit false -> block submit and show message
                      $form.find("#loginEmail").data("exists", false);
                      showValidateMsg($form, "No account found with that email address.", "danger");
                      submitBtn.prop("disabled", false).text(originalText);
                    } else {
                      // network error or unknown result: attempt AJAX submit and let server handle
                      ajaxLogin();
                    }
                  },
                  { $field: $form.find("#loginEmail"), $form: $form, context: "login" }
                );
                return false; // will submit (or block) after async check
              }
            }

            // Submit via AJAX
            ajaxLogin();
            // Prevent default since we've handled submission via fetch
            return false;
          },
        });

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
              showValidateMsg($form, "An account already exists with that email address.", "danger");
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
                  { $field: $form.find("#signupEmail"), $form: $form, context: "signup" }
                );
                return false; // will submit (or block) after async check
              }
            }

            // Helper: perform AJAX signup using new JSON endpoint
            function ajaxSignup() {
              const fd = new FormData(form);
              const body = new URLSearchParams();
              for (const pair of fd.entries()) body.append(pair[0], pair[1]);

              const _signupRequest = window.sopoppedFetch.request('./api/signup_submit.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: body });

              Promise.resolve(_signupRequest).then(({ response, ok, json: payload }) => {
                  if (!ok) {
                    const msg = (payload && (payload.error || (payload.errors && JSON.stringify(payload.errors)))) || 'Failed to create account. Please try again.';
                    showValidateMsg($form, msg, 'danger');
                    submitBtn.prop('disabled', false).text(originalText);
                    return;
                  }
                  if (payload && payload.success) {
                    // Show success and prompt to log in
                    showValidateMsg($form, payload.message || 'Account created successfully! Please log in.', 'success');
                    try { form.reset(); } catch (e) {}
                    setTimeout(function () {
                      try {
                        const $loginDialog = $('#loginDialog');
                        if ($loginDialog && $loginDialog.length) {
                          $loginDialog.dialog('open');
                        }
                      } catch (e) {}
                    }, 1200);
                    submitBtn.prop('disabled', false).text(originalText);
                  } else {
                    const err = (payload && (payload.error || (payload.errors && JSON.stringify(payload.errors)))) || 'Failed to create account.';
                    showValidateMsg($form, err, 'danger');
                    submitBtn.prop('disabled', false).text(originalText);
                  }
                }).catch((err) => {
                  console.error('Signup request failed', err);
                  showValidateMsg($form, 'Network or server error. Please try again later.', 'danger');
                  submitBtn.prop('disabled', false).text(originalText);
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
              const _contactRequest = window.sopoppedFetch.postForm('./api/contact_submit.php', bodyStr);

              Promise.resolve(_contactRequest).then(function (resp) {
                if (resp && resp.success) {
                  showValidateMsg($form, 'Message sent — thank you!', 'success');
                  form.reset();
                  setTimeout(function () { hideValidateMsg($form); }, 3500);
                } else if (resp && resp.errors) {
                  var first = Object.keys(resp.errors)[0];
                  showValidateMsg($form, resp.errors[first], 'danger');
                } else {
                  showValidateMsg($form, 'Unable to send message. Please try again later.', 'danger');
                }
              }).catch(function () {
                showValidateMsg($form, 'Network or server error. Please try again later.', 'danger');
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
                const $form = $(form);
                showValidateMsg($form, "Your cart is empty. Add items before checkout.", "danger");
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
                const _checkoutReq = window.sopoppedFetch.request(form.action, { method: 'POST', body: fd });

                Promise.resolve(_checkoutReq).then(async (result) => {
                  // result may be a Response (native fetch) or an object returned by sopoppedFetch.request
                  let res = result && result.response ? result.response : result;
                  let payload = null;
                  try {
                    payload = await (result && result.json ? Promise.resolve(result.json) : res.json());
                  } catch (e) { /* no body */ }

                  if (res && res.ok === false) {
                    const msg = (payload && (payload.error || (payload.errors && JSON.stringify(payload.errors)))) || 'Failed to place order. Please try again.';
                    if (!showValidateMsg($(form), msg, 'danger') && res.status === 401) {
                      try {
                        const $loginDialog = $('#loginDialog');
                        showValidateMsg($loginDialog, 'You need an account to proceed with checkout. Please log in.', 'danger');
                        $loginDialog.dialog('open');
                      } catch (e) { alert(msg); }
                    } else if (!showValidateMsg($(form), msg, 'danger')) {
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
                      alert(
                        "Order placed successfully." +
                          (orderId ? " Order ID: " + orderId : "")
                      );
                      if (orderId)
                        window.location.href =
                          "order_success.php?order_id=" +
                          encodeURIComponent(orderId);
                      else window.location.href = "order_success.php";
                    } else {
                      const err =
                        (data &&
                          (data.error ||
                            (data.errors && JSON.stringify(data.errors)))) ||
                        "Failed to place order. Please try again.";
                      if (!showValidateMsg($(form), err, "danger")) alert(err);
                    }
                  })
                  .catch((err) => {
                    if (err && err.handled) return;
                    console.error("Checkout submit failed", err);
                    const fallback =
                      "Network error while submitting order. Please try again.";
                    if (!showValidateMsg($(form), fallback, "danger")) alert(fallback);
                  });
              }

              // Check login state, show UI message for guests; prefer form-local message
              const _sessCheck = window.sopoppedFetch.json('./api/session_info.php');

              Promise.resolve(_sessCheck).then((sess) => {
                  if (!sess || !sess.logged_in) {
                    const msg = 'You need an account to proceed with checkout.';
                    if (!showValidateMsg($(form), msg, 'danger')) {
                      try {
                        const $loginDialog = $('#loginDialog');
                        showValidateMsg($loginDialog, msg + ' Please log in.', 'danger');
                        $loginDialog.dialog('open');
                      } catch (e) { alert(msg); }
                    }
                    return;
                  }
                  sendCheckout();
                }).catch(function(err){ console.warn('Failed to check session before checkout', err); showValidateMsg($(form), 'Network error while checking session.', 'danger'); });
            } catch (e) {
              console.error("Checkout submit error", e);
              const $form = $(form);
              showValidateMsg($form, "Unexpected error preparing order.", "danger");
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
      }

      // ===== DIALOG SETUP =====
      // Use shared uiHelpers if available, otherwise fall back to local implementations
      function dialogOptions(width) {
        try {
          if (window.uiHelpers && typeof window.uiHelpers.dialogOptions === 'function') {
            return window.uiHelpers.dialogOptions(width);
          }
        } catch (e) {}

  // local implementation (default)
        const nav = document.querySelector('.navbar');
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        const maxH = window.innerHeight - Math.max(120, navHeight + 40);
        return {
          autoOpen: false,
          modal: true,
          width: Math.min(width, window.innerWidth - 40),
          height: 'auto',
          maxHeight: maxH,
          draggable: true,
          resizable: true,
          classes: { 'ui-dialog': 'rounded-3', 'ui-widget-overlay': 'custom-overlay' },
          open: function () {
            const nav = document.querySelector('.navbar');
            const topOffset = nav ? nav.getBoundingClientRect().height + 10 : 10;
            try { $(this).parent().css({ top: topOffset + 'px' }); } catch (e) {}
          },
        };
      }

      // 2.3 - Initialize login and signup dialogs with specific widths
      $("#loginDialog").dialog(dialogOptions(400));
      $("#signupDialog").dialog(dialogOptions(520));

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
              const localJson = localStorage.getItem('sopopped_cart_v1') || '[]';
              const local = JSON.parse(localJson) || [];
              if (!Array.isArray(local) || local.length === 0) {
                setTimeout(function () {
                  $loginDialog.dialog('close');
                  window.location.reload();
                }, 1200);
              } else {
                // Use cartHelpers.mergeLocalWithServer when available
                try {
                  if (window.cartHelpers && typeof window.cartHelpers.mergeLocalWithServer === 'function') {
                    window.cartHelpers
                      .mergeLocalWithServer('sopopped_cart_v1', './api/cart_load.php', './api/cart_save.php')
                      .then(function () {
                        setTimeout(function () {
                          $loginDialog.dialog('close');
                          window.location.reload();
                        }, 1200);
                      })
                      .catch(function () {
                        setTimeout(function () {
                          $loginDialog.dialog('close');
                          window.location.reload();
                        }, 1200);
                      });
                  } else {
                    // Use centralized fetch helper directly to load and save cart
                    window.sopoppedFetch.json('./api/cart_load.php').then(function (serverResp) {
                        let server = [];
                        if (serverResp && serverResp.success && Array.isArray(serverResp.cart)) server = serverResp.cart;
                        const map = {};
                        server.forEach((it) => { map[String(it.id)] = it; });
                        local.forEach((it) => { if (!map[String(it.id)]) map[String(it.id)] = it; });
                        const merged = Object.keys(map).map((k) => map[k]);

                        const _saveReq = window.sopoppedFetch.postJSON('./api/cart_save.php', merged);

                        Promise.resolve(_saveReq).finally(function () {
                          try { localStorage.setItem('sopopped_cart_v1', JSON.stringify(merged)); } catch (e) {}
                          setTimeout(function () { $loginDialog.dialog('close'); window.location.reload(); }, 1200);
                        });
                      }).catch((err) => { setTimeout(function () { $loginDialog.dialog('close'); window.location.reload(); }, 1200); });
                  }
                } catch (e) {
                  setTimeout(function () { $loginDialog.dialog('close'); window.location.reload(); }, 1200);
                }
              }
            } catch (e) {
              setTimeout(function () {
                $loginDialog.dialog('close');
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
            showValidateMsg($form, loginMessage || "Login failed. Please try again.", "danger");
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
            showValidateMsg($form, signupMessage || "An error occurred. Please try again.", "danger");
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
            console.log(logoutMessage || "Logged out successfully");
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
          window.location.href = "api/logout.php";
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
      function emailKeyFilter(e) {
        // Allow composition (IME) to proceed
        if (e.isComposing) return;
        const allowed = /[A-Za-z0-9@._]/;
        const key = e.key;
        // Allow control keys (backspace, delete, arrows, tab, enter, etc.) and modifier combos
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (
          key === 'Backspace' ||
          key === 'Delete' ||
          key === 'ArrowLeft' ||
          key === 'ArrowRight' ||
          key === 'ArrowUp' ||
          key === 'ArrowDown' ||
          key === 'Tab' ||
          key === 'Enter'
        ) {
          return;
        }
        if (key.length === 1 && !allowed.test(key)) {
          e.preventDefault();
        }
      }
      // 3.8 - Apply email key filter to all email fields across forms
      // Apply to all email fields: login, signup, contact forms, and checkout form
      $(document).on(
        "keydown",
        '#loginEmail, #signupEmail, #contactForm input[type="email"], #checkoutForm input[type="email"]',
        emailKeyFilter
      );
    }

    // ===== INITIALIZATION =====
    // 4.1 - Initialize dialogs if jQuery UI is available
    // If jQuery UI already loaded, init now
    if ($.ui && $.ui.dialog) setupDialogs();

    // 4.2 - Watch for jQuery UI load and initialize when ready
    // Otherwise watch for script load and init
    $(document).on("jquery-ui-loaded", function () {
      setupDialogs();
    });

    // Fallback: ensure #loginBtn always opens a dialog even when jQuery UI is not present.
    // If jQuery UI is available, setupDialogs will bind the handler; otherwise, provide
    // a Bootstrap modal wrapper at runtime to present the same form to the user.
    $(document).on('click', '#loginBtn', function (e) {
      e.preventDefault();
      const $dlg = $('#loginDialog');
      if (!$dlg || !$dlg.length) return;

      // If jQuery UI dialog exists, open it
      try {
        if ($.ui && $.ui.dialog && $dlg.dialog) {
          try { $dlg.dialog('open'); } catch (e) { /* ignore */ }
          return;
        }
      } catch (e) { /* ignore */ }

      // Otherwise create a Bootstrap modal wrapper and move the dialog content into it
      const modalId = 'loginFallbackModal';
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
        $('body').append(wrapper);
        $modal = $(document.getElementById(modalId));

        // When modal hides, move dialog back to its original location and remove wrapper
        $modal.on('hidden.bs.modal', function () {
          try {
            const $inner = $modal.find('#loginDialog');
            if ($inner && $inner.length) {
              $inner.detach().hide().appendTo('body');
            }
          } catch (e) { }
          try { $modal.remove(); } catch (e) { }
        });
      }

      // Move the existing dialog element inside the modal body and show it
      try {
        const $body = $modal.find('.modal-body');
        $dlg.detach().show().appendTo($body);
        const bs = new bootstrap.Modal($modal[0]);
        bs.show();
      } catch (e) {
        // As a last resort, just show the dialog element inline
        try { $dlg.show(); } catch (e) { }
      }
    });

    // ===== WINDOW EVENTS =====
    // 5.1 - Recompute dialog sizes/positions on window resize
    // Recompute dialog sizes/positions on window resize
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
})(jQuery);
