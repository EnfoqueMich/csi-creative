import { ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function GeneralSection({ project, onChange, isNew }) {
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
          <div className="flex items-center gap-3 mt-1">
            {["registrado", "asignado", "finalizado"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => s !== "finalizado" && onChange({ proceso: s })}
                className={cn(
                  "transition-all",
                  project.proceso === s ? "scale-110" : "opacity-50 hover:opacity-80"
                )}
                disabled={s === "finalizado"}
              >
                <StatusBadge status={s} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <FieldLabel required>Proyecto</FieldLabel>
        <Textarea
          placeholder="Descripción general del proyecto..."
          value={project.proyecto || ""}
          onChange={(e) => onChange({ proyecto: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <FieldLabel>Asignado</FieldLabel>
          <Input
            placeholder="Nombre del responsable"
            value={project.asignado || ""}
            onChange={(e) => handleAsignadoChange(e.target.value)}
          />
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