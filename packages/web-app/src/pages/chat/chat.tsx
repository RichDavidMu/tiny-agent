import { observer } from 'mobx-react-lite';
import Content from '@/components/chat/components/content/content.tsx';
import { SidebarProvider } from '@/components/ui/sidebar.tsx';
import Sidebar from '@/components/chat/components/sidebar/sidebar.tsx';

const Chat = observer(() => {
  return (
    <SidebarProvider>
      <Sidebar />
      <Content />
    </SidebarProvider>
  );
});

export default Chat;
