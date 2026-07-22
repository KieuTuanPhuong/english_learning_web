import { Card } from "@/components/ui";
import { Question, AnswersPayload, resolveQuestionType, parseFillBlank } from "@/lib/exercises";
import { Check, X } from "lucide-react";

interface AnswersReviewProps {
  questions: Question[];
  answersPayload: unknown;
}

export function AnswersReview({ questions, answersPayload }: AnswersReviewProps) {
  if (!answersPayload || typeof answersPayload !== "object" || !("responses" in answersPayload)) {
    return <p className="text-sm text-zinc-400">No quiz answers provided.</p>;
  }

  const payload = answersPayload as AnswersPayload;

  return (
    <div className="space-y-4 mt-2">
      {questions.map((q, idx) => {
        const resp = payload.responses.find((r) => r.question_id === q.id);
        const type = resolveQuestionType(q);
        
        let answerContent = <span className="italic text-zinc-400">No answer provided</span>;
        let isCorrect: boolean | undefined = undefined;

        if (resp) {
          if (type === "mcq" || type === "true_false") {
            const chosenOption = q.options?.find((o) => o.id === resp.option_id);
            if (chosenOption) {
              answerContent = <span>{chosenOption.text}</span>;
              isCorrect = chosenOption.is_correct; // undefined if backend didn't send it or no right answer
            }
          } else if (type === "fill_blank") {
            try {
              const blanks = JSON.parse(resp.text || "[]");
              if (Array.isArray(blanks)) {
                answerContent = <span>{blanks.join(", ")}</span>;
              } else {
                answerContent = <span>{resp.text}</span>;
              }
            } catch {
              answerContent = <span>{resp.text}</span>;
            }
          } else if (type === "short_answer") {
            answerContent = <span className="whitespace-pre-wrap">{resp.text}</span>;
          }
        }

        return (
          <Card key={q.id} className="space-y-2 py-3 px-4 shadow-sm border-zinc-200">
            <div className="flex justify-between items-start">
               <div className="flex gap-3 w-full">
                 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 mt-0.5">
                   {idx + 1}
                 </div>
                 <div className="flex-1">
                   {type !== "fill_blank" && (
                     <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap">{q.text}</p>
                   )}
                   {type === "fill_blank" && (
                     <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap">{parseFillBlank(q.text).segments.join("___")}</p>
                   )}
                   <div className="mt-2 text-sm text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-100 flex items-center gap-2">
                     <span className="font-semibold">Answer:</span> {answerContent}
                     {isCorrect === true && <Check size={16} className="text-emerald-600" />}
                     {isCorrect === false && <X size={16} className="text-red-600" />}
                   </div>
                 </div>
               </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
