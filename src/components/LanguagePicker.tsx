import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useLanguage } from "@/lib/language";

type Props = {
  variant?: "header" | "compact";
  className?: string;
};

export function LanguagePicker({ variant = "header", className = "" }: Props) {
  const { language, setLanguage } = useLanguage();

  const triggerClass =
    variant === "compact"
      ? "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors"
      : "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-border hover:bg-secondary transition-colors";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language: ${language.native}`}
        className={`${triggerClass} ${className}`}
      >
        <Globe size={variant === "compact" ? 14 : 16} />
        <span>{language.native}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[60vh] overflow-y-auto w-56">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={l.code === language.code ? "bg-secondary font-semibold" : ""}
          >
            <span className="flex-1">{l.native}</span>
            <span className="text-xs opacity-60 ml-2">{l.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}