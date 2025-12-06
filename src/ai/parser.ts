import { logger } from '../utils/logger.js';

export interface ParsedCodeFiles {
  files: Record<string, string>;
  metadata?: {
    description?: string;
    dependencies?: string[];
    testFiles?: string[];
  };
}

/**
 * Parse AI response to extract code files
 */
export function parseCodeResponse(response: string): ParsedCodeFiles {
  // Try to extract JSON from markdown code blocks first
  const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (typeof parsed === 'object' && parsed !== null) {
        return { files: parsed };
      }
    } catch (error) {
      logger.warn('Failed to parse JSON from code block:', error instanceof Error ? error.message : error);
    }
  }

  // Try to find JSON object directly
  const directJsonMatch = response.match(/\{[\s\S]*\}/);
  if (directJsonMatch) {
    try {
      const parsed = JSON.parse(directJsonMatch[0]);
      if (typeof parsed === 'object' && parsed !== null) {
        return { files: parsed };
      }
    } catch (error) {
      logger.warn('Failed to parse direct JSON:', error instanceof Error ? error.message : error);
    }
  }

  // Fallback: try to extract file paths and content from markdown
  return parseMarkdownFiles(response);
}

function parseMarkdownFiles(response: string): ParsedCodeFiles {
  const files: Record<string, string> = {};
  // Match code blocks with optional language and file path
  // Format: ```typescript:src/file.ts or ```typescript src/file.ts
  const filePattern = /```(?:\w+)?:?\s*([^\n]+)\n([\s\S]*?)```/g;
  let match;

  while ((match = filePattern.exec(response)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();
    
    // Only treat as file path if it looks like a path (contains / or .)
    if (filePath.includes('/') || filePath.includes('.')) {
      files[filePath] = content;
    }
  }

  return { files };
}

/**
 * Validate that parsed files are reasonable
 */
export function validateParsedFiles(parsed: ParsedCodeFiles): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!parsed.files || Object.keys(parsed.files).length === 0) {
    errors.push('No files found in response');
  }

  for (const [filePath, content] of Object.entries(parsed.files)) {
    if (!filePath || filePath.trim().length === 0) {
      errors.push('Empty file path found');
    }

    if (!content || content.trim().length === 0) {
      errors.push(`Empty content for file: ${filePath}`);
    }

    // Check for reasonable file path
    if (filePath.includes('..') || filePath.startsWith('/')) {
      errors.push(`Invalid file path: ${filePath}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract implementation plan from AI response
 */
export function parsePlanResponse(response: string): string {
  // Remove markdown code fences if present
  let plan = response.trim();
  plan = plan.replace(/^```(?:markdown)?\n?/gm, '');
  plan = plan.replace(/\n?```$/gm, '');

  return plan;
}

