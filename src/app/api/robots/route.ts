export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  const robotsTxt = `# Agent Blog - Robots.txt
# 完全开放，欢迎爬取

User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/api/sitemap

# 允许所有爬虫
# 博客内容完全开放，欢迎索引
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
