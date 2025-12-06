import * as fs from 'fs';
import * as path from 'path';

export interface RoadmapFeature {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
}

export class RoadmapParser {
  constructor(private roadmapPath: string) {
    if (!fs.existsSync(roadmapPath)) {
      throw new Error(`ROADMAP.md not found: ${roadmapPath}`);
    }
  }

  async getPendingFeatures(): Promise<RoadmapFeature[]> {
    const content = fs.readFileSync(this.roadmapPath, 'utf-8');
    const features: RoadmapFeature[] = [];
    
    // Parse markdown for features
    // Look for patterns like:
    // - [ ] Feature name
    // - [x] Completed feature
    // ## Feature Title
    // ### Feature Title
    
    const lines = content.split('\n');
    let currentFeature: Partial<RoadmapFeature> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for checkbox items
      const checkboxMatch = line.match(/^[-*]\s+\[([ x])\]\s+(.+)$/);
      if (checkboxMatch) {
        const isChecked = checkboxMatch[1] === 'x';
        const title = checkboxMatch[2].trim();
        
        if (!isChecked) {
          features.push({
            title,
            description: '',
            status: 'pending',
          });
        }
        continue;
      }
      
      // Check for heading with feature
      const headingMatch = line.match(/^#{2,4}\s+(.+)$/);
      if (headingMatch) {
        const title = headingMatch[1].trim();
        
        // Skip if it's a section header (like "## Phase 1")
        if (!/^(Phase|Overview|Summary|Implementation)/i.test(title)) {
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
            features.push({
              title,
              description: description.trim(),
              status: status as 'pending' | 'in-progress',
            });
          }
        }
      }
    }
    
    return features;
  }

  private determineStatus(content: string, title: string): 'pending' | 'in-progress' | 'completed' {
    // Check for completion markers
    if (content.includes(`✅ ${title}`) || content.includes(`[x] ${title}`)) {
      return 'completed';
    }
    
    if (content.includes(`🚧 ${title}`) || content.includes(`[in-progress] ${title}`)) {
      return 'in-progress';
    }
    
    return 'pending';
  }
}

