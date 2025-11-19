// Framework-agnostic adapter for validation messages — works without jQuery
// but will delegate to jQuery-side helpers (registered as `sopoppedValidate._jq`)
// when they are available. This keeps the public API usable in plain DOM
// environments while allowing better integration when jQuery helpers are present.
(function ($) {
  if (typeof window === 'undefined') return;

  // Ensure global object exists and add adapter methods only if missing.
  // This makes the adapter merge-safe regardless of script load order.
  window.sopoppedValidate = window.sopoppedValidate || {};

  // show(formOrSelectorOrElement, text, type)
  if (typeof window.sopoppedValidate.show !== 'function') {
    window.sopoppedValidate.show = function (formOrEl, text, type) {
      // Delegate to jQuery-side adapter registered by authDialogs.js when available
      try {
        if (window.sopoppedValidate._jq && typeof window.sopoppedValidate._jq.show === 'function') {
          try {
            var $form = (window.jQuery && formOrEl && formOrEl.jquery) ? formOrEl : (window.jQuery ? window.jQuery(formOrEl) : null);
            return window.sopoppedValidate._jq.show($form, text, type);
          } catch (e) {
            return window.sopoppedValidate._jq.show(null, text, type);
          }
        }
      } catch (e) {}

      // Adapter not registered — log and return false
      try {
        console.error('sopoppedValidate adapter error: jQuery helpers were not registered. Ensure authDialogs.js (which registers _jq) is loaded before using the adapter.');
      } catch (e) {}
      return false;
    };
  }

  // hide(formOrSelectorOrElement)
  if (typeof window.sopoppedValidate.hide !== 'function') {
    window.sopoppedValidate.hide = function (formOrEl) {
      try {
        if (window.sopoppedValidate._jq && typeof window.sopoppedValidate._jq.hide === 'function') {
          try {
            var $form = (window.jQuery && formOrEl && formOrEl.jquery) ? formOrEl : (window.jQuery ? window.jQuery(formOrEl) : null);
            return window.sopoppedValidate._jq.hide($form);
          } catch (e) {
            return window.sopoppedValidate._jq.hide(null);
          }
        }
      } catch (e) {}

      try {
        console.error('sopoppedValidate adapter error: jQuery helpers were not registered. Ensure authDialogs.js (which registers _jq) is loaded before using the adapter.');
      } catch (e) {}
      return false;
    };
  }
})(jQuery);