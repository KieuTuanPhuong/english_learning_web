import { QuestionOption } from "@/lib/exercises";
import { cn } from "@/lib/cn";

interface McqOptionsProps {
  options: QuestionOption[];
  value?: number;
  onChange: (optionId: number) => void;
  disabled?: boolean;
}

export function McqOptions({ options, value, onChange, disabled }: McqOptionsProps) {
  return (
    <div className="space-y-2 mt-4" role="radiogroup">
      {options.map((opt, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        const isSelected = value === opt.id;
        
        return (
          <label
            key={opt.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition",
              isSelected
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-zinc-200 bg-white hover:border-zinc-300",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <input
              type="radio"
              name={`mcq-${options[0].id}`}
              value={opt.id}
              checked={isSelected}
              onChange={() => onChange(opt.id)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-zinc-300 bg-zinc-50 text-zinc-500"
              )}
            >
              {letter}
            </div>
            <span className="text-sm font-medium text-zinc-800">{opt.text}</span>
          </label>
        );
      })}
    </div>
  );
}
