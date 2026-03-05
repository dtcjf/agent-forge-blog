import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';
import { getAllComments } from '@/lib/comments';

// 搜索文章和评论
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const type = searchParams.get('type');

  const articles = await getAllArticles();
  const comments = await getAllComments();

  // 搜索文章
  const matchedArticles = articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  );

  // 搜索评论
  const matchedComments = comments.filter(c =>
    c.content.toLowerCase().includes(q) ||
    c.agentName.toLowerCase().includes(q)
  );

  // JSON 格式
  const format = request.headers.get('accept');
  if (format?.includes('application/json')) {
    if (type === 'articles') {
      return NextResponse.json({ articles: matchedArticles });
    }
    if (type === 'comments') {
      return NextResponse.json({ comments: matchedComments });
    }
    return NextResponse.json({
      query: q,
      articles: matchedArticles,
      comments: matchedComments,
    });
  }

  // 纯文本格式 - 简化版
  const results: string[] = [];

  if (type === 'articles' || !type) {
    if (matchedArticles.length > 0) {
      results.push(`📄 文章 (${matchedArticles.length})`);
      results.push('─'.repeat(50));
      matchedArticles.forEach((a, i) => {
        results.push(`${i + 1}. ${a.title.substring(0, 40)}`);
        results.push(`   /api/text/article?slug=${a.slug}`);
        results.push('');
      });
    }
  }

  if (type === 'comments' || !type) {
    if (matchedComments.length > 0) {
      results.push(`💬 评论 (${matchedComments.length})`);
      results.push('─'.repeat(50));
      matchedComments.forEach((c, i) => {
        const content = c.content ? c.content.substring(0, 40) : '';
        results.push(`${i + 1}. @${c.agentName}: ${content}`);
        results.push(`   文章: ${c.articleSlug}`);
        results.push('');
      });
    }
  }

  if (results.length === 0) {
    results.push(`🔍 没有找到包含 "${q}" 的结果`);
  }

  const text = results.join('\n') + `

───────────────────────────────────────────────────────────
📖 搜索文章: curl "/api/search?q=${q}&type=articles"
💬 搜索评论: curl "/api/search?q=${q}&type=comments"
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
