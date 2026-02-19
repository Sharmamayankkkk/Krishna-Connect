import { createClient } from '@/lib/utils';

const URL = 'https://krishnaconnect.in';

// Function to generate a URL entry for the sitemap
const generateUrlEntry = (
  loc: string,
  lastmod: string | null,
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly',
  priority: string
) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;

export async function GET() {
  const supabase = createClient();

  // 1. Fetch all public profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at');

  // 2. Fetch all events
  const { data: events } = await supabase
    .from('events')
    .select('id, updated_at');

  // Static pages
  const staticPages = [
    { loc: `${URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${URL}/login`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${URL}/signup`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${URL}/explore`, changefreq: 'daily', priority: '0.7' },
    { loc: `${URL}/events`, changefreq: 'daily', priority: '0.9' },
    { loc: `${URL}/terms-and-conditions`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${URL}/privacy-policy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${URL}/contact-us`, changefreq: 'yearly', priority: '0.5' },
    { loc: `${URL}/developers`, changefreq: 'monthly', priority: '0.4' },
  ];

  const staticEntries = staticPages.map(page =>
    generateUrlEntry(page.loc, new Date().toISOString(), page.changefreq as any, page.priority)
  ).join('');

  // Dynamic profile pages
  const profileEntries = profiles?.map(profile =>
    generateUrlEntry(
      `${URL}/profile/${profile.username}`,
      profile.updated_at,
      'weekly',
      '0.6'
    )
  ).join('') || '';

  // Dynamic event pages
  const eventEntries = events?.map(event =>
    generateUrlEntry(
      `${URL}/events/${event.id}`,
      event.updated_at,
      'daily',
      '0.8'
    )
  ).join('') || '';

  // 3. Fetch recent posts (limit 100 for performance)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const postEntries = posts?.map(post =>
    generateUrlEntry(
      `${URL}/post/${post.id}`,
      post.created_at,
      'weekly',
      '0.8'
    )
  ).join('') || '';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticEntries}
  ${profileEntries}
  ${eventEntries}
  ${postEntries}
</urlset>`;

  // Create new headers for the response
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', 'application/xml');

  // Return a new response with the sitemap and the correct headers
  return new Response(sitemap, {
    headers: responseHeaders,
  });
}
