import { components } from "./types/api";

export type Question = components["schemas"]["Question"];
export type QuestionOption = components["schemas"]["QuestionOption"];

export type QuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer";

export interface AnswerState {
  option_id?: number;
  text?: string;
}

export interface AnswersPayload {
  version: number;
  responses: {
    question_id: number;
    type: QuestionType;
    option_id?: number;
    text?: string;
  }[];
}

export function resolveQuestionType(q: Question): QuestionType {
  const options = q.options || [];
  if (options.length === 2) {
    const texts = options.map((o) => o.text.trim().toLowerCase());
    if (texts.includes("true") && texts.includes("false")) {
      return "true_false";
    }
  }
  if (options.length >= 2) {
    return "mcq";
  }
  if (q.text.includes("[[") && q.text.includes("]]")) {
    return "fill_blank";
  }
  // Fallback for options == 0 and no blanks
  return "short_answer";
}

export function parseFillBlank(text: string): { segments: string[]; answers: string[] } {
  const regex = /\[\[(.*?)\]\]/g;
  const segments: string[] = [];
  const answers: string[] = [];
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    segments.push(text.slice(lastIndex, match.index));
    answers.push(match[1]);
    lastIndex = regex.lastIndex;
  }
  segments.push(text.slice(lastIndex));

  return { segments, answers };
}

export function buildAnswers(questions: Question[], state: Record<number, AnswerState>): AnswersPayload {
  const responses = questions.map((q) => {
    const type = resolveQuestionType(q);
    const ans = state[q.id] || {};
    
    return {
      question_id: q.id,
      type,
      option_id: ans.option_id,
      text: ans.text,
    };
  });

  return {
    version: 1,
    responses,
  };
}

export function isComplete(questions: Question[], state: Record<number, AnswerState>): boolean {
  if (!questions || questions.length === 0) return true; // No questions means we can submit
  
  return questions.every((q) => {
    const type = resolveQuestionType(q);
    const ans = state[q.id];
    if (!ans) return false;

    if (type === "mcq" || type === "true_false") {
      return ans.option_id !== undefined;
    }
    if (type === "fill_blank") {
      try {
        const arr = JSON.parse(ans.text || "[]");
        const { answers } = parseFillBlank(q.text);
        if (!Array.isArray(arr) || arr.length !== answers.length) return false;
        return arr.every((a: string) => a.trim() !== "");
      } catch {
        return false;
      }
    }
    if (type === "short_answer") {
      return ans.text !== undefined && ans.text.trim() !== "";
    }
    return false;
  });
}
