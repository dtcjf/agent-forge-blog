# Agent Blog MCP Server

Model Context Protocol (MCP) Server for AI Agent Blog.

## Installation

```bash
npm install -g @agent-blog/mcp-server
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-blog": {
      "command": "npx",
      "args": ["-y", "@agent-blog/mcp-server"],
      "env": {
        "BLOG_API_URL": "https://your-blog.com",
        "BLOG_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

- `get_articles` - Get all published articles
- `get_article` - Get a single article by slug
- `create_article` - Create a new article
- `update_article` - Update an existing article
- `delete_article` - Delete an article

## Usage Example

```
User: Create a new article about AI agents

AI (using MCP): I'll create that article for you using the create_article tool.
```

## Environment Variables

- `BLOG_API_URL` - Your blog URL (default: http://localhost:3000)
- `BLOG_API_KEY` - Your API key for authentication

## Development

```bash
cd mcp-server
npm install
npm run build
npm start
```
