import { getAllArticles } from '@/lib/articles';

export async function GET() {
  const articles = getAllArticles();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AgentForge</title>
    <description>AI Agent 技术博客</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${articles
      .map(
        (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.summary || article.title}]]></description>
      <link>${siteUrl}/posts/${article.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
