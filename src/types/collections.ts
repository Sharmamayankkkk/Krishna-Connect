
export type BookmarkCollection = {
    id: string;
    name: string;
    is_private: boolean;
    created_at: string;
    post_count: number;
    last_post_cover: string | null;
};

export type BookmarkCollectionItem = {
    collection_id: string;
    post_id: string;
    added_at: string;
};
