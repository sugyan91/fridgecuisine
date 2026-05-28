import { useCallback, useEffect, useRef, useState } from "react";
import { TESTIMONIALS, type Testimonial, type TestimonialAccent } from "./testimonials-data";

const ACCENT_VAR: Record<TestimonialAccent, string> = {
  gold: "var(--accent-gold)",
  paprika: "var(--paprika)",
  sage: "var(--sage)",
};

export function Testimonials() {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
    setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = railRef.current;
    if (!el) return;
    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateScrollState]);

  const scrollByCards = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-card]");
    const cardW = first ? first.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * cardW, behavior: "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCards(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCards(-1);
    }
  };

  // Pointer drag-to-scroll (desktop mouse users)
  const dragRef = useRef<{ active: boolean; startX: number; startLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    startLeft: 0,
    moved: false,
  });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = railRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const el = railRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 4) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.startLeft - dx;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const el = railRef.current;
    if (el) el.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative">
      {/* Top-right arrow controls (desktop/tablet) */}
      <div className="hidden md:flex absolute -top-16 right-0 gap-2 z-10">
        <ArrowButton
          dir="prev"
          disabled={atStart}
          onClick={() => scrollByCards(-1)}
        />
        <ArrowButton
          dir="next"
          disabled={atEnd}
          onClick={() => scrollByCards(1)}
        />
      </div>

      <div
        ref={railRef}
        tabIndex={0}
        role="region"
        aria-label="Testimonials"
        onScroll={updateScrollState}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="-mx-4 md:-mx-8 px-4 md:px-8 overflow-x-auto snap-x snap-mandatory cursor-grab active:cursor-grabbing focus:outline-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none] select-none"
      >
        <div className="flex items-stretch gap-4 md:gap-5 pb-2">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name + t.role}
              data-card
              className="snap-start shrink-0 w-[82%] sm:w-[60%] md:w-[46%] lg:w-[34%] xl:w-[30%]"
            >
              <Card t={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Progress + caption */}
      <div className="mt-6 md:mt-8 flex items-center gap-4">
        <div className="flex-1 h-[3px] bg-border/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/80 rounded-full transition-[width] duration-150"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {TESTIMONIALS.length} stories
        </p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Drag, swipe, or use the arrows to read more.
      </p>
    </div>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous testimonials" : "Next testimonials"}
      className="size-11 rounded-full border border-border bg-card grid place-items-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`size-5 ${dir === "prev" ? "" : "rotate-180"}`}
        aria-hidden
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>
  );
}

function Card({ t }: { t: Testimonial }) {
  const accent = ACCENT_VAR[t.accent];
  return (
    <figure className="group h-full bg-card border border-border rounded-3xl p-6 md:p-8 shadow-[var(--shadow-soft)] flex flex-col transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgb(0_0_0_/_0.22)]">
      <span
        aria-hidden
        className="font-display text-6xl md:text-7xl leading-[0.7] mb-3"
        style={{ color: accent }}
      >
        “
      </span>
      <blockquote className="text-[15px] md:text-lg leading-relaxed text-foreground/90 flex-1">
        {t.quote}
      </blockquote>
      <figcaption className="mt-6 pt-4 border-t border-border flex items-center gap-3">
        <span
          aria-hidden
          className="size-11 rounded-full grid place-items-center font-display font-bold text-sm text-foreground shrink-0"
          style={{
            backgroundColor: `color-mix(in oklab, ${accent} 28%, transparent)`,
          }}
        >
          {t.initials}
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-sm tracking-tight truncate">
            {t.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t.role}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}