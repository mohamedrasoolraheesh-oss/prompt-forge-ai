import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3,
  FlaskConical,
  LibraryBig,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Wand2,
  LayoutTemplate,
  Search,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/forge")}>
            <Sparkles className="size-4" /> New Prompt
          </CommandItem>
          <CommandItem onSelect={() => go("/library")}>
            <Search className="size-4" /> Search Prompts
          </CommandItem>
          <CommandItem onSelect={() => go("/optimize")}>
            <Wand2 className="size-4" /> Optimize Prompt
          </CommandItem>
          <CommandItem onSelect={() => go("/playground")}>
            <FlaskConical className="size-4" /> Open Playground
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/templates")}>
            <LayoutTemplate className="size-4" /> Templates
          </CommandItem>
          <CommandItem onSelect={() => go("/library")}>
            <LibraryBig className="size-4" /> Library
          </CommandItem>
          <CommandItem onSelect={() => go("/analytics")}>
            <BarChart3 className="size-4" /> Analytics
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="size-4" /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() => {
              toggle();
              onOpenChange(false);
            }}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} Toggle
            Theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
