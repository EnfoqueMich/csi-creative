import { useState } from "react";
import { ShieldCheck, Upload, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import moment from "moment";

function FolioHistoryItem({ folio }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-red-700">{folio.folio}</span>
          <span className="text-xs text-red-500">RECHAZADA — {moment(folio.fecha).format("DD/MM/YYYY HH:mm")}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1 border-t border-red-200">
          {folio.motivo_rechazo && (
            <p className="text-sm text-red-700"><strong>Motivo:</strong> {folio.motivo_rechazo}</p>
          )}
          {folio.nombre && (
            <p className="text-sm text-red-600"><strong>Evaluó:</strong> {folio.nombre}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function QualitySection({ project, onChange }) {
  const folios = project.calidad_folios || [];
  const activeFolio = folios.length > 0 ? folios[folios.length - 1] : null;
  const isRejected = activeFolio?.estado === "rechazada";
  const isApproved = activeFolio?.estado === "aprobada";
  const rejectedHistory = folios.filter((f) => f.estado === "rechazada");

  const [uploading, setUploading] = useState(false);
  const [showExtraName, setShowExtraName] = useState(!!project.calidad_nombre_extra);
  const [generatingFolio, setGeneratingFolio] = useState(false);

  // Draft state for current active folio editing
  const [draftMotivoRechazo, setDraftMotivoRechazo] = useState(activeFolio?.motivo_rechazo || "");

  const canGenerateNewFolio = !activeFolio || isRejected;

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
    const newFolio = {
      folio,
      fecha: new Date().toISOString(),
      estado: null,
      motivo_rechazo: "",
      nombre: project.asignado || "",
      nombre_extra: "",
      archivo_url: "",
    };
    onChange({ calidad_folios: [...folios, newFolio] });
    setDraftMotivoRechazo("");
    setGeneratingFolio(false);
  };

  const updateActiveFolio = (updates) => {
    const updated = folios.map((f, i) =>
      i === folios.length - 1 ? { ...f, ...updates } : f
    );
    onChange({ calidad_folios: updated });
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
    updateActiveFolio({ archivo_url: file_url });
    setUploading(false);
  };

  const handleSetEstado = (estado) => {
    if (estado === "aprobada") {
      updateActiveFolio({ estado: "aprobada", motivo_rechazo: "" });
      onChange({ calidad_estado_final: "aprobada" });
    } else {
      updateActiveFolio({ estado: "rechazada", motivo_rechazo: draftMotivoRechazo });
      onChange({ calidad_estado_final: "rechazada" });
    }
  };

  const handleSaveRechazo = () => {
    updateActiveFolio({ estado: "rechazada", motivo_rechazo: draftMotivoRechazo });
    onChange({ calidad_estado_final: "rechazada" });
  };

  return (
    <SectionCard icon={ShieldCheck} title="Calidad" number="3">
      {/* Historial de rechazos */}
      {rejectedHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial de Rechazos</p>
          {rejectedHistory.map((f, i) => (
            <FolioHistoryItem key={i} folio={f} />
          ))}
        </div>
      )}

      {/* Botón generar folio */}
      {canGenerateNewFolio && !isApproved && (
        <div>
          <Button
            onClick={handleGenerateFolio}
            disabled={generatingFolio}
            variant="outline"
            className="gap-2"
          >
            {generatingFolio ? "Generando..." : isRejected ? "Generar Nuevo Folio" : "Crear Folio de Calidad"}
          </Button>
        </div>
      )}

      {/* Folio activo */}
      {activeFolio && (
        <div className={cn(
          "rounded-xl border p-5 space-y-5 transition-all",
          isApproved ? "border-green-200 bg-green-50/50" : isRejected ? "border-red-200 bg-red-50/50" : "border-border bg-card"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Folio</FieldLabel>
              <Input value={activeFolio.folio} disabled className="bg-white font-mono font-bold" />
            </div>
            <div>
              <FieldLabel>Fecha de Entrega</FieldLabel>
              <Input
                value={activeFolio.fecha ? moment(activeFolio.fecha).format("DD/MM/YYYY HH:mm") : "—"}
                disabled className="bg-white font-mono text-sm"
              />
            </div>
            <div>
              <FieldLabel>Nombre (Asignado)</FieldLabel>
              <Input value={project.asignado || "—"} disabled className="bg-white" />
            </div>
          </div>

          {/* Archivo PDF */}
          {!isApproved && !isRejected && (
            <div>
              <FieldLabel>Archivo Digital (PDF)</FieldLabel>
              <div className="flex items-center gap-3">
                <label className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer transition-all text-sm",
                  uploading ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-muted/50",
                  activeFolio.archivo_url ? "border-green-300 bg-green-50 text-green-700" : "border-border text-muted-foreground"
                )}>
                  <Upload className="w-4 h-4" />
                  {uploading ? "Subiendo..." : activeFolio.archivo_url ? "PDF Subido ✓" : "Subir PDF"}
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                </label>
                {activeFolio.archivo_url && (
                  <a href={activeFolio.archivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                    Ver archivo
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Estado */}
          {!isApproved && !isRejected && (
            <div className="space-y-3">
              <FieldLabel>Resultado de Calidad</FieldLabel>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleSetEstado("aprobada")}
                  className="px-5 py-2 rounded-lg text-sm font-semibold border bg-card text-muted-foreground border-border hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all">
                  APROBADA
                </button>
                <button type="button" onClick={() => handleSetEstado("rechazada")}
                  className="px-5 py-2 rounded-lg text-sm font-semibold border bg-card text-muted-foreground border-border hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all">
                  RECHAZADA
                </button>
              </div>
              <div>
                <FieldLabel>Motivo de Rechazo (si aplica)</FieldLabel>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Motivo de rechazo..."
                    value={draftMotivoRechazo}
                    onChange={(e) => setDraftMotivoRechazo(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aprobada badge */}
          {isApproved && (
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
              ✅ Este folio fue APROBADO
            </div>
          )}

          {/* Rechazada badge */}
          {isRejected && (
            <div className="text-sm text-red-700">
              <strong>❌ Rechazado:</strong> {activeFolio.motivo_rechazo}
            </div>
          )}

          {/* Nombres — solo si no está cerrado */}
          {!isRejected && (
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
                <button type="button" onClick={() => setShowExtraName(true)}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  <UserPlus className="w-3.5 h-3.5" />
                  + Agregar otra persona
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}