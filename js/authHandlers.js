/**
 * =============================================================================
 * File: js/authHandlers.js
 * Purpose: The "Brain" of Authentication.
 * =============================================================================
 *
 * NOTE:
 * While `authDialogs.js` handles the "Looks", this file handles the "Thinking".
 *
 * It answers questions like:
 *   1. "Is this email already taken?" (User Check)
 *   2. "What happens when they click Login?" (Submit Handler)
 *   3. "How do we move their guest cart to their account?" (Cart Merge)
 *
 * It connects the Forms to the API.
 * =============================================================================
 */

(function ($) {
  "use strict";

  if (typeof window === "undefined") return;
  window.sopoppedAuth = window.sopoppedAuth || {};

  // ==========================================================================
  // PART 1: PRE-FLIGHT CHECKS (User Existence)
  // ==========================================================================

  /**
   * ACTION: Check User Exists
   * Purpose: Before they even click submit, tell them if the email is valid/invalid.
   * Usage: Called when user tabs out of the email field.
   */
  window.sopoppedAuth.checkUserExists = function (email, cb, opts) {
    opts = opts || {};
    const $field = opts.$field || $(opts.selector || "#loginEmail");
    const $form =
      opts.$form || ($field && $field.closest ? $field.closest("form") : null);
    const context = opts.context || "login";

    if (!email) return; // Don't check empty strings

    // Ask the API
    const _checkUserExistsFetcher = window.sopoppedFetch.postForm(
      "./api/check_user_exists.php",
      new URLSearchParams({ email: email }),
    );

    Promise.resolve(_checkUserExistsFetcher)
      .then((json) => {
        try {
          const exists =
            json && typeof json.exists === "boolean" ? json.exists : undefined;
          const archived = json && !!json.is_archived;

          // Save the answer on the field itself (data attribute) so we can check it later instantly
          if (exists === true) {
            $field.data("exists", true);

            // FEEDBACK: Signup (Bad) vs Login (Goodish)
            if (context === "signup") {
              // If signing up, existence is BAD.
              if (window.validationUI)
                window.validationUI.showValidateMsg(
                  $form,
                  archived ? "Archived account." : "Email already exists.",
                  "danger",
                );
            } else if (context === "login" && archived) {
              if (window.validationUI)
                window.validationUI.showValidateMsg(
                  $form,
                  "Account deactivated.",
                  "danger",
                );
            }
          } else {
            // User does nota exist
            $field.data("exists", false);
            if (context === "login") {
              // If logging in, non-existence is BAD.
              if (window.validationUI)
                window.validationUI.showValidateMsg(
                  $form,
                  "No account found.",
                  "danger",
                );
            } else {
              // If signing up, non-existence is GOOD. Hide errors.
              if (window.validationUI)
                window.validationUI.hideValidateMsg($form);
            }
          }
        } catch (e) {
          console.warn("check_user_exists failed", e);
        }
        if (typeof cb === "function") cb(json || {});
      })
      .catch((err) => {
        if (typeof cb === "function") cb({});
      });
  };

  // ==========================================================================
  // PART 2: THE MERGE (Guest -> User)
  // ==========================================================================

  // NOTE:
  // This is a complex but crucial feature.
  // If a guest adds items to their cart, THEN logs in, we shouldn't lose those items.
  // We must "Merge" them with whatever is saved in their account.

  /**
   * LOGIC: Merge Carts
   * 1. Get Local Cart (Guest)
   * 2. Get Server Cart (Saved Account)
   * 3. Combine them (Sum quantities: 2 Guest + 1 Saved = 3 Total)
   * 4. Save back to Server
   * 5. Update Local Storage
   */
  async function mergeCartAfterLoginAndUpdateUI() {
    try {
      // 1. Get Guest Cart
      const local = JSON.parse(
        localStorage.getItem("sopopped_cart_v1") || "[]",
      );

      // Optimization: If guest cart empty, nothing to merge. Just refresh UI.
      if (!local.length) {
        document.dispatchEvent(
          new CustomEvent("cart-changed", { detail: { count: 0 } }),
        );
        return true;
      }

      // 2. Fetch Server Cart
      const resp = await window.sopoppedFetch
        .request("./api/cart_load.php", { method: "GET" })
        .catch(() => null);
      const server = resp && resp.json && resp.json.cart ? resp.json.cart : [];

      // 3. Combine (The Math)
      const map = new Map();

      // -- Add Server Items --
      server.forEach((it) => {
        const id = String(it.id);
        map.set(id, { ...it, quantity: Number(it.quantity || 0) });
      });

      // -- Add/Sum Local Items --
      local.forEach((it) => {
        const id = String(it.id);
        const qty = Number(it.quantity || it.qty || 0);
        if (map.has(id)) {
          const existing = map.get(id);
          existing.quantity += qty; // Summing
          map.set(id, existing);
        } else {
          map.set(id, { ...it, id: Number(id), quantity: qty });
        }
      });

      const merged = Array.from(map.values());

      // 4. Save Result to Server
      await window.sopoppedFetch.postJSON("./api/cart_save.php", merged);

      // 5. Update Local
      localStorage.setItem("sopopped_cart_v1", JSON.stringify(merged));
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

  // Helper: Wait for session cookie to settle
  async function waitForSessionReady(timeout = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const si = await window.sopoppedSession.fetchInfo();
      if (si && si.logged_in) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }
  window.sopoppedAuth.waitForSessionReady = waitForSessionReady;

  // ==========================================================================
  // PART 3: SUBMIT HANDLERS
  // ==========================================================================

  // --- LOGIN ---
  window.sopoppedAuth.createLoginSubmitHandler = function (opts) {
    return function (form) {
      const $form = $(form);
      const submitBtn = $("#loginSubmit");
      const originalText = submitBtn.text();

      // Lock UI
      submitBtn.prop("disabled", true).text("Logging in...");
      if (window.validationUI) window.validationUI.hideValidateMsg($form);

      const body = new URLSearchParams(new FormData(form));

      window.sopoppedFetch
        .postForm("./api/login_submit.php", body)
        .then(async (payload) => {
          if (payload && payload.success) {
            // Success!
            if (window.validationUI)
              window.validationUI.showValidateMsg(
                $form,
                "Login successful!",
                "success",
              );

            // Critical: Wait for session & Merge Carts
            await waitForSessionReady();
            await mergeCartAfterLoginAndUpdateUI();

            // Go to destination
            if (payload.redirect) window.location.href = payload.redirect;
            else window.location.reload();
          } else {
            // Failure
            const msg = payload.error || "Invalid email or password.";
            if (window.validationUI)
              window.validationUI.showValidateMsg($form, msg, "danger");
            submitBtn.prop("disabled", false).text(originalText);
          }
        })
        .catch(() => {
          if (window.validationUI)
            window.validationUI.showValidateMsg(
              $form,
              "Network error.",
              "danger",
            );
          submitBtn.prop("disabled", false).text(originalText);
        });
      return false;
    };
  };

  // --- SIGNUP ---
  window.sopoppedAuth.createSignupSubmitHandler = function (opts) {
    return function (form) {
      const $form = $(form);
      const submitBtn = $("#signupSubmit");
      const originalText = submitBtn.text();

      submitBtn.prop("disabled", true).text("Creating Account...");
      if (window.validationUI) window.validationUI.hideValidateMsg($form);

      const body = new URLSearchParams(new FormData(form));

      window.sopoppedFetch
        .postForm("./api/signup_submit.php", body)
        .then((payload) => {
          if (payload && payload.success) {
            if (window.validationUI)
              window.validationUI.showValidateMsg(
                $form,
                "Account created! Please log in.",
                "success",
              );

            // UX: Close Signup, Open Login automatically
            setTimeout(() => {
              if ($("#signupDialog").length) $("#signupDialog").dialog("close");
              if ($("#loginDialog").length) $("#loginDialog").dialog("open");
            }, 1200);

            submitBtn.prop("disabled", false).text(originalText);
            form.reset();
          } else {
            const msg = payload.error || "Failed to create account.";
            if (window.validationUI)
              window.validationUI.showValidateMsg($form, msg, "danger");
            submitBtn.prop("disabled", false).text(originalText);
          }
        })
        .catch(() => {
          if (window.validationUI)
            window.validationUI.showValidateMsg(
              $form,
              "Network error.",
              "danger",
            );
          submitBtn.prop("disabled", false).text(originalText);
        });
      return false;
    };
  };

  // --- CHECKOUT ---
  window.sopoppedAuth.createCheckoutSubmitHandler = function (opts) {
    return function (form) {
      const $form = $(form);

      // 1. Is the cart empty?
      const cartAll = JSON.parse(
        localStorage.getItem("sopopped_cart_v1") || "[]",
      );
      if (!cartAll.length) {
        alert("Your cart is empty.");
        return false;
      }

      // 2. Attach cart data (Respect Selection)
      let finalItems = cartAll;
      if (
        window.sopoppedCart &&
        typeof window.sopoppedCart.getSelectedItems === "function"
      ) {
        const selected = window.sopoppedCart.getSelectedItems();
        if (selected.length > 0) {
          finalItems = selected;
        }
      }

      const cartJson = JSON.stringify(finalItems);
      const cartInput = form.querySelector("#cart_items_input");
      if (cartInput) cartInput.value = cartJson;

      // 3. Are we logged in?
      window.sopoppedFetch.json("./api/session_info.php").then((sess) => {
        if (!sess || !sess.logged_in) {
          if (window.validationUI)
            window.validationUI.showValidateMsg(
              $form,
              "You must log in to checkout.",
              "danger",
            );
          return;
        }

        // 4. Send the order!
        const fd = new FormData(form);
        window.sopoppedFetch.postFormData(form.action, fd).then((res) => {
          if (res && res.success) {
            // Success: Clear Cart & Show Receipt
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
