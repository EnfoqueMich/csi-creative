import { useState } from "react";
import { Code, Upload, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

export default function DevelopmentSection({ project, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [showExtraName, setShowExtraName] = useState(!!project.desarrollo_nombre_extra);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Solo se permiten archivos .PDF");
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ desarrollo_archivo_url: file_url });
    setUploading(false);
  };

  return (
    <SectionCard icon={Code} title="Desarrollo y Cierre" number="4">
      {/* File Upload */}
      <div>
        <FieldLabel>Archivo de Desarrollo (PDF)</FieldLabel>
        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer transition-all text-sm",
            uploading ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-muted/50",
            project.desarrollo_archivo_url ? "border-green-300 bg-green-50 text-green-700" : "border-border text-muted-foreground"
          )}>
            <Upload className="w-4 h-4" />
            {uploading ? "Subiendo..." : project.desarrollo_archivo_url ? "PDF Subido ✓" : "Subir PDF"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
          {project.desarrollo_archivo_url && (
            <a href={project.desarrollo_archivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
              Ver archivo
            </a>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-3">
        <FieldLabel>Desarrollo Listo?</FieldLabel>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ desarrollo_estado: "aprobado", desarrollo_motivo_rechazo: "" })}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all border",
              project.desarrollo_estado === "aprobado"
                ? "bg-status-green text-white border-transparent shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-green-300"
            )}
          >
            APROBADO
          </button>
          <button
            type="button"
            onClick={() => onChange({ desarrollo_estado: "rechazado" })}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all border",
              project.desarrollo_estado === "rechazado"
                ? "bg-status-red text-white border-transparent shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-red-300"
            )}
          >
            RECHAZADO
          </button>
        </div>
        {project.desarrollo_estado === "rechazado" && (
          <div>
            <FieldLabel required>Motivo de Rechazo</FieldLabel>
            <Textarea
              placeholder="Describa el motivo del rechazo..."
              value={project.desarrollo_motivo_rechazo || ""}
              onChange={(e) => onChange({ desarrollo_motivo_rechazo: e.target.value })}
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Nombres */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nombre Desarrollo</FieldLabel>
            <Input
              placeholder="Quien autoriza"
              value={project.desarrollo_nombre || ""}
              onChange={(e) => onChange({ desarrollo_nombre: e.target.value })}
            />
          </div>
          {showExtraName && (
            <div>
              <FieldLabel>Nombre Extra</FieldLabel>
              <Input
                placeholder="Segunda persona"
                value={project.desarrollo_nombre_extra || ""}
                onChange={(e) => onChange({ desarrollo_nombre_extra: e.target.value })}
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