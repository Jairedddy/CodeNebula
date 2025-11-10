import { useState, useMemo } from 'react';
import { RepositoryData, FileNode } from '@/types/galaxy';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FileCode, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
  data: RepositoryData | null;
  onFileClick: (node: FileNode) => void;
  selectedFile: FileNode | null;
}

export function FileExplorer({ data, onFileClick, selectedFile }: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No repository data available</p>
        </div>
      </div>
    );
  }

  // Group files by folder
  const folderMap = useMemo(() => {
    const map = new Map<string, FileNode[]>();
    data.nodes.forEach(node => {
      const folder = node.folder || 'root';
      if (!map.has(folder)) {
        map.set(folder, []);
      }
      map.get(folder)!.push(node);
    });
    return map;
  }, [data]);

  // Filter files based on search
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folderMap;

    const filtered = new Map<string, FileNode[]>();
    const query = searchQuery.toLowerCase();

    folderMap.forEach((files, folder) => {
      const matchingFiles = files.filter(
        file =>
          file.name.toLowerCase().includes(query) ||
          file.path.toLowerCase().includes(query) ||
          file.language.toLowerCase().includes(query)
      );

      if (matchingFiles.length > 0) {
        filtered.set(folder, matchingFiles);
      }
    });

    return filtered;
  }, [folderMap, searchQuery]);

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const sortedFolders = Array.from(filteredFolders.entries()).sort((a, b) => {
    if (a[0] === 'root') return -1;
    if (b[0] === 'root') return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedFolders.map(([folder, files]) => {
          const isExpanded = expandedFolders.has(folder);
          const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={folder}>
              <button
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <Folder className={cn("w-4 h-4", isExpanded && "text-primary")} />
                <span className="font-medium text-sm">{folder === 'root' ? 'Root' : folder}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {files.length}
                </Badge>
              </button>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {sortedFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onFileClick(file)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-left",
                        selectedFile?.id === file.id && "bg-primary/20 border border-primary/50"
                      )}
                    >
                      <FileCode className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {file.language}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{file.loc} LOC</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

