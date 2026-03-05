import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { createClient } from '@supabase/supabase-js';

const articlesDirectory = path.join(process.cwd(), 'content', 'articles');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client if configured
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isSupabaseConfigured = supabase !== null;

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

// Supabase-based storage functions
async function getArticlesFromSupabase(): Promise<Record<string, Article>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('articles')
    .select('*');

  if (error || !data) {
    console.error('Failed to fetch articles from Supabase:', error);
    return {};
  }

  const articles: Record<string, Article> = {};
  for (const row of data) {
    articles[row.slug] = {
      slug: row.slug,
      title: row.title,
      date: row.date,
      tags: row.tags || [],
      summary: row.summary || '',
      published: row.published ?? true,
      content: row.content,
    };
  }
  return articles;
}

async function saveArticleToSupabase(article: Article): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('articles')
    .upsert({
      slug: article.slug,
      title: article.title,
      date: article.date,
      tags: article.tags,
      summary: article.summary,
      published: article.published,
      content: article.content,
    }, { onConflict: 'slug' });

  if (error) {
    console.error('Failed to save article to Supabase:', error);
    throw error;
  }
}

async function deleteArticleFromSupabase(slug: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('slug', slug);

  if (error) {
    console.error('Failed to delete article from Supabase:', error);
    return false;
  }
  return true;
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

// Public API - uses Supabase if available, falls back to filesystem
export function getArticleSlugs(): string[] {
  if (isSupabaseConfigured) {
    return [];
  }
  return getArticleSlugsFS();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (isSupabaseConfigured) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      slug: data.slug,
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      summary: data.summary || '',
      published: data.published ?? true,
      content: data.content,
    };
  }
  return getArticleBySlugFS(slug);
}

export async function getAllArticles(): Promise<ArticleMeta[]> {
  if (isSupabaseConfigured) {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('date', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(({ slug, title, date, tags, summary, published }) => ({
      slug,
      title,
      date,
      tags: tags || [],
      summary: summary || '',
      published: published ?? true,
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

  if (isSupabaseConfigured) {
    await saveArticleToSupabase(article);
  } else {
    createArticleFS(slug, title, content, tags, summary, published);
  }

  return article;
}

export async function updateArticle(
  slug: string,
  updates: Partial<Omit<Article, 'slug' | 'content'> & { content?: string }>
): Promise<Article | null> {
  if (isSupabaseConfigured) {
    // First get the existing article
    const existing = await getArticleBySlug(slug);
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

    await saveArticleToSupabase(updated);
    return updated;
  }

  return updateArticleFS(slug, updates);
}

export async function deleteArticle(slug: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    return deleteArticleFromSupabase(slug);
  }

  return deleteArticleFS(slug);
}
