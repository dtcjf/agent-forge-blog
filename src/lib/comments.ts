import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const commentsDirectory = path.join(process.cwd(), 'content', 'comments');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client if configured
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Admin client for table creation (uses service role key)
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const isSupabaseConfigured = supabase !== null;

// Auto-create tables if they don't exist
async function initializeTables() {
  if (!supabaseAdmin) return;

  try {
    // Try to create comments table
    await supabaseAdmin.from('comments').select('id').limit(1);

    // Table exists, try to add missing columns
    try {
      // Try to add ip column if it doesn't exist
      await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE comments ADD COLUMN IF NOT EXISTS ip TEXT;`
      });
    } catch {
      // Ignore - column might already exist or RPC not available
    }
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE comments ADD COLUMN IF NOT EXISTS region TEXT;`
      });
    } catch {
      // Ignore
    }
  } catch {
    // Table doesn't exist, try to create it
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          article_slug TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          agent_name TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          parent_id TEXT,
          signature TEXT,
          ip TEXT,
          region TEXT
        );`
      });
    } catch (e) {
      // RPC might not exist, ignore
      console.log('Please create comments table in Supabase manually');
    }
  }
}

// Initialize on module load (only in production)
if (process.env.NODE_ENV === 'production') {
  initializeTables().catch(console.error);
}

export interface Comment {
  id: string;
  articleSlug: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  parentId?: string;
  signature?: string;
  ip?: string;
  region?: string;
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
  parentId?: string,
  ip?: string,
  region?: string
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
    ip,
    region,
  };

  // Build insert data - only basic fields to ensure compatibility
  const insertData = {
    id: newComment.id,
    article_slug: articleSlug,
    agent_id: agentId,
    agent_name: agentName,
    content,
    timestamp: newComment.timestamp,
    parent_id: parentId || null,
  };

  const { error } = await supabase
    .from('comments')
    .insert(insertData);

  if (error) {
    console.error('Failed to add comment to Supabase:', JSON.stringify(error));
    throw new Error(`Supabase error: ${error.message || error.code || JSON.stringify(error)}`);
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
  parentId?: string,
  ip?: string,
  region?: string
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
    ip,
    region,
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
  parentId?: string,
  ip?: string,
  region?: string
): Promise<Comment> {
  if (isSupabaseConfigured) {
    return addCommentSupabase(articleSlug, agentId, agentName, content, parentId, ip, region);
  }
  return addCommentFS(articleSlug, agentId, agentName, content, parentId, ip, region);
}

export async function deleteComment(articleSlug: string, commentId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    return deleteCommentSupabase(articleSlug, commentId);
  }
  return deleteCommentFS(articleSlug, commentId);
}
