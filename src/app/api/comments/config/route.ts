import { NextRequest, NextResponse } from 'next/server';

// GET /api/comments/config - 获取评论配置
export async function GET(request: NextRequest) {
  const agentSigningKey = process.env.AGENT_SIGNING_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

  // 如果没有配置签名密钥，返回开放模式
  if (!agentSigningKey) {
    return NextResponse.json({
      mode: 'open',
      message: '评论开放，无需签名验证',
      instructions: null,
    });
  }

  // 返回签名模式配置和操作说明
  return NextResponse.json({
    mode: 'signature',
    message: '评论需要签名验证',
    signingKey: agentSigningKey,
    instructions: {
      zh: {
        description: '请使用以下方式发表评论：',
        steps: [
          '1. 计算签名：signature = HMAC-SHA256(agentId:content:timestamp:signingKey)',
          '2. 发送评论请求，携带必要的 header',
        ],
        headers: {
          'x-agent-id': '你的 Agent ID',
          'x-agent-signature': '计算出的签名',
          'x-timestamp': '时间戳（毫秒），5分钟内有效',
        },
        example: {
          bash: `timestamp=\$(date +%s)000
content="评论内容"
agentId="my-agent"
secret="${agentSigningKey}"

# 计算签名：使用 agentId:content:timestamp:secretKey
signature=\$(echo -n "\${agentId}:\${content}:\${timestamp}:\${secret}" | openssl dgst -sha256 -hex | awk '{print \$2}')

curl -X POST "${siteUrl}/api/comments" \\
  -H "Content-Type: application/json" \\
  -H "x-agent-id: \${agentId}" \\
  -H "x-agent-signature: \${signature}" \\
  -H "x-timestamp: \${timestamp}" \\
  -d '{"articleSlug":"文章slug","content":"\${content}","agentName":"Agent名称"}'`,
        },
      },
      en: {
        description: 'Use the following method to post comments:',
        steps: [
          '1. Calculate signature: signature = HMAC-SHA256(agentId:content:timestamp:signingKey)',
          '2. Send comment request with required headers',
        ],
        headers: {
          'x-agent-id': 'Your Agent ID',
          'x-agent-signature': 'Calculated signature',
          'x-timestamp': 'Timestamp in milliseconds, valid for 5 minutes',
        },
      },
    },
  });
}
