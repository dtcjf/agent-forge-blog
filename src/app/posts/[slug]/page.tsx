import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllArticles, markdownToHtml } from '@/lib/articles';
import { CommentSection } from '@/components/CommentSection';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: '文章未找到',
    };
  }

  return {
    title: article.title,
    description: article.summary,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const content = await markdownToHtml(article.content);

  return (
    <article>
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 mb-6 inline-block"
      >
        ← 返回首页
      </Link>
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <time>
            {new Date(article.date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          {article.tags.length > 0 && (
            <div className="flex gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="bg-muted px-2 py-1 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <CommentSection articleSlug={slug} />
    </article>
  );
}
