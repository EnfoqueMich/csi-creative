import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function GeneralSection({ project, onChange }) {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    base44.entities.Worker.list("nombre").then((data) => setWorkers(data.filter((w) => w.activo !== false)));
  }, []);

  const handleAsignadoChange = (value) => {
    const updates = { asignado: value };
    if (value && !project.asignado) {
      updates.fecha_inicio = new Date().toISOString();
      updates.proceso = "asignado";
    }
    if (!value) {
      updates.proceso = "registrado";
      updates.fecha_inicio = null;
    }
    onChange(updates);
  };

  return (
    <SectionCard icon={ClipboardList} title="Datos Generales" number="1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>CREA (ID)</FieldLabel>
          <Input
            type="number"
            placeholder="Ej. 1001"
            value={project.crea || ""}
            onChange={(e) => onChange({ crea: Number(e.target.value) })}
            className="font-mono"
          />
        </div>
        <div>
          <FieldLabel>Proceso</FieldLabel>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {["registrado", "asignado", "finalizado"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => s !== "finalizado" && onChange({ proceso: s })}
                disabled={s === "finalizado"}
                className={cn("transition-all", project.proceso === s ? "scale-110" : "opacity-50 hover:opacity-80")}
              >
                <StatusBadge status={s} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <FieldLabel required>Título del Proyecto</FieldLabel>
        <Input
          placeholder="Ej. Parches bordados temporada 2026..."
          value={project.titulo || ""}
          onChange={(e) => onChange({ titulo: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel>Descripción</FieldLabel>
        <Textarea
          placeholder="Descripción general del proyecto..."
          value={project.proyecto || ""}
          onChange={(e) => onChange({ proyecto: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <FieldLabel>Horas de Diseño / Digitalización</FieldLabel>
        <Input
          type="number"
          placeholder="Ej. 2.5"
          step="0.25"
          min="0"
          value={project.diseno_horas || ""}
          onChange={(e) => onChange({ diseno_horas: Number(e.target.value) })}
          className="font-mono max-w-[200px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <FieldLabel>Asignado</FieldLabel>
          {workers.length > 0 ? (
            <select
              value={project.asignado || ""}
              onChange={(e) => handleAsignadoChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Sin asignar —</option>
              {workers.map((w) => (
                <option key={w.id} value={w.nombre}>{w.nombre}{w.puesto ? ` (${w.puesto})` : ""}</option>
              ))}
            </select>
          ) : (
            <Input
              placeholder="Nombre del responsable"
              value={project.asignado || ""}
              onChange={(e) => handleAsignadoChange(e.target.value)}
            />
          )}
        </div>
        <div>
          <FieldLabel>Fecha y Hora Inicio</FieldLabel>
          <Input
            value={project.fecha_inicio ? moment(project.fecha_inicio).format("DD/MM/YYYY HH:mm") : "—"}
            disabled
            className="bg-muted/50 font-mono text-sm"
          />
        </div>
        <div>
          <FieldLabel>Fecha y Hora Final</FieldLabel>
          <Input
            value={project.fecha_final ? moment(project.fecha_final).format("DD/MM/YYYY HH:mm") : "—"}
            disabled
            className="bg-muted/50 font-mono text-sm"
          />
        </div>
      </div>
    </SectionCard>
  );
}