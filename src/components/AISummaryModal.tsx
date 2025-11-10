import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileNode, CodeSummary } from '@/types/galaxy';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISummaryModalProps {
  file: FileNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISummaryModal({ file, open, onOpenChange }: AISummaryModalProps) {
  const [summary, setSummary] = useState<CodeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    if (file && open) {
      fetchSummary();
    } else {
      setSummary(null);
      setFileContent('');
    }
  }, [file, open]);

  const fetchSummary = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Fetch file content from GitHub
      const pathParts = file.path.split('/');
      const owner = pathParts[0];
      const repo = pathParts[1];
      const filePath = pathParts.slice(2).join('/');

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const data = await response.json();
      const content = atob(data.content);
      setFileContent(content);

      // Call edge function to get AI summary
      const { data: summaryData, error } = await supabase.functions.invoke('summarize-code', {
        body: {
          file_content: content,
          file_path: file.path,
        },
      });

      if (error) throw error;

      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Failed to generate AI summary');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-destructive';
    if (priority >= 3) return 'bg-accent';
    return 'bg-secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px] h-[600px] flex flex-col border-glow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-glow-cyan">
            <Sparkles className="w-6 h-6 text-primary" />
            {file?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto pr-4">
          {/* File Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div>
              <p className="text-sm text-muted-foreground">Path</p>
              <p className="font-mono text-sm">{file?.path}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <Badge variant="secondary">{file?.language}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lines of Code</p>
              <p className="font-bold text-primary">{file?.loc}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size</p>
              <p>{((file?.size || 0) / 1024).toFixed(2)} KB</p>
            </div>
          </div>

          {/* AI Summary */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing code with AI...</p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Purpose */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  Purpose
                </h3>
                <p className="text-foreground leading-relaxed">{summary.purpose}</p>
              </div>

              {/* Critical Functions */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Critical Functions</h3>
                <ul className="space-y-2">
                  {summary.criticalFunctions.map((func, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent">▸</span>
                      <span className="font-mono text-sm">{func}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Refactoring Priority */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Refactoring Priority
                </h3>
                <div className="flex items-center gap-3">
                  <Badge className={`${getPriorityColor(summary.refactoringPriority)} text-white`}>
                    Level {summary.refactoringPriority}/5
                  </Badge>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPriorityColor(summary.refactoringPriority)}`}
                      style={{ width: `${(summary.refactoringPriority / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Code Preview */}
          {fileContent && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Code Preview</h3>
              <pre className="p-4 bg-muted/30 rounded-lg border border-border overflow-x-auto max-h-64 text-xs font-mono">
                <code>{fileContent.slice(0, 2000)}{fileContent.length > 2000 ? '...' : ''}</code>
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
