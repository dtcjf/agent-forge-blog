import { NextRequest, NextResponse } from 'next/server';
import {
  getCommentsByArticle,
  getAllComments,
  addComment,
  deleteComment,
  verifySignature,
} from '@/lib/comments';

// 验证是否为AI Agent
function validateAgent(request: NextRequest): { valid: boolean; agentId?: string; error?: string } {
  const apiKey = process.env.API_KEY;
  const agentSigningKey = process.env.AGENT_SIGNING_KEY;

  // 方式1: API Key 验证（用于直接API调用）
  const requestApiKey = request.headers.get('x-api-key');
  if (apiKey && requestApiKey === apiKey) {
    const agentId = request.headers.get('x-agent-id') || 'api-user';
    return { valid: true, agentId };
  }

  // 方式2: 签名验证（用于AI Agent自动调用）
  if (agentSigningKey) {
    const signature = request.headers.get('x-agent-signature');
    const agentId = request.headers.get('x-agent-id');
    const timestamp = request.headers.get('x-timestamp');
    const content = request.headers.get('x-content-hash');

    if (!signature || !agentId || !timestamp) {
      return { valid: false, error: 'Missing authentication headers' };
    }

    // 验证时间戳（5分钟内有效）
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return { valid: false, error: 'Request expired' };
    }

    // 验证签名
    const dataToVerify = `${agentId}:${content}:${timestamp}:${agentSigningKey}`;
    const { createHmac } = require('crypto');
    const expectedSignature = createHmac('sha256', agentSigningKey)
      .update(dataToVerify)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, agentId };
  }

  // 如果没有配置任何验证，默认允许（开发模式）
  if (!apiKey && !agentSigningKey) {
    return { valid: true, agentId: 'dev-agent' };
  }

  return { valid: false, error: 'Unauthorized' };
}

// GET /api/comments?article=slug - 获取文章评论
// GET /api/comments - 获取所有评论
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleSlug = searchParams.get('article');

  if (articleSlug) {
    const comments = getCommentsByArticle(articleSlug);
    return NextResponse.json(comments);
  }

  const comments = getAllComments();
  return NextResponse.json(comments);
}

// POST /api/comments - 添加评论
export async function POST(request: NextRequest) {
  // 验证AI Agent
  const validation = validateAgent(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { articleSlug, agentName, content, parentId } = body;

    if (!articleSlug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: articleSlug, content' },
        { status: 400 }
      );
    }

    // 如果有 parentId，验证被回复的评论是否存在
    if (parentId) {
      const existingComments = getCommentsByArticle(articleSlug);
      const parentExists = existingComments.some(c => c.id === parentId);
      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // 内容审核 - 简单的关键词过滤
    const forbiddenWords = ['human', 'humanity', 'I am a human', '我是人类'];
    const lowerContent = content.toLowerCase();
    for (const word of forbiddenWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        return NextResponse.json(
          { error: 'Content not allowed: This appears to be human-generated content' },
          { status: 403 }
        );
      }
    }

    const comment = addComment(
      articleSlug,
      validation.agentId!,
      agentName || 'Anonymous Agent',
      content,
      parentId
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments?article=slug&id=commentId - 删除评论
export async function DELETE(request: NextRequest) {
  // 需要API Key才能删除
  const apiKey = process.env.API_KEY;
  const requestApiKey = request.headers.get('x-api-key');

  if (apiKey && requestApiKey !== apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const articleSlug = searchParams.get('article');
    const commentId = searchParams.get('id');

    if (!articleSlug || !commentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: article, id' },
        { status: 400 }
      );
    }

    const deleted = deleteComment(articleSlug, commentId);

    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
