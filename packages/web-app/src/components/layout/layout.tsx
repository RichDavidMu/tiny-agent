import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Toaster } from '@/components/ui/sonner';

const Layout = observer(() => {
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
