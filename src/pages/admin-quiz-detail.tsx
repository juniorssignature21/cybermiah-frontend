import { useQuiz, useQuizQuestions, useBulkCreateQuestions } from "@/lib/hooks";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Upload } from "lucide-react";

export default function AdminQuizDetail() {
  const [, params] = useRoute("/admin/quizzes/:id");
  const id = params?.id;
  
  const { data: quiz, isLoading: loadingQuiz } = useQuiz(id!);
  const { data: questions, isLoading: loadingQ, refetch } = useQuizQuestions(id!);
  const bulkCreate = useBulkCreateQuestions();

  const [rawJson, setRawJson] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const handleBulkUpload = () => {
    try {
      const parsed = JSON.parse(rawJson);
      const qArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      
      if (qArray.length === 0) {
        throw new Error("No questions found in JSON.");
      }

      bulkCreate.mutate({ quizId: id!, questions: qArray }, {
        onSuccess: () => {
          setRawJson("");
          setShowUpload(false);
          setErrorMsg("");
        },
        onError: (e) => {
          setErrorMsg(e.message);
        }
      });
    } catch (e: any) {
      setErrorMsg("Invalid JSON: " + e.message);
    }
  };

  if (loadingQuiz || loadingQ) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/quizzes" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">{quiz?.title}</h1>
          <p className="text-muted-foreground">{questions?.length || 0} questions configured</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload Questions
        </Button>
      </div>

      {showUpload && (
        <div className="bg-card border p-6 rounded-lg mb-8 shadow-sm">
          <h2 className="text-lg font-medium mb-2">Paste Questions JSON</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {'Format: [{ "question_text": "...", "difficulty": "E", "options": {"A":"1","B":"2"}, "correct_answer": "A", "order_index": 0 }]'}
          </p>
          
          {errorMsg && (
            <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <textarea 
            className="w-full border rounded p-3 font-mono text-sm mb-4 h-48 bg-background"
            value={rawJson}
            onChange={e => setRawJson(e.target.value)}
            placeholder="Paste JSON array here..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button 
              onClick={handleBulkUpload} 
              disabled={bulkCreate.isPending || !rawJson.trim()}
            >
              {bulkCreate.isPending ? 'Importing...' : 'Import JSON'}
            </Button>
          </div>
        </div>
      )}

      {questions && questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-card border p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-lg">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span> 
                  {q.question_text}
                </h3>
                <span className="text-xs bg-muted px-2 py-1 rounded font-medium">Diff: {q.difficulty}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(q.options).map(([key, val]) => (
                  <div key={key} className={`p-2 border rounded ${q.correct_answer === key ? 'border-primary bg-primary/5 text-primary font-medium' : 'bg-background'}`}>
                    <span className="opacity-50 mr-2">{key}.</span>{val}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed rounded-lg text-muted-foreground">
          No questions in this quiz yet. Use Bulk Upload to add some.
        </div>
      )}
    </div>
  );
}
