"use client";
/* eslint-disable react-hooks/refs -- Floating UI's `refs` are stable setter
   callbacks (setFloating/setPositionReference), not React refs; the compiler's
   ref heuristic flags them as a false positive. */
// Popover anchored to a selection's client rect via Floating UI's virtual
// element (doc 03 §3). Fixed strategy so the cached viewport rect stays correct
// without recomputing offsets; flip/shift handle viewport edges.
import { useEffect, type ReactNode } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";

export function SelectionPopover({
  rect,
  open,
  onOpenChange,
  children,
}: {
  rect: DOMRect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    strategy: "fixed",
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    if (rect) {
      refs.setPositionReference({ getBoundingClientRect: () => rect });
    }
  }, [rect, refs]);

  if (!open || !rect) return null;
  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-50 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl"
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
