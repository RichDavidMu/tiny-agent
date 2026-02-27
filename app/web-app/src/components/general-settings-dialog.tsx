import { observer } from 'mobx-react-lite';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import rootStore from '@/stores/root-store';

interface GeneralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GeneralSettingsDialog = observer(({ open, onOpenChange }: GeneralSettingsDialogProps) => {
  const { themeStore } = rootStore;

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
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default GeneralSettingsDialog;
