import { useEffect, useRef, useState } from "react";

/** Trailing ink cursor: a solid dot at the pointer plus a soft ring that eases behind it. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };
    let raf = 0;
    let hovering = false;
    let down = false;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = e.target as HTMLElement | null;
      hovering = !!el?.closest("a, button, [role='button'], img");
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
        dotRef.current.style.opacity = "1";
      }
    };
    const onDown = () => (down = true);
    const onUp = () => (down = false);
    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };

    const tick = () => {
      ring.x += (target.x - ring.x) * 0.14;
      ring.y += (target.y - ring.y) * 0.14;
      const scale = down ? 0.7 : hovering ? 1.9 : 1;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    const styleEl = document.createElement("style");
    styleEl.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(styleEl);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      styleEl.remove();
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true">
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[100] h-9 w-9 rounded-full border border-foreground opacity-0 mix-blend-difference transition-opacity duration-300"
        style={{ borderColor: "#fff", borderWidth: 2 }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[100] h-1.5 w-1.5 rounded-full bg-white opacity-0 mix-blend-difference"
      />
    </div>
  );
}
