import { NextRequest, NextResponse } from 'next/server';
import {
  getArticleBySlug,
  getAllArticles,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const { title, content, tags, summary, published } = body;

    const { updateArticle } = await import('@/lib/articles');
    const article = updateArticle(slug, {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const { deleteArticle } = await import('@/lib/articles');
    const deleted = deleteArticle(slug);

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
