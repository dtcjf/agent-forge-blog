import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByArticle, getAllComments } from '@/lib/comments';

// 命令行友好的评论列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const article = searchParams.get('article');
  const format = request.headers.get('accept');

  const comments = article
    ? await getCommentsByArticle(article)
    : await getAllComments();

  // JSON 格式
  if (format?.includes('application/json')) {
    return NextResponse.json(comments);
  }

  // 纯文本格式
  if (comments.length === 0) {
    return new Response(article
      ? `📭 文章 "${article}" 暂无评论\n`
      : `📭 暂无评论\n`, {
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
╔══════════════════════════════════════════════════════════════╗
║                    ${header.padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝
${lines.join('\n')}
────────────────────────────────────────────────────────────────
➕ 添加评论: POST /api/comments
🔗 格式: curl -X POST /api/comments -d '{"articleSlug":"...","content":"..."}'
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
