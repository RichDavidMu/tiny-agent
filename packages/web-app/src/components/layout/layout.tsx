import { Link, Outlet, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStore } from '@/stores/rootStore';
import { cn } from '@/lib/utils';

const Layout = observer(() => {
  const location = useLocation();
  const { themeStore } = useStore();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                OpenManus
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === '/' ? 'text-foreground' : 'text-foreground/60',
                )}
              >
                Home
              </Link>
              <Link
                to="/chat"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === '/chat' ? 'text-foreground' : 'text-foreground/60',
                )}
              >
                Chat
              </Link>
            </nav>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => themeStore.toggleTheme()}
                    className="h-9 w-9"
                  >
                    {themeStore.theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {themeStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
});

export default Layout;
