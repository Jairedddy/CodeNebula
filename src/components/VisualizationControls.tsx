import { useState } from 'react';
import { VisualizationMode } from '@/types/galaxy';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Layers, Network, Info, SlidersHorizontal } from 'lucide-react';

interface VisualizationControlsProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  onResetView: () => void;
  repositoryData: any;
}

const LANGUAGE_COLORS_LEGEND: Record<string, string> = {
  javascript: '#FFD700',
  typescript: '#4169E1',
  python: '#32CD32',
  java: '#FF6347',
  go: '#00CED1',
  rust: '#FF8C00',
  cpp: '#FF1493',
  c: '#9370DB',
  ruby: '#DC143C',
  php: '#9966CC',
  swift: '#FF7F50',
  kotlin: '#DA70D6',
  css: '#9932CC',
  html: '#FF4500',
  other: '#48D1CC',
};

export function VisualizationControls({ mode, onModeChange, onResetView, repositoryData }: VisualizationControlsProps) {
  if (!repositoryData) return null;

  // Get unique languages
  const languages = Array.from(
    new Set(
      repositoryData.nodes
        .map((n: any) => (n.language || 'other').toLowerCase())
        .filter(Boolean)
    )
  )
    .sort()
    .slice(0, 8); // Show top 8 languages

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {isOpen ? 'Hide Controls' : 'Show Controls'}
      </Button>

      {isOpen && (
        <>
          {/* Mode Controls */}
          <Card className="p-3 bg-card/90 backdrop-blur-sm border-border/50">
            <div className="flex gap-2">
              <Button
                variant={mode === 'structural' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('structural')}
                className="flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Structure
              </Button>
              <Button
                variant={mode === 'dependency' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onModeChange('dependency')}
                className="flex items-center gap-2"
              >
                <Network className="w-4 h-4" />
                Dependencies
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onResetView}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </Card>

          {/* Language Legend */}
          {languages.length > 0 && (
            <Card className="p-3 bg-card/90 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Languages</span>
              </div>
              <div className="space-y-1.5">
                {languages.map((lang) => (
                  <div key={lang} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: LANGUAGE_COLORS_LEGEND[lang] || LANGUAGE_COLORS_LEGEND.other }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{lang}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

