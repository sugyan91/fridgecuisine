import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium cursor-pointer transition-[transform,background-color,box-shadow,color] duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92 hover:shadow-md hover:-translate-y-[1px]",
        premium:
          "btn-premium-surface hover:brightness-[1.04] hover:-translate-y-[1px]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-[1px]",
        outline:
          "border border-border bg-background/70 backdrop-blur-sm hover:bg-accent/40 hover:text-accent-foreground hover:border-primary/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground",
        "ghost-warm":
          "text-foreground/80 hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-11 px-7 text-[15px]",
        xl: "h-13 px-9 text-base tracking-tight",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
