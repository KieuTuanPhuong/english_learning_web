"use client";
// Page-scoped UI state for text<->sidebar sync: which annotation is active, and
// element registries for scroll targeting in both directions. Deliberately NOT
// global (doc 03 §6): it is ephemeral per-view state.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface AnnotationContextValue {
  activeId: number | null;
  setActiveId: (id: number | null) => void;
  registerSegment: (id: number, el: HTMLElement | null) => void;
  registerCard: (id: number, el: HTMLElement | null) => void;
  scrollToSegment: (id: number) => void;
  scrollToCard: (id: number) => void;
}

const Ctx = createContext<AnnotationContextValue | null>(null);

function scrollInto(el: HTMLElement | undefined) {
  if (!el) return;
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
}

export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const segments = useRef(new Map<number, HTMLElement>());
  const cards = useRef(new Map<number, HTMLElement>());

  const registerSegment = useCallback((id: number, el: HTMLElement | null) => {
    if (el) segments.current.set(id, el);
    else segments.current.delete(id);
  }, []);
  const registerCard = useCallback((id: number, el: HTMLElement | null) => {
    if (el) cards.current.set(id, el);
    else cards.current.delete(id);
  }, []);
  const scrollToSegment = useCallback(
    (id: number) => scrollInto(segments.current.get(id)),
    [],
  );
  const scrollToCard = useCallback(
    (id: number) => scrollInto(cards.current.get(id)),
    [],
  );

  const value = useMemo(
    () => ({
      activeId,
      setActiveId,
      registerSegment,
      registerCard,
      scrollToSegment,
      scrollToCard,
    }),
    [activeId, registerSegment, registerCard, scrollToSegment, scrollToCard],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAnnotationUI() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useAnnotationUI must be used within <AnnotationProvider>");
  return ctx;
}
