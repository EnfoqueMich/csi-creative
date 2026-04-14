import { useState, useEffect } from "react";
import { Package, Plus, X, ZoomIn, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
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

const fmt$ = (n) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const matArea = (m) => (Number(m?.base) || 0) * (Number(m?.altura) || 0) * (Number(m?.cantidad) || 1);

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
  const [collapsed, setCollapsed] = useState(true);
  const mats = bordado.materiales || {};
  const updateMat = (key, val) => onChange({ materiales: { ...mats, [key]: val } });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          <p className="text-sm font-bold">Bordado #{index + 1}</p>
          {collapsed && bordado.puntadas ? (
            <span className="text-xs text-muted-foreground font-mono">{Number(bordado.puntadas).toLocaleString()} puntadas</span>
          ) : null}
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-5 border-t border-border">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Total de Hilo (m)</FieldLabel>
              <Input type="number" placeholder="0" step="0.01" value={bordado.total_hilo} onChange={(e) => onChange({ total_hilo: e.target.value })} className="font-mono" />
            </div>
            <div>
              <FieldLabel>Total Bobina (m)</FieldLabel>
              <Input type="number" placeholder="0" value={bordado.total_bobina} onChange={(e) => onChange({ total_bobina: e.target.value })} className="font-mono" />
            </div>
          </div>

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
      )}
    </div>
  );
}

function PriceField({ label, value, onChange, unit }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="font-mono pl-7"
        />
      </div>
      {unit && <p className="text-xs text-muted-foreground mt-1">{unit}</p>}
    </div>
  );
}

export default function ScrapSection({ project, onChange }) {
  const bordados = project.bordados_scrap || [];
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [globalPrices, setGlobalPrices] = useState({});

  useEffect(() => {
    base44.entities.PriceSettings.list().then((data) => {
      if (data.length > 0) setGlobalPrices(data[0]);
    });
  }, []);

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

  // Totals — quantities
  const totalHilo = bordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = bordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTatamiArea = bordados.reduce((s, b) => s + matArea(b.materiales?.tatami), 0);
  const totalTelaCanastaArea = bordados.reduce((s, b) => s + matArea(b.materiales?.tela_canasta), 0);
  const totalTelaScrapArea = bordados.reduce((s, b) => s + matArea(b.materiales?.tela_scrap), 0);
  const totalVelcroArea = bordados.reduce((s, b) => s + matArea(b.materiales?.velcro_macho) + matArea(b.materiales?.velcro_hembra), 0);
  const totalTiempoSecs = bordados.reduce((s, b) =>
    s + (Number(b.tiempo_horas) || 0) * 3600 + (Number(b.tiempo_minutos) || 0) * 60 + (Number(b.tiempo_segundos) || 0), 0);
  const fmtTiempo = `${Math.floor(totalTiempoSecs / 3600)}h ${Math.floor((totalTiempoSecs % 3600) / 60)}m ${totalTiempoSecs % 60}s`;

  // Precios desde configuración global
  const pHiloM = Number(globalPrices.precio_hilo_m) || 0;
  const pBobinaM = Number(globalPrices.precio_bobina_m) || 0;
  const pTatamiCm2 = Number(globalPrices.precio_tatami_cm2) || 0;
  const pTelaCanastaCm2 = Number(globalPrices.precio_tela_canasta_cm2) || 0;
  const pTelaScrapCm2 = Number(globalPrices.precio_tela_scrap_cm2) || 0;
  const pVelcroCm2 = Number(globalPrices.precio_velcro_cm2) || 0;
  const pMinBordado = Number(globalPrices.precio_minuto_bordado) || 0;
  const pHoraDiseno = Number(globalPrices.precio_hora_diseno) || 0;

  // Costos calculados
  const costoHilo = totalHilo * pHiloM;
  const costoBobina = totalBobina * pBobinaM;
  const costoTatami = totalTatamiArea * pTatamiCm2;
  const costoTelaCanasta = totalTelaCanastaArea * pTelaCanastaCm2;
  const costoTelaScrap = totalTelaScrapArea * pTelaScrapCm2;
  const costoVelcro = totalVelcroArea * pVelcroCm2;
  const totalMinsBordado = totalTiempoSecs / 60;
  const costoBordado = totalMinsBordado * pMinBordado;
  const costoDiseno = (Number(project.diseno_horas) || 0) * pHoraDiseno;
  const costoTotal = costoHilo + costoBobina + costoTatami + costoTelaCanasta + costoTelaScrap + costoVelcro + costoBordado + costoDiseno;

  const hayPrecios = pHiloM || pBobinaM || pTatamiCm2 || pTelaCanastaCm2 || pTelaScrapCm2 || pVelcroCm2 || pMinBordado || pHoraDiseno;

  return (
    <SectionCard icon={Package} title="Scrap — Bordados" number="5">

      {/* Lista de bordados */}
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
        <div className="space-y-4">
          {/* Totales físicos */}
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Totales físicos ({bordados.length} bordado{bordados.length > 1 ? "s" : ""})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total Hilo (m)", value: totalHilo.toFixed(2) },
                { label: "Total Bobina (m)", value: totalBobina.toFixed(2) },
                { label: "Tatami (cm²)", value: totalTatamiArea.toLocaleString() },
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

          {/* Desglose de costos */}
          {hayPrecios && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">Costo Total en Pesos</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Hilo", value: costoHilo, show: pHiloM > 0 },
                  { label: "Bobina", value: costoBobina, show: pBobinaM > 0 },
                  { label: "Tatami", value: costoTatami, show: pTatamiCm2 > 0 },
                  { label: "Tela Canasta", value: costoTelaCanasta, show: pTelaCanastaCm2 > 0 },
                  { label: "Tela Scrap", value: costoTelaScrap, show: pTelaScrapCm2 > 0 },
                  { label: "Velcro", value: costoVelcro, show: pVelcroCm2 > 0 },
                  { label: "Bordado (tiempo)", value: costoBordado, show: pMinBordado > 0 },
                  { label: "Diseño gráfico", value: costoDiseno, show: pHoraDiseno > 0 && Number(project.diseno_horas) > 0 },
                ].filter((r) => r.show).map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg border border-green-100 p-3 text-center">
                    <p className="text-base font-bold font-mono text-green-800">{fmt$(value)}</p>
                    <p className="text-xs text-green-600 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-green-200 pt-4 flex items-center justify-between">
                <p className="text-sm font-bold text-green-800">TOTAL</p>
                <p className="text-2xl font-bold font-mono text-green-800">{fmt$(costoTotal)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}