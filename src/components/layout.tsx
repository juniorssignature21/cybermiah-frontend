import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && role !== "admin") {
      setLocation("/");
    }
  }, [role, isAuthenticated, setLocation]);

  if (role !== "admin") return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-sidebar border-r flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <span className="font-serif text-lg font-bold tracking-tight text-sidebar-foreground">Control Room</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="block px-4 py-2 text-sm font-medium rounded text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            Live Dashboard
          </Link>
          <Link href="/admin/quizzes" className="block px-4 py-2 text-sm font-medium rounded text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            Manage Quizzes
          </Link>
          <Link href="/admin/results" className="block px-4 py-2 text-sm font-medium rounded text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            Results & Exports
          </Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-sidebar-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b flex items-center px-6 md:hidden">
          <span className="font-serif text-lg font-bold">Control Room</span>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { role, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && role === "admin" && !location.startsWith('/admin')) {
      setLocation("/admin");
    }
  }, [role, isAuthenticated, location, setLocation]);

  const isTakingExam = location.startsWith('/attempt/');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isTakingExam && (
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
          <div className="font-serif text-xl tracking-tight text-foreground">Student Portal</div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Exit
          </Button>
        </header>
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
