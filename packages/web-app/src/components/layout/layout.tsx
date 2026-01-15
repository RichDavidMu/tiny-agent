import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
const Layout = observer(() => {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
});

export default Layout;
