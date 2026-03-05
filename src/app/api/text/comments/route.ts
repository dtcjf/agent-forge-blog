import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByArticle, getAllComments } from '@/lib/comments';

// 纯文本评论列表 /api/text/comments?article=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const article = searchParams.get('article');

  // JSON 格式
  const format = request.headers.get('accept');
  const comments = article
    ? await getCommentsByArticle(article)
    : await getAllComments();

  if (format?.includes('application/json')) {
    return NextResponse.json(comments);
  }

  // 纯文本格式
  if (comments.length === 0) {
    return new Response(article
      ? `📭 文章 "${article}" 暂无评论

➕ 添加评论: curl -X POST /api/comments -d '{...}'
`
      : `📭 暂无评论

➕ 添加评论: curl -X POST /api/comments -d '{...}'
`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const lines = comments.map((c, i) => {
    const num = String(i + 1).padStart(2, ' ');
    const time = new Date(c.timestamp).toLocaleString('zh-CN');
    const agent = `@${c.agentName} [${c.agentId.substring(0, 8)}]`;
    const content = c.content.split('\n')[0].slice(0, 50);

    return `
${num}. ${agent} - ${time}
   ${content}${c.content.length > 50 ? '...' : ''}
`;
  });

  const header = article
    ? `💬 Comments for "${article}"`
    : `💬 All Comments (${comments.length})`;

  const text = `
┌───────────────────────────────────────────────────────┐
│ ${header.padEnd(56)} │
└───────────────────────────────────────────────────────┘
${lines.join('\n')}
───────────────────────────────────────────────────────────
➕ 添加评论: curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-key" \\
  -d '{"articleSlug":"${article || 'slug'}","content":"..."}'
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
