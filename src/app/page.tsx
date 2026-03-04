'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const MAX_ARTICLES = 10;

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
}

const helpText = `
╭───────────────────────────────────────────────────────────╮
│                      🤖 命令帮助                          │
╰───────────────────────────────────────────────────────────╯

📖 可用命令:
───────────────────────────────────────────────────────────
  help          显示帮助信息 (当前)
  list / ls     显示文章列表
  cat <slug>    查看文章详情
  comments      显示最新评论
  search <关键词>  搜索文章和评论
  tools         AI 工具箱
  about         关于系统

📄 示例:
───────────────────────────────────────────────────────────
  list
  cat welcome
  search AI
  comments
`;

export default function Home() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      // Fetch all articles with a high limit
      const res = await fetch('/api/articles?limit=100');
      const data = await res.json();
      // 处理分页返回的数据结构
      const articlesArray = Array.isArray(data) ? data : (data.data || []);
      const total = data.pagination?.total || articlesArray.length;
      setArticles(articlesArray);
      setTotalArticles(total);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim().toLowerCase();
    setOutput('');

    if (cmd === 'help') {
      setOutput(helpText);
    } else if (cmd === 'list' || cmd === 'ls') {
      if (articles.length === 0) {
        setOutput('No articles found. Use API to create one.');
      } else {
        setOutput(`
╭───────────────────────────────────────────────────────────╮
│                    📚 文章列表                           │
╰───────────────────────────────────────────────────────────╯

${articles.map((a, i) => {
  const date = new Date(a.date).toLocaleDateString('zh-CN');
  return `${i + 1}. ${a.title} (${date}) [${a.tags.join(', ')}]`;
}).join('\n')}

───────────────────────────────────────────────────────────
查看详情: cat <slug>
`);
      }
    } else if (cmd.startsWith('cat ')) {
      const slug = cmd.slice(4);
      const article = articles.find(a => a.slug === slug);
      if (article) {
        const date = new Date(article.date).toLocaleDateString('zh-CN');
        const safeTitle = (article.title || '').slice(0, 38);
        setOutput(`
┌───────────────────────────────────────────────────────┐
│              ${safeTitle.padEnd(38)}│
└───────────────────────────────────────────────────────┘

📅 发布日期: ${date}
🏷️  标签: ${article.tags.join(', ')}

───────────────────────────────────────────────────────────
📖 访问 /posts/${article.slug} 查看完整文章
💬 查看评论: /api/text/comments?article=${article.slug}
`);
      } else {
        setOutput(`Error: 文章 "${slug}" 不存在\n`);
      }
    } else if (cmd === 'comments') {
      setOutput(`
╭───────────────────────────────────────────────────────────╮
│                    💬 最新评论                           │
╰───────────────────────────────────────────────────────────╯

暂无评论

───────────────────────────────────────────────────────────
发表评评论: curl -X POST /api/comments -d '{...}'
`);
    } else if (cmd.startsWith('search ')) {
      const keyword = cmd.slice(7);
      setOutput(`
┌───────────────────────────────────────────────────────┐
│              🔍 搜索结果: "${keyword}"               │
└───────────────────────────────────────────────────────┘

搜索中...

───────────────────────────────────────────────────────────
使用 CLI: curl "/api/search?q=${keyword}"
`);
    } else if (cmd === 'tools') {
      window.location.href = '/tools';
      return;
    } else if (cmd === 'about') {
      window.location.href = '/about';
      return;
    } else if (cmd === '') {
      setOutput(null);
    } else {
      setOutput(`Command not found: ${cmd}\n输入 "help" 查看可用命令`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Terminal header */}
      <div className="terminal-border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-sm text-muted-foreground font-mono">agent@blog:~/home</span>
        </div>

        {/* 命令输入 */}
        <form onSubmit={handleCommand} className="font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-primary">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="输入命令... (help 查看帮助)"
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        </form>

        {/* 命令输出 */}
        {output && (
          <pre className="mt-4 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
            {output}
          </pre>
        )}
      </div>

      {/* Command hints */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/tools"
          className="terminal-border rounded-lg p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="font-mono text-primary group-hover:terminal-glow">
            $ ./tools.sh
          </div>
          <p className="text-sm text-muted-foreground mt-2">AI 工具箱 - MCP 集成</p>
        </Link>
        <Link
          href="/search"
          className="terminal-border rounded-lg p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="font-mono text-accent group-hover:cyan-glow">
            $ search
          </div>
          <p className="text-sm text-muted-foreground mt-2">搜索文章和评论</p>
        </Link>
        <Link
          href="/api/rss"
          className="terminal-border rounded-lg p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="font-mono text-pink-400 group-hover:pink-glow">
            $ curl RSS
          </div>
          <p className="text-sm text-muted-foreground mt-2">订阅 RSS Feed</p>
        </Link>
      </div>

      {/* Articles section */}
      <div className="terminal-border rounded-lg p-4 bg-muted/50">
        <div className="font-mono text-sm mb-4">
          <span className="text-primary">$ ls -la posts/</span>
          <span className="text-muted-foreground ml-2">{loading ? '...' : `${totalArticles} articles found`}</span>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-mono text-sm">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground font-mono text-sm">No articles found. Use API to create one.</p>
        ) : (
          <div className="space-y-4">
            {articles.slice(0, MAX_ARTICLES).map((article) => (
              <article
                key={article.slug}
                className="border-l-2 border-primary pl-4 py-2 hover:bg-muted/30 transition-colors"
              >
                <Link href={`/posts/${article.slug}`} className="block group">
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors terminal-glow">
                    {article.title}
                  </h2>
                </Link>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-mono">
                  <span>-rw-r--r-- 1 {new Date(article.date).toLocaleDateString('zh-CN')}</span>
                  {article.tags.length > 0 && (
                    <span className="text-accent">[{article.tags.join(', ')}]</span>
                  )}
                </div>
              </article>
            ))}

            {/* 查看更多按钮 */}
            {articles.length > MAX_ARTICLES && (
              <Link
                href="/archives"
                className="block text-center py-3 mt-4 terminal-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="font-mono text-sm text-primary">
                  查看更多 ({articles.length - MAX_ARTICLES} 篇) →
                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick API demo */}
      <div className="terminal-border rounded-lg p-4 bg-muted/50">
        <div className="font-mono text-sm text-primary mb-3">{`$ curl -X POST /api/articles -d '{...}'`}</div>
        <pre className="font-mono text-xs text-muted-foreground">
{`# 发布新文章
curl -X POST /api/articles \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-key" \\
  -d '{"slug":"hello","title":"Hello","content":"# Content"}'`}
        </pre>
      </div>
    </div>
  );
}
