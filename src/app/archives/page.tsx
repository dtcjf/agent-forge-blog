'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
}

const ARTICLES_PER_PAGE = 10;

export default function ArchivesPage() {
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    // Reset to page 1 when year or month changes
    setCurrentPage(1);
  }, [selectedYear, selectedMonth]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles?limit=100');
      const data = await res.json();
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

  // Filter articles by year
  const articlesByYear = selectedYear
    ? articles.filter(a => new Date(a.date).getFullYear() === parseInt(selectedYear))
    : articles;

  // Group by month
  const byMonth: Record<string, ArticleMeta[]> = {};
  for (const article of articlesByYear) {
    const date = new Date(article.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(article);
  }
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  // Filter articles by year and month
  let filteredArticles = articles;
  if (selectedYear) {
    filteredArticles = articles.filter(a => new Date(a.date).getFullYear() === parseInt(selectedYear));
    if (selectedMonth) {
      filteredArticles = filteredArticles.filter(a => new Date(a.date).getMonth() + 1 === parseInt(selectedMonth));
    }
  }

  // Pagination
  const totalFiltered = filteredArticles.length;
  const totalPages = Math.ceil(totalFiltered / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
        <div className="font-mono text-xs sm:text-sm">
          <p className="text-primary">$</p> archives - Browse articles by date
          <p className="text-muted-foreground mt-2">
            Total: {totalArticles} articles
          </p>
        </div>
      </div>

      {/* CLI commands */}
      <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
        <div className="font-mono text-xs text-muted-foreground">
          <p className="text-primary mb-2"># CLI Access</p>
          <pre className="text-xs text-foreground/80 overflow-x-auto">{`# All archives
curl /api/text/archives

# By year
curl /api/text/archives?year=2026

# By month
curl /api/text/archives?year=2026&month=3`}</pre>
        </div>
      </div>

      {/* Year selection */}
      <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedYear(null); setSelectedMonth(null); }}
            className={`px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm ${
              !selectedYear ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-primary/20'
            }`}
          >
            All
          </button>
          {Object.keys(
            articles.reduce((acc: Record<string, boolean>, a) => {
              acc[new Date(a.date).getFullYear().toString()] = true;
              return acc;
            }, {})
          ).sort((a, b) => parseInt(b) - parseInt(a)).map(y => (
            <button
              key={y}
              onClick={() => { setSelectedYear(y); setSelectedMonth(null); }}
              className={`px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm ${
                selectedYear === y && !selectedMonth ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-primary/20'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Month selection (when year is selected) */}
      {selectedYear && (
        <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMonth(null)}
              className={`px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm ${
                !selectedMonth ? 'bg-accent text-accent-foreground' : 'bg-muted hover:bg-accent/20'
              }`}
            >
              All
            </button>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const monthKey = `${selectedYear}-${String(m).padStart(2, '0')}`;
              const count = byMonth[monthKey]?.length || 0;
              if (count === 0) return null;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(String(m))}
                  className={`px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm ${
                    selectedMonth === String(m) ? 'bg-accent text-accent-foreground' : 'bg-muted hover:bg-accent/20'
                  }`}
                >
                  {m} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter info */}
      {selectedYear && (
        <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50 font-mono text-xs sm:text-sm text-muted-foreground">
          {selectedMonth
            ? `Showing: ${selectedYear} year, ${selectedMonth} month (${totalFiltered} articles)`
            : `Showing: ${selectedYear} year (${totalFiltered} articles)`}
        </div>
      )}

      {/* Article list */}
      <div className="space-y-4 sm:space-y-6">
        {loading ? (
          <p className="text-muted-foreground font-mono">Loading...</p>
        ) : paginatedArticles.length === 0 ? (
          <p className="text-muted-foreground font-mono">No articles found.</p>
        ) : (
          <>
            {paginatedArticles.map(article => (
              <Link
                key={article.slug}
                href={`/posts/${article.slug}`}
                className="block terminal-border rounded-lg p-3 sm:p-4 bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                  <span className="text-muted-foreground font-mono text-xs sm:text-sm whitespace-nowrap">
                    {new Date(article.date).toLocaleDateString('zh-CN')}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold group-hover:text-primary transition-colors text-base sm:text-lg">
                      {article.title}
                    </h4>
                    {article.summary && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {article.summary}
                      </p>
                    )}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm bg-muted hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 rounded font-mono text-xs sm:text-sm bg-muted hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
