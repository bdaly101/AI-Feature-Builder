import { RoadmapFeature } from '../../core/roadmap-parser.js';

export interface PlanningContext {
  feature: RoadmapFeature;
  projectContext: string;
  existingFiles: string[];
  dependencies: string[];
}

/**
 * Build the prompt for creating an implementation plan
 */
export function buildPlanningPrompt(context: PlanningContext): string {
  const { feature, projectContext, existingFiles, dependencies } = context;

  return `Create a detailed implementation plan for the following feature:

## Feature
**Title:** ${feature.title}
**Description:** ${feature.description || 'No description provided'}
**Status:** ${feature.status}
${feature.priority ? `**Priority:** ${feature.priority}` : ''}

## Project Context
${projectContext}

## Existing Files
${existingFiles.length > 0 ? existingFiles.slice(0, 50).join(', ') : 'None detected'}

## Current Dependencies
${dependencies.length > 0 ? dependencies.join(', ') : 'None'}

## Requirements
1. Create a step-by-step implementation plan
2. List all files that need to be created or modified
3. Identify any new dependencies needed
4. Suggest test cases
5. Note any configuration changes
6. Estimate complexity (low/medium/high)
7. Identify potential challenges

Format your response as a clear markdown document.`;
}

