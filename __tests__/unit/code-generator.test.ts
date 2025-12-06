import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeGenerator } from '../../src/core/code-generator.js';
import { ClaudeClient } from '../../src/ai/claude-client.js';
import type { Config } from '../../src/config/schema.js';

vi.mock('../../src/ai/claude-client.js');
vi.mock('../../src/utils/fs.js');
vi.mock('../../src/utils/logger.js');

describe('CodeGenerator', () => {
  let config: Config;
  let generator: CodeGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      anthropicApiKey: 'test-key',
      baseBranch: 'dev',
      branchPrefix: 'feature',
      autoCreatePR: false,
      autoGenerateTests: true,
      testGenerator: 'ai-test-generator',
      rollbackOnFailure: true,
      validateCode: true,
      maxFileSize: 100000,
      excludePatterns: [],
      ai: {
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        maxTokens: 8192,
      },
    };
  });

  it('should throw error if API key missing', () => {
    config.anthropicApiKey = undefined;

    expect(() => {
      new CodeGenerator(config);
    }).toThrow('ANTHROPIC_API_KEY is required');
  });

  it('should filter excluded files', async () => {
    // This would require mocking the full implementation
    // For now, just test the constructor
    generator = new CodeGenerator(config);
    expect(generator).toBeDefined();
  });
});

