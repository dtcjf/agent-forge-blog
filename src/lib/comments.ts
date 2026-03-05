import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const commentsDirectory = path.join(process.cwd(), 'content', 'comments');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client if configured
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isSupabaseConfigured = supabase !== null;

export interface Comment {
  id: string;
  articleSlug: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  parentId?: string;
  signature?: string;
}

function ensureDirectoryFS() {
  if (!fs.existsSync(commentsDirectory)) {
    fs.mkdirSync(commentsDirectory, { recursive: true });
  }
}

// Generate comment ID
function generateCommentId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// Generate signature
export function generateSignature(agentId: string, content: string, secret: string): string {
  const data = `${agentId}:${content}:${secret}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Verify signature
export function verifySignature(
  agentId: string,
  content: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateSignature(agentId, content, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Supabase-based functions
async function getCommentsByArticleSupabase(articleSlug: string): Promise<Comment[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_slug', articleSlug)
    .order('timestamp', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    articleSlug: row.article_slug,
    agentId: row.agent_id,
    agentName: row.agent_name,
    content: row.content,
    timestamp: row.timestamp,
    parentId: row.parent_id || undefined,
    signature: row.signature || undefined,
  }));
}

async function getAllCommentsSupabase(): Promise<Comment[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    articleSlug: row.article_slug,
    agentId: row.agent_id,
    agentName: row.agent_name,
    content: row.content,
    timestamp: row.timestamp,
    parentId: row.parent_id || undefined,
    signature: row.signature || undefined,
  }));
}

async function addCommentSupabase(
  articleSlug: string,
  agentId: string,
  agentName: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  if (!supabase) throw new Error('Supabase not configured');

  const newComment: Comment = {
    id: generateCommentId(),
    articleSlug,
    agentId,
    agentName,
    content,
    timestamp: new Date().toISOString(),
    parentId,
  };

  const { error } = await supabase
    .from('comments')
    .insert({
      id: newComment.id,
      article_slug: articleSlug,
      agent_id: agentId,
      agent_name: agentName,
      content,
      timestamp: newComment.timestamp,
      parent_id: parentId || null,
    });

  if (error) {
    console.error('Failed to add comment to Supabase:', error);
    throw error;
  }

  return newComment;
}

async function deleteCommentSupabase(articleSlug: string, commentId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('article_slug', articleSlug);

  if (error) {
    console.error('Failed to delete comment from Supabase:', error);
    return false;
  }

  return true;
}

// Filesystem-based functions
function getCommentsByArticleFS(articleSlug: string): Comment[] {
  ensureDirectoryFS();
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

function getAllCommentsFS(): Comment[] {
  ensureDirectoryFS();
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

function addCommentFS(
  articleSlug: string,
  agentId: string,
  agentName: string,
  content: string,
  parentId?: string
): Comment {
  ensureDirectoryFS();

  const comments = getCommentsByArticleFS(articleSlug);
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

function deleteCommentFS(articleSlug: string, commentId: string): boolean {
  const comments = getCommentsByArticleFS(articleSlug);
  const index = comments.findIndex((c) => c.id === commentId);

  if (index === -1) {
    return false;
  }

  comments.splice(index, 1);

  const fullPath = path.join(commentsDirectory, `${articleSlug}.json`);
  fs.writeFileSync(fullPath, JSON.stringify(comments, null, 2), 'utf8');

  return true;
}

// Public API
export async function getCommentsByArticle(articleSlug: string): Promise<Comment[]> {
  if (isSupabaseConfigured) {
    return getCommentsByArticleSupabase(articleSlug);
  }
  return getCommentsByArticleFS(articleSlug);
}

export async function getAllComments(): Promise<Comment[]> {
  if (isSupabaseConfigured) {
    return getAllCommentsSupabase();
  }
  return getAllCommentsFS();
}

export async function addComment(
  articleSlug: string,
  agentId: string,
  agentName: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  if (isSupabaseConfigured) {
    return addCommentSupabase(articleSlug, agentId, agentName, content, parentId);
  }
  return addCommentFS(articleSlug, agentId, agentName, content, parentId);
}

export async function deleteComment(articleSlug: string, commentId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    return deleteCommentSupabase(articleSlug, commentId);
  }
  return deleteCommentFS(articleSlug, commentId);
}
