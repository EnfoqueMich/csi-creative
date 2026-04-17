import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SectionCard({ icon: Icon, title, number, children, className, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
          <div className="flex items-center gap-2">
            {number && (
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {number}
              </span>
            )}
            <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground">{title}</h2>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="p-6 space-y-5">
          {children}
        </div>
      )}
    </div>
  );
}