// Validation helpers used by both jQuery Validate custom methods and the
// non-jQuery adapter. These functions attach to `window.sopoppedValidate` and
// are safe to call from plain DOM code (they also integrate with jQuery when
// available).

(function($){
  try {
    window.sopoppedValidate = window.sopoppedValidate || {};

    window.sopoppedValidate.emailFormat = function(value){
      if (!value) return false;
      // Basic checks: exactly one @, at least one dot after @, and no weird chars
      try {
        const at = value.indexOf('@');
        if (at <= 0) return false;
        const after = value.slice(at+1);
        if (after.indexOf('.') === -1) return false;
        // disallow multiple @
        if (value.split('@').length !== 2) return false;
        return true;
      } catch (e) { return false; }
    };

    window.sopoppedValidate.emailChars = function(value){
      if (!value) return false;
      try {
        return /^[A-Za-z0-9._@]+$/.test(value);
      } catch (e) { return false; }
    };

    window.sopoppedValidate.passwordStrength = function(value){
      if (!value) return false;
      try {
        if (value.length < 8 || value.length > 16) return false;
        if (!/[A-Z]/.test(value)) return false;
        if (!/[a-z]/.test(value)) return false;
        if (!/[0-9]/.test(value)) return false;
        if (!/[!@#$%^&*;\'\[\]\/]/.test(value)) return false;
        return true;
      } catch (e) { return false; }
    };
  } catch (e) { /* noop */ }
})(jQuery);