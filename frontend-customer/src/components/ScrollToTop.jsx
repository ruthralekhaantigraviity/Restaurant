import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures every page navigation starts at the very top (heading)
 * instead of preserving scroll position at the footer.
 */
const ScrollToTop = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // If there's an anchor hash (e.g. #offers, #featured-restaurants), smoothly scroll to that element
        if (hash) {
            const targetId = hash.replace('#', '');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }

        // Otherwise, immediately scroll to the top of the window on full page navigation
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [pathname, hash]);

    return null;
};

export default ScrollToTop;
