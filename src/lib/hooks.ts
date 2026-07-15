import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from './api';
import { getAllAttemptIds } from './attempt-store';

// Types
export interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
  is_active: boolean;
  max_attempts: number;
  shuffle_questions: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  difficulty: 'E' | 'M' | 'H';
  options: Record<string, string>;
  correct_answer?: string; // only for admin
  order_index: number;
}

export interface Attempt {
  id: string;
  quiz_id: string;
  status: 'in_progress' | 'submitted' | 'flagged';
  started_at: string;
  remaining_seconds: number;
  questions: Question[];
  score?: number;
  submitted_at?: string;
  auto_submitted?: boolean;
}

export interface StudentAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  status: 'in_progress' | 'submitted' | 'flagged';
  started_at: string;
  submitted_at?: string;
  auto_submitted?: boolean;
  score?: number;
}

// Hooks

export function useQuizzes() {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: () => fetchApi<Quiz[]>('/quizzes/')
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: ['quizzes', id],
    queryFn: () => fetchApi<Quiz>(`/quizzes/${id}`),
    enabled: !!id
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Quiz>) => fetchApi<Quiz>('/quizzes/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    }
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Quiz> }) => fetchApi<Quiz>(`/quizzes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes', id] });
    }
  });
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: (quizId: string) => fetchApi<Attempt>('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quizId })
    })
  });
}

export function useAttempt(id: string) {
  return useQuery({
    queryKey: ['attempts', id],
    queryFn: () => fetchApi<Attempt>(`/attempts/${id}`),
    enabled: !!id,
    refetchOnWindowFocus: false, // Important: don't refetch on focus during exam
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({ attemptId, questionId, answer }: { attemptId: string, questionId: string, answer: string }) => 
      fetchApi(`/attempts/${attemptId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, answer })
      })
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => fetchApi<Attempt>(`/attempts/${attemptId}/submit`, {
      method: 'POST'
    }),
    onSuccess: (data, attemptId) => {
      queryClient.setQueryData(['attempts', attemptId], data);
    }
  });
}

// Fetches the real attempt record (status/score) for every quiz the student
// has started an attempt on in this session, keyed by quiz id. Used to show
// results inline on the student dashboard. There is no "list my attempts"
// endpoint, so this relies on attempt ids we recorded locally when the
// attempt was started (see attempt-store.ts) and fetches each one for real.
export function useMyAttemptsByQuiz() {
  const map = getAllAttemptIds();
  const entries = Object.entries(map);

  const results = useQueries({
    queries: entries.map(([quizId, attemptId]) => ({
      queryKey: ['attempts', attemptId],
      queryFn: () => fetchApi<Attempt>(`/attempts/${attemptId}`),
      staleTime: 10_000,
    })),
  });

  const byQuizId: Record<string, { data?: Attempt; isLoading: boolean; isError: boolean }> = {};
  entries.forEach(([quizId], index) => {
    const r = results[index];
    byQuizId[quizId] = { data: r.data as Attempt | undefined, isLoading: r.isLoading, isError: r.isError };
  });

  return byQuizId;
}

export function useMyAttempts() {
  return useQuery({
    queryKey: ['attempts', 'mine'],
    queryFn: () => fetchApi<StudentAttempt[]>('/attempts/mine'),
  });
}

export function useProctoringEvent() {
  return useMutation({
    mutationFn: ({ attemptId, eventType }: { attemptId: string, eventType: string }) => 
      fetchApi(`/attempts/${attemptId}/proctoring-events/`, {
        method: 'POST',
        body: JSON.stringify({ event_type: eventType })
      })
  });
}

// Admin Hooks
export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: ['quizzes', quizId, 'questions'],
    queryFn: () => fetchApi<Question[]>(`/quizzes/${quizId}/questions/`),
    enabled: !!quizId
  });
}

export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questions }: { quizId: string, questions: any[] }) => 
      fetchApi(`/quizzes/${quizId}/questions/bulk`, {
        method: 'POST',
        body: JSON.stringify({ questions })
      }),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', quizId, 'questions'] });
    }
  });
}

export function useAdminLive(quizId?: string) {
  return useQuery({
    queryKey: ['admin', 'live', quizId],
    queryFn: () => fetchApi<{ in_progress: number; completed: number }>(`/admin/live${quizId ? `?quiz_id=${quizId}` : ''}`),
    refetchInterval: 5000
  });
}

export function useAdminResults(quizId?: string, cohort?: string) {
  return useQuery({
    queryKey: ['admin', 'results', quizId, cohort],
    queryFn: () => {
      const params = new URLSearchParams();
      if (quizId && quizId !== 'all') params.append('quiz_id', quizId);
      if (cohort && cohort !== 'all') params.append('cohort', cohort);
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchApi<any[]>(`/admin/results${query}`);
    }
  });
}

export function useAdminAttemptTimeline(attemptId: string) {
  return useQuery({
    queryKey: ['admin', 'attempts', attemptId, 'timeline'],
    queryFn: () => fetchApi<any[]>(`/admin/attempts/${attemptId}/timeline`),
    enabled: !!attemptId
  });
}
