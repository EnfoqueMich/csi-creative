import { cn } from "@/lib/utils";

export default function YesNoButtons({ value, onChange, yesLabel = "SÍ", noLabel = "NO" }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "px-5 py-2 rounded-lg text-sm font-semibold transition-all border",
          value === true
            ? "bg-status-green text-white border-transparent shadow-md"
            : "bg-card text-muted-foreground border-border hover:border-green-300 hover:text-green-600"
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "px-5 py-2 rounded-lg text-sm font-semibold transition-all border",
          value === false
            ? "bg-status-red text-white border-transparent shadow-md"
            : "bg-card text-muted-foreground border-border hover:border-red-300 hover:text-red-600"
        )}
      >
        {noLabel}
      </button>
    </div>
  );
}