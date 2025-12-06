import { z } from 'zod';

const AISchema = z.object({
  model: z.string().default('claude-3-5-sonnet-20241022'),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().positive().default(8192),
});

export const ConfigSchema = z.object({
  anthropicApiKey: z.string().optional(),
  githubToken: z.string().optional(),
  baseBranch: z.string().default('dev'),
  branchPrefix: z.string().default('feature'),
  autoCreatePR: z.boolean().default(false),
  autoGenerateTests: z.boolean().default(true),
  testGenerator: z.string().default('ai-test-generator'),
  rollbackOnFailure: z.boolean().default(true),
  validateCode: z.boolean().default(true),
  maxFileSize: z.number().positive().default(100000),
  excludePatterns: z.array(z.string()).default([
    'node_modules/**',
    'dist/**',
    '**/*.test.ts',
    '**/*.spec.ts',
  ]),
  ai: AISchema.optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const defaultConfig: Config = {
  baseBranch: 'dev',
  branchPrefix: 'feature',
  autoCreatePR: false,
  autoGenerateTests: true,
  testGenerator: 'ai-test-generator',
  rollbackOnFailure: true,
  validateCode: true,
  maxFileSize: 100000,
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],
  ai: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3,
    maxTokens: 8192,
  },
};

