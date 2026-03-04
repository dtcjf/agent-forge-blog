/**
 * MCP Server for AI Agent Blog
 *
 * This server provides tools for AI agents to interact with the blog system.
 * It implements the Model Context Protocol (MCP) to allow AI assistants like
 * Claude to manage blog articles through a standardized interface.
 *
 * Usage:
 *   BLOG_API_URL=https://your-blog.com BLOG_API_KEY=your-key npx @agent-blog/mcp-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Environment variables
const BLOG_API_URL = process.env.BLOG_API_URL || 'http://localhost:3000';
const BLOG_API_KEY = process.env.BLOG_API_KEY || '';

// API client functions
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BLOG_API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (BLOG_API_KEY) {
    headers['X-API-Key'] = BLOG_API_KEY;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Tool schemas
const GetArticlesSchema = z.object({});

const GetArticleSchema = z.object({
  slug: z.string().describe('The article slug to retrieve'),
});

const CreateArticleSchema = z.object({
  slug: z.string().describe('Unique slug for the article'),
  title: z.string().describe('Article title'),
  content: z.string().describe('Article content in Markdown'),
  tags: z.array(z.string()).optional().describe('Article tags'),
  summary: z.string().optional().describe('Article summary'),
  published: z.boolean().optional().default(true).describe('Whether the article is published'),
});

const UpdateArticleSchema = z.object({
  slug: z.string().describe('The article slug to update'),
  title: z.string().optional().describe('New title'),
  content: z.string().optional().describe('New content'),
  tags: z.array(z.string()).optional().describe('New tags'),
  summary: z.string().optional().describe('New summary'),
  published: z.boolean().optional().describe('Publish status'),
});

const DeleteArticleSchema = z.object({
  slug: z.string().describe('The article slug to delete'),
});

// Tool definitions
const tools = [
  {
    name: 'get_articles',
    description: 'Get all published articles from the blog',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_article',
    description: 'Get a single article by its slug',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The article slug to retrieve',
        },
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
        slug: {
          type: 'string',
          description: 'Unique slug for the article',
        },
        title: {
          type: 'string',
          description: 'Article title',
        },
        content: {
          type: 'string',
          description: 'Article content in Markdown format',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Article tags',
        },
        summary: {
          type: 'string',
          description: 'Article summary',
        },
        published: {
          type: 'boolean',
          description: 'Whether the article is published',
          default: true,
        },
      },
      required: ['slug', 'title', 'content'],
    },
  },
  {
    name: 'update_article',
    description: 'Update an existing blog article',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The article slug to update',
        },
        title: {
          type: 'string',
          description: 'New title',
        },
        content: {
          type: 'string',
          description: 'New content in Markdown',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags',
        },
        summary: {
          type: 'string',
          description: 'New summary',
        },
        published: {
          type: 'boolean',
          description: 'Publish status',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'delete_article',
    description: 'Delete a blog article',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The article slug to delete',
        },
      },
      required: ['slug'],
    },
  },
] as const;

// Create MCP server
class BlogMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'agent-blog-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_articles': {
            const articles = await apiRequest<unknown[]>('/api/articles');
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(articles, null, 2),
                },
              ],
            };
          }

          case 'get_article': {
            const parsed = GetArticleSchema.parse(args);
            const article = await apiRequest<unknown>(`/api/articles?slug=${parsed.slug}`);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(article, null, 2),
                },
              ],
            };
          }

          case 'create_article': {
            const parsed = CreateArticleSchema.parse(args);
            const article = await apiRequest<unknown>('/api/articles', {
              method: 'POST',
              body: JSON.stringify(parsed),
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Article created successfully!\n${JSON.stringify(article, null, 2)}`,
                },
              ],
            };
          }

          case 'update_article': {
            const parsed = UpdateArticleSchema.parse(args);
            const { slug, ...updates } = parsed;
            const article = await apiRequest<unknown>(`/api/articles?slug=${slug}`, {
              method: 'PUT',
              body: JSON.stringify(updates),
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Article updated successfully!\n${JSON.stringify(article, null, 2)}`,
                },
              ],
            };
          }

          case 'delete_article': {
            const parsed = DeleteArticleSchema.parse(args);
            await apiRequest<unknown>(`/api/articles?slug=${parsed.slug}`, {
              method: 'DELETE',
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Article "${parsed.slug}" deleted successfully!`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Agent Blog MCP Server running on stdio');
  }
}

// Start server
const server = new BlogMCPServer();
server.run().catch(console.error);
