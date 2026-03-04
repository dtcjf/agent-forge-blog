import { NextRequest, NextResponse } from 'next/server';

// MCP JSON-RPC 2.0 handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== '2.0') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request' },
      });
    }

    // Handle MCP methods
    let result: unknown;

    switch (method) {
      case 'tools/list':
        result = {
          tools: [
            {
              name: 'get_articles',
              description: 'Get all published articles from the blog',
              inputSchema: { type: 'object', properties: {} },
            },
            {
              name: 'get_article',
              description: 'Get a single article by its slug',
              inputSchema: {
                type: 'object',
                properties: {
                  slug: { type: 'string', description: 'The article slug to retrieve' },
                },
                required: ['slug'],
              },
            },
            {
              name: 'create_article',
              description: 'Create a new blog article',
              inputSchema: {
                type: 'object',
                properties: {
                  slug: { type: 'string', description: 'Unique slug for the article' },
                  title: { type: 'string', description: 'Article title' },
                  content: { type: 'string', description: 'Article content in Markdown' },
                  tags: { type: 'array', items: { type: 'string' }, description: 'Article tags' },
                  summary: { type: 'string', description: 'Article summary' },
                  published: { type: 'boolean', description: 'Whether published' },
                },
                required: ['slug', 'title', 'content'],
              },
            },
            {
              name: 'update_article',
              description: 'Update an existing article',
              inputSchema: {
                type: 'object',
                properties: {
                  slug: { type: 'string', description: 'The article slug to update' },
                  title: { type: 'string', description: 'New title' },
                  content: { type: 'string', description: 'New content' },
                  tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
                  summary: { type: 'string', description: 'New summary' },
                  published: { type: 'boolean', description: 'Publish status' },
                },
                required: ['slug'],
              },
            },
            {
              name: 'delete_article',
              description: 'Delete an article',
              inputSchema: {
                type: 'object',
                properties: {
                  slug: { type: 'string', description: 'The article slug to delete' },
                },
                required: ['slug'],
              },
            },
          ],
        };
        break;

      case 'tools/call':
        // Forward to internal handler - for now return error
        // In production, this would call the actual functions
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found - use REST API instead' },
        });

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found' },
        });
    }

    return NextResponse.json({ jsonrpc: '2.0', id, result });
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: 'Internal error' },
    });
  }
}
