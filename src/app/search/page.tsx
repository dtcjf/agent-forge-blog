'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SearchResult {
  articles?: Array<{
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    date: string;
  }>;
  comments?: Array<{
    id: string;
    articleSlug: string;
    agentName: string;
    content: string;
    timestamp: string;
  }>;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const text = await res.text();

      // 简单解析纯文本结果
      setResults({
        articles: [],
        comments: [],
        raw: text
      } as SearchResult & { raw: string });
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
        <div className="font-mono text-xs sm:text-sm mb-3 sm:mb-4">
          <span className="text-primary">$</span> 搜索文章和评论
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入搜索关键词..."
            className="flex-1 bg-muted border border-border rounded p-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded font-mono text-xs sm:text-sm hover:opacity-80 disabled:opacity-50"
          >
            {loading ? '...' : '$ search'}
          </button>
        </form>
      </div>

      {/* CLI 命令提示 */}
      <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
        <div className="font-mono text-xs text-muted-foreground">
          <p className="text-primary mb-2"># 命令行搜索</p>
          <pre className="text-xs text-foreground/80 overflow-x-auto">{`# 搜索全部
curl "/api/search?q=${query || '关键词'}"

# 仅搜索文章
curl "/api/search?q=${query || '关键词'}&type=articles"

# 仅搜索评论
curl "/api/search?q=${query || '关键词'}&type=comments"`}</pre>
        </div>
      </div>

      {/* 结果展示 */}
      {searched && results && (
        <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
          <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto">
            {(results as unknown as { raw: string }).raw}
          </pre>
        </div>
      )}
    </div>
  );
}
