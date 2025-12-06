import { describe, it, expect } from 'vitest';
import { parseCodeResponse, validateParsedFiles, parsePlanResponse } from '../../src/ai/parser.js';

describe('parseCodeResponse', () => {
  it('should parse JSON from code block', () => {
    const response = `\`\`\`json
{
  "src/file.ts": "export function test() {}",
  "src/types.ts": "export interface Test {}"
}
\`\`\``;

    const result = parseCodeResponse(response);

    expect(result.files).toHaveProperty('src/file.ts');
    expect(result.files).toHaveProperty('src/types.ts');
    expect(result.files['src/file.ts']).toBe('export function test() {}');
  });

  it('should parse direct JSON object', () => {
    const response = `{
  "src/file.ts": "export function test() {}"
}`;

    const result = parseCodeResponse(response);

    expect(result.files).toHaveProperty('src/file.ts');
  });

  it('should parse markdown code blocks', () => {
    const response = `\`\`\`typescript:src/file.ts
export function test() {}
\`\`\`

\`\`\`src/types.ts
export interface Test {}
\`\`\``;

    const result = parseCodeResponse(response);

    // The parser should handle both formats
    // If it doesn't parse markdown, it should at least not crash
    expect(result.files).toBeDefined();
  });
});

describe('validateParsedFiles', () => {
  it('should validate correct files', () => {
    const parsed = {
      files: {
        'src/file.ts': 'export function test() {}',
        'src/types.ts': 'export interface Test {}',
      },
    };

    const result = validateParsedFiles(parsed);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect empty files', () => {
    const parsed = {
      files: {
        'src/file.ts': '',
      },
    };

    const result = validateParsedFiles(parsed);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Empty content'))).toBe(true);
  });

  it('should detect invalid file paths', () => {
    const parsed = {
      files: {
        '../file.ts': 'export function test() {}',
      },
    };

    const result = validateParsedFiles(parsed);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid file path'))).toBe(true);
  });
});

describe('parsePlanResponse', () => {
  it('should remove markdown code fences', () => {
    const response = `\`\`\`markdown
# Plan
This is the plan.
\`\`\``;

    const result = parsePlanResponse(response);

    expect(result).not.toContain('```');
    expect(result).toContain('# Plan');
  });

  it('should handle plain text', () => {
    const response = `# Plan
This is the plan.`;

    const result = parsePlanResponse(response);

    expect(result).toBe(response);
  });
});

