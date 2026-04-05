import { cn } from "@/lib/utils";

const statusConfig = {
  registrado: { label: "Registrado", dotClass: "bg-status-red", bgClass: "bg-red-50 text-red-700 border-red-200" },
  asignado: { label: "Asignado", dotClass: "bg-status-yellow", bgClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  finalizado: { label: "Finalizado", dotClass: "bg-status-green", bgClass: "bg-green-50 text-green-700 border-green-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.registrado;

  return (
    <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border", config.bgClass)}>
      <span className={cn("w-2 h-2 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}