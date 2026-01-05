/**
 * Shared UI Logic for Admin Panel
 * Handles modal resetting, form confirmation, and common UI behaviors.
 */
(function (root) {
  const AdminUI = {
    /**
     * Resets a modal form when the modal is hidden.
     * @param {string} modalId - ID of the modal (e.g., 'userModal')
     * @param {string} formId - ID of the form inside the modal (e.g., 'userForm')
     * @param {object} options - Optional callbacks or settings
     */
    setupModalReset: function (modalId, formId, options = {}) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.addEventListener("hidden.bs.modal", function () {
        try {
          const form = document.getElementById(formId);
          if (form) {
            form.reset();
            // Clear validation classes
            form.querySelectorAll(".is-invalid, .is-valid").forEach((el) => {
              el.classList.remove("is-invalid");
              el.classList.remove("is-valid");
            });

            // Clear hidden IDs commonly used
            const inputsToClear = ["userId", "productId", "orderId"];
            inputsToClear.forEach((id) => {
              const el = document.getElementById(id);
              if (el) el.value = "";
            });

            // Clear password fields explicitly
            form.querySelectorAll('input[type="password"]').forEach((el) => {
              el.value = "";
            });

            // Reset role/status selects to defaults
            const role = document.getElementById("role");
            if (role) role.value = "customer";
            const status =
              document.getElementById("userStatus") ||
              document.getElementById("productStatus");
            if (status)
              status.value = status.id === "productStatus" ? "1" : "0";

            // Helpers for image preview reset (Product Modal)
            const imgPreview = document.getElementById("imagePreview");
            if (imgPreview) {
              imgPreview.src = "";
              imgPreview.classList.add("d-none");
            }
            const dropZoneText = document.getElementById("dropZoneText");
            if (dropZoneText) dropZoneText.classList.remove("d-none");

            // Hide and clear form-level validate message
            const vmsg = form.querySelector("#validate-msg");
            if (vmsg) {
              vmsg.classList.add("d-none");
              vmsg.textContent = "";
            }
            const smsg = form.querySelector("#success-msg");
            if (smsg) {
              smsg.classList.add("d-none");
              smsg.textContent = "";
            }

            if (typeof options.onReset === "function") {
              options.onReset(form);
            }
          }
        } catch (e) {
          console.warn(`Failed to reset modal ${modalId}`, e);
        }
      });
    },

    /**
     * Intercepts form submission to show a confirmation dialog.
     * Relies on HTML5 validity check first.
     * @param {string} formId - ID of the form
     * @param {string} confirmMessage - Message to show in confirm()
     * @param {function} submitHandler - Async function to handle actual submission.
     *                                   If provided, it overrides default submission.
     *                                   Receives the event object.
     */
    setupFormSubmission: function (formId, confirmMessage, submitHandler) {
      const form = document.getElementById(formId);
      if (!form) return;

      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // 0. jQuery Validation Check (if present and configured)
        try {
          if (typeof $ !== "undefined" && $(form).valid && !$(form).valid()) {
            // Validation failed, errors should be visible
            return;
          }
        } catch (err) {
          console.error("Validation crashed:", err);
          // If validation crashes (e.g. missing method), assume valid enough to let server decide or native check
        }

        // 1. Native HTML5 Validation
        if (!form.checkValidity()) {
          try {
            form.reportValidity();
          } catch (er) {}
          return;
        }

        // 2. Confirmation
        if (confirmMessage && !confirm(confirmMessage)) {
          return;
        }

        // 3. Hand off to custom handler or standard submit
        if (typeof submitHandler === "function") {
          try {
            await submitHandler(e);
          } catch (err) {
            console.error("Form submit handler failed:", err);
            alert("An error occurred: " + (err.message || "Unknown error"));
          }
        } else {
          // Fallback to standard submit if no handler provided (rare in this app)
          form.submit();
        }
      });
    },

    /**
     * Helper to populate a modal with data from a JSON data-attribute.
     * @param {HTMLElement} triggerBtn - Button that triggered the event
     * @param {object} mapping - Object mapping data keys to element IDs.
     *                           Example: { first_name: 'firstName', role: 'role' }
     * @param {function} customLogic - Optional callback for complex fields
     */
    populateModalFromButton: function (triggerBtn, mapping, customLogic) {
      if (!triggerBtn) return;
      try {
        const itemStr = triggerBtn.dataset.item;
        if (!itemStr) return;

        const item = JSON.parse(decodeURIComponent(itemStr));

        for (const [key, elementId] of Object.entries(mapping)) {
          const el = document.getElementById(elementId);
          if (el) {
            el.value =
              item[key] !== undefined && item[key] !== null ? item[key] : "";
          }
        }

        if (typeof customLogic === "function") {
          customLogic(item);
        }
      } catch (err) {
        console.error("Failed to parse item data", err);
      }
    },
  };

  root.sopoppedAdminUI = AdminUI;
})(window);
