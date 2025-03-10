import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { info, FeatureArea } from '@/lib/logger';

const MARKDOWN_FILES = [
  { label: 'API Standards', value: 'API_STANDARDS.md' },
  { label: 'API Testing', value: 'API_TESTING.md' },
  { label: 'Contributing', value: 'CONTRIBUTING.md' },
  { label: 'Debug Infrastructure', value: 'DEBUG_INFRASTRUCTURE.md' },
  { label: 'Feature Testing', value: 'FEATURE_TESTING.md' },
  { label: 'Implementation Analysis', value: 'IMPLEMENTATION_ANALYSIS.md' },
  { label: 'README', value: 'README.md' },
  { label: 'Unified Debug Implementation', value: 'UNIFIED_DEBUG_IMPLEMENTATION.md' },
];

export function MarkdownViewer() {
  const [selectedFile, setSelectedFile] = useState<string>(MARKDOWN_FILES[0].value);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkdown = async (filename: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      info(FeatureArea.UI, `Loading markdown file: ${filename}`);
      const response = await fetch(`/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      setMarkdownContent(content);
      info(FeatureArea.UI, `Markdown file loaded: ${filename}`, { size: content.length });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unknown error loading markdown file';
      setError(errMessage);
      setMarkdownContent('');
      console.error(`Error loading markdown: ${errMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkdown(selectedFile);
  }, [selectedFile]);

  const handleFileChange = (value: string) => {
    setSelectedFile(value);
  };

  const handleRefresh = () => {
    fetchMarkdown(selectedFile);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Documentation Viewer</CardTitle>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>View documentation markdown files</CardDescription>
        <div className="mt-2">
          <Select value={selectedFile} onValueChange={handleFileChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select file" />
            </SelectTrigger>
            <SelectContent>
              {MARKDOWN_FILES.map((file) => (
                <SelectItem key={file.value} value={file.value}>
                  {file.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow pb-4 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md">
            <p className="font-semibold">Error loading markdown</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)] pr-4 border rounded-md p-4 bg-slate-900/50">
            <article className="prose-cyberpunk">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownContent}
              </ReactMarkdown>
            </article>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}