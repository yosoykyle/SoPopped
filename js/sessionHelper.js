/**
 * =============================================================================
 * File: js/sessionHelper.js
 * Purpose: The "Identifier".
 * =============================================================================
 *
 * NOTE:
 * How does the website know "Who am I?"
 *
 * This script is responsible for asking that question.
 * It provides a single function `fetchInfo()` that calls our API (`session_info.php`).
 * The rest of the app calls this to check if it should show "Log In" or "My Account".
 * =============================================================================
 */

(function ($) {
  try {
    // ---------------------------------------------------------------------------
    // STEP 1: DEFINE NAMESPACE
    // ---------------------------------------------------------------------------
    // Create a safe place to store our function so we don't conflict with others.
    window.sopoppedSession = window.sopoppedSession || {};

    /**
     * METHOD: fetchInfo
     * Purpose: ask the server "Is anyone logged in?"
     * Returns: A Promise (a future answer) containing the User Info or null.
     */
    window.sopoppedSession.fetchInfo = async function () {
      try {
        // "Waiter, go ask the kitchen who is sitting at this table."
        return await window.sopoppedFetch
          .json("./api/session_info.php")
          .catch(() => null); // If error, assume nobody is home.
      } catch (e) {
        return null;
      }
    };
  } catch (e) {
    // Silent fail protection
  }
})(jQuery);
