import { RepositoryData } from '@/types/galaxy';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LanguageChartProps {
  data: RepositoryData | null;
}

const LANGUAGE_COLORS: Record<string, string> = {
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

export function LanguageChart({ data }: LanguageChartProps) {
  if (!data) return null;

  // Calculate language distribution
  const languageMap = new Map<string, number>();
  data.nodes.forEach(node => {
    const lang = node.language.toLowerCase();
    languageMap.set(lang, (languageMap.get(lang) || 0) + node.loc);
  });

  const chartData = Array.from(languageMap.entries())
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.other,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 languages

  const totalLOC = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Language Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString()} LOC (${((value / totalLOC) * 100).toFixed(1)}%)`,
                'Lines of Code',
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconSize={10}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

