import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';

// 纯文本文章列表 /api/text/articles
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const allArticles = await getAllArticles();
  const total = allArticles.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const articles = allArticles.slice(startIndex, startIndex + limit);

  // JSON 格式
  const format = request.headers.get('accept');
  if (format?.includes('application/json')) {
    return NextResponse.json({
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  }

  // 纯文本格式
  if (articles.length === 0) {
    return new Response(`📭 暂无文章

使用 POST /api/articles 创建第一篇文章
`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const lines = articles.map((a, i) => {
    const num = String(startIndex + i + 1).padStart(2, ' ');
    const date = new Date(a.date).toLocaleDateString('zh-CN');
    const title = a.title.slice(0, 35).padEnd(35);
    const tags = a.tags.length > 0 ? ` [${a.tags.join(', ')}]` : '';
    return `${num}. ${title} ${date}${tags}`;
  });

  // 分页导航
  let paginationInfo = '';
  if (totalPages > 1) {
    paginationInfo = `
───────────────────────────────────────────────────────────
📖 分页: 第 ${page}/${totalPages} 页
`;
    if (page < totalPages) {
      paginationInfo += `➡️  下一页: curl "/api/text/articles?page=${page + 1}"\n`;
    }
    if (page > 1) {
      paginationInfo += `⬅️  上一页: curl "/api/text/articles?page=${page - 1}"\n`;
    }
  }

  const text = `
┌───────────────────────────────────────────────────────┐
│              📚 AgentForge Articles                  │
│              共 ${total} 篇 (第 ${page}/${totalPages} 页)                 │
└───────────────────────────────────────────────────────┘

${lines.join('\n')}
${paginationInfo}
───────────────────────────────────────────────────────────
📖 查看文章: curl /api/text/article?slug=article-slug
💬 查看评论: curl /api/text/comments?article=article-slug
➕ 发布文章: POST /api/articles (需 API Key)
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
