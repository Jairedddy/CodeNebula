import { RepositoryData } from '@/types/galaxy';
import { FileText, Code, Languages, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RepositoryStatsProps {
  data: RepositoryData | null;
}

export function RepositoryStats({ data }: RepositoryStatsProps) {
  if (!data) return null;

  const languageCount = new Set(data.nodes.map(n => n.language)).size;
  const averageLoc = Math.round(data.metadata.totalLOC / Math.max(data.metadata.totalFiles, 1));
  const centerNode =
    data.nodes.length > 0
      ? data.nodes.reduce((current, candidate) => {
          if (!current) return candidate;
          const currentImportance = current.importance ?? -Infinity;
          const candidateImportance = candidate.importance ?? -Infinity;
          return candidateImportance > currentImportance ? candidate : current;
        }, data.nodes[0])
      : null;

  const stats = [
    {
      label: 'Total Files',
      value: data.metadata.totalFiles.toLocaleString(),
      icon: FileText,
      color: 'text-cyan-400',
    },
    {
      label: 'Lines of Code',
      value: data.metadata.totalLOC.toLocaleString(),
      icon: Code,
      color: 'text-purple-400',
    },
    {
      label: 'Languages',
      value: languageCount.toString(),
      icon: Languages,
      color: 'text-pink-400',
    },
    {
      label: 'Avg LOC / File',
      value: averageLoc.toLocaleString(),
      icon: Gauge,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="p-3 bg-card/50 border-border/50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md bg-muted/50 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
              <p className="text-xl font-bold text-foreground leading-tight">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

