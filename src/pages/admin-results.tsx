import { useAdminResults } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { Download, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type AdminResultRow = {
  attempt_id: string;
  student_name: string;
  student_email: string;
  cohort?: string | null;
  quiz_title: string;
  score?: number | null;
  status: string;
  violation_count: number;
};

export default function AdminResults() {
  const [filterQuiz, setFilterQuiz] = useState<string>("all");
  const { data: results, isLoading, isError, error } = useAdminResults(filterQuiz);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    // The endpoint streams a CSV. Route through the shared API client so
    // auth headers and 401 handling stay centralized.
    setExportError(null);
    try {
      const blob = await fetchApi<Blob>("/admin/results/export");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz_results_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export results");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Results & Exports</h1>
          <p className="text-muted-foreground">View all student attempt records.</p>
        </div>
        <Button onClick={handleExport} variant="secondary">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {exportError && (
        <div className="mb-6 p-4 border border-destructive/20 text-destructive rounded bg-destructive/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {exportError}
        </div>
      )}

      {isError ? (
        <div className="p-4 border border-destructive/20 text-destructive rounded bg-destructive/5">
          {error?.message || "Failed to load results"}
        </div>
      ) : isLoading ? (
        <div className="h-64 bg-card border rounded-lg animate-pulse"></div>
      ) : results?.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-lg text-muted-foreground">
          No attempts have been recorded yet.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="p-4 font-medium text-muted-foreground">Student</th>
                  <th className="p-4 font-medium text-muted-foreground">Cohort</th>
                  <th className="p-4 font-medium text-muted-foreground">Quiz</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Score</th>
                  <th className="p-4 font-medium text-muted-foreground text-center">Violations</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results?.map((r: AdminResultRow) => (
                  <tr key={r.attempt_id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{r.student_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student_email}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{r.cohort || '-'}</td>
                    <td className="p-4 text-foreground">{r.quiz_title}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === 'flagged' ? 'bg-destructive/10 text-destructive' :
                        r.status === 'submitted' ? 'bg-primary/10 text-primary' :
                        'bg-accent/10 text-accent-foreground'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-medium">
                      {r.score !== null ? `${Number(r.score).toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {r.violation_count > 0 ? (
                        <span className="inline-flex items-center text-destructive font-medium">
                          <AlertTriangle className="w-3 h-3 mr-1" /> {r.violation_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/timeline/${r.attempt_id}`}>
                        <Button variant="outline" size="sm">Timeline</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
