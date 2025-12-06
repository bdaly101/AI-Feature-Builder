import { readFile, fileExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export interface RoadmapFeature {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  lineNumber?: number;
}

export class RoadmapParser {
  constructor(private roadmapPath: string) {
    if (!fileExists(roadmapPath)) {
      throw new Error(`ROADMAP.md not found: ${roadmapPath}`);
    }
  }

  async getPendingFeatures(): Promise<RoadmapFeature[]> {
    const content = readFile(this.roadmapPath);
    const features: RoadmapFeature[] = [];
    
    const lines = content.split('\n');
    let currentFeature: Partial<RoadmapFeature> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for checkbox items
      const checkboxMatch = line.match(/^[-*]\s+\[([ x])\]\s+(.+)$/);
      if (checkboxMatch) {
        const isChecked = checkboxMatch[1] === 'x';
        let title = checkboxMatch[2].trim();
        
        // Extract priority from title
        const priority = this.extractPriority(title, content);
        
        // Remove priority markers from title
        title = title.replace(/\s*\[(high|medium|low)\]/gi, '').trim();
        
        if (!isChecked) {
          // Look ahead for description
          let description = '';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.startsWith('#') && !nextLine.match(/^[-*]\s+\[/)) {
              description += nextLine + ' ';
            } else {
              break;
            }
          }
          
          features.push({
            title,
            description: description.trim(),
            status: 'pending',
            priority,
            lineNumber: i + 1,
          });
        }
        continue;
      }
      
      // Check for heading with feature
      const headingMatch = line.match(/^#{2,4}\s+(.+)$/);
      if (headingMatch) {
        const title = headingMatch[1].trim();
        
        // Skip if it's a section header
        if (!/^(Phase|Overview|Summary|Implementation|Project|Architecture|Tech Stack)/i.test(title)) {
          // Look ahead for description
          let description = '';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.startsWith('#')) {
              description += nextLine + ' ';
            } else {
              break;
            }
          }
          
          // Check if feature is marked as completed
          const status = this.determineStatus(content, title);
          
          if (status !== 'completed') {
            // Extract priority if present
            const priority = this.extractPriority(title, content);
            
            features.push({
              title,
              description: description.trim(),
              status: status as 'pending' | 'in-progress',
              priority,
              lineNumber: i + 1,
            });
          }
        }
      }
    }
    
    return features;
  }

  private determineStatus(content: string, title: string): 'pending' | 'in-progress' | 'completed' {
    // Check for completion markers
    if (
      content.includes(`✅ ${title}`) ||
      content.includes(`[x] ${title}`) ||
      content.includes(`- [x] ${title}`) ||
      content.includes(`Completed: ${title}`)
    ) {
      return 'completed';
    }
    
    if (
      content.includes(`🚧 ${title}`) ||
      content.includes(`[in-progress] ${title}`) ||
      content.includes(`In Progress: ${title}`)
    ) {
      return 'in-progress';
    }
    
    return 'pending';
  }

  private extractPriority(title: string, content: string): 'high' | 'medium' | 'low' | undefined {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('[high]') || titleLower.includes('(high)') || contentLower.includes(`priority: high`)) {
      return 'high';
    }
    
    if (titleLower.includes('[low]') || titleLower.includes('(low)') || contentLower.includes(`priority: low`)) {
      return 'low';
    }
    
    if (titleLower.includes('[medium]') || titleLower.includes('(medium)') || contentLower.includes(`priority: medium`)) {
      return 'medium';
    }
    
    return undefined;
  }

  /**
   * Get all features (including completed)
   */
  async getAllFeatures(): Promise<RoadmapFeature[]> {
    const content = readFile(this.roadmapPath);
    const features: RoadmapFeature[] = [];
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const checkboxMatch = line.match(/^[-*]\s+\[([ x])\]\s+(.+)$/);
      if (checkboxMatch) {
        const isChecked = checkboxMatch[1] === 'x';
        const title = checkboxMatch[2].trim();
        
        features.push({
          title,
          description: '',
          status: isChecked ? 'completed' : 'pending',
          lineNumber: i + 1,
        });
      }
    }
    
    return features;
  }
}

