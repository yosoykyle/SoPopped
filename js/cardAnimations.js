/*
 * Card animations helper
 * Responsibilities split into small functions:
 * - compute and set card index CSS custom property for each card
 * - provide a fallback IntersectionObserver-based trigger when
 *   animation-timeline is not supported
 * - observe DOM mutations to re-run index calculation for dynamic content
 */

// Constants to replace magic numbers / strings
const CARD_INDEX_PROP = '--card-index';
const TIMELINE_SUPPORT_DECL = 'animation-timeline: --card-timeline';
const INTERSECTION_THRESHOLD = 0.2; // fraction of visibility required
const ANIMATE_CLASS = 'animate';

function setIndexOnCard(cardEl, index) {
    // single responsibility: set the index property for a single card element
    cardEl.style.setProperty(CARD_INDEX_PROP, index);
}

function setIndexesForRow($row) {
    // loop a row's cards and set the index property
    const $cards = $row.find('.card');
    $cards.each(function(index) {
        setIndexOnCard(this, index);
    });
}

function initializeCardIndexes() {
    // top-level iteration: apply to every .row on the page
    $('.row').each(function() {
        setIndexesForRow($(this));
    });
}

function createFallbackObserver() {
    // Creates an IntersectionObserver that adds ANIMATE_CLASS once
    // the element is visible. The observer unobserves after first
    // intersection so the animation runs once per element.
    return new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(ANIMATE_CLASS);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: INTERSECTION_THRESHOLD });
}

function observeCardsWithFallback() {
    // Do nothing if native animation-timeline is supported
    if (CSS.supports(TIMELINE_SUPPORT_DECL)) return;

    const io = createFallbackObserver();
    $('.card').each(function() {
        io.observe(this);
    });
}

function observeMutationsForIndexes() {
    // Re-run index initialization on DOM changes to support dynamic content
    const mutationObserver = new MutationObserver(initializeCardIndexes);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

$(function() {
    initializeCardIndexes();
    observeCardsWithFallback();
    observeMutationsForIndexes();
});