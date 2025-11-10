export interface FileNode {
    id: string;
    path: string;
    name: string;
    size: number;
    loc: number;
    language: string;
    brightness: number; // Based on commit activity
    folder: string;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number;
    fy?: number;
    fz?: number;
    importance?: number;
    isStar?: boolean;
  }
  
  export interface DependencyLink {
    source: string;
    target: string;
    strength: number;
  }
  
  export interface RepositoryData {
    nodes: FileNode[];
    links: DependencyLink[];
    metadata: {
      owner: string;
      repo: string;
      totalFiles: number;
      totalLOC: number;
    };
  }
  
  export interface CodeSummary {
    purpose: string;
    criticalFunctions: string[];
    refactoringPriority: number; // 1-5
    filePath: string;
  }
  
  export type VisualizationMode = 'structural' | 'dependency';
  