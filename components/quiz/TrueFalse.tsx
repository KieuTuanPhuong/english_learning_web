import { QuestionOption } from "@/lib/exercises";
import { cn } from "@/lib/cn";

interface TrueFalseProps {
  options: QuestionOption[];
  value?: number;
  onChange: (optionId: number) => void;
  disabled?: boolean;
}

export function TrueFalse({ options, value, onChange, disabled }: TrueFalseProps) {
  return (
    <div className="flex gap-4 mt-4" role="radiogroup">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        
        return (
          <label
            key={opt.id}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 transition text-center",
              isSelected
                ? "border-accent bg-accent/5 font-semibold text-accent ring-1 ring-accent"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <input
              type="radio"
              name={`tf-${options[0].id}`}
              value={opt.id}
              checked={isSelected}
              onChange={() => onChange(opt.id)}
              disabled={disabled}
              className="sr-only"
            />
            {opt.text}
          </label>
        );
      })}
    </div>
  );
}
