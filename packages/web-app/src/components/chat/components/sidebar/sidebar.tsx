import { observer } from 'mobx-react-lite';
import { Plus, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import rootStore from '@/stores/root-store.ts';

const MySidebar = observer(() => {
  const navigate = useNavigate();
  const { sessionStore } = rootStore;

  useEffect(() => {
    sessionStore.getSessions();
  }, []);

  const handleNewSession = () => {
    navigate('/chat');
  };

  const handleSessionClick = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  return (
    <Sidebar>
      {/* 顶部吸顶区：Logo + 新建任务按钮 */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">OpenManus</div>
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
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>设置</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

export default MySidebar;
