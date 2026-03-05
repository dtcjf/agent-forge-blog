import { NextRequest, NextResponse } from 'next/server';
import {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  Article,
} from '@/lib/articles';

function getApiKey(): string | undefined {
  return process.env.API_KEY;
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = getApiKey();
  if (!apiKey) {
    return true;
  }
  const requestKey = request.headers.get('x-api-key');
  return requestKey === apiKey;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (slug) {
    const article = await getArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(article);
  }

  const allArticles = await getAllArticles();
  const total = allArticles.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedArticles = allArticles.slice(startIndex, startIndex + limit);

  // 返回分页信息
  return NextResponse.json({
    data: paginatedArticles,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  });
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, title, content, tags, summary, published } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content' },
        { status: 400 }
      );
    }

    const existing = await getArticleBySlug(slug);
    if (existing) {
      return NextResponse.json(
        { error: 'Article already exists' },
        { status: 409 }
      );
    }

    const article = await createArticle(
      slug,
      title,
      content,
      tags || [],
      summary || '',
      published ?? true
    );

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, tags, summary, published } = body;

    const article = await updateArticle(slug, {
      title,
      content,
      tags,
      summary,
      published,
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      );
    }

    const deleted = await deleteArticle(slug);

    if (!deleted) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
