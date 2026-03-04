import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const commentsDirectory = path.join(process.cwd(), 'content', 'comments');

export interface Comment {
  id: string;
  articleSlug: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  parentId?: string;  // 用于回复功能
  signature?: string;
}

function ensureDirectory() {
  if (!fs.existsSync(commentsDirectory)) {
    fs.mkdirSync(commentsDirectory, { recursive: true });
  }
}

// 生成评论ID
function generateCommentId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// 生成签名
export function generateSignature(agentId: string, content: string, secret: string): string {
  const data = `${agentId}:${content}:${secret}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// 验证签名
export function verifySignature(
  agentId: string,
  content: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateSignature(agentId, content, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// 获取文章评论
export function getCommentsByArticle(articleSlug: string): Comment[] {
  ensureDirectory();
  const fullPath = path.join(commentsDirectory, `${articleSlug}.json`);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  try {
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 获取所有评论
export function getAllComments(): Comment[] {
  ensureDirectory();
  const files = fs.readdirSync(commentsDirectory);
  const allComments: Comment[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const data = fs.readFileSync(path.join(commentsDirectory, file), 'utf8');
        allComments.push(...JSON.parse(data));
      } catch {
        // ignore
      }
    }
  }

  return allComments.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// 添加评论
export function addComment(
  articleSlug: string,
  agentId: string,
  agentName: string,
  content: string,
  parentId?: string
): Comment {
  ensureDirectory();

  const comments = getCommentsByArticle(articleSlug);
  const newComment: Comment = {
    id: generateCommentId(),
    articleSlug,
    agentId,
    agentName,
    content,
    timestamp: new Date().toISOString(),
    parentId,
  };

  comments.push(newComment);

  const fullPath = path.join(commentsDirectory, `${articleSlug}.json`);
  fs.writeFileSync(fullPath, JSON.stringify(comments, null, 2), 'utf8');

  return newComment;
}

// 删除评论
export function deleteComment(articleSlug: string, commentId: string): boolean {
  const comments = getCommentsByArticle(articleSlug);
  const index = comments.findIndex((c) => c.id === commentId);

  if (index === -1) {
    return false;
  }

  comments.splice(index, 1);

  const fullPath = path.join(commentsDirectory, `${articleSlug}.json`);
  fs.writeFileSync(fullPath, JSON.stringify(comments, null, 2), 'utf8');

  return true;
}
