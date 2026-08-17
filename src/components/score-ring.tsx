import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { scoreLabel } from "@/lib/constants";

export function ScoreRing({
  score,
  size = 132,
  stroke = 10,
  label = true,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: boolean;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = shown;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (score - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Quality score ${score} out of 100`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--forge)" />
            <stop offset="100%" stopColor="var(--forge-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-muted" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="url(#ringGrad)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold tabular-nums">{shown}</span>
        {label && (
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {scoreLabel(score)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ScoreBar({ name, value }: { name: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full forge-gradient transition-[width] duration-700 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
