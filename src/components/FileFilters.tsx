import { useState, useEffect } from 'react';
import { RepositoryData } from '@/types/galaxy';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileFiltersProps {
  data: RepositoryData | null;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchQuery: string;
  selectedLanguages: string[];
  minSize: number;
  maxSize: number;
  fileTypes: string[];
}

export function FileFilters({ data, onFilterChange }: FileFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  if (!data) return null;

  // Get unique languages
  const languages = Array.from(new Set(data.nodes.map(n => n.language.toLowerCase())))
    .sort();

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLanguages([]);
  };

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({
      searchQuery,
      selectedLanguages,
      minSize: 0,
      maxSize: Infinity,
      fileTypes: [],
    });
  }, [searchQuery, selectedLanguages, onFilterChange]);

  return (
    <Card className="p-3 bg-card/90 backdrop-blur-sm border-border/50">
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {selectedLanguages.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {selectedLanguages.length}
            </Badge>
          )}
        </Button>

        {/* Language Filters */}
        {showFilters && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Languages</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {languages.slice(0, 10).map((lang) => (
                <Badge
                  key={lang}
                  variant={selectedLanguages.includes(lang) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize text-xs"
                  onClick={() => toggleLanguage(lang)}
                >
                  {lang}
                </Badge>
              ))}
            </div>
            {selectedLanguages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

