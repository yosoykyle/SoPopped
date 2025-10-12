// Set up card animation indices
function initializeCardAnimations() {
    document.querySelectorAll('.row').forEach(row => {
        const cards = row.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.setProperty('--card-index', index);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCardAnimations();

    // Fallback: IntersectionObserver for Safari/iOS
    if (!CSS.supports("animation-timeline: --card-timeline")) {
        const cards = document.querySelectorAll('.card');
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target); // only animate once
                }
            });
        }, { threshold: 0.2 });

        cards.forEach(card => io.observe(card));
    }
});

// Re-initialize when content changes (for dynamic content)
const observer = new MutationObserver(initializeCardAnimations);
observer.observe(document.body, { childList: true, subtree: true });
