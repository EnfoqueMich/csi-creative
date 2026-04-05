import { useState } from "react";
import { ShieldCheck, Upload, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function QualitySection({ project, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [showExtraName, setShowExtraName] = useState(!!project.calidad_nombre_extra);
  const [generatingFolio, setGeneratingFolio] = useState(false);

  const handleGenerateFolio = async () => {
    setGeneratingFolio(true);
    let counters = await base44.entities.QualityFolioCounter.list();
    let counter;
    if (counters.length === 0) {
      counter = await base44.entities.QualityFolioCounter.create({ last_number: 0 });
    } else {
      counter = counters[0];
    }
    const nextNum = (counter.last_number || 0) + 1;
    await base44.entities.QualityFolioCounter.update(counter.id, { last_number: nextNum });
    const folio = `P-CA${String(nextNum).padStart(4, "0")}`;
    onChange({
      calidad_folio: folio,
      calidad_fecha_entrega: new Date().toISOString(),
    });
    setGeneratingFolio(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Solo se permiten archivos .PDF");
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ calidad_archivo_url: file_url });
    setUploading(false);
  };

  return (
    <SectionCard icon={ShieldCheck} title="Calidad" number="3">
      {/* Folio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <FieldLabel>Folio de Calidad</FieldLabel>
          <div className="flex gap-2">
            <Input
              value={project.calidad_folio || "—"}
              disabled
              className="bg-muted/50 font-mono font-bold"
            />
            <Button
              onClick={handleGenerateFolio}
              disabled={generatingFolio || !!project.calidad_folio}
              variant="outline"
              className="whitespace-nowrap"
            >
              {generatingFolio ? "..." : "Crear Folio"}
            </Button>
          </div>
        </div>
        <div>
          <FieldLabel>Fecha de Entrega</FieldLabel>
          <Input
            value={project.calidad_fecha_entrega ? moment(project.calidad_fecha_entrega).format("DD/MM/YYYY HH:mm") : "—"}
            disabled
            className="bg-muted/50 font-mono text-sm"
          />
        </div>
        <div>
          <FieldLabel>Nombre (de Asignado)</FieldLabel>
          <Input
            value={project.asignado || "—"}
            disabled
            className="bg-muted/50"
          />
        </div>
      </div>

      {/* File Upload */}
      <div>
        <FieldLabel>Archivo Digital (PDF)</FieldLabel>
        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer transition-all text-sm",
            uploading ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-muted/50",
            project.calidad_archivo_url ? "border-green-300 bg-green-50 text-green-700" : "border-border text-muted-foreground"
          )}>
            <Upload className="w-4 h-4" />
            {uploading ? "Subiendo..." : project.calidad_archivo_url ? "PDF Subido ✓" : "Subir PDF"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
          {project.calidad_archivo_url && (
            <a href={project.calidad_archivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
              Ver archivo
            </a>
          )}
        </div>
      </div>

      {/* Calidad Estado */}
      <div className="space-y-3">
        <FieldLabel>Calidad Listo?</FieldLabel>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ calidad_estado: "aprobada", calidad_motivo_rechazo: "" })}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all border",
              project.calidad_estado === "aprobada"
                ? "bg-status-green text-white border-transparent shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-green-300"
            )}
          >
            APROBADA
          </button>
          <button
            type="button"
            onClick={() => onChange({ calidad_estado: "rechazada" })}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all border",
              project.calidad_estado === "rechazada"
                ? "bg-status-red text-white border-transparent shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-red-300"
            )}
          >
            RECHAZADA
          </button>
        </div>
        {project.calidad_estado === "rechazada" && (
          <div>
            <FieldLabel required>Motivo de Rechazo</FieldLabel>
            <Textarea
              placeholder="Describa el motivo del rechazo..."
              value={project.calidad_motivo_rechazo || ""}
              onChange={(e) => onChange({ calidad_motivo_rechazo: e.target.value })}
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Nombres */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nombre Calidad</FieldLabel>
            <Input
              placeholder="Quien evalúa"
              value={project.calidad_nombre || ""}
              onChange={(e) => onChange({ calidad_nombre: e.target.value })}
            />
          </div>
          {showExtraName && (
            <div>
              <FieldLabel>Nombre Extra</FieldLabel>
              <Input
                placeholder="Segunda persona"
                value={project.calidad_nombre_extra || ""}
                onChange={(e) => onChange({ calidad_nombre_extra: e.target.value })}
              />
            </div>
          )}
        </div>
        {!showExtraName && (
          <button
            type="button"
            onClick={() => setShowExtraName(true)}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Agregar otra persona
          </button>
        )}
      </div>
    </SectionCard>
  );
}