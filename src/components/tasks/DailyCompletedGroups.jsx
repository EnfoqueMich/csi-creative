import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";

export default function DailyCompletedGroups({ tasks, TaskCard, ...cardProps }) {
  const [openDays, setOpenDays] = useState({});

  if (tasks.length === 0) return null;

  const groups = {};
  tasks.forEach((t) => {
    const dateKey = t.fecha_completada
      ? format(new Date(t.fecha_completada), "yyyy-MM-dd")
      : "sin-fecha";
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
  });

  const sortedKeys = Object.keys(groups)
    .filter((dateKey) => dateKey === "sin-fecha" || new Date(dateKey).getDay() !== 0)
    .sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-muted-foreground px-1">Control diario de tareas completadas</p>
      {sortedKeys.map((dateKey, idx) => {
        const dayTasks = groups[dateKey];
        const label = dateKey === "sin-fecha"
          ? "Sin fecha"
          : format(new Date(dateKey), "EEEE d 'de' MMMM, yyyy", { locale: es });
        const isOpen = openDays[dateKey] !== undefined ? openDays[dateKey] : idx === 0;
        return (
          <div key={dateKey} className="rounded-xl border border-green-200 overflow-hidden">
            <button
              onClick={() => setOpenDays((prev) => ({ ...prev, [dateKey]: !isOpen }))}
              className="w-full flex items-center gap-3 px-5 py-3 bg-green-50/50 hover:bg-green-50 transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-green-600" /> : <ChevronRight className="w-4 h-4 text-green-600" />}
              <CheckCircle2 className="w-4 h-4 text-status-green" />
              <span className="text-sm font-semibold text-green-800 flex-1 capitalize">{label}</span>
              <span className="text-xs text-green-700 font-mono bg-green-100 px-2 py-0.5 rounded-full">{dayTasks.length}</span>
            </button>
            {isOpen && (
              <div className="p-3 space-y-2 bg-card">
                {dayTasks.map((t) => (
                  <TaskCard key={t.id} task={t} {...cardProps} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}