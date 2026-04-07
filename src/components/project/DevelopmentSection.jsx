import { useState } from "react";
import { Code, Upload, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function DevelopmentSection({ project, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [showExtraName, setShowExtraName] = useState(!!project.desarrollo_nombre_extra);
  const [motivoInput, setMotivoInput] = useState("");

  const rechazos = project.desarrollo_rechazos || [];
  const isApproved = project.desarrollo_estado === "aprobado";
  const noAplica = project.desarrollo_estado === "no_aplica";

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

  const handleRechazar = () => {
    if (!motivoInput.trim()) return;
    const nuevoRechazo = { motivo: motivoInput.trim(), fecha: new Date().toISOString() };
    onChange({
      desarrollo_estado: "rechazado",
      desarrollo_rechazos: [...rechazos, nuevoRechazo],
    });
    setMotivoInput("");
  };

  const handleAprobar = () => {
    onChange({ desarrollo_estado: "aprobado" });
  };

  return (
    <SectionCard icon={Code} title="Desarrollo y Cierre" number="4">
      {/* No Aplica */}
      {!isApproved && !noAplica && (
        <div className="flex justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
            <input type="checkbox" checked={false} onChange={() => onChange({ desarrollo_estado: "no_aplica" })} className="rounded" />
            No Aplica (liberar sin desarrollo)
          </label>
        </div>
      )}
      {noAplica && (
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground font-medium bg-muted/50 px-4 py-2 rounded-lg border border-border">
            ✓ Liberado — No requiere desarrollo
          </div>
          <button type="button" onClick={() => onChange({ desarrollo_estado: null })} className="text-xs text-muted-foreground hover:underline">Cancelar</button>
        </div>
      )}
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

      {/* Historial de rechazos */}
      {!noAplica && rechazos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de Rechazos</p>
          <div className="space-y-2">
            {rechazos.map((r, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs text-red-400">{moment(r.fecha).format("DD/MM/YYYY HH:mm")}</span>
                  <span className="text-xs font-bold text-red-600 uppercase">Rechazado</span>
                </div>
                <p className="text-sm text-red-700">{r.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado */}
      {!noAplica && !isApproved && (
        <div className="space-y-3">
          <FieldLabel>Resultado de Desarrollo</FieldLabel>
          <div className="flex gap-2">
            <button type="button" onClick={handleAprobar}
              className="px-5 py-2 rounded-lg text-sm font-semibold border bg-card text-muted-foreground border-border hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all">
              APROBADO
            </button>
          </div>
          <div>
            <FieldLabel>Motivo de Rechazo</FieldLabel>
            <div className="flex gap-2 items-start">
              <Textarea placeholder="Escriba el motivo y haga clic en Rechazar..." value={motivoInput} onChange={(e) => setMotivoInput(e.target.value)} rows={2} className="flex-1" />
              <Button type="button" variant="destructive" onClick={handleRechazar} disabled={!motivoInput.trim()} className="mt-0.5">Rechazar</Button>
            </div>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
          ✅ Desarrollo APROBADO
        </div>
      )}

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
          <button type="button" onClick={() => setShowExtraName(true)}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
            <UserPlus className="w-3.5 h-3.5" />
            + Agregar otra persona
          </button>
        )}
      </div>
    </SectionCard>
  );
}