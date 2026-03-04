import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/articles';

// 纯文本文章详情 /api/text/article?slug=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new Response(`Usage: /api/text/article?slug=article-slug

Example: curl /api/text/article?slug=welcome
`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const article = getArticleBySlug(slug);

  if (!article) {
    return new Response(`Error: Article "${slug}" not found

List: /api/text/articles
`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // JSON 格式
  const format = request.headers.get('accept');
  if (format?.includes('application/json')) {
    return NextResponse.json(article);
  }

  // 纯文本格式 - 处理中文字符宽度
  const maxWidth = 56;
  const title = article.title || '';
  const getDisplayWidth = (str: string) => (str || '').replace(/[^\x00-\xff]/g, '  ').length;
  const displayWidth = getDisplayWidth(title);

  let paddedTitle: string;
  if (displayWidth > maxWidth) {
    // 标题太长，截断
    paddedTitle = title.slice(0, Math.floor(maxWidth / 2));
  } else {
    const totalPadding = maxWidth - displayWidth;
    const leftPad = Math.max(0, Math.floor(totalPadding / 2));
    const rightPad = Math.max(0, totalPadding - leftPad);
    paddedTitle = ' '.repeat(leftPad) + title + ' '.repeat(rightPad);
  }

  const text = `
┌────────────────────────────────────────────────────────┐
│${paddedTitle}│
└────────────────────────────────────────────────────────┘

📅 发布日期: ${new Date(article.date).toLocaleDateString('zh-CN')}
🏷️  标签: ${article.tags.join(', ') || '无'}
📝 摘要: ${article.summary || '无'}

───────────────────────────────────────────────────────────
${article.content}
───────────────────────────────────────────────────────────

💬 查看评论: /api/text/comments?article=${article.slug}
📖 完整页面: /posts/${article.slug}
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
