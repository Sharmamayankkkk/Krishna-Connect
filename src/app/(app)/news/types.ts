export interface NewsItem {
    id: string; // Unique ID (hash of URL or original ID)
    title: string;
    link: string;
    description?: string;
    imageUrl?: string;
    pubDate?: string;
    source: 'Prabhupadanugas' | 'Harekrsna Sun';
    content?: string; // Full content for reader view
}

export interface NewsFeedResponse {
    items: NewsItem[];
    error?: string;
}
