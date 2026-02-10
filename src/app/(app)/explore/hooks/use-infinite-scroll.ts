import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
    threshold?: number;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore: () => void;
}

/**
 * Custom hook for infinite scroll functionality
 * Detects when user scrolls near bottom and triggers load more
 */
export function useInfiniteScroll({
    threshold = 500,
    isLoading = false,
    hasMore = true,
    onLoadMore,
}: UseInfiniteScrollOptions) {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;

            // Show scroll-to-top button after scrolling down 300px
            setShowScrollTop(scrollTop > 300);

            // Check if near bottom
            if (scrollHeight - scrollTop - clientHeight < threshold) {
                if (!isLoading && hasMore) {
                    onLoadMore();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold, isLoading, hasMore, onLoadMore]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return { showScrollTop, scrollToTop };
}
