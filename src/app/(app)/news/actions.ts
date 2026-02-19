'use server'

import { NewsItem } from './types';
import * as cheerio from 'cheerio';

async function fetchPrabhupadaNews(page: number = 1): Promise<NewsItem[]> {
    const items: NewsItem[] = [];
    try {
        // Pagination seems broken on the site/news page (404s on page/2).
        // However, ?author=1 returns ~24 items, which is better than the default 5.
        // We will just fetch this one page for now.
        if (page > 1) return [];

        const url = 'http://www.prabhupadanugas.eu/news/?author=1';

        const response = await fetch(url, {
            next: { revalidate: 3600 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) return [];

        const html = await response.text();
        const $ = cheerio.load(html);

        const promises = $('.post, article, .entry').map(async (i, el) => {
            const titleEl = $(el).find('h2 a, h3 a, .entry-title a').first();
            const title = titleEl.text().trim();
            const link = titleEl.attr('href');

            if (!title || !link) return null;

            let desc = $(el).find('.entry-content, .post-content, .entry-summary, p').text();
            desc = desc.replace(/Read more.*/i, '').substring(0, 160).trim() + (desc.length > 160 ? '...' : '');

            let imageUrl = $(el).find('img').attr('src');
            if (!imageUrl) {
                imageUrl = $(el).find('[style*="background-image"]').css('background-image')?.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
            }

            // If no image found in feed, fetch the article page to find one
            if (!imageUrl && link) {
                try {
                    const articleHtml = await fetch(link, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
                    }).then(res => res.text());

                    const $article = cheerio.load(articleHtml);
                    // Try to find the first image in the content
                    const articleImg = $article('article img, .entry-content img, .post-content img').first();
                    imageUrl = articleImg.attr('src');
                } catch (e) {
                    console.error(`Failed to fetch image for ${link}`, e);
                }
            }

            // Fix relative URLs
            if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `http://www.prabhupadanugas.eu${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            const dateEl = $(el).find('.date, .time, .published, .updated').first();
            const pubDate = dateEl.attr('datetime') || dateEl.text().trim() || new Date().toISOString();
            const id = Buffer.from(link).toString('base64');

            return {
                id,
                title,
                link,
                description: desc,
                imageUrl,
                pubDate,
                source: 'Prabhupadanugas'
            } as NewsItem;
        }).get();

        const results = await Promise.all(promises);
        results.forEach(item => {
            if (item) items.push(item);
        });

    } catch (e) {
        console.error(`Error fetching Prabhupadanugas page ${page}`, e);
    }
    return items;
}

export async function fetchNewsFeed(): Promise<NewsItem[]> {
    const newsItems: NewsItem[] = [];

    // 1. Fetch from Prabhupadanugas.eu (Pages 1, 2, 3 to get ~15-20 items or more)
    // We execute in parallel
    const prabhupadaPromises = [1, 2, 3].map(page => fetchPrabhupadaNews(page));
    const prabhupadaResults = await Promise.all(prabhupadaPromises);

    // Flatten and deduplicate
    const pItems = prabhupadaResults.flat();
    const seen = new Set();
    pItems.forEach(item => {
        if (!seen.has(item.id)) {
            seen.add(item.id);
            newsItems.push(item);
        }
    });

    // 2. Fetch from Harekrsna Sun (Best Effort)
    try {
        const response = await fetch('https://www.harekrsna.com/sun/', {
            next: { revalidate: 3600 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);

            $('td a').each((i, el) => {
                const link = $(el).attr('href');
                const title = $(el).text().trim();

                if (!link || !title || title.length < 15) return;
                if (link.includes('index.htm') || link.includes('contact.htm')) return;

                const fullLink = link.startsWith('http') ? link : `https://www.harekrsna.com/sun/${link}`;
                const id = Buffer.from(fullLink).toString('base64');

                if (!newsItems.some(item => item.id === id)) {
                    newsItems.push({
                        id,
                        title,
                        link: fullLink,
                        source: 'Harekrsna Sun',
                        pubDate: new Date().toISOString()
                    });
                }
            });
        }
    } catch (e) {
        console.log("Could not fetch Harekrsna Sun");
    }

    return newsItems;
}

export async function fetchArticleContent(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        $('script, style, iframe, nav, footer, header, .sidebar, .comments, #comments, .widget, .ad, .menu, #secondary').remove();

        let content = '';
        const selectors = [
            'article',
            '.entry-content',
            '.post-content',
            '#content',
            'main',
            '.post_text',
            'td[width="80%"]'
        ];

        for (const selector of selectors) {
            const el = $(selector);
            if (el.length > 0 && el.text().trim().length > 100) {
                // Try to strip nested sidebars/related posts if they exist inside the content area
                el.find('.yarpp-related, .sharedaddy, .jp-relatedposts').remove();

                el.find('img').each((i, img) => {
                    const src = $(img).attr('src');
                    if (src && !src.startsWith('http')) {
                        if (url.includes('harekrsna.com')) {
                            $(img).attr('src', `https://www.harekrsna.com/sun/${src}`);
                        } else {
                            $(img).attr('src', `http://www.prabhupadanugas.eu${src.search(/^\//) ? '' : '/'}${src}`);
                        }
                    }
                    // Remove tiny tracking images
                    const width = parseInt($(img).prop('width') as string || '0');
                    const height = parseInt($(img).prop('height') as string || '0');
                    if (width === 1 || height === 1) {
                        $(img).remove();
                    }
                });
                content = el.html() || '';
                break;
            }
        }

        if (!content || content.length < 200) {
            const body = $('body').html();
            if (body && body.length > 500) return body;
        }

        return content || null;

    } catch (error) {
        console.error('Error fetching article content:', error);
        return null;
    }
}
