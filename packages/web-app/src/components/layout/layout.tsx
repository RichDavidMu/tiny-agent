import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Toaster } from '@/components/ui/sonner';
import { useHistorySync } from '@/hooks/use-history-sync.tsx';

const Layout = observer(() => {
  useHistorySync();
  return (
    <div className="flex min-h-screen flex-col">
      <Toaster position="top-center" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
});

export default Layout;
