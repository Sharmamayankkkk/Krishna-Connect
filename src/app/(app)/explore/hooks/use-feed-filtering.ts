import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PostType } from '@/lib/types';

export type FeedFilter = 'following' | 'latest';

interface UseFeedFilteringOptions {
    initialFilter?: FeedFilter;
    onFilterChange?: (filter: FeedFilter) => void;
}

/**
 * Custom hook for managing feed filter state and URL sync
 */
export function useFeedFiltering({
    initialFilter = 'latest',
    onFilterChange,
}: UseFeedFilteringOptions = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = (searchParams.get('tab') as FeedFilter) || initialFilter;
    const [feedFilter, setFeedFilter] = useState<FeedFilter>(currentTab);

    // Update URL when filter changes
    const handleTabChange = useCallback((tab: FeedFilter) => {
        setFeedFilter(tab);
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
        onFilterChange?.(tab);
    }, [searchParams, pathname, router, onFilterChange]);

    // Sync state if URL changes externally (e.g. back button)
    useEffect(() => {
        if (currentTab !== feedFilter) {
            setFeedFilter(currentTab);
            onFilterChange?.(currentTab);
        }
    }, [currentTab, feedFilter, onFilterChange]);

    // Apply filter to posts
    const applyFilter = useCallback((posts: PostType[], filter: FeedFilter): PostType[] => {
        if (filter === 'following') {
            // Filter logic for following feed (to be implemented based on user's following list)
            return posts;
        }
        // Latest filter - return as is (already sorted by created_at desc from backend)
        return posts;
    }, []);

    return {
        feedFilter,
        handleTabChange,
        applyFilter,
    };
}
