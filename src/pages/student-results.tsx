import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, Clock3, ChartColumnBig, CheckCircle2, BadgePercent, ArrowRight, Sparkles } from "lucide-react";
import { useMyAttempts } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentResults() {
  const { data: attempts } = useMyAttempts();
  const [, setLocation] = useLocation();

  const completedAttempts = useMemo(() => {
    return (attempts ?? [])
      .filter(attempt => attempt.status === "submitted" || attempt.status === "flagged")
      .sort((a, b) => {
        const aDate = a.submitted_at ?? a.started_at;
        const bDate = b.submitted_at ?? b.started_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }, [attempts]);

  const stats = useMemo(() => {
    const scores = completedAttempts
      .map(attempt => attempt.score)
      .filter((score): score is number => typeof score === "number");

    const completed = completedAttempts.length;
    const averageScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const flagged = completedAttempts.filter(attempt => attempt.status === "flagged").length;

    return { completed, averageScore, bestScore, flagged };
  }, [completedAttempts]);

  const latestAttempt = completedAttempts[0];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-36 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Personal performance hub
            </div>
            <h1 className="text-3xl font-serif tracking-tight md:text-5xl">My Results</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Track every submitted attempt, review your score trend, and jump back into any result instantly.
            </p>
          </div>

          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/20 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">{stats.completed}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Submitted or flagged attempts</CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Average score</CardDescription>
              <CardTitle className="text-3xl">{stats.averageScore.toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Across scored attempts</CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Best score</CardDescription>
              <CardTitle className="text-3xl">{stats.bestScore.toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Your strongest result so far</CardContent>
          </Card>
          <Card className="border-destructive/20 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Flagged</CardDescription>
              <CardTitle className="text-3xl">{stats.flagged}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Attempts affected by proctoring</CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartColumnBig className="h-5 w-5 text-primary" />
                Result Timeline
              </CardTitle>
              <CardDescription>Each completed attempt, newest first.</CardDescription>
            </CardHeader>
            <CardContent>
              {completedAttempts.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center">
                  <Badge variant="secondary" className="mb-4">
                    <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                    No results yet
                  </Badge>
                  <h2 className="text-lg font-medium">Your dashboard will appear here after your first submission.</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start a quiz from the main dashboard and come back here to review the outcome.
                  </p>
                  <Button className="mt-6" onClick={() => setLocation("/")}>
                    Explore quizzes
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedAttempts.map((attempt) => {
                    const isFlagged = attempt.status === "flagged";
                    return (
                      <div key={attempt.id} className="rounded-xl border bg-background/80 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-medium">{attempt.quiz_title}</h3>
                              <Badge variant={isFlagged ? "destructive" : "secondary"}>
                                {isFlagged ? (
                                  <>
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Flagged
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Completed
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <BadgePercent className="h-4 w-4" />
                                {attempt.score !== undefined && attempt.score !== null ? `${attempt.score.toFixed(1)}%` : "No score"}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-4 w-4" />
                                {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : new Date(attempt.started_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => setLocation(`/result/${attempt.id}`)}>
                              View result
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Latest result</CardTitle>
                <CardDescription>The most recent submitted attempt.</CardDescription>
              </CardHeader>
              <CardContent>
                {latestAttempt ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{latestAttempt.quiz_title}</div>
                      <div className="mt-1 text-4xl font-mono font-bold text-primary">
                        {latestAttempt.score !== undefined && latestAttempt.score !== null ? `${latestAttempt.score.toFixed(1)}%` : "-"}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                      {latestAttempt.status === "flagged"
                        ? "This result was flagged by proctoring."
                        : "This result was successfully recorded and is ready to review."}
                    </div>
                    <Button className="w-full" onClick={() => setLocation(`/result/${latestAttempt.id}`)}>
                      Open latest result
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Once you complete a quiz, the most recent result will appear here.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Move between your student pages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href="/">
                    Quiz dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/")}>
                  Browse available quizzes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
