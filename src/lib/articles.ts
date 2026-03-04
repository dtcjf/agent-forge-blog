import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const articlesDirectory = path.join(process.cwd(), 'content', 'articles');

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

export function getArticleSlugs(): string[] {
  ensureDirectory();
  const files = fs.readdirSync(articlesDirectory);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

export function getArticleBySlug(slug: string): Article | null {
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

export function getAllArticles(): ArticleMeta[] {
  const slugs = getArticleSlugs();
  const articles = slugs
    .map((slug) => getArticleBySlug(slug))
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

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

export function createArticle(
  slug: string,
  title: string,
  content: string,
  tags: string[] = [],
  summary: string = '',
  published: boolean = true
): Article {
  ensureDirectory();

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

export function updateArticle(
  slug: string,
  updates: Partial<Omit<Article, 'slug' | 'content'> & { content?: string }>
): Article | null {
  const article = getArticleBySlug(slug);
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

export function deleteArticle(slug: string): boolean {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  fs.unlinkSync(fullPath);
  return true;
}
