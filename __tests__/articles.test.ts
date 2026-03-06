import {
  Article,
  ArticleMeta,
  getArticleSlugs,
  getArticleBySlug,
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  markdownToHtml,
} from '@/lib/articles';

// Mock gray-matter
jest.mock('gray-matter', () => {
  return jest.fn((content: string) => {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
      const frontmatter = match[1];
      const body = match[2];
      const data: Record<string, any> = {};

      frontmatter.split('\n').forEach((line: string) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          let value = line.slice(colonIndex + 1).trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else if (value.startsWith('[')) {
            try {
              value = JSON.parse(value);
            } catch {
              // ignore
            }
          }
          data[key] = value;
        }
      });

      return { data, content: body };
    }
    return { data: {}, content };
  });
});

// Mock remark
jest.mock('remark', () => ({
  remark: jest.fn().mockImplementation(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({
      toString: jest.fn().mockReturnValue('<p>processed html</p>'),
    }),
  })),
}));

jest.mock('remark-html', () => jest.fn());

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));

// Mock supabase - return null to use filesystem
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => null),
}));

// Set environment variables before importing the module
process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

describe('articles', () => {
  const mockFs = require('fs');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markdownToHtml', () => {
    it('should convert markdown to HTML', async () => {
      const result = await markdownToHtml('# Hello World');
      expect(result).toBe('<p>processed html</p>');
    });

    it('should handle empty markdown', async () => {
      const result = await markdownToHtml('');
      expect(result).toBe('<p>processed html</p>');
    });

    it('should handle complex markdown', async () => {
      const result = await markdownToHtml('# Heading\n\n**Bold**\n\n- Item 1\n- Item 2');
      expect(result).toBe('<p>processed html</p>');
    });
  });

  describe('Article type definitions', () => {
    it('should have correct Article interface structure', () => {
      const article: Article = {
        slug: 'test-article',
        title: 'Test Article',
        date: '2024-01-01',
        tags: ['tag1', 'tag2'],
        summary: 'Summary',
        published: true,
        content: 'Content here',
      };

      expect(article.slug).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.date).toBeDefined();
      expect(Array.isArray(article.tags)).toBe(true);
      expect(typeof article.summary).toBe('string');
      expect(typeof article.published).toBe('boolean');
      expect(typeof article.content).toBe('string');
    });

    it('should have correct ArticleMeta interface structure', () => {
      const meta: ArticleMeta = {
        slug: 'test-article',
        title: 'Test Article',
        date: '2024-01-01',
        tags: ['tag1', 'tag2'],
        summary: 'Summary',
        published: true,
      };

      expect(meta.slug).toBeDefined();
      expect(meta.title).toBeDefined();
      expect(meta.date).toBeDefined();
      expect(Array.isArray(meta.tags)).toBe(true);
      expect(typeof meta.summary).toBe('string');
      expect(typeof meta.published).toBe('boolean');
    });
  });

  describe('article sorting and filtering', () => {
    it('should sort articles by date descending', () => {
      const articles: ArticleMeta[] = [
        { slug: 'a', title: 'A', date: '2024-01-01', tags: [], summary: '', published: true },
        { slug: 'b', title: 'B', date: '2024-03-01', tags: [], summary: '', published: true },
        { slug: 'c', title: 'C', date: '2024-02-01', tags: [], summary: '', published: true },
      ];

      const sorted = articles.sort((a, b) => (a.date > b.date ? -1 : 1));

      expect(sorted[0].slug).toBe('b');
      expect(sorted[1].slug).toBe('c');
      expect(sorted[2].slug).toBe('a');
    });

    it('should filter out unpublished articles', () => {
      const articles: ArticleMeta[] = [
        { slug: 'a', title: 'A', date: '2024-01-01', tags: [], summary: '', published: true },
        { slug: 'b', title: 'B', date: '2024-01-02', tags: [], summary: '', published: false },
        { slug: 'c', title: 'C', date: '2024-01-03', tags: [], summary: '', published: true },
      ];

      const published = articles.filter((a) => a.published);

      expect(published.length).toBe(2);
      expect(published.map((a) => a.slug)).toEqual(['a', 'c']);
    });
  });

  describe('filesystem-based article functions', () => {
    it('getArticleSlugs should return array of article slugs', async () => {
      mockFs.readdirSync.mockReturnValue(['article-1.md', 'article-2.md', 'readme.txt'] as any);

      const slugs = getArticleSlugs();

      expect(mockFs.readdirSync).toHaveBeenCalled();
      expect(slugs).toEqual(['article-1', 'article-2']);
    });

    it('getArticleBySlug should return article when file exists', async () => {
      const mockContent = `---
title: "Test Article"
date: "2024-01-01"
tags: ["test"]
summary: "Summary"
published: true
---

Content here
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const article = await getArticleBySlug('test-article');

      expect(article).not.toBeNull();
      expect(article?.slug).toBe('test-article');
      expect(article?.title).toBe('Test Article');
    });

    it('getArticleBySlug should return null when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const article = await getArticleBySlug('nonexistent');

      expect(article).toBeNull();
    });

    it('getAllArticles should return all published articles', async () => {
      mockFs.readdirSync.mockReturnValue(['article-1.md'] as any);

      const mockContent = `---
title: "Test Article"
date: "2024-01-01"
tags: ["test"]
summary: "Summary"
published: true
---

Content here
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const articles = await getAllArticles();

      expect(articles.length).toBe(1);
      expect(articles[0].title).toBe('Test Article');
    });

    it('createArticle should create new article file', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation();

      const article = await createArticle('new-article', 'New Article', 'New content', ['tag1'], 'Summary', true);

      expect(article.slug).toBe('new-article');
      expect(article.title).toBe('New Article');
      expect(article.content).toBe('New content');
      expect(article.tags).toEqual(['tag1']);
      expect(article.summary).toBe('Summary');
      expect(article.published).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('updateArticle should update existing article', async () => {
      const existingContent = `---
title: "Old Title"
date: "2024-01-01"
tags: ["old"]
summary: "Old Summary"
published: true
---

Old content
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);
      mockFs.writeFileSync.mockImplementation();

      const result = await updateArticle('test-article', {
        title: 'New Title',
        content: 'New content',
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('New Title');
      expect(result?.content).toBe('New content');
    });

    it('updateArticle should return null for non-existent article', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await updateArticle('nonexistent', { title: 'New Title' });

      expect(result).toBeNull();
    });

    it('deleteArticle should delete article file', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = await deleteArticle('test-article');

      expect(result).toBe(true);
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });

    it('deleteArticle should return false when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await deleteArticle('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle articles with empty tags', async () => {
      const mockContent = `---
title: "Test"
date: "2024-01-01"
tags: []
summary: ""
published: true
---

Content
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const article = await getArticleBySlug('test');

      expect(article?.tags).toEqual([]);
      expect(article?.summary).toBe('');
    });

    it('should handle articles with default published value', async () => {
      const mockContent = `---
title: "Test"
date: "2024-01-01"
---

Content
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);

      const article = await getArticleBySlug('test');

      expect(article?.published).toBe(true);
    });

    it('should filter unpublished articles in getAllArticles', async () => {
      mockFs.readdirSync.mockReturnValue(['a.md', 'b.md'] as any);

      const contentA = `---
title: "A"
date: "2024-01-01"
published: true
---

Content A
`;
      const contentB = `---
title: "B"
date: "2024-01-02"
published: false
---

Content B
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync
        .mockReturnValueOnce(contentA)
        .mockReturnValueOnce(contentB);

      const articles = await getAllArticles();

      expect(articles.length).toBe(1);
      expect(articles[0].title).toBe('A');
    });

    it('should sort by date in getAllArticles', async () => {
      mockFs.readdirSync.mockReturnValue(['a.md', 'b.md', 'c.md'] as any);

      const contentA = `---
title: "A"
date: "2024-01-01"
published: true
---

Content A
`;
      const contentB = `---
title: "B"
date: "2024-01-03"
published: true
---

Content B
`;
      const contentC = `---
title: "C"
date: "2024-01-02"
published: true
---

Content C
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync
        .mockReturnValueOnce(contentA)
        .mockReturnValueOnce(contentB)
        .mockReturnValueOnce(contentC);

      const articles = await getAllArticles();

      expect(articles[0].title).toBe('B'); // Most recent
      expect(articles[1].title).toBe('C');
      expect(articles[2].title).toBe('A'); // Oldest
    });

    it('should handle update with only content change', async () => {
      const existingContent = `---
title: "Old Title"
date: "2024-01-01"
tags: ["old"]
summary: "Old Summary"
published: true
---

Old content
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);
      mockFs.writeFileSync.mockImplementation();

      const result = await updateArticle('test-article', {
        content: 'New content only',
      });

      expect(result?.content).toBe('New content only');
      expect(result?.title).toBe('Old Title'); // Unchanged
    });

    it('should handle update with only tags change', async () => {
      const existingContent = `---
title: "Title"
date: "2024-01-01"
tags: ["old"]
summary: "Summary"
published: true
---

Content
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);
      mockFs.writeFileSync.mockImplementation();

      const result = await updateArticle('test-article', {
        tags: ['new', 'tags'],
      });

      expect(result?.tags).toEqual(['new', 'tags']);
    });

    it('should handle update with published change', async () => {
      const existingContent = `---
title: "Title"
date: "2024-01-01"
tags: []
summary: "Summary"
published: true
---

Content
`;
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingContent);
      mockFs.writeFileSync.mockImplementation();

      const result = await updateArticle('test-article', {
        published: false,
      });

      expect(result?.published).toBe(false);
    });
  });
});
