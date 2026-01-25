/**
 * =============================================================================
 * File: js/loadComponents.js
 * Purpose: The "Loader" (Optimization).
 * =============================================================================
 *
 * NOTE:
 * Heavy scripts (like the Popup system) slow down the initial page load.
 * We don't need them immediately.
 *
 * This script is a "Lazy Loader".
 * It waits until the page is ready, or until we need it, before fetching
 * heavier files like jQuery UI. This makes the site feel faster.
 * =============================================================================
 */

// Helper: Fetch a script file only if we haven't already.
function loadScript(url, checkVar) {
  return new Promise((resolve, reject) => {
    if (checkVar && window[checkVar]) return resolve(); // Already got it!

    if (document.querySelector(`script[src="${url}"]`)) return resolve(); // Already asking for it!

    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Helper: Fetch a CSS file.
function loadStyle(url) {
  if (document.querySelector(`link[href="${url}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

// ---------------------------------------------------------------------------
// MAIN LOADER
// ---------------------------------------------------------------------------
function loadJqueryUI() {
  loadStyle("./node_modules/jquery-ui/dist/themes/base/jquery-ui.css");

  // Check what we already have
  const hasUI = window.jQuery && window.jQuery.ui;
  const hasValidate =
    window.jQuery && window.jQuery.fn && window.jQuery.fn.validate;

  // A "Promise Chain" ensures order:
  // 1. Load jQuery UI... THEN
  // 2. Load Validation... THEN
  // 3. Announce "We are Ready!".

  let uiPromise = Promise.resolve();
  if (!hasUI) {
    uiPromise = loadScript(
      "./node_modules/jquery-ui/dist/jquery-ui.min.js",
      "jQuery.ui",
    );
  }

  return uiPromise
    .then(() => {
      // Step 2
      if (!hasValidate && (!window.jQuery || !window.jQuery.fn.validate)) {
        return loadScript(
          "./node_modules/jquery-validation/dist/jquery.validate.min.js",
          "jQuery.validator",
        );
      }
      return Promise.resolve();
    })
    .then(() => {
      // Step 3: Broadcast event for other scripts (like authDialogs.js) to listen for.
      document.dispatchEvent(new Event("jquery-ui-loaded"));
    })
    .catch((err) => console.error("Failed to load components", err));
}

// Auto-run when the DOM is ready.
document.addEventListener("DOMContentLoaded", loadJqueryUI);
