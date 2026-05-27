import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  isSignedIn: boolean;
  countdown: string;
};

export function LimitReachedModal({ open, onClose, isSignedIn, countdown }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl md:text-3xl tracking-tight">
            You've cooked through your 5 free receipes today 🔥
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {isSignedIn
              ? "Go unlimited and never hit the limit again — or wait for the daily reset."
              : "Sign up free to get more receipes, save them across devices, and unlock the community cookbook."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-2">
          {!isSignedIn && (
            <Link
              to="/login"
              search={{ mode: "signup" }}
              onClick={onClose}
              className="w-full text-center px-4 py-3 rounded-full bg-foreground text-background font-display font-semibold text-sm hover:brightness-110 transition-all"
            >
              Sign up free — keep cooking
            </Link>
          )}
          <Link
            to="/pricing"
            onClick={onClose}
            className="w-full text-center px-4 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all"
          >
            Go unlimited — $5.99/mo
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Daily limit resets in <span className="font-semibold text-foreground">{countdown}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}