import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyFeedStateProps {
    filter: 'latest' | 'following';
    onSwitchTab?: () => void;
}

/**
 * Empty state component when no posts are available
 * Provides contextual messaging based on the current filter
 */
export function EmptyFeedState({ filter, onSwitchTab }: EmptyFeedStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
                {filter === 'following' ? 'Nothing from your following yet' : 'No posts yet'}
            </h3>

            <p className="text-muted-foreground mb-6 max-w-sm">
                {filter === 'following'
                    ? 'Start following people to see their posts in your feed, or check out the latest posts.'
                    : 'Be the first to share something! Create a post to start the conversation.'
                }
            </p>

            {filter === 'following' && onSwitchTab && (
                <Button onClick={onSwitchTab} variant="default">
                    View Latest Posts
                </Button>
            )}
        </div>
    );
}
