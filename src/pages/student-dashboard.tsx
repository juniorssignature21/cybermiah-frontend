import { useQuizzes, useStartAttempt, useMyAttemptsByQuiz } from "@/lib/hooks";
import { recordAttempt } from "@/lib/attempt-store";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Clock, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export default function StudentDashboard() {
  const { data: quizzes, isLoading, isError, error, refetch } = useQuizzes();
  const startAttempt = useStartAttempt();
  const attemptsByQuiz = useMyAttemptsByQuiz();
  const [, setLocation] = useLocation();

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
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-serif mb-8 text-foreground">Available Quizzes</h1>

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
                    <Link href={`/attempt/${attempt.id}`}>
                      <Button>Continue Attempt</Button>
                    </Link>
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
  );
}
