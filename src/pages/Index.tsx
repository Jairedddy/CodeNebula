import { useEffect, useMemo, useState } from 'react';
import { CodeGalaxy } from '@/components/CodeGalaxy';
import { AISummaryModal } from '@/components/AISummaryModal';
import { RepositoryStats } from '@/components/RepositoryStats';
import { LanguageChart } from '@/components/LanguageChart';
import { FileExplorer } from '@/components/FileExplorer';
import { VisualizationControls } from '@/components/VisualizationControls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { FileNode, RepositoryData, VisualizationMode } from '@/types/galaxy';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Github, Sparkles, LayoutGrid, FileCode, BarChart3 } from 'lucide-react';
import { FileFilters, FilterState } from '@/components/FileFilters';
import { ExportControls } from '@/components/ExportControls';
import { FileSizeChart } from '@/components/FileSizeChart';
import { exportGalaxyAsImage } from '@/components/CodeGalaxy';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppFooter } from '@/components/AppFooter';

export default function Index() {
  const [repoUrl, setRepoUrl] = useState('');
  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<VisualizationMode>('structural');
  const [activeTab, setActiveTab] = useState('visualization');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedLanguages: [],
    minSize: 0,
    maxSize: Infinity,
    fileTypes: [],
  });

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    // Validate GitHub URL
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
    if (!githubUrlPattern.test(repoUrl.trim())) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }

    setLoading(true);
    try {
      const MAX_ANALYSIS_RETRIES = 4;
      const shouldRetry = (err: unknown) => {
        if (!err) return false;

        let message: string | null = null;
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'object' && 'message' in (err as Record<string, unknown>)) {
          const candidate = (err as Record<string, unknown>).message;
          if (typeof candidate === 'string') {
            message = candidate;
          }
        }

        if (!message) return false;
        const normalized = message.toLowerCase();
        return normalized.includes('edge function returned') || normalized.includes('non-2xx');
      };

      let attempt = 0;
      let lastError: unknown = null;
      let analysisResult: RepositoryData | null = null;

      while (attempt < MAX_ANALYSIS_RETRIES) {
        attempt += 1;
        try {
          const { data, error } = await supabase.functions.invoke('analyze-repo', {
            body: { repo_url: repoUrl.trim() },
          });

          if (error) {
            lastError = error;
            if (shouldRetry(error) && attempt < MAX_ANALYSIS_RETRIES) {
              continue;
            }
            throw error;
          }

          if (!data || (data as { error?: string }).error) {
            const normalizedError = new Error(
              (data as { error?: string })?.error || 'Failed to analyze repository'
            );
            lastError = normalizedError;
            if (shouldRetry(normalizedError) && attempt < MAX_ANALYSIS_RETRIES) {
              continue;
            }
            throw normalizedError;
          }

          analysisResult = data as RepositoryData;
          break;
        } catch (invokeError) {
          lastError = invokeError;
          if (!(shouldRetry(invokeError) && attempt < MAX_ANALYSIS_RETRIES)) {
            throw invokeError;
          }
        }
      }

      if (!analysisResult) {
        const fallbackError =
          lastError instanceof Error
            ? lastError
            : new Error('Failed to analyze repository after multiple attempts');
        throw fallbackError;
      }

      setRepositoryData(analysisResult);
      setFilters({
        searchQuery: '',
        selectedLanguages: [],
        minSize: 0,
        maxSize: Infinity,
        fileTypes: [],
      });
      toast.success('Repository analyzed successfully!');
      setActiveTab('visualization');
    } catch (error: unknown) {
      console.error('Error analyzing repository:', error);
      const message = error instanceof Error ? error.message : 'Failed to analyze repository';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (node: FileNode) => {
    setSelectedFile(node);
    setIsModalOpen(true);
  };

  const handleResetView = () => {
    setResetTrigger((prev) => prev + 1);
  };

  const handleExportImage = () => {
    const dataUrl = exportGalaxyAsImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `codegalaxy-${repositoryData?.metadata.owner}-${repositoryData?.metadata.repo}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Image exported successfully!');
    } else {
      toast.error('Failed to export image');
    }
  };

  const handleExportData = () => {
    if (!repositoryData) return;
    const dataStr = JSON.stringify(repositoryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `codegalaxy-${repositoryData.metadata.owner}-${repositoryData.metadata.repo}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const filteredRepositoryData = useMemo(() => {
    if (!repositoryData) return null;

    const searchQuery = filters.searchQuery.trim().toLowerCase();
    const selectedLanguages = filters.selectedLanguages.map((lang) => lang.toLowerCase());
    const minSize = typeof filters.minSize === 'number' ? filters.minSize : 0;
    const maxSize = typeof filters.maxSize === 'number' ? filters.maxSize : Infinity;

    const matchesSearch = (node: FileNode) =>
      !searchQuery ||
      node.name.toLowerCase().includes(searchQuery) ||
      node.path.toLowerCase().includes(searchQuery) ||
      (node.language || '').toLowerCase().includes(searchQuery);

    const matchesLanguage = (node: FileNode) =>
      selectedLanguages.length === 0 ||
      selectedLanguages.includes((node.language || '').toLowerCase());

    const matchesSize = (node: FileNode) =>
      node.loc >= minSize && node.loc <= maxSize;

    const filteredNodes = repositoryData.nodes
      .filter((node) => matchesSearch(node) && matchesLanguage(node) && matchesSize(node));

    const centerNode = filteredNodes.reduce<FileNode | null>((current, candidate) => {
      if (!current) return candidate;
      const currentImportance = current.importance ?? -Infinity;
      const candidateImportance = candidate.importance ?? -Infinity;
      return candidateImportance > currentImportance ? candidate : current;
    }, filteredNodes[0] ?? null);

    const nodesWithStar = filteredNodes.map((node) => ({
      ...node,
      isStar: centerNode ? node.id === centerNode.id : false,
    }));

    const nodeIds = new Set(nodesWithStar.map((node) => node.id));
    const normalizeEndpoint = (endpoint: string | { id?: string } | null | undefined): string | null => {
      if (typeof endpoint === 'string') return endpoint;
      if (endpoint && typeof endpoint.id === 'string') return endpoint.id;
      return null;
    };

    const filteredLinks = repositoryData.links.reduce((acc, link) => {
      const sourceId = normalizeEndpoint(link.source);
      const targetId = normalizeEndpoint(link.target);

      if (!sourceId || !targetId) {
        return acc;
      }

      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
        return acc;
      }

      acc.push({
        ...link,
        source: sourceId,
        target: targetId,
      });

      return acc;
    }, [] as typeof repositoryData.links);

    return {
      ...repositoryData,
      nodes: nodesWithStar,
      links: filteredLinks,
    };
  }, [repositoryData, filters]);

  useEffect(() => {
    if (!selectedFile || !filteredRepositoryData) return;
    const stillExists = filteredRepositoryData.nodes.some((node) => node.id === selectedFile.id);
    if (!stillExists) {
      setSelectedFile(null);
    }
  }, [filteredRepositoryData, selectedFile]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Enhanced Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shadow-sm shadow-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                  CodeNebula
                </h1>
                <p className="text-xs text-muted-foreground">3D Repository Visualizer</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Repository Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading} size="lg" className="px-8">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Repository
                </>
              )}
            </Button>
          </div>

          {/* Repository Info */}
          {repositoryData && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Github className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-foreground">
                  {repositoryData.metadata.owner} / {repositoryData.metadata.repo}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {repositoryData ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Stats & Charts */}
          <div className="w-72 border-r border-border bg-card/30 backdrop-blur-sm overflow-y-auto p-4 space-y-4 min-w-[280px]">
            <RepositoryStats data={repositoryData} />
            <LanguageChart data={repositoryData} />
            <FileSizeChart data={repositoryData} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-border px-4">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="visualization" className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Visualization
                  </TabsTrigger>
                  <TabsTrigger value="explorer" className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    File Explorer
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="visualization" className="flex-1 m-0 overflow-hidden relative">
                <CodeGalaxy
                  repositoryData={filteredRepositoryData}
                  mode={mode}
                  onFileClick={handleFileClick}
                  resetTrigger={resetTrigger}
                />
                <div className="absolute top-4 left-4 z-10 space-y-3">
                  <FileFilters data={repositoryData} onFilterChange={setFilters} />
                  <ExportControls
                    onExportImage={handleExportImage}
                    onExportData={handleExportData}
                    repositoryData={repositoryData}
                  />
                </div>
                <VisualizationControls
                  mode={mode}
                  onModeChange={setMode}
                  onResetView={handleResetView}
                  repositoryData={filteredRepositoryData}
                />
              </TabsContent>

              <TabsContent value="explorer" className="flex-1 m-0 overflow-hidden">
                <FileExplorer
                  data={filteredRepositoryData}
                  onFileClick={handleFileClick}
                  selectedFile={selectedFile}
                />
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 m-0 overflow-y-auto p-4">
                <div className="space-y-4">
                  <Card className="p-6 bg-card/50 border-border/50">
                    <h3 className="text-lg font-semibold mb-4">Repository Analytics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average File Size</p>
                        <p className="text-2xl font-bold">
                          {((repositoryData.nodes.reduce((sum, n) => sum + n.size, 0) / repositoryData.nodes.length) / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average LOC per File</p>
                        <p className="text-2xl font-bold">
                          {Math.round(repositoryData.metadata.totalLOC / repositoryData.metadata.totalFiles)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Largest File</p>
                        <p className="text-lg font-semibold">
                          {repositoryData.nodes.reduce((max, n) => n.size > max.size ? n : max, repositoryData.nodes[0])?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Most Important File</p>
                        <p className="text-lg font-semibold">
                          {repositoryData.nodes.find(n => n.isStar)?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="relative">
              <div className="text-9xl animate-pulse-slow">🌌</div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Welcome to CodeNebula
              </h2>
              <p className="text-muted-foreground text-lg">
                Transform any GitHub repository into a stunning 3D galaxy visualization
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Enter a GitHub repository URL above to begin exploring
              </p>
            </div>
          </div>
        </div>
      )}

      <AppFooter />

      <AISummaryModal
        file={selectedFile}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
