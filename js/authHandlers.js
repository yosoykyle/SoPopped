/**
 * =============================================================================
 * File: js/authHandlers.js
 * Purpose: Authentication handlers for login, signup, checkout, and user checks.
 * =============================================================================
 *
 * This consolidated module manages all authentication-related form submissions
 * and interactions. It interacts with the backend APIs for user management
 * and integrates closely with the shopping cart to merge guest/user carts.
 *
 * Key Functionalities:
 *   1. User Existence Check: Verifies if email exists (for both login & signup).
 *   2. Login Handler: authenticates user, merges cart, and updates session UI.
 *   3. Signup Handler: creates new user, handles duplicate checks, auto-opens login.
 *   4. Checkout Handler: requires auth for checkout, submits order, clears cart.
 *
 * Exports (window.sopoppedAuth):
 *   - checkUserExists(email, cb, opts)
 *   - waitForSessionReady(timeout, interval)
 *   - mergeCartAfterLoginAndUpdateUI()
 *   - createLoginSubmitHandler(opts)
 *   - createSignupSubmitHandler(opts)
 *   - createCheckoutSubmitHandler(opts)
 *
 * Dependencies:
 *   - fetchHelper.js (sopoppedFetch) - For API calls
 *   - sessionHelper.js (sopoppedSession) - For session status
 *   - validation.js (validationUI) - For showing error messages
 *   - cart.js (via localStorage 'sopopped_cart_v1')
 * =============================================================================
 */

(function ($) {
  "use strict";

  if (typeof window === "undefined") return;
  window.sopoppedAuth = window.sopoppedAuth || {};

  // ==========================================================================
  // PART 1: USER CHECK UTILITIES
  // ==========================================================================

  /**
   * Check whether an email exists on the server and update field attributes.
   * Used by both Login (to warn if not found) and Signup (to warn if exists).
   *
   * @param {string} email - Email address to check
   * @param {function} cb - Callback function ({exists, is_archived})
   * @param {object} opts - { $field, $form, context: 'login'|'signup' }
   */
  window.sopoppedAuth.checkUserExists = function (email, cb, opts) {
    opts = opts || {};
    const $field = opts.$field || $(opts.selector || "#loginEmail");
    const $form =
      opts.$form || ($field && $field.closest ? $field.closest("form") : null);

    const context = opts.context || "login";

    // Reset state if email is empty
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

    // Check against API
    const _checkUserExistsFetcher = window.sopoppedFetch.postForm(
      "./api/check_user_exists.php",
      new URLSearchParams({ email: email }),
    );

    Promise.resolve(_checkUserExistsFetcher)
      .then((json) => {
        try {
          const exists =
            json && typeof json.exists === "boolean" ? json.exists : undefined;
          const archived =
            json && typeof json.is_archived !== "undefined"
              ? !!json.is_archived
              : false;

          // Update data attributes on field for synchronous validation later
          if (exists === true) {
            if ($field && $field.length) {
              $field.data("exists", true);
              $field.data("archived", archived);
            }
            // Show inline warnings based on context
            if (context === "signup") {
              if (window.validationUI && window.validationUI.showValidateMsg) {
                window.validationUI.showValidateMsg(
                  $form,
                  archived
                    ? "This email belongs to an archived account."
                    : "An account already exists with that email.",
                  "danger",
                );
              }
            } else if (context === "login" && archived) {
              if (window.validationUI && window.validationUI.showValidateMsg) {
                window.validationUI.showValidateMsg(
                  $form,
                  "This account has been deactivated.",
                  "danger",
                );
              }
            }
          } else {
            // User does not exist
            if ($field && $field.length) {
              $field.data("exists", false);
              $field.data("archived", false);
            }
            if (context === "login") {
              if (window.validationUI && window.validationUI.showValidateMsg) {
                window.validationUI.showValidateMsg(
                  $form,
                  "No account found with that email address.",
                  "danger",
                );
              }
            } else {
              if (window.validationUI && window.validationUI.hideValidateMsg)
                window.validationUI.hideValidateMsg($form);
            }
          }
        } catch (e) {
          console.warn("check_user_exists processing failed", e);
        }
        if (typeof cb === "function") cb(json || {});
      })
      .catch((err) => {
        // Fail silently but clear flags
        if ($field && $field.length) {
          $field.data("exists", undefined);
          $field.data("archived", undefined);
        }
        if (typeof cb === "function") cb({});
      });
  };

  // ==========================================================================
  // PART 2: LOGIN & CART MERGE LOGIC
  // ==========================================================================

  // --- Cart Data Helpers ---
  function _getLocalCartArray() {
    try {
      const arr = JSON.parse(localStorage.getItem("sopopped_cart_v1") || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function _setLocalCartArray(arr) {
    try {
      localStorage.setItem(
        "sopopped_cart_v1",
        JSON.stringify(Array.isArray(arr) ? arr : []),
      );
    } catch (e) {}
  }

  function _itemId(it) {
    if (!it) return null;
    return it.id || it.product_id || it.productId || null;
  }

  function _itemQty(it) {
    return Number(it.quantity ?? it.qty ?? it.qt ?? 0) || 0;
  }

  // --- API Helpers ---
  async function _fetchServerCart() {
    const resp = await window.sopoppedFetch
      .request("./api/cart_load.php", { method: "GET" })
      .catch(() => null);
    if (!resp || !resp.ok) return [];
    const j = resp.json;
    if (j && j.success && Array.isArray(j.cart)) return j.cart;
    return [];
  }

  async function _saveServerCartArray(arr) {
    return await window.sopoppedFetch
      .postJSON("./api/cart_save.php", arr || [])
      .catch(() => null);
  }

  /**
   * Poll for session to be ready (useful after login before redirect).
   */
  async function waitForSessionReady(timeout = 2000, interval = 200) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const si = await window.sopoppedSession.fetchInfo();
      if (si && si.logged_in) return true;
      await new Promise((r) => setTimeout(r, interval));
    }
    return false;
  }
  window.sopoppedAuth.waitForSessionReady = waitForSessionReady;

  /**
   * Merge local cart with server cart. Sums quantities for duplicates.
   * @private
   */
  function _mergeCartsSumming(localArr, serverArr) {
    const map = new Map();
    // Add server items first
    (serverArr || []).forEach((it) => {
      const id = String(_itemId(it));
      if (!id) return;
      const qty = _itemQty(it);
      map.set(id, Object.assign({}, it, { id: Number(id), quantity: qty }));
    });
    // Merge local items
    (localArr || []).forEach((it) => {
      const id = String(_itemId(it));
      if (!id) return;
      const qty = _itemQty(it);
      if (map.has(id)) {
        const existing = map.get(id);
        existing.quantity += qty;
        map.set(id, existing);
      } else {
        map.set(id, Object.assign({}, it, { id: Number(id), quantity: qty }));
      }
    });
    return Array.from(map.values());
  }

  /**
   * Core Post-Login Handler: Merges carts and updates UI.
   * Called by login handler and successful logins.
   */
  async function mergeCartAfterLoginAndUpdateUI() {
    try {
      const local = _getLocalCartArray();

      // If no local cart, just refresh session UI
      if (local.length === 0) {
        document.dispatchEvent(
          new CustomEvent("cart-changed", { detail: { count: 0 } }),
        );
        return true;
      }

      // Fetch server cart and merge
      const server = await _fetchServerCart();
      const merged = _mergeCartsSumming(local, server);

      // Save merged cart to server
      const saveResp = await _saveServerCartArray(merged);
      if (!saveResp || !saveResp.success) {
        console.warn("Server failed to save merged cart");
      }

      // Update local storage matches merged state
      _setLocalCartArray(merged);

      // Update UI
      document.dispatchEvent(
        new CustomEvent("cart-changed", { detail: { count: merged.length } }),
      );

      return true;
    } catch (err) {
      console.error("Cart merge logic failed", err);
      return false;
    }
  }
  window.sopoppedAuth.mergeCartAfterLoginAndUpdateUI =
    mergeCartAfterLoginAndUpdateUI;

  // ==========================================================================
  // PART 3: FORM HANDLERS (General Helpers)
  // ==========================================================================

  function showValidateMsg($form, msg, type) {
    if (window.validationUI && window.validationUI.showValidateMsg) {
      return window.validationUI.showValidateMsg($form, msg, type);
    }
  }

  function hideValidateMsg($form) {
    if (window.validationUI && window.validationUI.hideValidateMsg) {
      return window.validationUI.hideValidateMsg($form);
    }
  }

  // ==========================================================================
  // PART 4: LOGIN SUBMIT HANDLER
  // ==========================================================================

  /**
   * Factory for login form submit handler.
   */
  window.sopoppedAuth.createLoginSubmitHandler = function (opts) {
    opts = opts || {};
    return function (form) {
      const $form = $(form);
      const submitBtn = $(opts.submitBtnSelector || "#loginSubmit");
      const originalText = submitBtn.text();

      submitBtn.prop("disabled", true).text("Logging in...");
      hideValidateMsg($form);

      // Pre-flight check from cached "checkUserExists" result
      const emailExists = $form.find("#loginEmail").data("exists");
      if (emailExists === false) {
        showValidateMsg($form, "No account found with that email.", "danger");
        submitBtn.prop("disabled", false).text(originalText);
        return false;
      }

      const fd = new FormData(form);
      const body = new URLSearchParams(fd);

      window.sopoppedFetch
        .postForm("./api/login_submit.php", body)
        .then(async (payload) => {
          if (payload && payload.success) {
            // Success: Update UI, merge cart, redirect
            showValidateMsg($form, "Login successful!", "success");

            await waitForSessionReady(); // Ensure cookie set
            await mergeCartAfterLoginAndUpdateUI();

            // Redirect or reload
            if (payload.redirect) window.location.href = payload.redirect;
            else window.location.reload();
          } else {
            // Failure
            const msg = payload.error || "Invalid email or password.";
            showValidateMsg($form, msg, "danger");
            submitBtn.prop("disabled", false).text(originalText);
          }
        })
        .catch(() => {
          showValidateMsg($form, "Network error. Try again.", "danger");
          submitBtn.prop("disabled", false).text(originalText);
        });

      return false;
    };
  };

  // ==========================================================================
  // PART 5: SIGNUP SUBMIT HANDLER
  // ==========================================================================

  /**
   * Factory for signup form submit handler.
   */
  window.sopoppedAuth.createSignupSubmitHandler = function (opts) {
    opts = opts || {};
    return function (form) {
      const $form = $(form);
      const submitBtn = $(opts.submitBtnSelector || "#signupSubmit");
      const originalText = submitBtn.text();

      submitBtn.prop("disabled", true).text("Creating Account...");
      hideValidateMsg($form);

      // Check duplicates again
      const emailExists = $form.find("#signupEmail").data("exists");
      if (emailExists === true) {
        showValidateMsg($form, "Account already exists.", "danger");
        submitBtn.prop("disabled", false).text(originalText);
        return false;
      }

      const fd = new FormData(form);
      const body = new URLSearchParams(fd);

      window.sopoppedFetch
        .postForm("./api/signup_submit.php", body)
        .then((payload) => {
          if (payload && payload.success) {
            showValidateMsg(
              $form,
              "Account created! Please log in.",
              "success",
            );

            // Switch to login dialog after delay
            setTimeout(() => {
              try {
                if ($("#signupDialog").length)
                  $("#signupDialog").dialog("close");
                if ($("#loginDialog").length) $("#loginDialog").dialog("open");
              } catch (e) {}
            }, 1200);

            submitBtn.prop("disabled", false).text(originalText);
            form.reset();
          } else {
            const msg = payload.error || "Failed to create account.";
            showValidateMsg($form, msg, "danger");
            submitBtn.prop("disabled", false).text(originalText);
          }
        })
        .catch(() => {
          showValidateMsg($form, "Network error.", "danger");
          submitBtn.prop("disabled", false).text(originalText);
        });

      return false;
    };
  };

  // ==========================================================================
  // PART 6: CHECKOUT SUBMIT HANDLER
  // ==========================================================================

  /**
   * Factory for checkout form submit handler.
   */
  window.sopoppedAuth.createCheckoutSubmitHandler = function (opts) {
    return function (form) {
      const $form = $(form);

      // 1. Check Cart Empty
      const cartJson = localStorage.getItem("sopopped_cart_v1") || "[]";
      const cart = JSON.parse(cartJson);
      if (!cart.length) {
        alert("Your cart is empty.");
        return false;
      }

      // 2. Inject Cart Data
      const cartInput = form.querySelector("#cart_items_input");
      if (cartInput) cartInput.value = JSON.stringify(cart);

      // 3. Check Session
      window.sopoppedFetch.json("./api/session_info.php").then((sess) => {
        if (!sess || !sess.logged_in) {
          showValidateMsg($form, "You must log in to checkout.", "danger");
          return;
        }

        // 4. Submit Order
        const fd = new FormData(form);
        window.sopoppedFetch.postFormData(form.action, fd).then((res) => {
          if (res && res.success) {
            // Order success: Clear cart and redirect
            localStorage.removeItem("sopopped_cart_v1");
            const oid = res.order_id || res.id || "";
            window.location.href =
              "order_success.php" + (oid ? "?order_id=" + oid : "");
          } else {
            alert(res.error || "Failed to place order.");
          }
        });
      });

      return false;
    };
  };
})(jQuery);
