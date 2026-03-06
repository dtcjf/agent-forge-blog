import {
  generateSignature,
  verifySignature,
  getRegionFromIP,
  Comment,
  getCommentsByArticle,
  addComment,
  deleteComment,
  getAllComments,
} from '@/lib/comments';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => null),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(() => '[]'),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(() => ['test-article.json']),
  unlinkSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));

describe('comments', () => {
  const mockFs = require('fs');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSignature', () => {
    it('should generate a valid HMAC-SHA256 signature', () => {
      const signature = generateSignature('test-agent', 'Hello World', 'test-secret');
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64);
    });

    it('should generate consistent signatures for same input', () => {
      const sig1 = generateSignature('test-agent', 'Hello World', 'test-secret');
      const sig2 = generateSignature('test-agent', 'Hello World', 'test-secret');
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different content', () => {
      const sig1 = generateSignature('test-agent', 'Content 1', 'secret');
      const sig2 = generateSignature('test-agent', 'Content 2', 'secret');
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const sig = generateSignature('test-agent', 'Hello World', 'secret1');
      const sig2 = generateSignature('test-agent', 'Hello World', 'secret2');
      expect(sig).not.toBe(sig2);
    });

    it('should generate different signatures for different agent IDs', () => {
      const sig1 = generateSignature('agent-1', 'content', 'secret');
      const sig2 = generateSignature('agent-2', 'content', 'secret');
      expect(sig1).not.toBe(sig2);
    });

    it('should handle special characters in content', () => {
      const sig = generateSignature('agent', 'content with emojis!', 'secret');
      expect(sig).toBeDefined();
      expect(sig.length).toBe(64);
    });

    it('should handle long content', () => {
      const longContent = 'a'.repeat(10000);
      const sig = generateSignature('agent', longContent, 'secret');
      expect(sig).toBeDefined();
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      const signature = generateSignature('test-agent', 'Hello World', 'secret');
      const isValid = verifySignature('test-agent', 'Hello World', signature, 'secret');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const invalidSignature = 'a'.repeat(64);
      const isValid = verifySignature('test-agent', 'Hello World', invalidSignature, 'secret');
      expect(isValid).toBe(false);
    });

    it('should return false for tampered content', () => {
      const signature = generateSignature('test-agent', 'Hello World', 'secret');
      const isValid = verifySignature('test-agent', 'Tampered', signature, 'secret');
      expect(isValid).toBe(false);
    });

    it('should return false for wrong secret', () => {
      const signature = generateSignature('test-agent', 'Hello World', 'secret1');
      const isValid = verifySignature('test-agent', 'Hello World', signature, 'secret2');
      expect(isValid).toBe(false);
    });

    it('should return false for wrong agent ID', () => {
      const signature = generateSignature('agent-1', 'content', 'secret');
      const isValid = verifySignature('agent-2', 'content', signature, 'secret');
      expect(isValid).toBe(false);
    });

    it('should handle empty content', () => {
      const signature = generateSignature('test-agent', '', 'secret');
      const isValid = verifySignature('test-agent', '', signature, 'secret');
      expect(isValid).toBe(true);
    });
  });

  describe('getRegionFromIP', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return "Local" for undefined IP', async () => {
      expect(await getRegionFromIP(undefined as any)).toBe('Local');
    });

    it('should return "Local" for "unknown" IP', async () => {
      expect(await getRegionFromIP('unknown')).toBe('Local');
    });

    it('should return "Local" for 10.x.x.x private IP', async () => {
      expect(await getRegionFromIP('10.0.0.1')).toBe('Local');
    });

    it('should return "Local" for 192.168.x.x private IP', async () => {
      expect(await getRegionFromIP('192.168.1.1')).toBe('Local');
    });

    it('should return "Local" for 172.16.x.x private IP', async () => {
      expect(await getRegionFromIP('172.16.0.1')).toBe('Local');
    });

    it('should return "Local" for 127.0.0.1', async () => {
      expect(await getRegionFromIP('127.0.0.1')).toBe('Local');
    });

    it('should return "Local" for ::1', async () => {
      expect(await getRegionFromIP('::1')).toBe('Local');
    });

    it('should return "Local" for localhost', async () => {
      expect(await getRegionFromIP('localhost')).toBe('Local');
    });

    it('should return region info for valid public IP', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          city: 'San Francisco',
          regionName: 'California',
          country: 'USA',
        }),
      });

      const result = await getRegionFromIP('8.8.8.8');
      expect(result).toBe('San Francisco, California, USA');
    });

    it('should return "Unknown" when API returns failure status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'fail' }),
      });

      expect(await getRegionFromIP('8.8.8.8')).toBe('Unknown');
    });

    it('should return "Unknown" when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      expect(await getRegionFromIP('8.8.8.8')).toBe('Unknown');
    });

    it('should return "Unknown" when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      expect(await getRegionFromIP('8.8.8.8')).toBe('Unknown');
    });

    it('should handle partial location data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', country: 'USA' }),
      });
      expect(await getRegionFromIP('8.8.8.8')).toBe('USA');
    });

    it('should handle empty location data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' }),
      });
      expect(await getRegionFromIP('8.8.8.8')).toBe('Unknown');
    });

    it('should handle city only', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', city: 'New York' }),
      });
      expect(await getRegionFromIP('8.8.8.8')).toBe('New York');
    });

    it('should handle region and country', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', regionName: 'California', country: 'USA' }),
      });
      expect(await getRegionFromIP('8.8.8.8')).toBe('California, USA');
    });

    it('should clean up extra commas', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', city: '', regionName: '', country: 'USA' }),
      });
      expect(await getRegionFromIP('8.8.8.8')).toBe('USA');
    });
  });

  describe('Comment interface', () => {
    it('should have correct Comment interface structure', () => {
      const comment: Comment = {
        id: 'test-id',
        articleSlug: 'test-article',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        content: 'Test comment',
        timestamp: '2024-01-01T00:00:00Z',
        parentId: 'parent-1',
        signature: 'sig',
        ip: '127.0.0.1',
        region: 'Local',
      };

      expect(comment.id).toBeDefined();
      expect(comment.articleSlug).toBeDefined();
      expect(comment.agentId).toBeDefined();
      expect(comment.agentName).toBeDefined();
      expect(comment.content).toBeDefined();
      expect(comment.timestamp).toBeDefined();
      expect(comment.parentId).toBeDefined();
      expect(comment.signature).toBeDefined();
      expect(comment.ip).toBeDefined();
      expect(comment.region).toBeDefined();
    });

    it('should handle optional fields', () => {
      const comment: Comment = {
        id: 'test-id',
        articleSlug: 'test-article',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        content: 'Test comment',
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(comment.parentId).toBeUndefined();
      expect(comment.signature).toBeUndefined();
      expect(comment.ip).toBeUndefined();
      expect(comment.region).toBeUndefined();
    });
  });

  describe('filesystem-based comment functions', () => {
    it('getCommentsByArticle should call fs functions', async () => {
      const mockComments = [
        {
          id: '1',
          articleSlug: 'test-article',
          agentId: 'agent-1',
          agentName: 'Agent',
          content: 'Test',
          timestamp: '2024-01-01',
        },
      ];

      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(mockComments));

      const comments = await getCommentsByArticle('test-article');

      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalled();
      expect(comments).toEqual(mockComments);
    });

    it('getCommentsByArticle should return empty array when file not found', async () => {
      mockFs.existsSync.mockReturnValueOnce(false);

      const comments = await getCommentsByArticle('nonexistent');

      expect(comments).toEqual([]);
    });

    it('getCommentsByArticle should return empty array on JSON parse error', async () => {
      mockFs.readFileSync.mockReturnValueOnce('invalid json');

      const comments = await getCommentsByArticle('test-article');

      expect(comments).toEqual([]);
    });

    it('getCommentsByArticle should handle comments with all fields', async () => {
      const mockComments = [
        {
          id: '1',
          articleSlug: 'test-article',
          agentId: 'agent-1',
          agentName: 'Agent',
          content: 'Test',
          timestamp: '2024-01-01',
          parentId: 'parent-1',
          signature: 'sig123',
          ip: '1.2.3.4',
          region: 'USA',
        },
      ];

      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(mockComments));

      const comments = await getCommentsByArticle('test-article');

      expect(comments[0].parentId).toBe('parent-1');
      expect(comments[0].signature).toBe('sig123');
      expect(comments[0].ip).toBe('1.2.3.4');
      expect(comments[0].region).toBe('USA');
    });

    it('getAllComments should return all comments', async () => {
      const mockComments = [
        { id: '1', articleSlug: 'article-1', agentId: 'a1', agentName: 'A', content: 'c', timestamp: '2024-01-01' },
      ];
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(mockComments));

      const comments = await getAllComments();

      expect(mockFs.readdirSync).toHaveBeenCalled();
      expect(comments).toEqual(mockComments);
    });

    it('getAllComments should return empty array on JSON parse error', async () => {
      mockFs.readdirSync.mockReturnValue(['test.json'] as any);
      mockFs.readFileSync.mockReturnValueOnce('invalid json');

      const comments = await getAllComments();

      expect(comments).toEqual([]);
    });

    it('getAllComments should sort by timestamp descending', async () => {
      const mockComments1 = [
        { id: '1', articleSlug: 'a1', agentId: 'a1', agentName: 'A', content: 'c', timestamp: '2024-01-01' },
      ];
      const mockComments2 = [
        { id: '2', articleSlug: 'a2', agentId: 'a2', agentName: 'B', content: 'd', timestamp: '2024-01-03' },
      ];
      mockFs.readdirSync.mockReturnValue(['a1.json', 'a2.json'] as any);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockComments1))
        .mockReturnValueOnce(JSON.stringify(mockComments2));

      const comments = await getAllComments();

      expect(comments[0].timestamp).toBe('2024-01-03');
      expect(comments[1].timestamp).toBe('2024-01-01');
    });

    it('addComment should write to filesystem', async () => {
      mockFs.readFileSync.mockReturnValueOnce('[]');
      mockFs.writeFileSync.mockImplementation();

      const comment = await addComment('test-article', 'agent-1', 'Agent', 'Test content');

      expect(comment.id).toBeDefined();
      expect(comment.articleSlug).toBe('test-article');
      expect(comment.agentId).toBe('agent-1');
      expect(comment.content).toBe('Test content');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('addComment should include parentId when provided', async () => {
      mockFs.readFileSync.mockReturnValueOnce('[]');
      mockFs.writeFileSync.mockImplementation();

      const comment = await addComment('test-article', 'agent-1', 'Agent', 'Reply', 'parent-123');

      expect(comment.parentId).toBe('parent-123');
    });

    it('addComment should include ip and region when provided', async () => {
      mockFs.readFileSync.mockReturnValueOnce('[]');
      mockFs.writeFileSync.mockImplementation();

      const comment = await addComment('test-article', 'agent-1', 'Agent', 'Test', undefined, '8.8.8.8', 'USA');

      expect(comment.ip).toBe('8.8.8.8');
      expect(comment.region).toBe('USA');
    });

    it('deleteComment should remove comment', async () => {
      const existingComments = [
        { id: '1', articleSlug: 'test-article', agentId: 'a1', agentName: 'A', content: 'c', timestamp: '2024-01-01' },
      ];
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(existingComments));

      const result = await deleteComment('test-article', '1');

      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('deleteComment should return false for non-existent comment', async () => {
      const existingComments = [
        { id: '1', articleSlug: 'test-article', agentId: 'a1', agentName: 'A', content: 'c', timestamp: '2024-01-01' },
      ];
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(existingComments));

      const result = await deleteComment('test-article', 'nonexistent');

      expect(result).toBe(false);
    });
  });
});
