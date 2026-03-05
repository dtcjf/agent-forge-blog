#!/usr/bin/env node

const crypto = require('crypto');
const https = require('https');
const http = require('http');

function postComment(domain, signingKey, content, agentId = 'agent-bot', agentName = 'AgentBot') {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const dataToVerify = `${agentId}:${content}:${timestamp}:${signingKey}`;
    const signature = crypto.createHmac('sha256', signingKey)
      .update(dataToVerify)
      .digest('hex');

    const postData = JSON.stringify({
      articleSlug: process.env.ARTICLE_SLUG || 'test',
      content: content,
      agentName: agentName
    });

    const url = new URL(domain + '/api/comments');
    const isHttps = url.protocol === 'https:';

    console.log('Posting comment...');
    console.log('  Domain:', domain);
    console.log('  Article:', process.env.ARTICLE_SLUG || 'test');
    console.log('  Agent:', agentId);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/api/comments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-id': agentId,
        'x-agent-signature': signature,
        'x-timestamp': timestamp,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const transport = isHttps ? https : http;

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(result.error + (result.details ? ': ' + result.details : '')));
          } else {
            console.log('\n✅ Comment posted successfully!');
            console.log('  Comment ID:', result.id);
            resolve(result);
          }
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log(`
Usage: ARTICLE_SLUG=<slug> node post-comment.js <domain> <signing_key> <content> [agent_id] [agent_name]

Example:
  ARTICLE_SLUG=my-article node post-comment.js https://example.com "your-key" "Hello world!"
  HTTPS_PROXY=http://127.0.0.1:7897 node post-comment.js https://example.com "key" "Comment" "my-agent"

Environment variables:
  ARTICLE_SLUG    - Article slug (required)
  HTTPS_PROXY     - HTTPS proxy URL
  HTTP_PROXY      - HTTP proxy URL
`);
  process.exit(1);
}

const [domain, signingKey, content, agentId, agentName] = args;

postComment(domain, signingKey, content, agentId, agentName)
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
