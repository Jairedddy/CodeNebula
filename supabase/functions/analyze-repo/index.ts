// @ts-ignore - Deno import (works in Supabase Edge Functions runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileNode {
  id: string;
  path: string;
  name: string;
  size: number;
  loc: number;
  language: string;
  brightness: number;
  folder: string;
  importance?: number;
  isStar?: boolean;
}

interface DependencyLink {
  source: string;
  target: string;
  strength: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repo_url } = await req.json();
    
    if (!repo_url) {
      throw new Error('Repository URL is required');
    }

    // Parse GitHub URL
    const urlMatch = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = urlMatch;
    const cleanRepo = repo.replace(/\.git$/, '');

    console.log(`Analyzing repository: ${owner}/${cleanRepo}`);

    // Fetch repository tree
    const treeUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/main?recursive=1`;
    const treeResponse = await fetch(treeUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Codebase-Galaxy',
      },
    });

    if (!treeResponse.ok) {
      // Try 'master' branch if 'main' fails
      const masterTreeUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/master?recursive=1`;
      const masterResponse = await fetch(masterTreeUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Codebase-Galaxy',
        },
      });
      
      if (!masterResponse.ok) {
        throw new Error('Failed to fetch repository tree');
      }
      
      const masterData = await masterResponse.json();
      return processTree(masterData, owner, cleanRepo);
    }

    const treeData = await treeResponse.json();
    return processTree(treeData, owner, cleanRepo);

  } catch (error: any) {
    console.error('Error in analyze-repo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processTree(treeData: any, owner: string, repo: string) {
  const nodes: FileNode[] = [];
  const links: DependencyLink[] = [];
  let totalLOC = 0;

  // Filter code files
  const codeFiles = treeData.tree.filter((item: any) => {
    if (item.type !== 'blob') return false;
    if (item.size > 100000) return false; // Skip large files
    
    const extension = item.path.split('.').pop()?.toLowerCase();
    const codeExtensions = ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'rb', 'php', 'swift', 'kt', 'css', 'html'];
    return extension && codeExtensions.includes(extension);
  });

  // Process each file
  for (const file of codeFiles.slice(0, 500)) { // Limit to 500 files for performance
    const extension = file.path.split('.').pop()?.toLowerCase() || 'other';
    const name = file.path.split('/').pop() || file.path;
    const folder = file.path.split('/').slice(0, -1).join('/') || 'root';
    
    // Estimate LOC based on size (rough estimate: 40 chars per line)
    const estimatedLOC = Math.ceil(file.size / 40);
    totalLOC += estimatedLOC;

    // Calculate importance score (higher = more important)
    const importanceScore = estimatedLOC * 1.5 + (file.size / 1000);

    nodes.push({
      id: file.path,
      path: `${owner}/${repo}/${file.path}`,
      name,
      size: file.size,
      loc: estimatedLOC,
      language: extension,
      brightness: Math.random() * 0.5 + 0.5, // Random brightness for now
      folder,
      importance: importanceScore,
    });
  }

  // Find README file (case-insensitive search for readme files)
  const readmePatterns = /^(readme|read\.me|read_me)(\.(md|txt|rst|adoc))?$/i;
  let readmeFile = nodes.find(node => readmePatterns.test(node.name));
  
  // If no README found, mark the most important file as the "star"
  let starFile = readmeFile || nodes[0];
  if (!readmeFile) {
    for (const node of nodes) {
      if (node.importance && starFile.importance && node.importance > starFile.importance) {
        starFile = node;
      }
    }
  }
  
  if (starFile) {
    starFile.isStar = true;
  }

  // Create folder-based links (structural relationships)
  const folderGroups = new Map<string, string[]>();
  nodes.forEach(node => {
    if (!folderGroups.has(node.folder)) {
      folderGroups.set(node.folder, []);
    }
    folderGroups.get(node.folder)!.push(node.id);
  });

  // Add some random dependency links for visualization
  // In a real implementation, this would parse imports
  nodes.forEach((node, idx) => {
    const sameFolder = nodes.filter(n => n.folder === node.folder && n.id !== node.id);
    if (sameFolder.length > 0 && Math.random() > 0.7) {
      const target = sameFolder[Math.floor(Math.random() * sameFolder.length)];
      links.push({
        source: node.id,
        target: target.id,
        strength: Math.random() * 0.5 + 0.5,
      });
    }
  });

  const result = {
    nodes,
    links,
    metadata: {
      owner,
      repo,
      totalFiles: nodes.length,
      totalLOC,
    },
  };

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
