import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import rootStore from '@/stores/root-store';

interface GeneralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GeneralSettingsDialog = observer(({ open, onOpenChange }: GeneralSettingsDialogProps) => {
  const { themeStore } = rootStore;

  // 读取localStorage中的debug配置
  const getDebugConfig = () => {
    const debug = localStorage.getItem('debug') || '';
    const debugList = debug
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      webApp: debugList.includes('web-app*'),
      agentCore: debugList.includes('agent-core*'),
    };
  };

  const [debugConfig, setDebugConfig] = useState(getDebugConfig);

  // 更新localStorage中的debug配置
  const updateDebugConfig = (type: 'web-app*' | 'agent-core*', enabled: boolean) => {
    const debug = localStorage.getItem('debug') || '';
    let debugList = debug
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (enabled) {
      if (!debugList.includes(type)) {
        debugList.push(type);
      }
    } else {
      debugList = debugList.filter((item) => item !== type);
    }

    const newDebug = debugList.join(',');
    localStorage.setItem('debug', newDebug);
    setDebugConfig(getDebugConfig());
  };

  // 当对话框打开时，重新读取配置
  useEffect(() => {
    if (open) {
      setDebugConfig(getDebugConfig());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>通用设置</DialogTitle>
          <DialogDescription>配置应用的通用选项</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">主题</Label>
            <RadioGroup
              value={themeStore.theme}
              onValueChange={(value) => themeStore.setTheme(value as 'light' | 'dark')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="font-normal cursor-pointer">
                  浅色
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="font-normal cursor-pointer">
                  深色
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">日志开关</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="web-app-log" className="font-normal cursor-pointer">
                  Web App 日志
                </Label>
                <Switch
                  id="web-app-log"
                  checked={debugConfig.webApp}
                  onCheckedChange={(checked) => updateDebugConfig('web-app*', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="agent-core-log" className="font-normal cursor-pointer">
                  Agent Core 日志
                </Label>
                <Switch
                  id="agent-core-log"
                  checked={debugConfig.agentCore}
                  onCheckedChange={(checked) => updateDebugConfig('agent-core*', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default GeneralSettingsDialog;
