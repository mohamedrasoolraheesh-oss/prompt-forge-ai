import { useEffect } from "react";

type Opts = { meta?: boolean; shift?: boolean; enabled?: boolean };

/** Registers a global keyboard shortcut. `key` is compared case-insensitively. */
export function useHotkey(key: string, handler: () => void, opts: Opts = {}) {
  const { meta = true, shift = false, enabled = true } = opts;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (meta && !mod) return;
      if (!meta && mod) return;
      if (shift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, handler, meta, shift, enabled]);
}

export const modKey = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
