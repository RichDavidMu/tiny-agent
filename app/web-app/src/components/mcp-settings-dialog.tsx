import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import mcpStore, { type MCPConfig } from '@/stores/mcp-store';

interface MCPSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MCPSettingsDialog = observer(({ open, onOpenChange }: MCPSettingsDialogProps) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  });

  // 当对话框打开时加载 MCP 配置
  useEffect(() => {
    if (open) {
      mcpStore.loadMCPConfigs();
    }
  }, [open]);

  const handleAdd = () => {
    setEditingName('new');
    setFormData({ name: '', url: '' });
  };

  const handleEdit = (config: MCPConfig) => {
    setEditingName(config.name);
    setFormData({
      name: config.name,
      url: config.url,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.url) {
      toast.error('Name and URL are required');
      return;
    }

    try {
      if (editingName === 'new') {
        await mcpStore.addMCP({
          name: formData.name,
          url: formData.url,
        });
        toast.success('MCP server added successfully');
      }
      setEditingName(null);
      setFormData({ name: '', url: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save MCP server');
    }
  };

  const handleCancel = () => {
    setEditingName(null);
    setFormData({ name: '', url: '' });
  };

  const handleDelete = async (name: string) => {
    try {
      await mcpStore.removeMCP(name);
      toast.success('MCP server removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove MCP server');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>MCP Settings</DialogTitle>
          <DialogDescription>
            Manage your Model Context Protocol server configurations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!mcpStore.extensionInstalled ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Browser Extension Required</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  To use MCP servers, you need to install the Tiny Agent MCP Bridge browser
                  extension.
                </p>
                <p className="text-sm">
                  After installing the extension, please refresh this page to continue.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    window.open(
                      'https://chromewebstore.google.com/detail/tiny-agent-mcp-bridge/enancoankilkplgabpojdilmgjaebodi',
                      '_blank',
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Install Extension
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {editingName ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., filesystem"
                      disabled={editingName !== 'new'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL</label>
                    <Input
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="e.g., https://example.com/mcp"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleAdd} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add MCP Server
                </Button>
              )}

              <div className="space-y-2">
                {mcpStore.mcpList.map((config) => (
                  <div
                    key={config.name}
                    className="border rounded-lg p-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {config.name}
                        {config.builtin && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Built-in
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{config.url}</div>
                    </div>
                    {!config.builtin && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(config)} variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(config.name)} variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default MCPSettingsDialog;
