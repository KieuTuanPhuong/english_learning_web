import { parseFillBlank } from "@/lib/exercises";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface FillBlankInputProps {
  text: string;
  value?: string; // JSON array of strings
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function FillBlankInput({ text, value, onChange, disabled }: FillBlankInputProps) {
  const { segments, answers } = parseFillBlank(text);
  
  const [blanks, setBlanks] = useState<string[]>(() => {
    try {
      const arr = JSON.parse(value || "[]");
      if (Array.isArray(arr) && arr.length === answers.length) {
        return arr;
      }
    } catch {
      // ignore
    }
    return new Array(answers.length).fill("");
  });

  useEffect(() => {
    try {
      const arr = JSON.parse(value || "[]");
      if (Array.isArray(arr) && arr.length === answers.length) {
        setBlanks(arr);
      }
    } catch {
      // ignore
    }
  }, [value, answers.length]);

  const handleChange = (index: number, val: string) => {
    const newBlanks = [...blanks];
    newBlanks[index] = val;
    setBlanks(newBlanks);
    onChange(JSON.stringify(newBlanks));
  };

  return (
    <div className="mt-4 text-sm leading-8 text-zinc-800">
      {segments.map((segment, index) => (
        <span key={index}>
          {segment}
          {index < answers.length && (
            <input
              type="text"
              value={blanks[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={disabled}
              placeholder="___"
              className={cn(
                "mx-1 inline-block h-8 w-32 rounded-md border border-zinc-300 bg-white px-2 text-center text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30",
                disabled && "opacity-60 cursor-not-allowed bg-zinc-50"
              )}
            />
          )}
        </span>
      ))}
    </div>
  );
}
