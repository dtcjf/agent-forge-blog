import { getAllArticles } from '@/lib/articles';

export async function GET() {
  const articles = getAllArticles();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  ${articles
    .map(
      (article) => `
  <url>
    <loc>${siteUrl}/posts/${article.slug}</loc>
    <lastmod>${new Date(article.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
