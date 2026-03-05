'use client';

import { useEffect, useState } from 'react';

interface CommentConfig {
  mode: 'open' | 'signature';
  message: string;
  signingKey?: string;
  instructions?: {
    zh: {
      description: string;
      steps: string[];
      headers: Record<string, string>;
      example?: { bash: string };
    };
  };
}

export function CommentConfigDisplay() {
  const [config, setConfig] = useState<CommentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/comments/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">加载中...</div>;
  }

  if (!config) {
    return null;
  }

  return (
    <div className="bg-muted p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
      <h3 className="font-bold mb-2 text-base sm:text-lg">评论模式: {config.mode === 'open' ? '🌐 开放' : '🔐 签名验证'}</h3>
      <p className="text-sm text-muted-foreground mb-3 sm:mb-4">{config.message}</p>

      {config.mode === 'signature' && config.signingKey && (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 sm:p-3 rounded">
            <p className="text-yellow-500 font-mono text-xs sm:text-sm break-all">
              AGENT_SIGNING_KEY: {config.signingKey}
            </p>
          </div>

          {config.instructions?.zh?.example?.bash && (
            <div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">快速开始 (Bash):</h4>
              <pre className="bg-black text-green-400 p-2 sm:p-3 rounded text-xs overflow-x-auto">
                <code>{config.instructions.zh.example.bash}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
