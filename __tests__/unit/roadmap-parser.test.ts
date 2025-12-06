import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoadmapParser } from '../../src/core/roadmap-parser.js';
import * as fsUtils from '../../src/utils/fs.js';

vi.mock('../../src/utils/fs.js', () => ({
  readFile: vi.fn(),
  fileExists: vi.fn(),
}));

describe('RoadmapParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse pending features from checkboxes', async () => {
    const roadmapContent = `# Features

- [ ] Feature 1
- [x] Completed feature
- [ ] Feature 2 with description
  This is a description`;

    vi.mocked(fsUtils.fileExists).mockReturnValue(true);
    vi.mocked(fsUtils.readFile).mockReturnValue(roadmapContent);

    const parser = new RoadmapParser('ROADMAP.md');
    const features = await parser.getPendingFeatures();

    expect(features).toHaveLength(2);
    expect(features[0].title).toBe('Feature 1');
    expect(features[1].title).toBe('Feature 2 with description');
    expect(features[1].description).toContain('description');
  });

  it('should parse features from headings', async () => {
    const roadmapContent = `# Features

## Add Authentication
This feature adds user authentication.

## Completed Feature ✅
This is done.

### Another Feature
This is another feature.`;

    vi.mocked(fsUtils.fileExists).mockReturnValue(true);
    vi.mocked(fsUtils.readFile).mockReturnValue(roadmapContent);

    const parser = new RoadmapParser('ROADMAP.md');
    const features = await parser.getPendingFeatures();

    expect(features.length).toBeGreaterThan(0);
    expect(features.some(f => f.title === 'Add Authentication')).toBe(true);
  });

  it('should extract priority from feature title', async () => {
    const roadmapContent = `# Features

- [ ] High Priority Feature [high]
- [ ] Low Priority Feature [low]
- [ ] Medium Priority Feature [medium]`;

    vi.mocked(fsUtils.fileExists).mockReturnValue(true);
    vi.mocked(fsUtils.readFile).mockReturnValue(roadmapContent);

    const parser = new RoadmapParser('ROADMAP.md');
    const features = await parser.getPendingFeatures();

    expect(features[0].priority).toBe('high');
    expect(features[1].priority).toBe('low');
    expect(features[2].priority).toBe('medium');
  });

  it('should throw error if roadmap file not found', () => {
    vi.mocked(fsUtils.fileExists).mockReturnValue(false);

    expect(() => {
      new RoadmapParser('nonexistent.md');
    }).toThrow('ROADMAP.md not found');
  });
});

