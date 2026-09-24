import { cn } from "@/lib/utils";

export function VicTyLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-foreground", className)} aria-label="VicTy">
      <svg viewBox="0 0 58 48" aria-hidden="true" className="h-8 w-10 shrink-0 overflow-visible">
        <defs>
          <linearGradient id="victy-logo-gradient" x1="3" y1="2" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--logo-indigo)" />
            <stop offset="0.56" stopColor="var(--logo-violet)" />
            <stop offset="1" stopColor="var(--logo-lilac)" />
          </linearGradient>
        </defs>
        <path d="M4.8 8.7c-1.7-2.8.3-6.3 3.6-6.3h8.2c2.3 0 4.4 1.2 5.6 3.2l11.3 19.2-8.7 14.7c-1.7 2.9-5.9 2.9-7.6 0L4.8 8.7Z" fill="url(#victy-logo-gradient)" />
        <path d="M30.3 25.7 40.8 10c1-1.6 2.8-2.5 4.7-2.5h4.4c2.8 0 4.5 3.1 3 5.4L36.1 39.1c-1.7 2.7-5.6 2.5-7-.3l-2.5-5 3.7-8.1Z" fill="url(#victy-logo-gradient)" opacity=".88" />
        <circle cx="48" cy="2" r="4" fill="var(--signal)" />
      </svg>
      {!compact && <span className="text-[1.35rem] font-semibold leading-none tracking-normal">VicTy</span>}
    </span>
  );
}
