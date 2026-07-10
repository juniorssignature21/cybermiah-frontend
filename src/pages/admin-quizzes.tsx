import { useQuizzes, useCreateQuiz, useUpdateQuiz } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

export default function AdminQuizzes() {
  const { data: quizzes, isLoading, isError, error } = useQuizzes();
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();

  const [isCreating, setIsCreating] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: '', duration_minutes: 30, max_attempts: 1, shuffle_questions: true, is_active: false });

  const handleCreate = () => {
    if (!newQuiz.title) return;
    createQuiz.mutate(newQuiz, {
      onSuccess: () => {
        setIsCreating(false);
        setNewQuiz({ title: '', duration_minutes: 30, max_attempts: 1, shuffle_questions: true, is_active: false });
      }
    });
  };

  const toggleActive = (id: string, current: boolean) => {
    updateQuiz.mutate({ id, data: { is_active: !current } });
  };

  if (isLoading) return <div className="p-8">Loading quizzes...</div>;
  if (isError) return <div className="p-8 text-destructive">{error?.message}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif">Quizzes</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Create New Quiz'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-card border p-6 rounded-lg mb-8 shadow-sm">
          <h2 className="text-lg font-medium mb-4">New Quiz Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input 
                type="text" 
                value={newQuiz.title}
                onChange={e => setNewQuiz({...newQuiz, title: e.target.value})}
                className="w-full border px-3 py-2 rounded" 
                placeholder="e.g. Midterm Exam"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Duration (minutes)</label>
              <input 
                type="number" 
                value={newQuiz.duration_minutes}
                onChange={e => setNewQuiz({...newQuiz, duration_minutes: parseInt(e.target.value)})}
                className="w-full border px-3 py-2 rounded" 
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createQuiz.isPending || !newQuiz.title}>
            {createQuiz.isPending ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>
      )}

      {quizzes?.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded text-muted-foreground">
          No quizzes exist yet. Create one to get started.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-4 font-medium text-sm text-muted-foreground">Title</th>
                <th className="p-4 font-medium text-sm text-muted-foreground">Duration</th>
                <th className="p-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-sm text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes?.map(q => (
                <tr key={q.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{q.title}</td>
                  <td className="p-4 text-sm">{q.duration_minutes}m</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${q.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {q.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(q.id, q.is_active)}>
                      {q.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Link href={`/admin/quizzes/${q.id}`}>
                      <Button size="sm">Manage Questions</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
