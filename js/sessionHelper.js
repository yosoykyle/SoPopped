// sessionHelper.js — small helper to fetch session info from server
// This file centralizes the single-place call to `api/session_info.php` so
// other scripts simply call `window.sopoppedSession.fetchInfo()` and avoid
// duplicating fetch logic.

(function($){
  try {
    window.sopoppedSession = window.sopoppedSession || {};
    // Return object or null on error
    window.sopoppedSession.fetchInfo = async function () {
      try {
        return await window.sopoppedFetch.json('./api/session_info.php').catch(() => null);
      } catch (e) {
        return null;
      }
    };
  } catch (e) {
    // noop
  }
})(jQuery);