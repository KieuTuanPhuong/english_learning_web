"use client";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { PronunciationDrill } from "@/lib/types";

export function DrillCard({
  drill,
  bestScore,
  canManage,
  onEdit,
  onDelete,
}: {
  drill: PronunciationDrill;
  bestScore: number | null;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Badge kind={drill.drill_type === "minimal_pair" ? undefined : drill.drill_type}>
          {drill.drill_type.replace("_", " ")}
        </Badge>
        {canManage && (
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Edit drill"
              onClick={onEdit}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label="Delete drill"
              onClick={onDelete}
              className="text-zinc-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <Link href={`/pronunciation/${drill.id}`} className="block">
        <p className="text-base font-semibold text-zinc-800">{drill.target_text}</p>
        {drill.contrast_text && (
          <p className="text-xs text-zinc-500">vs {drill.contrast_text}</p>
        )}
        {drill.phoneme_hint && (
          <p className="mt-0.5 font-mono text-xs text-zinc-400">{drill.phoneme_hint}</p>
        )}
      </Link>
      {bestScore != null && (
        <p className="text-xs font-medium text-teal-600">
          Best: {Math.round(bestScore)}/100
        </p>
      )}
    </Card>
  );
}
