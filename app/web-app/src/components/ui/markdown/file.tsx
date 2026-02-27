import type { CreateFileInput } from '@tini-agent/agent-core';
import { Download, FileJson, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FileComponent({
  ids,
  attachment,
}: {
  ids: string[];
  attachment?: CreateFileInput[];
}) {
  if (!attachment) {
    return null;
  }

  const files = attachment.filter((a) => ids.includes(a.id));

  if (files.length === 0) {
    return null;
  }

  const getFileExtension = (mimeType: string): string => {
    if (mimeType === 'application/json') {
      return '.json';
    }
    if (mimeType === 'text/plain') {
      return '.txt';
    }
    if (mimeType.startsWith('image/')) {
      const type = mimeType.split('/')[1];
      return `.${type}`;
    }
    return '';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/json') {
      return <FileJson className="h-5 w-5" />;
    }
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const handleDownload = (file: CreateFileInput) => {
    const extension = getFileExtension(file.mimeType);
    const fileName = file.name.endsWith(extension) ? file.name : `${file.name}${extension}`;

    const blob = new Blob([file.content], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <span className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
      {files.map((file) => (
        <span
          key={file.id}
          className="border rounded-lg p-2 flex items-center justify-between hover:bg-accent/50 transition-colors"
        >
          <span className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-muted-foreground">{getFileIcon(file.mimeType)}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate">{file.name}</span>
              <span className="block text-sm text-muted-foreground">
                {file.mimeType}
                {file.content && ` • ${(file.content.length / 1024).toFixed(1)} KB`}
              </span>
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(file)}
            className="ml-2 shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </span>
      ))}
    </span>
  );
}
