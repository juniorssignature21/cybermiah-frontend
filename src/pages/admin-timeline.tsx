import { useAdminAttemptTimeline } from "@/lib/hooks";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";

export default function AdminTimeline() {
  const [, params] = useRoute("/admin/timeline/:id");
  const id = params?.id;

  const { data: events, isLoading, isError, error } = useAdminAttemptTimeline(id!);

  if (isLoading) return <div className="p-8">Loading timeline...</div>;
  if (isError) return <div className="p-8 text-destructive">{error?.message}</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/results" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </Link>
      </div>

      <h1 className="text-3xl font-serif mb-2">Proctoring Timeline</h1>
      <p className="text-muted-foreground mb-8">Attempt ID: {id}</p>

      {events && events.length === 0 ? (
        <div className="py-12 text-center border rounded-lg bg-card text-muted-foreground">
          No proctoring events recorded for this attempt. Clean run!
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {events?.map((ev: any, i: number) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-destructive text-destructive-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <AlertTriangle className="w-4 h-4" />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded border shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium capitalize text-destructive">{ev.event_type.replace('_', ' ')}</div>
                  <time className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </time>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
