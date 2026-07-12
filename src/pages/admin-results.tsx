import { useAdminResults, useQuizzes } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { Download, AlertTriangle, Users, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();
  const [filterQuiz, setFilterQuiz] = useState<string>("all");
  const [filterCohort, setFilterCohort] = useState<string>("all");
  const { data: results, isLoading, isError, error } = useAdminResults(filterQuiz !== 'all' ? filterQuiz : undefined, filterCohort !== 'all' ? filterCohort : undefined);
  const { data: quizzes } = useQuizzes();
  const [exportError, setExportError] = useState<string | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!results || results.length === 0) return { totalAttempts: 0, avgScore: 0, flaggedCount: 0, uniqueStudents: new Set() };
    
    const scores = results
      .filter(r => r.score !== null && r.score !== undefined)
      .map(r => r.score as number);
    
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const flaggedCount = results.filter(r => r.status === 'flagged').length;
    const uniqueStudents = new Set(results.map(r => r.student_email));

    return { totalAttempts: results.length, avgScore, flaggedCount, uniqueStudents: uniqueStudents.size };
  }, [results]);

  // Get unique cohorts from results
  const cohorts = useMemo(() => {
    if (!results) return [];
    const unique = new Set(results.map(r => r.cohort).filter(c => c));
    return Array.from(unique).sort();
  }, [results]);

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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Results & Exports</h1>
          <p className="text-muted-foreground">View and analyze student attempt records.</p>
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

      {/* Statistics Cards */}
      {!isLoading && !isError && results && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Attempts</div>
                <div className="text-3xl font-bold text-foreground">{stats.totalAttempts}</div>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card border p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Unique Students</div>
                <div className="text-3xl font-bold text-foreground">{stats.uniqueStudents}</div>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card border p-6 rounded-lg shadow-sm">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Average Score</div>
              <div className="text-3xl font-bold text-primary">{stats.avgScore.toFixed(1)}%</div>
            </div>
          </div>
          <div className="bg-card border p-6 rounded-lg shadow-sm">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Flagged Attempts</div>
              <div className={`text-3xl font-bold ${stats.flaggedCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {stats.flaggedCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border p-6 rounded-lg mb-6 shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Quiz</label>
            <select
              value={filterQuiz}
              onChange={(e) => setFilterQuiz(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
            >
              <option value="all">All Quizzes</option>
              {quizzes?.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Cohort</label>
            <select
              value={filterCohort}
              onChange={(e) => setFilterCohort(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
            >
              <option value="all">All Cohorts</option>
              {cohorts.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}

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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLocation(`/admin/timeline/${r.attempt_id}`)}
                      >
                        Timeline
                      </Button>
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
