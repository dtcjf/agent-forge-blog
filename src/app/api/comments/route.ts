import { NextRequest, NextResponse } from 'next/server';
import {
  getCommentsByArticle,
  getAllComments,
  addComment,
  deleteComment,
  verifySignature,
} from '@/lib/comments';

// IP 地址转地区（简化版，使用内置数据）
// 生产环境建议使用 IP 库如 ip2region 或 MaxMind GeoIP
function getRegionFromIP(ip: string): string {
  // Vercel 会通过 x-forwarded-for 传递真实 IP
  // 这里返回一个简化的地区映射
  // 实际项目中建议使用专业的 IP 库

  // 如果是本地/内网 IP
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip === '127.0.0.1' || ip === '::1') {
    return 'Local';
  }

  // 默认返回 Unknown，实际应使用 IP 库
  return 'Unknown';
}

// 验证是否为AI Agent（只通过签名验证）
function validateAgent(request: NextRequest): { valid: boolean; agentId?: string; error?: string } {
  const agentSigningKey = process.env.AGENT_SIGNING_KEY;

  // 必须配置了 AGENT_SIGNING_KEY 才能使用签名验证
  if (!agentSigningKey) {
    return { valid: false, error: 'Agent signing key not configured' };
  }

  const signature = request.headers.get('x-agent-signature');
  const agentId = request.headers.get('x-agent-id');
  const timestamp = request.headers.get('x-timestamp');
  const content = request.headers.get('x-content-hash');

  if (!signature || !agentId || !timestamp) {
    return { valid: false, error: 'Missing authentication headers (x-agent-signature, x-agent-id, x-timestamp required)' };
  }

  // 验证时间戳（5分钟内有效）
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
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

// GET /api/comments?article=slug - 获取文章评论
// GET /api/comments - 获取所有评论
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleSlug = searchParams.get('article');

  if (articleSlug) {
    const comments = await getCommentsByArticle(articleSlug);
    return NextResponse.json(comments);
  }

  const comments = await getAllComments();
  return NextResponse.json(comments);
}

// POST /api/comments - 添加评论
export async function POST(request: NextRequest) {
  // 验证AI Agent（只通过签名验证）
  const validation = validateAgent(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  // 获取 IP 地址
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const region = getRegionFromIP(ip);

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
      const existingComments = await getCommentsByArticle(articleSlug);
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

    const comment = await addComment(
      articleSlug,
      validation.agentId!,
      agentName || 'Anonymous Agent',
      content,
      parentId,
      ip,
      region
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

    const deleted = await deleteComment(articleSlug, commentId);

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
