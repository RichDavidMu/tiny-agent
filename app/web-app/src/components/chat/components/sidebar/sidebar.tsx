import { observer } from 'mobx-react-lite';
import { Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import rootStore from '@/stores/root-store.ts';
import { selectSession } from '@/lib/session.ts';
import stream from '@/stream/stream.ts';
import MCPSettingsDialog from '@/components/mcp-settings-dialog';

const MySidebar = observer(() => {
  const { sessionStore } = rootStore;
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);

  useEffect(() => {
    sessionStore.getSessions();
  }, []);

  const handleNewSession = () => {
    if (stream.loading) {
      toast('cannot create new task now');
      return;
    }
    selectSession(undefined);
  };

  const handleSessionClick = (sessionId: string) => {
    if (stream.loading) {
      toast('cannot switch session now');
      return;
    }
    selectSession(sessionId);
  };

  return (
    <Sidebar>
      {/* 顶部吸顶区：Logo + 新建任务按钮 */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">tiny-agent</div>
          </div>
          <Button size="sm" onClick={handleNewSession} className="h-8 gap-2">
            <Plus className="h-4 w-4" />
            <span>新建任务</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* 中间滚动区域：Session 列表 */}
      <SidebarContent>
        <SidebarMenu>
          {sessionStore.sessionList.map((session) => (
            <SidebarMenuItem key={session.id}>
              <SidebarMenuButton
                onClick={() => handleSessionClick(session.id)}
                isActive={sessionStore.sessionId === session.id}
              >
                <span className="truncate">{session.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* 底部吸底区：设置按钮 */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>设置</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem onClick={() => setMcpDialogOpen(true)}>MCP 设置</DropdownMenuItem>
                <DropdownMenuItem>通用设置</DropdownMenuItem>
                <DropdownMenuItem>关于</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <MCPSettingsDialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen} />
    </Sidebar>
  );
});

export default MySidebar;
