import { useAdminLive } from "@/lib/hooks";
import { Users, CheckCircle2 } from "lucide-react";

export default function AdminLive() {
  const { data: stats, isLoading, isError } = useAdminLive();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-serif mb-2">Live Dashboard</h1>
      <p className="text-muted-foreground mb-8">Real-time attempts statistics (Auto-refreshes every 5s)</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-card border rounded-lg animate-pulse"></div>
          <div className="h-32 bg-card border rounded-lg animate-pulse"></div>
        </div>
      ) : isError ? (
        <div className="p-4 border border-destructive text-destructive rounded bg-destructive/5">
          Failed to load live stats.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-lg p-6 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">In Progress</div>
              <div className="text-5xl font-mono text-foreground">{stats?.in_progress || 0}</div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Completed</div>
              <div className="text-5xl font-mono text-foreground">{stats?.completed || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
