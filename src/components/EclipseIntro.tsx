import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EclipseIntro({ onComplete }: { onComplete: () => void }) {
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skip.current?.focus({ preventScroll: true });
    const pointerSkip = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".eclipse-skip")) onComplete();
    };
    window.addEventListener("pointerup", pointerSkip, true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onComplete, reducedMotion ? 250 : 3200);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onComplete(); };
    window.addEventListener("keydown", escape);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
      window.removeEventListener("pointerup", pointerSkip, true);
    };
  }, [onComplete]);

  return <div className="eclipse-intro" role="dialog" aria-modal="true" aria-label="SYNEXIS opening">
    <div className="eclipse-composition" aria-hidden="true">
      <div className="eclipse-corona" />
      <div className="eclipse-sun" />
      <div className="eclipse-moon" />
      <div className="eclipse-diamond" />
    </div>
    <div className="eclipse-wordmark"><p className="font-display">SYNEXIS</p><span className="font-mono-ui">Lunar Landing Site Navigator</span></div>
    <Button ref={skip} type="button" variant="ghost" className="eclipse-skip" onClick={onComplete}>Skip intro <ArrowRight /></Button>
  </div>;
}