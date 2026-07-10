import { useRoute, Link } from "wouter";
import { useAttempt } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function ExamResult() {
  const [, params] = useRoute("/result/:id");
  const attemptId = params?.id;
  const { data: attempt, isLoading, isError } = useAttempt(attemptId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="w-full max-w-md bg-card border p-8 rounded-lg animate-pulse text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-6"></div>
          <div className="h-6 w-1/2 bg-muted mx-auto mb-4"></div>
          <div className="h-10 w-24 bg-muted mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <div className="text-center bg-card border p-8 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-medium mb-4">Could not load result</h1>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFlagged = attempt.status === 'flagged';

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md bg-card border shadow-sm p-8 rounded-lg text-center">
        
        {isFlagged ? (
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="w-8 h-8" />
          </div>
        ) : attempt.auto_submitted ? (
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent">
            <Clock className="w-8 h-8" />
          </div>
        ) : (
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
            <CheckCircle className="w-8 h-8" />
          </div>
        )}

        <h1 className="text-3xl font-serif mb-2 text-foreground">
          {isFlagged ? 'Attempt Flagged' : 'Exam Submitted'}
        </h1>
        
        <p className="text-muted-foreground mb-8">
          {isFlagged 
            ? 'Your attempt was flagged and ended due to proctoring violations.' 
            : attempt.auto_submitted 
              ? 'Time expired. Your answers were automatically submitted.'
              : 'Your answers have been successfully recorded.'}
        </p>

        {attempt.score !== undefined && attempt.score !== null && (
          <div className="bg-background border rounded-lg p-6 mb-8">
            <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Final Score</div>
            <div className="text-5xl font-mono text-primary font-bold">
              {attempt.score.toFixed(1)}<span className="text-2xl text-muted-foreground ml-1">%</span>
            </div>
          </div>
        )}

        <Link href="/">
          <Button className="w-full">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
