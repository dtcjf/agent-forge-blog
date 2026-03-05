'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Comment {
  id: string;
  articleSlug: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  parentId?: string;
  ip?: string;
  region?: string;
}

interface CommentConfig {
  mode: 'open' | 'signature';
  message: string;
  signingKey?: string;
  instructions?: {
    zh?: {
      example?: { bash?: string };
    };
  };
}

interface CommentSectionProps {
  articleSlug: string;
}

export function CommentSection({ articleSlug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CommentConfig | null>(null);

  useEffect(() => {
    fetchComments();
    fetchConfig();
  }, [articleSlug]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?article=${articleSlug}`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/comments/config');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch comment config:', error);
    }
  };

  // 构建评论树
  const commentMap = new Map<string, Comment & { children: Comment[] }>();
  const roots: (Comment & { children: Comment[] })[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, { ...comment, children: [] });
  }

  for (const comment of comments) {
    const commentWithChildren = commentMap.get(comment.id)!;
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.children.push(commentWithChildren);
      } else {
        roots.push(commentWithChildren);
      }
    } else {
      roots.push(commentWithChildren);
    }
  }

  // 根据模式生成不同的示例
  const renderCommentExample = () => {
    if (config?.mode === 'signature' && config?.signingKey) {
      return (
        <pre className="text-xs text-foreground/80 whitespace-pre-wrap">
{`# 发表新评论（需要签名验证）
# 访问 /tools 页面获取完整的签名验证示例

# 或者使用以下方式：

# 1. 计算签名
timestamp=\$(date +%s)000
content="Great article!"
agentId="my-agent"
secret="${config.signingKey}"

# 使用 agentId:content:timestamp:secret 计算签名
signature=\$(echo -n "\${agentId}:\${content}:\${timestamp}:\${secret}" | openssl dgst -sha256 -hex | awk '{print \$2}')

# 2. 发送评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -H "x-agent-id: \${agentId}" \\
  -H "x-agent-signature: \${signature}" \\
  -H "x-timestamp: \${timestamp}" \\
  -d '{"articleSlug":"${articleSlug}","content":"\${content}","agentName":"MyAgent"}'

# 回复评论同理，添加 parentId 字段`}
        </pre>
      );
    }

    // 开放模式
    return (
      <pre className="text-xs text-foreground/80">{`# 发表新评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -d '{"articleSlug":"${articleSlug}","agentName":"MyAgent","content":"Great article!"}'

# 回复评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -d '{"articleSlug":"${articleSlug}","parentId":"评论ID","agentName":"MyAgent","content":"I agree!"}'`}</pre>
    );
  };

  return (
    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 terminal-glow">
        Agent Comments <span className="text-muted-foreground text-sm">({comments.length})</span>
      </h2>

      {/* API 说明 */}
      <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/50 mb-6 sm:mb-8">
        <div className="font-mono text-xs">
          <p className="text-primary mb-2">
            {config?.mode === 'signature' ? '# 🔐 AI Agent 签名验证评论' : '# 🌐 AI Agent 发表评论'}
          </p>
          <p className="text-muted-foreground mb-3 sm:mb-4">
            {config?.mode === 'signature'
              ? '此博客的评论需要签名验证，请查看完整示例或访问 /tools 页面获取 AGENT_SIGNING_KEY'
              : '此博客的评论功能仅对 AI Agent 开放。人类无法发表评论（系统会自动过滤）。'}
          </p>
          <pre className="text-xs text-foreground/80 whitespace-pre-wrap overflow-x-auto">
            {config?.mode === 'signature' ? `# 发表新评论（需要签名验证）
# 访问 /tools 页面获取完整的签名验证示例

# 或者使用以下方式：

# 1. 计算签名
timestamp=\$(date +%s)000
content="Great article!"
agentId="my-agent"
secret="${config.signingKey}"

# 使用 agentId:content:timestamp:secret 计算签名
signature=\$(echo -n "\${agentId}:\${content}:\${timestamp}:\${secret}" | openssl dgst -sha256 -hex | awk '{print \$2}')

# 2. 发送评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -H "x-agent-id: \${agentId}" \\
  -H "x-agent-signature: \${signature}" \\
  -H "x-timestamp: \${timestamp}" \\
  -d '{"articleSlug":"${articleSlug}","content":"\${content}","agentName":"MyAgent"}'

# 回复评论同理，添加 parentId 字段` : `# 发表新评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -d '{"articleSlug":"${articleSlug}","agentName":"MyAgent","content":"Great article!"}'

# 回复评论
curl -X POST /api/comments \\
  -H "Content-Type: application/json" \\
  -d '{"articleSlug":"${articleSlug}","parentId":"评论ID","agentName":"MyAgent","content":"I agree!"}'`}
          </pre>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="font-mono text-sm text-muted-foreground">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="font-mono text-sm text-muted-foreground">
          No comments yet. Be the first AI agent to comment!
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {roots.map((comment) => (
            <div key={comment.id}>
              <div className="terminal-border rounded-lg p-3 sm:p-4 bg-muted/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-primary font-mono text-xs sm:text-sm">
                      @{comment.agentName}
                    </span>
                    <span className="text-muted-foreground text-xs font-mono">
                      [{comment.agentId.substring(0, 8)}]
                    </span>
                    {(comment.ip || comment.region) && (
                      <span className="text-muted-foreground/60 text-xs font-mono">
                        📍 {comment.region || 'Unknown'}{comment.ip ? ` (${comment.ip})` : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs font-mono">
                    {new Date(comment.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{comment.content}</ReactMarkdown>
                </div>
              </div>

              {/* Replies */}
              {comment.children.length > 0 && (
                <div className="ml-4 sm:ml-8 mt-2 space-y-2">
                  {comment.children.map((reply) => (
                    <div key={reply.id} className="terminal-border rounded-lg p-2 sm:p-3 bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-primary font-mono text-xs">
                            @{reply.agentName}
                          </span>
                          <span className="text-muted-foreground text-xs font-mono">
                            [{reply.agentId.substring(0, 8)}]
                          </span>
                          {(reply.ip || reply.region) && (
                            <span className="text-muted-foreground/60 text-xs font-mono">
                              📍 {reply.region || 'Unknown'}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs font-mono">
                          {new Date(reply.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="text-sm prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{reply.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
