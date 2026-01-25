/**
 * =============================================================================
 * File: js/cardAnimations.js
 * Status: DEAD CODE / DEPRECATED
 * =============================================================================
 *
 * NOTE:
 * This file is NO LONGER USED.
 * Animations are now handled efficiently via CSS in `styles.css`.
 *
 * We are keeping this file here just for reference, but it is NOT loaded.
 * =============================================================================
 */

/*
// -----------------------------------------------------------------------------
// OLD CODE BELOW - DO NOT USE
// -----------------------------------------------------------------------------

// CONFIGURATION
const ANIMATE_CLASS = "animate"; // The CSS class that triggers the motion

(function ($) {
  
  // STEP 1: SET INDEXES (Staggering)
  function initializeCardIndexes() {
    $(".row").each(function () {
      $(this).find(".card").each(function (index) {
        this.style.setProperty("--card-index", index);
      });
    });
  }

  // STEP 2: WATCHING THE SCROLL (Observer)
  function observeCards() {
    // Check if browser supports modern CSS animations natively. If so, skip JS.
    if (CSS.supports("animation-timeline: --card-timeline")) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { // Is it visible?
          entry.target.classList.add(ANIMATE_CLASS); // Add class
          obs.unobserve(entry.target); // Stop watching (run only once)
        }
      });
    }, { threshold: 0.2 }); // Trigger when 20% visible

    // Start watching all cards
    $(".card").each(function () { observer.observe(this); });
  }

  // STEP 3: DYNAMIC CONTENT
  function observeMutations() {
    const mutationObserver = new MutationObserver(initializeCardIndexes);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Run
  $(function () {
    initializeCardIndexes();
    observeCards();
    observeMutations();
  });

})(jQuery);
*/
