import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BookmarkCollection } from '@/types/collections';

// Fetch all collections for the current user
export function useCollections() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['bookmark-collections'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_bookmark_collections');
            if (error) throw error;
            return data as BookmarkCollection[];
        }
    });
}

// Create a new collection
export function useCreateCollection() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, isPrivate }: { name: string, isPrivate: boolean }) => {
            const { data, error } = await supabase.rpc('create_bookmark_collection', {
                p_name: name,
                p_is_private: isPrivate
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark-collections'] });
        }
    });
}

// Delete a collection
export function useDeleteCollection() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collectionId: string) => {
            const { error } = await supabase.rpc('delete_bookmark_collection', {
                p_collection_id: collectionId
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark-collections'] });
        }
    });
}

// Add a post to a collection
export function useAddToCollection() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ collectionId, postId }: { collectionId: string, postId: string }) => {
            const { error } = await supabase.rpc('add_to_collection', {
                p_collection_id: collectionId,
                p_post_id: postId
            });
            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate collections to update counts/covers
            queryClient.invalidateQueries({ queryKey: ['bookmark-collections'] });
            // Invalidate specific collection posts if we were viewing it
            queryClient.invalidateQueries({ queryKey: ['collection-posts'] });
        }
    });
}

// Remove a post from a collection
export function useRemoveFromCollection() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ collectionId, postId }: { collectionId: string, postId: string }) => {
            const { error } = await supabase.rpc('remove_from_collection', {
                p_collection_id: collectionId,
                p_post_id: postId
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark-collections'] });
            queryClient.invalidateQueries({ queryKey: ['collection-posts'] });
        }
    });
}
