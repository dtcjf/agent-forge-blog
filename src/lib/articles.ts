import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { kv } from '@vercel/kv';

const articlesDirectory = path.join(process.cwd(), 'content', 'articles');
const KV_ARTICLES_KEY = 'articles';

// Check if Redis is configured
const isRedisConfigured = process.env.KV_URL !== undefined;

export interface Article {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  published: boolean;
  content: string;
}

export interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  published: boolean;
}

function ensureDirectory() {
  if (!fs.existsSync(articlesDirectory)) {
    fs.mkdirSync(articlesDirectory, { recursive: true });
  }
}

// Redis-based storage functions
async function getArticlesFromKV(): Promise<Record<string, Article>> {
  if (!isRedisConfigured) return {};
  const articles = await kv.get<Record<string, Article>>(KV_ARTICLES_KEY);
  return articles || {};
}

async function saveArticlesToKV(articles: Record<string, Article>): Promise<void> {
  if (!isRedisConfigured) return;
  await kv.set(KV_ARTICLES_KEY, articles);
}

// Fallback: filesystem functions
function ensureDirectoryFS() {
  if (!fs.existsSync(articlesDirectory)) {
    fs.mkdirSync(articlesDirectory, { recursive: true });
  }
}

function getArticleSlugsFS(): string[] {
  ensureDirectoryFS();
  const files = fs.readdirSync(articlesDirectory);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

function getArticleBySlugFS(slug: string): Article | null {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(articlesDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug: realSlug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    tags: data.tags || [],
    summary: data.summary || '',
    published: data.published ?? true,
    content,
  };
}

function getAllArticlesFS(): ArticleMeta[] {
  const slugs = getArticleSlugsFS();
  const articles = slugs
    .map((slug) => getArticleBySlugFS(slug))
    .filter((article): article is Article => article !== null)
    .filter((article) => article.published)
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  return articles.map(({ slug, title, date, tags, summary, published }) => ({
    slug,
    title,
    date,
    tags,
    summary,
    published,
  }));
}

function createArticleFS(
  slug: string,
  title: string,
  content: string,
  tags: string[] = [],
  summary: string = '',
  published: boolean = true
): Article {
  ensureDirectoryFS();

  const date = new Date().toISOString();
  const frontmatter = `---
title: "${title}"
date: "${date}"
tags: ${JSON.stringify(tags)}
summary: "${summary}"
published: ${published}
---

${content}`;

  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  fs.writeFileSync(fullPath, frontmatter, 'utf8');

  return {
    slug,
    title,
    date,
    tags,
    summary,
    published,
    content,
  };
}

function updateArticleFS(
  slug: string,
  updates: Partial<Omit<Article, 'slug' | 'content'> & { content?: string }>
): Article | null {
  const article = getArticleBySlugFS(slug);
  if (!article) {
    return null;
  }

  const newContent = updates.content ?? article.content;
  const newTitle = updates.title ?? article.title;
  const newTags = updates.tags ?? article.tags;
  const newSummary = updates.summary ?? article.summary;
  const newPublished = updates.published ?? article.published;

  const date = article.date;
  const frontmatter = `---
title: "${newTitle}"
date: "${date}"
tags: ${JSON.stringify(newTags)}
summary: "${newSummary}"
published: ${newPublished}
---

${newContent}`;

  const fullPath = path.join(articlesDirectory, `${slug}.md`);
  fs.writeFileSync(fullPath, frontmatter, 'utf8');

  return {
    slug,
    title: newTitle,
    date,
    tags: newTags,
    summary: newSummary,
    published: newPublished,
    content: newContent,
  };
}

function deleteArticleFS(slug: string): boolean {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  fs.unlinkSync(fullPath);
  return true;
}

// Public API - uses Redis if available, falls back to filesystem
export function getArticleSlugs(): string[] {
  if (isRedisConfigured) {
    // For Redis, we need to load all articles first
    return [];
  }
  return getArticleSlugsFS();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (isRedisConfigured) {
    const articles = await getArticlesFromKV();
    return articles[slug] || null;
  }
  return getArticleBySlugFS(slug);
}

export async function getAllArticles(): Promise<ArticleMeta[]> {
  if (isRedisConfigured) {
    const articles = await getArticlesFromKV();
    return Object.values(articles)
      .filter((article) => article.published)
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .map(({ slug, title, date, tags, summary, published }) => ({
        slug,
        title,
        date,
        tags,
        summary,
        published,
      }));
  }
  return getAllArticlesFS();
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

export async function createArticle(
  slug: string,
  title: string,
  content: string,
  tags: string[] = [],
  summary: string = '',
  published: boolean = true
): Promise<Article> {
  const date = new Date().toISOString();
  const article: Article = {
    slug,
    title,
    date,
    tags,
    summary,
    published,
    content,
  };

  if (isRedisConfigured) {
    const articles = await getArticlesFromKV();
    articles[slug] = article;
    await saveArticlesToKV(articles);
  } else {
    createArticleFS(slug, title, content, tags, summary, published);
  }

  return article;
}

export async function updateArticle(
  slug: string,
  updates: Partial<Omit<Article, 'slug' | 'content'> & { content?: string }>
): Promise<Article | null> {
  if (isRedisConfigured) {
    const articles = await getArticlesFromKV();
    const existing = articles[slug];
    if (!existing) {
      return null;
    }

    const updated: Article = {
      ...existing,
      title: updates.title ?? existing.title,
      tags: updates.tags ?? existing.tags,
      summary: updates.summary ?? existing.summary,
      published: updates.published ?? existing.published,
      content: updates.content ?? existing.content,
    };

    articles[slug] = updated;
    await saveArticlesToKV(articles);
    return updated;
  }

  return updateArticleFS(slug, updates);
}

export async function deleteArticle(slug: string): Promise<boolean> {
  if (isRedisConfigured) {
    const articles = await getArticlesFromKV();
    if (!articles[slug]) {
      return false;
    }
    delete articles[slug];
    await saveArticlesToKV(articles);
    return true;
  }

  return deleteArticleFS(slug);
}
