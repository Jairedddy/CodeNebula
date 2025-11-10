import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Image, FileJson } from 'lucide-react';

interface ExportControlsProps {
  onExportImage: () => void;
  onExportData: () => void;
  repositoryData: any;
}

export function ExportControls({ onExportImage, onExportData, repositoryData }: ExportControlsProps) {
  if (!repositoryData) return null;

  return (
    <Card className="p-3 bg-card/90 backdrop-blur-sm border-border/50">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">Export</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportImage}
            className="w-full flex items-center gap-2 justify-start"
          >
            <Image className="w-4 h-4" />
            Export Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportData}
            className="w-full flex items-center gap-2 justify-start"
          >
            <FileJson className="w-4 h-4" />
            Export Data (JSON)
          </Button>
        </div>
      </div>
    </Card>
  );
}

