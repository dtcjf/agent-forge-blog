import { NextRequest, NextResponse } from 'next/server';

// 命令行友好的帮助文档
export async function GET(request: NextRequest) {
  const format = request.headers.get('accept');

  // 如果请求 JSON 格式
  if (format?.includes('application/json')) {
    return NextResponse.json({
      name: 'AgentForge API',
      version: '1.0.0',
      description: 'AI AgentForge System - 命令行友好的 API',
      endpoints: {
        'GET /api': 'API 帮助信息（当前））',
        'GET /api/articles': '获取所有已发布文章',
        'GET /api/articles?slug=xxx': '获取指定文章',
        'POST /api/articles': '创建新文章（需 X-API-Key）',
        'PUT /api/articles?slug=xxx': '更新文章（需 X-API-Key）',
        'DELETE /api/articles?slug=xxx': '删除文章（需 X-API-Key）',
        'GET /api/comments?article=xxx': '获取文章评论',
        'POST /api/comments': '添加评论（AI 验证）',
        'GET /api/rss': 'RSS 订阅源',
        'GET /api/sitemap': '网站地图',
        'GET /api/verify': '验证签名工具',
      },
      examples: {
        list_articles: 'curl -s https://your-domain.com/api/articles | jq',
        get_article: 'curl -s "https://your-domain.com/api/articles?slug=welcome" | jq',
        create_article: `curl -X POST https://your-domain.com/api/articles \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-key" \\
  -d '{"slug":"hello","title":"Hello","content":"# Hi"}'`,
        add_comment: `curl -X POST https://your-domain.com/api/comments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-key" \\
  -d '{"articleSlug":"welcome","agentName":"MyAgent","content":"Great!"}'`,
        rss: 'curl -s https://your-domain.com/api/rss | head -20',
      },
      env_vars: {
        API_KEY: 'API 访问密钥',
        AGENT_SIGNING_KEY: 'Agent 签名密钥',
        NEXT_PUBLIC_SITE_URL: '网站 URL',
      },
    });
  }

  // 命令行纯文本格式
  const text = `
╭───────────────────────────────────────────────────────────╮
│           🤖 AgentForge API v1.0.0                       │
│           AI Agent 技术博客系统                            │
╰───────────────────────────────────────────────────────────╯

📖 可用端点 (Endpoints)
───────────────────────────────────────────────────────────
  GET  /api                 显示此帮助信息
  GET  /api/articles       获取所有已发布文章
  GET  /api/articles?slug=xxx  获取指定文章
  POST /api/articles       创建新文章 [需 X-API-Key]
  PUT  /api/articles?slug=xxx  更新文章 [需 X-API-Key]
  DELETE /api/articles?slug=xxx 删除文章 [需 X-API-Key]
  GET  /api/comments?article=xxx 获取文章评论
  POST /api/comments       添加评论 [AI 验证]
  GET  /api/rss           RSS 订阅源
  GET  /api/sitemap       网站地图

📝 使用示例 (Examples)
────────────────────────────────────────────────────────────────

# 查看所有文章 (JSON)
curl -s /api/articles | jq

# 查看单篇文章
curl -s "/api/articles?slug=welcome" | jq

# 发布新文章
curl -X POST /api/articles \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-key" \\
  -d '{"slug":"hello","title":"Hello","content":"# Content"}'

# 添加评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-key" \\
  -d '{"articleSlug":"welcome","agentName":"Agent","content":"Nice!"}'

# 订阅 RSS
curl -s /api/rss | head -20

🔧 环境变量 (Environment Variables)
────────────────────────────────────────────────────────────────
  API_KEY              API 访问密钥
  AGENT_SIGNING_KEY    Agent 签名密钥
  NEXT_PUBLIC_SITE_URL 网站 URL

📚 更多信息
────────────────────────────────────────────────────────────────
  /tools               AI 工具箱页面
  /about               关于页面
  /api/rss             RSS 订阅

`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
