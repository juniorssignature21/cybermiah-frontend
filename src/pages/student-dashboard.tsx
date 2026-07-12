import { useQuizzes, useStartAttempt, useMyAttemptsByQuiz } from "@/lib/hooks";
import { recordAttempt } from "@/lib/attempt-store";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Clock, AlertCircle, CheckCircle2, AlertTriangle, TrendingUp, Award } from "lucide-react";
import { useMemo } from "react";

export default function StudentDashboard() {
  const { data: quizzes, isLoading, isError, error, refetch } = useQuizzes();
  const startAttempt = useStartAttempt();
  const attemptsByQuiz = useMyAttemptsByQuiz();
  const [, setLocation] = useLocation();

  // Calculate statistics for attempted quizzes
  const resultsStats = useMemo(() => {
    const attempts = Object.values(attemptsByQuiz)
      .filter(a => a.data && (a.data.status === 'submitted' || a.data.status === 'flagged'))
      .map(a => a.data!);
    
    if (attempts.length === 0) {
      return { completed: 0, avgScore: 0, bestScore: 0 };
    }

    const scores = attempts
      .filter(a => a.score !== undefined && a.score !== null)
      .map(a => a.score as number);
    
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    return { completed: attempts.length, avgScore, bestScore };
  }, [attemptsByQuiz]);

  const handleStart = (quizId: string) => {
    startAttempt.mutate(quizId, {
      onSuccess: (data) => {
        recordAttempt(quizId, data.id);
        setLocation(`/attempt/${data.id}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <h1 className="text-3xl font-serif mb-8">Available Quizzes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-card border p-6 rounded-lg animate-pulse">
              <div className="h-6 bg-muted w-2/3 mb-4 rounded"></div>
              <div className="h-4 bg-muted w-1/3 mb-6 rounded"></div>
              <div className="h-10 bg-muted w-32 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-medium text-destructive mb-2">Failed to load quizzes</h2>
          <p className="text-sm text-destructive/80 mb-4">{error?.message}</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 mt-8">
      {/* My Results Section */}
      {Object.values(attemptsByQuiz).some(a => a.data && (a.data.status === 'submitted' || a.data.status === 'flagged')) && (
        <>
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-serif text-foreground">My Results</h2>
            </div>

            {/* Results Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border p-6 rounded-lg shadow-sm">
                <div className="text-sm text-muted-foreground mb-2">Quizzes Completed</div>
                <div className="text-4xl font-bold text-primary">{resultsStats.completed}</div>
              </div>
              <div className="bg-card border p-6 rounded-lg shadow-sm">
                <div className="text-sm text-muted-foreground mb-2">Average Score</div>
                <div className="text-4xl font-bold text-primary">{resultsStats.avgScore.toFixed(1)}%</div>
              </div>
              <div className="bg-card border p-6 rounded-lg shadow-sm">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Best Score
                </div>
                <div className="text-4xl font-bold text-primary">{resultsStats.bestScore.toFixed(1)}%</div>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="p-4 text-left font-medium text-muted-foreground">Quiz</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Score</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-left font-medium text-muted-foreground">Completed</th>
                      <th className="p-4 text-right font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quizzes?.map(quiz => {
                      const attemptState = attemptsByQuiz[quiz.id];
                      const attempt = attemptState?.data;
                      const isCompleted = attempt && (attempt.status === 'submitted' || attempt.status === 'flagged');

                      if (!isCompleted) return null;

                      return (
                        <tr key={quiz.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-medium text-foreground">{quiz.title}</td>
                          <td className="p-4">
                            <span className="text-lg font-mono font-bold text-primary">
                              {attempt.score !== undefined && attempt.score !== null ? `${attempt.score.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              attempt.status === 'flagged' 
                                ? 'bg-destructive/10 text-destructive' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {attempt.status === 'flagged' ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Flagged
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setLocation(`/result/${attempt.id}`)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t my-12"></div>
        </>
      )}

      {/* Available Quizzes Section */}
      <div>
        <h2 className="text-2xl font-serif mb-6 text-foreground">Available Quizzes</h2>
        {quizzes && quizzes.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed rounded-lg">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">No active quizzes right now</h2>
            <p className="text-muted-foreground">Check back later or contact your instructor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes?.map((quiz) => {
            const attemptState = attemptsByQuiz[quiz.id];
            const attempt = attemptState?.data;
            const isSubmitted = attempt && (attempt.status === 'submitted' || attempt.status === 'flagged');
            const isInProgress = attempt && attempt.status === 'in_progress';

            return (
              <div key={quiz.id} className="bg-card border p-6 rounded-lg flex flex-col items-start shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-medium mb-2 text-card-foreground">{quiz.title}</h2>
                <div className="flex items-center text-muted-foreground text-sm mb-6 gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{quiz.duration_minutes} minutes</span>
                </div>

                {isSubmitted && (
                  <div className={`mb-4 w-full p-4 rounded-lg border ${
                    attempt.status === 'flagged' ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'
                  }`}>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      {attempt.status === 'flagged' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-destructive">Attempt flagged</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span className="text-primary">Completed</span>
                        </>
                      )}
                    </div>
                    {attempt.score !== undefined && attempt.score !== null && (
                      <div className="text-2xl font-mono text-foreground">{attempt.score.toFixed(1)}%</div>
                    )}
                    <Link href={`/result/${attempt.id}`} className="text-xs text-primary hover:underline">
                      View full result
                    </Link>
                  </div>
                )}

                <div className="mt-auto">
                  {startAttempt.isError && startAttempt.variables === quiz.id && (
                    <div className="mb-3 text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {startAttempt.error.message}
                    </div>
                  )}
                  {isInProgress ? (
                    <Button onClick={() => setLocation(`/attempt/${attempt.id}`)}>Continue Attempt</Button>
                  ) : isSubmitted ? (
                    <Button variant="outline" disabled>
                      Attempt Complete
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStart(quiz.id)}
                      disabled={startAttempt.isPending}
                    >
                      {startAttempt.isPending && startAttempt.variables === quiz.id ? 'Starting...' : 'Start Attempt'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
