// Wait for the DOM to be ready before loading components
// This script no longer fetches HTML fragments. The app has been migrated to server-side
// includes for primary components. loadComponents.js now ensures optional UI/validation
// assets are loaded so the auth dialogs and validation code can run when fragments are
// included server-side.

document.addEventListener('DOMContentLoaded', async () => {
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function loadStyle(href) {
        return new Promise((resolve, reject) => {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            l.onload = resolve;
            l.onerror = reject;
            document.head.appendChild(l);
        });
    }

    try {
        await loadStyle('./node_modules/jquery-ui/themes/base/all.css');
    } catch (e) {
        try { await loadStyle('./node_modules/jquery-ui/themes/base/jquery-ui.css'); } catch (err) { /* ignore */ }
    }

    try {
        await loadScript('./node_modules/jquery-ui/dist/jquery-ui.min.js');
        await loadScript('./node_modules/jquery-validation/dist/jquery.validate.min.js');
        await loadScript('./node_modules/jquery-validation/dist/additional-methods.min.js');
    } catch (err) {
        // Optional UI/validation scripts failed to load — ignore silently in production
    }

    // Notify authDialogs.js that jQuery UI is ready (authDialogs listens for this event)
    const evt = new Event('jquery-ui-loaded');
    document.dispatchEvent(evt);
    // Also trigger a jQuery event for code that listens via jQuery
    if (window.jQuery) {
        window.jQuery(document).trigger('jquery-ui-loaded');
    }
});