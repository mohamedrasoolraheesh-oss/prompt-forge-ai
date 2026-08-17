import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { parseSections } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export async function copyText(text: string, message = "Prompt copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error("Clipboard unavailable in this browser");
    return false;
  }
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      aria-label="Copy prompt"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      {copied ? (
        <Check className="size-4 text-success animate-pop" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/** Structured, syntax-highlighted-ish rendering of a forged prompt. */
export function PromptView({
  content,
  className,
  streaming,
}: {
  content: string;
  className?: string;
  streaming?: boolean;
}) {
  const sections = parseSections(content);

  if (!sections.length) {
    return (
      <pre
        className={cn(
          "whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground/90",
          className,
        )}
      >
        {content}
        {streaming && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-primary align-middle" />}
      </pre>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {sections.map((s) => (
        <section key={s.heading} className="animate-rise">
          <h4 className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {s.heading}
          </h4>
          <pre className="whitespace-pre-wrap break-words border-l-2 border-border pl-3 font-mono text-[13px] leading-relaxed text-foreground/90">
            {s.body}
          </pre>
        </section>
      ))}
      {streaming && <span className="inline-block h-4 w-2 animate-pulse bg-primary align-middle" />}
    </div>
  );
}
