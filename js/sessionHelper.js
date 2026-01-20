/**
 * =============================================================================
 * File: js/sessionHelper.js
 * Purpose: Centralized session info fetcher for the SoPopped application.
 * =============================================================================
 *
 * This small utility provides a single point of access to fetch session info
 * from the server. Other scripts call `window.sopoppedSession.fetchInfo()` to
 * check login status without duplicating fetch logic.
 *
 * Exports (window.sopoppedSession):
 *   - fetchInfo(): Returns Promise<Object|null> with session data or null on error
 *
 * Usage Example:
 *   const session = await window.sopoppedSession.fetchInfo();
 *   if (session && session.logged_in) {
 *     console.log('User is logged in:', session.user_name);
 *   }
 *
 * Dependencies:
 *   - fetchHelper.js (sopoppedFetch.json)
 *   - jQuery (passed but not heavily used)
 * =============================================================================
 */

(function ($) {
  try {
    // Initialize global namespace if not exists
    window.sopoppedSession = window.sopoppedSession || {};

    /**
     * Fetch session info from server API.
     * @returns {Promise<Object|null>} Session info object or null on error
     *   - logged_in: boolean - Whether user is logged in
     *   - user_id: number - User ID (if logged in)
     *   - user_name: string - User's name (if logged in)
     *   - user_email: string - User's email (if logged in)
     */
    window.sopoppedSession.fetchInfo = async function () {
      try {
        return await window.sopoppedFetch
          .json("./api/session_info.php")
          .catch(() => null);
      } catch (e) {
        return null;
      }
    };
  } catch (e) {
    // Silent fail - noop
  }
})(jQuery);
