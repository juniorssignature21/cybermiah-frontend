import { useEffect, useState, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useAttempt, useSubmitAnswer, useSubmitAttempt, useProctoringEvent } from "@/lib/hooks";
import { recordAttempt } from "@/lib/attempt-store";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Send, ShieldAlert, Maximize } from "lucide-react";

const MAX_FULLSCREEN_STRIKES = 3;

export default function ExamRoom() {
  const [, params] = useRoute("/attempt/:id");
  const attemptId = params?.id;
  const [, setLocation] = useLocation();
  
  const { data: attempt, isLoading, isError, error, refetch } = useAttempt(attemptId!);
  const submitAnswer = useSubmitAnswer();
  const submitAttempt = useSubmitAttempt();
  const proctoringEvent = useProctoringEvent();

  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [fullscreenStrikes, setFullscreenStrikes] = useState(0);
  const strikesRef = useRef(0);

  // Auto-submit handle
  const isEnded = attempt?.status === 'submitted' || attempt?.status === 'flagged';
  
  useEffect(() => {
    if (isEnded) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setLocation(`/result/${attemptId}`);
    }
  }, [isEnded, attemptId, setLocation]);

  // Sync timer
  useEffect(() => {
    if (attempt && attempt.remaining_seconds !== undefined && timeLeft === null) {
      setTimeLeft(attempt.remaining_seconds);
    }
  }, [attempt]);

  // Record this attempt against its quiz so the dashboard can show its
  // result later, even if the student lands here directly (refresh, deep
  // link) rather than via the dashboard's "Start Attempt" button.
  useEffect(() => {
    if (attempt) {
      recordAttempt(attempt.quiz_id, attempt.id);
    }
  }, [attempt]);

  // Re-sync fullscreen state whenever the attempt loads, in case the
  // student was already out of fullscreen before the listener below was
  // attached (e.g. denied the initial fullscreen prompt).
  useEffect(() => {
    if (attempt) {
      setIsFullscreen(!!document.fullscreenElement);
    }
  }, [attempt]);

  // Tick timer locally
  useEffect(() => {
    if (timeLeft === null || isEnded) return;
    
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, isEnded]);

  // Enter Fullscreen on mount if not in it
  useEffect(() => {
    if (!attempt || isEnded) return;
    const enterFullscreen = async () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {
          // Interaction required, can't auto-enter. We'll show a button if needed.
        }
      }
    };
    enterFullscreen();
  }, [attempt, isEnded]);

  // Proctoring events
  useEffect(() => {
    if (!attempt || isEnded) return;

    const logEvent = (type: string) => {
      proctoringEvent.mutate({ attemptId: attempt.id, eventType: type }, {
        onSuccess: (data: any) => {
          if (data.attempt_status === 'flagged' || data.auto_submitted) {
            refetch(); // Pull the flagged state to redirect
          }
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) logEvent("tab_blur");
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      if (!inFullscreen) {
        const nextStrikes = strikesRef.current + 1;
        strikesRef.current = nextStrikes;
        setFullscreenStrikes(nextStrikes);
        logEvent("fullscreen_exit");
        // The server is the source of truth for the 3-strike auto-flag (see
        // logEvent's onSuccess above), but we also force a submit locally as
        // a guarantee in case the server response is delayed or the
        // threshold differs, per the "3rd strike submits immediately" rule.
        if (nextStrikes >= MAX_FULLSCREEN_STRIKES) {
          handleFinalSubmit();
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); logEvent("copy_attempt"); };
    const handleCut = (e: ClipboardEvent) => { e.preventDefault(); logEvent("copy_attempt"); };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); logEvent("copy_attempt"); };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        logEvent("copy_attempt");
      }
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))) {
        logEvent("devtools_open");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [attempt, isEnded, proctoringEvent, refetch]);

  // Debounced Save
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  const handleAnswerSelect = (questionId: string, answerKey: string) => {
    setLocalAnswers(prev => ({ ...prev, [questionId]: answerKey }));
    setSavingStatus(prev => ({ ...prev, [questionId]: 'saving' }));

    if (timersRef.current[questionId]) {
      clearTimeout(timersRef.current[questionId]);
    }

    timersRef.current[questionId] = setTimeout(() => {
      submitAnswer.mutate({ attemptId: attempt!.id, questionId, answer: answerKey }, {
        onSuccess: () => {
          setSavingStatus(prev => ({ ...prev, [questionId]: 'saved' }));
          setTimeout(() => {
            setSavingStatus(prev => {
              const next = { ...prev };
              delete next[questionId];
              return next;
            });
          }, 2000);
        },
        onError: () => {
          setSavingStatus(prev => ({ ...prev, [questionId]: 'error' }));
        }
      });
    }, 1500);
  };

  const hasSubmittedRef = useRef(false);

  const handleFinalSubmit = () => {
    // Guard against duplicate submits: repeated fullscreen-exit events at the
    // 3rd strike, an in-flight mutation, or the exam already having ended
    // server-side should never trigger a second submit call.
    if (hasSubmittedRef.current || submitAttempt.isPending || isEnded) return;
    hasSubmittedRef.current = true;
    submitAttempt.mutate(attempt!.id, {
      onSuccess: () => {
        setLocation(`/result/${attempt!.id}`);
      },
      onError: () => {
        hasSubmittedRef.current = false;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-8 bg-muted w-1/3 rounded"></div>
          <div className="space-y-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-medium mb-2">Error loading exam</h1>
          <p className="text-muted-foreground mb-4">{error?.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const isUrgent = timeLeft !== null && timeLeft <= 120;
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const strikesRemaining = Math.max(0, MAX_FULLSCREEN_STRIKES - fullscreenStrikes);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Blocking overlay: shown whenever the student is not in fullscreen.
          It covers the entire screen so the exam questions and navigation
          are inaccessible until the student returns to fullscreen. */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border shadow-lg p-8 rounded-lg text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif mb-2 text-foreground">Fullscreen Required</h1>
            <p className="text-muted-foreground mb-2">
              Leaving fullscreen during the exam is not allowed and has been logged.
            </p>
            <p className="text-sm font-medium text-destructive mb-6">
              Warning {Math.min(fullscreenStrikes, MAX_FULLSCREEN_STRIKES)} of {MAX_FULLSCREEN_STRIKES}
              {strikesRemaining > 0
                ? ` — ${strikesRemaining} more will submit your exam automatically.`
                : ' — your exam is being submitted.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
                disabled={fullscreenStrikes >= MAX_FULLSCREEN_STRIKES}
              >
                <Maximize className="w-4 h-4 mr-2" />
                Return to Fullscreen
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleFinalSubmit}
                disabled={submitAttempt.isPending}
              >
                {submitAttempt.isPending ? 'Submitting...' : 'Submit Exam Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Info Panel */}
      <div className="w-full md:w-64 bg-sidebar border-b md:border-b-0 md:border-r flex flex-col sticky top-0 md:h-screen md:sticky">
        <div className="p-6">
          <h2 className="font-serif text-lg text-sidebar-foreground tracking-tight mb-6">Quiz Instrument</h2>
          
          <div className={`p-4 rounded-lg flex items-center gap-3 transition-colors ${
            isUrgent ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-background border'
          }`}>
            <Clock className="w-5 h-5" />
            <div className="font-mono text-2xl tracking-tight">
              {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
            </div>
          </div>
          {isUrgent && (
            <p className="text-xs mt-2 text-accent-foreground/80 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" /> Time is running out
            </p>
          )}
          {fullscreenStrikes > 0 && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{fullscreenStrikes} of {MAX_FULLSCREEN_STRIKES} fullscreen warnings</span>
            </div>
          )}
        </div>

        <div className="mt-auto p-6 hidden md:block">
          <Button 
            className="w-full" 
            size="lg" 
            variant="secondary"
            onClick={handleFinalSubmit}
            disabled={submitAttempt.isPending}
          >
            {submitAttempt.isPending ? 'Submitting...' : 'Finish Exam'}
          </Button>
        </div>
      </div>

      {/* Main Questions Panel */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-32 md:pb-12">
        <div className="max-w-3xl mx-auto space-y-12">
          {attempt.questions.map((q, index) => (
            <div key={q.id} className="relative group">
              <div className="flex gap-4">
                <div className="shrink-0 pt-1">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-serif text-sm">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg leading-relaxed text-foreground mb-6 font-medium">
                    {q.question_text}
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(q.options).map(([key, text]) => {
                      const isSelected = localAnswers[q.id] === key;
                      return (
                        <label 
                          key={key} 
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-primary text-primary' : 'border-input'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                          </div>
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(q.id, key)}
                          />
                          <span className="text-foreground leading-snug">{text}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="h-6 mt-3">
                    {savingStatus[q.id] === 'saving' && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" /> Saving...
                      </span>
                    )}
                    {savingStatus[q.id] === 'saved' && (
                      <span className="text-xs text-primary flex items-center gap-1.5 opacity-70">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                    {savingStatus[q.id] === 'error' && (
                      <span className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Failed to save
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Submit Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleFinalSubmit}
          disabled={submitAttempt.isPending}
        >
          <Send className="w-4 h-4 mr-2" />
          {submitAttempt.isPending ? 'Submitting...' : 'Finish Exam'}
        </Button>
      </div>
    </div>
  );
}
