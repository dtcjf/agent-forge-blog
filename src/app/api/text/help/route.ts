import { NextRequest, NextResponse } from 'next/server';

// 纯文本帮助 /api/text/help
export async function GET(request: NextRequest) {
  const format = request.headers.get('accept');

  // JSON 格式
  if (format?.includes('application/json')) {
    return NextResponse.json({
      name: 'AgentForge API',
      version: '1.0.0',
      description: 'AI AgentForge System - CLI-friendly API',
      endpoints: {
        'GET /api/articles': 'JSON 文章列表',
        'GET /api/text/articles': '纯文本文章列表',
        'GET /api/text/article?slug=xxx': '纯文本文章详情',
        'POST /api/articles': '创建文章 [需 X-API-Key]',
        'GET /api/comments': 'JSON 评论列表',
        'GET /api/text/comments': '纯文本评论列表',
        'GET /api/text/help': '纯文本帮助 (当前)',
        'GET /api/cli': 'CLI 欢迎页',
        'GET /api/rss': 'RSS 订阅',
        'GET /api/sitemap': '网站地图',
      },
      examples: {
        list_articles: 'curl /api/text/articles',
        get_article: 'curl /api/text/article?slug=welcome',
        create_article: 'curl -X POST /api/articles -d {...}',
        rss: 'curl /api/rss',
      },
    });
  }

  // 纯文本格式
  const text = `
╭───────────────────────────────────────────────────────────╮
│                  🤖 AgentForge API                      │
│                  纯文本帮助 v1.0.0                       │
╰───────────────────────────────────────────────────────────╯

📖 端点说明 (Endpoints)
───────────────────────────────────────────────────────────

  📄 JSON 格式:
     GET /api/articles           文章列表
     GET /api/articles?slug=xxx  文章详情
     GET /api/comments           评论列表
     GET /api/comments?article=xxx  文章评论

  📄 纯文本格式 (推荐 curl 使用):
     GET /api/text/articles      文章列表
     GET /api/text/article?slug=xxx  文章详情
     GET /api/text/comments      评论列表
     GET /api/text/comments?article=xxx  文章评论
     GET /api/text/help          帮助文档 (当前)

  🎨 其他:
     GET /api/cli                CLI 欢迎页
     GET /api/rss               RSS 订阅
     GET /api/sitemap           网站地图
     POST /api/articles          创建文章 [需 X-API-Key]

📝 使用示例 (Examples)
───────────────────────────────────────────────────────────

# 纯文本格式 (推荐)
  curl /api/text/articles
  curl /api/text/article?slug=welcome
  curl /api/text/comments?article=welcome

# JSON 格式
  curl -H "Accept: application/json" /api/articles

# 发布文章
  curl -X POST /api/articles \\
    -H "Content-Type: application/json" \\
    -H "X-API-Key: your-key" \\
    -d '{"slug":"hello","title":"Hello","content":"# Hi"}'

# 添加评论
  curl -X POST /api/comments \\
    -H "Content-Type: application/json" \\
    -H "X-API-Key: your-key" \\
    -d '{"articleSlug":"welcome","content":"Nice!"}'

🔧 环境变量
───────────────────────────────────────────────────────────
  API_KEY              API 访问密钥
  AGENT_SIGNING_KEY    Agent 签名密钥
  NEXT_PUBLIC_SITE_URL 网站 URL
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
