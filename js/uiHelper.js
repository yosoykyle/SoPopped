/*
 * File: js/uiHelper.js
 * Purpose: Handles form validation messages (show, hide, reveal)
 *           for auth dialogs and other forms.
 *
 * Exports (window.sopoppedUI):
 *   - showValidateMsg($form, text, type): show message ('success' | 'warning' | else = 'error')
 *   - hideValidateMsg($form): clear & hide message
 *   - revealValidateMsg($form): unhide message text
 *
 * Behavior:
 *   - Finds #validate-msg or first .validate-msg in form
 *   - Uses Bootstrap alerts (danger/success/warning) + toggles d-none
 *   - Returns boolean for success/fallback handling
 *
 * Requirements:
 *   - jQuery required
 *   - Load after jQuery and CSS for .validate-msg + Bootstrap alerts
 *
 * Note:
 *   - Differs from js/uiHelpers.js (plural) — this file handles form UI;
 *     that one handles dialog layout.
 */


(function($){
  try {
    window.sopoppedUI = window.sopoppedUI || {};

    function _getValidateMsgElement($form) {
      try {
        if (!$form) return null;
        // Keep same selector semantics: #validate-msg inside form, or first .validate-msg
        const $el = $form.find('#validate-msg').length ? $form.find('#validate-msg') : $form.find('.validate-msg');
        return $el.length ? $el[0] : null;
      } catch (e) { return null; }
    }

    window.sopoppedUI.showValidateMsg = function ($form, text, type) {
      try {
        const el = _getValidateMsgElement($form && ($form[0] || $form) || $form);
        if (!el) return false;
        const $el = $(el);
        $el.removeClass('d-none');
        $el.removeClass('alert-danger alert-success alert-warning alert-info');
        $el.addClass(type === 'success' ? 'alert-success' : (type === 'warning' ? 'alert-warning' : 'alert-danger'));
        $el.text(text || '');
        return true;
      } catch (e) { return false; }
    };

    window.sopoppedUI.hideValidateMsg = function ($form) {
      try {
        const el = _getValidateMsgElement($form && ($form[0] || $form) || $form);
        if (!el) return false;
        const $el = $(el);
        $el.text('');
        $el.addClass('d-none');
        return true;
      } catch (e) { return false; }
    };

    window.sopoppedUI.revealValidateMsg = function ($form) {
      try {
        const el = _getValidateMsgElement($form && ($form[0] || $form) || $form);
        if (!el) return false;
        const $el = $(el);
        $el.removeClass('d-none');
        return true;
      } catch (e) { return false; }
    };
  } catch (e) { /* noop */ }
})(jQuery);