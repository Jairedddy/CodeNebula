import { RepositoryData } from '@/types/galaxy';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileSizeChartProps {
  data: RepositoryData | null;
}

export function FileSizeChart({ data }: FileSizeChartProps) {
  if (!data) return null;

  // Categorize files by size
  const sizeCategories = [
    { name: 'Tiny', max: 1024, color: '#48D1CC' }, // < 1KB
    { name: 'Small', max: 10240, color: '#32CD32' }, // < 10KB
    { name: 'Medium', max: 102400, color: '#FFD700' }, // < 100KB
    { name: 'Large', max: 1048576, color: '#FF6347' }, // < 1MB
    { name: 'Huge', max: Infinity, color: '#DC143C' }, // >= 1MB
  ];

  const categoryCounts = sizeCategories.map(cat => {
    const count = data.nodes.filter(node => {
      if (cat.name === 'Tiny') return node.size < cat.max;
      if (cat.name === 'Huge') return node.size >= cat.max;
      return node.size >= sizeCategories[sizeCategories.indexOf(cat) - 1]?.max && node.size < cat.max;
    }).length;
    return { name: cat.name, count, color: cat.color };
  });

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">File Size Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={categoryCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              formatter={(value: number) => [value, 'Files']}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
              {categoryCounts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

