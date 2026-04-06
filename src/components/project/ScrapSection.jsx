import { useState } from "react";
import { Package, Plus, X, ZoomIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const emptyMat = () => ({ cantidad: "", base: "", altura: "" });
const emptyBordado = () => ({
  base: "", altura: "", puntadas: "",
  tiempo_horas: "", tiempo_minutos: "", tiempo_segundos: "",
  total_hilo: "", total_bobina: "", imagen_url: "",
  materiales: {
    tatami: emptyMat(),
    velcro_macho: emptyMat(),
    velcro_hembra: emptyMat(),
    tela_canasta: emptyMat(),
    tela_scrap: emptyMat(),
  },
});

function ImageThumb({ url }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className="relative group cursor-pointer w-[100px] h-[100px] rounded-lg overflow-hidden border border-border" onClick={() => setExpanded(true)}>
        <img src={url} alt="Bordado" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-5 h-5 text-white" />
        </div>
      </div>
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt="Bordado" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setExpanded(false)} className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MaterialRow({ label, value, onChange }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <FieldLabel>Cantidad</FieldLabel>
          <Input type="number" placeholder="0" value={value.cantidad} onChange={(e) => onChange({ ...value, cantidad: e.target.value })} className="font-mono text-sm" />
        </div>
        <div>
          <FieldLabel>Base (cm)</FieldLabel>
          <Input type="number" placeholder="0" value={value.base} onChange={(e) => onChange({ ...value, base: e.target.value })} className="font-mono text-sm" />
        </div>
        <div>
          <FieldLabel>Altura (cm)</FieldLabel>
          <Input type="number" placeholder="0" value={value.altura} onChange={(e) => onChange({ ...value, altura: e.target.value })} className="font-mono text-sm" />
        </div>
      </div>
    </div>
  );
}

function BordadoForm({ bordado, index, onChange, onRemove, uploadingIndex, onUploadImage }) {
  const mats = bordado.materiales || {};
  const updateMat = (key, val) => onChange({ materiales: { ...mats, [key]: val } });

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 relative">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Bordado #{index + 1}</p>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dimensiones + Puntadas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Base Bordado (cm)</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.base} onChange={(e) => onChange({ base: e.target.value })} className="font-mono" />
        </div>
        <div>
          <FieldLabel>Altura Bordado (cm)</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.altura} onChange={(e) => onChange({ altura: e.target.value })} className="font-mono" />
        </div>
        <div>
          <FieldLabel>Puntadas</FieldLabel>
          <Input type="number" placeholder="0" value={bordado.puntadas} onChange={(e) => onChange({ puntadas: e.target.value })} className="font-mono" />
        </div>
      </div>

      {/* Tiempo manual */}
      <div>
        <FieldLabel>Duración del Bordado</FieldLabel>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 text-center">Horas</p>
            <Input type="number" min="0" placeholder="0" value={bordado.tiempo_horas} onChange={(e) => onChange({ tiempo_horas: e.target.value })} className="font-mono text-center" />
          </div>
          <span className="text-lg font-bold text-muted-foreground mt-4">:</span>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 text-center">Minutos</p>
            <Input type="number" min="0" max="59" placeholder="0" value={bordado.tiempo_minutos} onChange={(e) => onChange({ tiempo_minutos: e.target.value })} className="font-mono text-center" />
          </div>
          <span className="text-lg font-bold text-muted-foreground mt-4">:</span>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 text-center">Segundos</p>
            <Input type="number" min="0" max="59" placeholder="0" value={bordado.tiempo_segundos} onChange={(e) => onChange({ tiempo_segundos: e.target.value })} className="font-mono text-center" />
          </div>
        </div>
      </div>

      {/* Hilo y Bobina */}
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

      {/* Materiales */}
      <div>
        <FieldLabel>Material Usado</FieldLabel>
        <div className="space-y-3 mt-1">
          <MaterialRow label="Tatami" value={mats.tatami || emptyMat()} onChange={(v) => updateMat("tatami", v)} />
          <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Velcro</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MaterialRow label="Velcro Macho" value={mats.velcro_macho || emptyMat()} onChange={(v) => updateMat("velcro_macho", v)} />
              <MaterialRow label="Velcro Hembra" value={mats.velcro_hembra || emptyMat()} onChange={(v) => updateMat("velcro_hembra", v)} />
            </div>
          </div>
          <MaterialRow label="Tela Canasta" value={mats.tela_canasta || emptyMat()} onChange={(v) => updateMat("tela_canasta", v)} />
          <MaterialRow label="Tela Scrap" value={mats.tela_scrap || emptyMat()} onChange={(v) => updateMat("tela_scrap", v)} />
        </div>
      </div>

      {/* Imagen */}
      <div>
        <FieldLabel>Imagen del Bordado</FieldLabel>
        <div className="flex items-center gap-4">
          <label className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer transition-all text-sm text-muted-foreground",
            uploadingIndex === index ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-muted/50"
          )}>
            <Plus className="w-4 h-4" />
            {uploadingIndex === index ? "Subiendo..." : "Subir imagen"}
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

  const handleAddBordado = () => onChange({ bordados_scrap: [...bordados, emptyBordado()] });

  const handleChangeBordado = (index, updates) => {
    const updated = bordados.map((b, i) => i === index ? { ...b, ...updates } : b);
    onChange({ bordados_scrap: updated });
  };

  const handleRemoveBordado = (index) => onChange({ bordados_scrap: bordados.filter((_, i) => i !== index) });

  const handleUploadImage = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingIndex(index);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChangeBordado(index, { imagen_url: file_url });
    setUploadingIndex(null);
  };

  // Totals
  const totalHilo = bordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = bordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTelaArea = bordados.reduce((s, b) => {
    const mats = b.materiales || {};
    let area = 0;
    ["tatami", "tela_canasta", "tela_scrap"].forEach((k) => {
      const m = mats[k];
      if (m) area += (Number(m.base) || 0) * (Number(m.altura) || 0) * (Number(m.cantidad) || 1);
    });
    return s + area;
  }, 0);
  const totalVelcroArea = bordados.reduce((s, b) => {
    const mats = b.materiales || {};
    let area = 0;
    ["velcro_macho", "velcro_hembra"].forEach((k) => {
      const m = mats[k];
      if (m) area += (Number(m.base) || 0) * (Number(m.altura) || 0) * (Number(m.cantidad) || 1);
    });
    return s + area;
  }, 0);
  const totalTiempoSecs = bordados.reduce((s, b) =>
    s + (Number(b.tiempo_horas) || 0) * 3600 + (Number(b.tiempo_minutos) || 0) * 60 + (Number(b.tiempo_segundos) || 0), 0);
  const fmtTiempo = `${Math.floor(totalTiempoSecs / 3600)}h ${Math.floor((totalTiempoSecs % 3600) / 60)}m ${totalTiempoSecs % 60}s`;

  return (
    <SectionCard icon={Package} title="Scrap — Bordados" number="5">
      <div className="space-y-4">
        {bordados.map((b, i) => (
          <BordadoForm
            key={i}
            bordado={b}
            index={i}
            onChange={(updates) => handleChangeBordado(i, updates)}
            onRemove={() => handleRemoveBordado(i)}
            uploadingIndex={uploadingIndex}
            onUploadImage={handleUploadImage}
          />
        ))}
      </div>

      <Button type="button" variant="outline" onClick={handleAddBordado} className="gap-2 w-full border-dashed">
        <Plus className="w-4 h-4" />
        Agregar Bordado
      </Button>

      {bordados.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Totales ({bordados.length} bordado{bordados.length > 1 ? "s" : ""})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Hilo (m)", value: totalHilo },
              { label: "Total Bobina (m)", value: totalBobina },
              { label: "Total Tela (cm²)", value: totalTelaArea.toLocaleString() },
              { label: "Total Velcro (cm²)", value: totalVelcroArea.toLocaleString() },
              { label: "Tiempo Total", value: fmtTiempo },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card rounded-lg border border-border p-3 text-center">
                <p className="text-xl font-bold font-mono">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}