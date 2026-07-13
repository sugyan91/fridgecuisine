import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Coffee, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTipCheckout } from "@/lib/tips.functions";
import { supabase } from "@/integrations/supabase/client";

const TIERS = [300, 500, 1000, 2000];

export function TipChefDialog({
  open,
  onOpenChange,
  chefUsername,
  chefName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chefUsername: string;
  chefName: string;
}) {
  const isMobile = useIsMobile();
  const startTip = useServerFn(createTipCheckout);
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState<"pick" | "auth" | "checkout">("pick");
  const [authed, setAuthed] = useState<boolean | null>(null);

  const openChange = (v: boolean) => {
    if (!v) {
      setStage("pick");
      setMessage("");
      setCustom("");
      setAmount(500);
    }
    onOpenChange(v);
  };

  const effectiveCents = custom
    ? Math.round(Number(custom) * 100)
    : amount;

  const onNext = async () => {
    if (!effectiveCents || effectiveCents < 100) {
      toast.error("Minimum tip is $1");
      return;
    }
    if (effectiveCents > 20000) {
      toast.error("Maximum tip is $200");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setAuthed(false);
      setStage("auth");
      return;
    }
    setAuthed(true);
    setStage("checkout");
  };

  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/checkout/return?type=tip&chef=${encodeURIComponent(chefUsername)}&session_id={CHECKOUT_SESSION_ID}`;
    const res = await startTip({
      data: {
        chefUsername,
        amountCents: effectiveCents,
        message: message.trim() || undefined,
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (!res.clientSecret) throw new Error("Could not start checkout");
    return res.clientSecret;
  };

  const body = (
    <div className="p-4 space-y-4">
      {stage === "pick" && (
        <>
          <div className="flex items-center gap-2">
            <Coffee className="size-5 text-turmeric" />
            <p className="font-display text-lg uppercase">Tip {chefName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Show appreciation for their recipes. 90% goes directly to the chef.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setAmount(t);
                  setCustom("");
                }}
                className={`rounded-xl border-2 border-border py-2 font-black text-sm ${
                  !custom && amount === t ? "bg-foreground text-background" : "bg-card"
                }`}
              >
                ${(t / 100).toFixed(0)}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Or custom amount (USD)
            </label>
            <input
              type="number"
              min={1}
              max={200}
              inputMode="decimal"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="10"
              className="w-full mt-1 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              placeholder="Loved the paella recipe!"
              rows={2}
              className="w-full mt-1 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/280</p>
          </div>
          <Button onClick={onNext} className="w-full">
            Continue — ${(effectiveCents / 100).toFixed(2)}
          </Button>
        </>
      )}
      {stage === "auth" && (
        <div className="text-center py-6 space-y-3">
          <p className="font-display text-lg uppercase">Sign in to tip</p>
          <p className="text-sm text-muted-foreground">
            Create a free account to send a tip. It takes 30 seconds.
          </p>
          <Button asChild className="w-full">
            <a href={`/login?redirect=/chef/${chefUsername}`}>Sign in / Sign up</a>
          </Button>
        </div>
      )}
      {stage === "checkout" && (
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
      {stage === "pick" && authed === false && (
        <div className="text-xs text-muted-foreground text-center flex items-center gap-1 justify-center">
          <Loader2 className="size-3 animate-spin" /> checking session
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={openChange}>
        <DrawerContent className="h-[92vh] p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-display text-sm uppercase tracking-wide">Send a tip</p>
            <DrawerClose asChild>
              <button
                type="button"
                className="text-xs font-black uppercase tracking-wide text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border-2 border-border"
              >
                Close
              </button>
            </DrawerClose>
          </div>
          <div className="h-full overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="font-display text-lg uppercase tracking-wide">
            Send a tip
          </DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
