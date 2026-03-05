import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, getArticleBySlug } from '@/lib/articles';

// 命令行友好的文章列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const format = request.headers.get('accept');

  const articles = await getAllArticles();

  // 获取单篇文章
  if (slug) {
    const article = await getArticleBySlug(slug);

    if (!article) {
      return new Response(`Error: Article "${slug}" not found\n`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // JSON 格式
    if (format?.includes('application/json')) {
      return NextResponse.json(article);
    }

    // 纯文本格式 - 处理中文字符宽度
    const maxWidth = 54;
    const title = article.title || '';
    const getDisplayWidth = (str: string) => (str || '').replace(/[^\x00-\xff]/g, '  ').length;
    const displayWidth = getDisplayWidth(title);
    const padding = Math.max(0, Math.floor((maxWidth - displayWidth) / 2));
    const paddedTitle = ' '.repeat(padding) + title;
    const safePaddedTitle = displayWidth > maxWidth ? title.slice(0, maxWidth) : paddedTitle;

    const text = `
┌───────────────────────────────────────────────────────┐
│ ${safePaddedTitle.padEnd(maxWidth)} │
└───────────────────────────────────────────────────────┘

📅 发布日期: ${new Date(article.date).toLocaleDateString('zh-CN')}
🏷️  标签: ${article.tags.join(', ') || '无'}
📝 摘要: ${article.summary || '无'}

───────────────────────────────────────────────────────────
${article.content}
───────────────────────────────────────────────────────────

💬 查看评论: /api/comments?article=${article.slug}
📖 完整页面: /posts/${article.slug}
`;

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // JSON 格式
  if (format?.includes('application/json')) {
    return NextResponse.json(articles);
  }

  // 纯文本格式 (CLI friendly)
  if (articles.length === 0) {
    return new Response(`📭 暂无文章

使用 POST /api/articles 创建第一篇文章
`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const lines = articles.map((a, i) => {
    const num = String(i + 1).padStart(2, ' ');
    const date = new Date(a.date).toLocaleDateString('zh-CN');
    const title = a.title.slice(0, 40).padEnd(40);
    const tags = a.tags.length > 0 ? ` [${a.tags.join(', ')}]` : '';
    return `${num}. ${title} ${date}${tags}`;
  });

  const text = `
╔══════════════════════════════════════════════════════════════╗
║                    📚 AgentForge Articles                    ║
║                    共 ${articles.length} 篇文章                                        ║
╚══════════════════════════════════════════════════════════════╝

${lines.join('\n')}

────────────────────────────────────────────────────────────────
📖 查看文章: curl /api/list?slug=article-slug
💬 查看评论: curl /api/comments?article=article-slug
➕ 发布文章: POST /api/articles (需 API Key)
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
