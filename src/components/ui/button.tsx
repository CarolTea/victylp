import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow-strong",
        secondary:
          "border-border bg-surface/70 text-foreground backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-strong",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
        icon:
          "size-11 border-border bg-surface/80 p-0 text-foreground backdrop-blur-xl hover:border-primary/50 hover:bg-surface-strong",
      },
      size: {
        default: "h-12",
        sm: "h-10 min-h-10 px-4 text-xs",
        lg: "h-14 px-7 text-base",
        icon: "size-11 min-h-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
