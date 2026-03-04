// Unit tests for comments library functions
import { generateSignature, verifySignature } from '@/lib/comments';

describe('Comments Library', () => {
  describe('Signature Generation', () => {
    const secret = 'test-secret-key';

    it('should generate a valid HMAC-SHA256 signature', () => {
      const signature = generateSignature('agent-1', 'Hello World', secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA256 produces 64 hex characters
    });

    it('should generate consistent signatures for same input', () => {
      const sig1 = generateSignature('agent-1', 'Hello World', secret);
      const sig2 = generateSignature('agent-1', 'Hello World', secret);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different agent IDs', () => {
      const sig1 = generateSignature('agent-1', 'Hello World', secret);
      const sig2 = generateSignature('agent-2', 'Hello World', secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different content', () => {
      const sig1 = generateSignature('agent-1', 'Hello World', secret);
      const sig2 = generateSignature('agent-1', 'Different Content', secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const sig1 = generateSignature('agent-1', 'Hello World', 'secret-1');
      const sig2 = generateSignature('agent-1', 'Hello World', 'secret-2');

      expect(sig1).not.toBe(sig2);
    });

    it('should handle empty content', () => {
      const signature = generateSignature('agent-1', '', secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should handle special characters in content', () => {
      const signature = generateSignature('agent-1', '你好世界! @#$%^&*()', secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should handle Unicode content', () => {
      const signature = generateSignature('agent-1', '测试中文内容 🎉', secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });
  });

  describe('Signature Verification', () => {
    const secret = 'test-secret-key';

    it('should verify a valid signature', () => {
      const signature = generateSignature('agent-1', 'Hello World', secret);
      const isValid = verifySignature('agent-1', 'Hello World', signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      // Use a valid length string but wrong content to test rejection
      const invalidSig = 'a'.repeat(64);
      let isValid = false;
      try {
        isValid = verifySignature('agent-1', 'Hello World', invalidSig, secret);
      } catch (e) {
        // timingSafeEqual throws on different lengths, which also means invalid
        isValid = false;
      }
      expect(isValid).toBe(false);
    });

    it('should reject signature for wrong content', () => {
      const signature = generateSignature('agent-1', 'Hello World', secret);
      const isValid = verifySignature('agent-1', 'Different Content', signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject signature for wrong agent ID', () => {
      const signature = generateSignature('agent-1', 'Hello World', secret);
      const isValid = verifySignature('agent-2', 'Hello World', signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const signature = generateSignature('agent-1', 'Hello World', 'correct-secret');
      const isValid = verifySignature('agent-1', 'Hello World', signature, 'wrong-secret');

      expect(isValid).toBe(false);
    });

    it('should handle empty content verification', () => {
      const signature = generateSignature('agent-1', '', secret);
      const isValid = verifySignature('agent-1', '', signature, secret);

      expect(isValid).toBe(true);
    });

    it('should handle Unicode content verification', () => {
      const content = '测试中文内容 🎉';
      const signature = generateSignature('agent-1', content, secret);
      const isValid = verifySignature('agent-1', content, signature, secret);

      expect(isValid).toBe(true);
    });
  });
});
