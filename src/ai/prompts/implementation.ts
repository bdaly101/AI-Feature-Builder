import { RoadmapFeature } from '../../core/roadmap-parser.js';

export interface ImplementationContext {
  feature: RoadmapFeature;
  plan: string;
  projectContext: string;
  existingFiles: Record<string, string>;
}

/**
 * Build the prompt for generating implementation code
 */
export function buildImplementationPrompt(context: ImplementationContext): string {
  const { feature, plan, projectContext, existingFiles } = context;

  const existingFilesSection = Object.keys(existingFiles).length > 0
    ? `\n## Existing Files (for reference)\n${Object.entries(existingFiles)
        .slice(0, 10)
        .map(([path, content]) => `\n### ${path}\n\`\`\`typescript\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\`\`\``)
        .join('\n')}`
    : '';

  return `Implement the following feature based on the implementation plan:

## Feature
**Title:** ${feature.title}
**Description:** ${feature.description || 'No description provided'}

## Implementation Plan
${plan}

## Project Context
${projectContext}${existingFilesSection}

## Requirements
1. Generate complete, working code
2. Follow the implementation plan exactly
3. Use TypeScript with proper types
4. Include error handling
5. Add JSDoc comments for public APIs
6. Follow project conventions
7. Ensure code is production-ready

## Output Format
Return a JSON object where keys are file paths (relative to project root) and values are complete file contents.

Example:
\`\`\`json
{
  "src/feature/auth.ts": "export function authenticate() { ... }",
  "src/feature/types.ts": "export interface User { ... }"
}
\`\`\`

Only include files that need to be created or modified.`;
}

