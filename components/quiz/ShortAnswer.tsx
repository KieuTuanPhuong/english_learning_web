import { TextArea } from "@/components/ui";

interface ShortAnswerProps {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function ShortAnswer({ value, onChange, disabled }: ShortAnswerProps) {
  return (
    <div className="mt-4">
      <TextArea
        placeholder="Type your answer here..."
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
      />
    </div>
  );
}
