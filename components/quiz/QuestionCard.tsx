import { Card } from "@/components/ui";
import { Question, AnswerState, resolveQuestionType } from "@/lib/exercises";
import { McqOptions } from "./McqOptions";
import { TrueFalse } from "./TrueFalse";
import { ShortAnswer } from "./ShortAnswer";
import { FillBlankInput } from "./FillBlankInput";

interface QuestionCardProps {
  number: number;
  question: Question;
  answer?: AnswerState;
  onChange: (ans: AnswerState) => void;
  disabled?: boolean;
}

export function QuestionCard({ number, question, answer, onChange, disabled }: QuestionCardProps) {
  const type = resolveQuestionType(question);

  return (
    <Card className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-500">
        {number}
      </div>
      <div className="flex-1 pt-1">
        {type !== "fill_blank" && (
          <p className="text-sm font-medium text-zinc-800 whitespace-pre-wrap">{question.text}</p>
        )}

        {type === "mcq" && (
          <McqOptions
            options={question.options}
            value={answer?.option_id}
            onChange={(optId) => onChange({ option_id: optId })}
            disabled={disabled}
          />
        )}
        
        {type === "true_false" && (
          <TrueFalse
            options={question.options}
            value={answer?.option_id}
            onChange={(optId) => onChange({ option_id: optId })}
            disabled={disabled}
          />
        )}

        {type === "fill_blank" && (
          <FillBlankInput
            text={question.text}
            value={answer?.text}
            onChange={(val) => onChange({ text: val })}
            disabled={disabled}
          />
        )}

        {type === "short_answer" && (
          <ShortAnswer
            value={answer?.text}
            onChange={(val) => onChange({ text: val })}
            disabled={disabled}
          />
        )}
      </div>
    </Card>
  );
}
