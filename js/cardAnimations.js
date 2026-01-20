/**
 * =============================================================================
 * File: js/cardAnimations.js
 * Purpose: Scroll-driven animations for product cards.
 * =============================================================================
 *
 * This script adds progressive entry animations to cards using CSS variables
 * for staggered delays. It uses `IntersectionObserver` as a fallback for
 * browsers that don't support CSS scroll-driven animations.
 *
 * Logic:
 *   1. Calculates and sets --card-index on each card in a row.
 *   2. Observes DOM mutations to handle dynamic content (e.g., pagination).
 *   3. Adds 'animate' class when cards scroll into view.
 *
 * Dependencies:
 *   - jQuery
 * =============================================================================
 */

// Constants
const CARD_INDEX_PROP = "--card-index";
const TIMELINE_SUPPORT_DECL = "animation-timeline: --card-timeline";
const INTERSECTION_THRESHOLD = 0.2; // 20% visibility triggers animation
const ANIMATE_CLASS = "animate";

// ---------------------------------------------------------------------------
// 1. INDEX CALCULATION
// ---------------------------------------------------------------------------

/**
 * Set custom CSS property for staggered animation delay.
 * @param {HTMLElement} cardEl - Card element
 * @param {number} index - Index within the row
 */
function setIndexOnCard(cardEl, index) {
  cardEl.style.setProperty(CARD_INDEX_PROP, index);
}

/**
 * Calculate indexes for all cards in a row.
 * @param {jQuery} $row - Row container
 */
function setIndexesForRow($row) {
  const $cards = $row.find(".card");
  $cards.each(function (index) {
    setIndexOnCard(this, index);
  });
}

/**
 * Initialize indexes for all rows on the page.
 */
function initializeCardIndexes() {
  $(".row").each(function () {
    setIndexesForRow($(this));
  });
}

// ---------------------------------------------------------------------------
// 2. INTERSECTION OBSERVER
// ---------------------------------------------------------------------------

function createFallbackObserver() {
  // Trigger animation class when element enters viewport
  return new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(ANIMATE_CLASS);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: INTERSECTION_THRESHOLD },
  );
}

/**
 * Initialize observer if browser lacks native timeline support.
 */
function observeCardsWithFallback() {
  if (CSS.supports(TIMELINE_SUPPORT_DECL)) return;

  const io = createFallbackObserver();
  $(".card").each(function () {
    io.observe(this);
  });
}

// ---------------------------------------------------------------------------
// 3. MUTATION OBSERVER (For dynamic content)
// ---------------------------------------------------------------------------

function observeMutationsForIndexes() {
  const mutationObserver = new MutationObserver(initializeCardIndexes);
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// ---------------------------------------------------------------------------
// 4. INITIALIZATION
// ---------------------------------------------------------------------------

$(function () {
  initializeCardIndexes();
  observeCardsWithFallback();
  observeMutationsForIndexes();
});
