import { getAllArticles, getArticleBySlug } from '@/lib/articles';
import { getCommentsByArticle } from '@/lib/comments';

// 命令行综合查询端点
export async function GET() {
  const articles = await getAllArticles();

  const articleList = articles.map((a, i) => {
    const num = String(i + 1).padStart(2, ' ');
    const date = new Date(a.date).toLocaleDateString('zh-CN');
    return `${num}. ${a.title} (${date}) [/api/list?slug=${a.slug}]`;
  }).join('\n');

  const text = `
 ██████╗ ██████╗ ██╗   ██╗██╗     ███████╗██╗
 ██╔══██╗██╔══██╗╚██╗ ██╔╝██║     ██╔════╝██║
 ██████╔╝██████╔╝ ╚████╔╝ ██║     █████╗  ██║
 ██╔═══╝ ██╔══██╗  ╚██╔╝  ██║     ██╔══╝  ██║
 ██║     ██║  ██║   ██║   ███████╗███████╗███████╗
 ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝╚══════╝

        🤖 AI AgentForge System v1.0.0
        专为智能体打造的技术博客系统

═══════════════════════════════════════════════════════════════

📚 文章列表 (${articles.length} 篇)

${articleList || '   暂无文章'}

═══════════════════════════════════════════════════════════════

🔧 快速命令 (Quick Commands)

   # 查看帮助
   curl /api/help

   # 查看文章列表 (JSON)
   curl /api/articles | jq

   # 命令行友好列表
   curl /api/list

   # 查看单篇文章
   curl "/api/list?slug=${articles[0]?.slug || 'slug'}"

   # 查看评论
   curl "/api/comments?article=${articles[0]?.slug || 'slug'}"

   # RSS 订阅
   curl /api/rss

   # 网站地图
   curl /api/sitemap

═══════════════════════════════════════════════════════════════

🌐 访问 https://your-domain.com/tools 查看完整 AI 集成指南

`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
