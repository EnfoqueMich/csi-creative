import { useState } from "react";
import { Package, Plus, X, ZoomIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const MATERIALES = ["TATAMI", "VELCRO", "TELA CANASTA", "TELA SCRAP"];

function ImageThumb({ url }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div
        className="relative group cursor-pointer w-[100px] h-[100px] rounded-lg overflow-hidden border border-border"
        onClick={() => setExpanded(true)}
      >
        <img src={url} alt="Bordado" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-5 h-5 text-white" />
        </div>
      </div>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt="Bordado" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setExpanded(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const emptyBordado = () => ({
  base: "", altura: "", puntadas: "", tiempo: "", total_hilo: "", total_bobina: "",
  material: "", tela_base: "", tela_altura: "", imagen_url: "",
});

function BordadoForm({ bordado, index, onChange, onRemove, uploading, onUploadImage }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4 relative">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Bordado #{index + 1}</p>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <FieldLabel>Base (cm)</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.base} onChange={(e) => onChange({ base: e.target.value })} className="font-mono" />
        </div>
        <div>
          <FieldLabel>Altura (cm)</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.altura} onChange={(e) => onChange({ altura: e.target.value })} className="font-mono" />
        </div>
        <div>
          <FieldLabel>Puntadas</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.puntadas} onChange={(e) => onChange({ puntadas: e.target.value })} className="font-mono" />
        </div>
        <div>
          <FieldLabel>Tiempo (hh:mm)</FieldLabel>
          <Input type="time" value={bordado.tiempo} onChange={(e) => onChange({ tiempo: e.target.value })} className="font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Total de Hilo (m)</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.total_hilo} onChange={(e) => onChange({ total_hilo: e.target.value })} className="font-mono" />
        </div>
        <div>
          <FieldLabel>Total Bobina (m)</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.total_bobina} onChange={(e) => onChange({ total_bobina: e.target.value })} className="font-mono" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <FieldLabel>Material Usado</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {MATERIALES.map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => onChange({ material: bordado.material === mat ? "" : mat })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  bordado.material === mat
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-card text-muted-foreground border-border hover:border-primary"
                )}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Tela Base (cm)</FieldLabel>
            <Input type="number" placeholder="0" value={bordado.tela_base} onChange={(e) => onChange({ tela_base: e.target.value })} className="font-mono" />
          </div>
          <div>
            <FieldLabel>Tela Altura (cm)</FieldLabel>
            <Input type="number" placeholder="0" value={bordado.tela_altura} onChange={(e) => onChange({ tela_altura: e.target.value })} className="font-mono" />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Imagen del Bordado</FieldLabel>
        <div className="flex items-center gap-4">
          <label className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer transition-all text-sm",
            uploading === index ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-muted/50 text-muted-foreground border-border"
          )}>
            <Plus className="w-4 h-4" />
            {uploading === index ? "Subiendo..." : "Subir imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadImage(e, index)} />
          </label>
          {bordado.imagen_url && <ImageThumb url={bordado.imagen_url} />}
        </div>
      </div>
    </div>
  );
}

export default function ScrapSection({ project, onChange }) {
  const bordados = project.bordados_scrap || [];
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleAddBordado = () => {
    onChange({ bordados_scrap: [...bordados, emptyBordado()] });
  };

  const handleChangeBordado = (index, updates) => {
    const updated = bordados.map((b, i) => i === index ? { ...b, ...updates } : b);
    onChange({ bordados_scrap: updated });
  };

  const handleRemoveBordado = (index) => {
    onChange({ bordados_scrap: bordados.filter((_, i) => i !== index) });
  };

  const handleUploadImage = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingIndex(index);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChangeBordado(index, { imagen_url: file_url });
    setUploadingIndex(null);
  };

  // Totals
  const parseTime = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const totalHilo = bordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = bordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTelaArea = bordados.reduce((s, b) => s + ((Number(b.tela_base) || 0) * (Number(b.tela_altura) || 0)), 0);
  const totalTiempoMins = bordados.reduce((s, b) => s + parseTime(b.tiempo), 0);

  return (
    <SectionCard icon={Package} title="Scrap — Bordados" number="5">
      {/* Bordados */}
      <div className="space-y-4">
        {bordados.map((b, i) => (
          <BordadoForm
            key={i}
            bordado={b}
            index={i}
            onChange={(updates) => handleChangeBordado(i, updates)}
            onRemove={() => handleRemoveBordado(i)}
            uploading={uploadingIndex}
            onUploadImage={handleUploadImage}
          />
        ))}
      </div>

      <Button type="button" variant="outline" onClick={handleAddBordado} className="gap-2 w-full border-dashed">
        <Plus className="w-4 h-4" />
        Agregar Bordado
      </Button>

      {/* Totals */}
      {bordados.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Totales Acumulados ({bordados.length} bordado{bordados.length > 1 ? "s" : ""})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{totalHilo}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Hilo (m)</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{totalBobina}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Bobina (m)</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{totalTelaArea.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Tela (cm²)</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{formatMinutes(totalTiempoMins)}</p>
              <p className="text-xs text-muted-foreground mt-1">Tiempo Total (hh:mm)</p>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}