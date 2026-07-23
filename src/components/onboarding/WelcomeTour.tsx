import { useEffect, useState } from "react";
import { ChefHat, Sparkles, Bookmark } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fc.welcomeTour.v1";

const SLIDES = [
  {
    icon: ChefHat,
    title: "Cook what's already in your fridge",
    body: "Type a few ingredients — even the odd leftovers — and we turn them into real recipes with steps, cook times, and swaps.",
  },
  {
    icon: Sparkles,
    title: "One tap, any cuisine or diet",
    body: "Pick a cuisine, a dietary need, or hit 'Surprise Me'. Your preferences stay saved so every recipe fits your kitchen.",
  },
  {
    icon: Bookmark,
    title: "Save, plan, and shop",
    body: "Save recipes to your cookbook, drop them into your weekly plan, and get a shopping list generated automatically.",
  },
];

export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) finish();
      }}
    >
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-turmeric/30 text-paprika border-2 border-border shadow-[3px_3px_0px_0px_var(--border)]">
            <Icon className="h-8 w-8" aria-hidden />
          </div>
          <DialogTitle className="font-display text-2xl text-paprika mb-2">
            {slide.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {slide.body}
          </DialogDescription>

          <div className="mt-6 flex items-center justify-center gap-1.5" aria-hidden>
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-paprika" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={finish}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          <Button
            type="button"
            variant="premium"
            size="sm"
            onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
          >
            {isLast ? "Start cooking" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}