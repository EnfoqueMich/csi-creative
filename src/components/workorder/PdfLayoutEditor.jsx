import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye, EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PDF_CONFIG = {
  mostrar_encabezado: true,
  mostrar_tipo_trabajo: true,
  mostrar_observaciones: true,
  mostrar_especificaciones: true,
  mostrar_vista_prenda: true,
  mostrar_posiciones: true,
  mostrar_firma: true,
  color_encabezado: "#1e40af",      // azul oscuro
  color_tipo_trabajo: "#16a34a",    // verde
  color_posiciones: "#1d4ed8",      // azul
  color_firma: "#1d4ed8",           // azul
  fuente_tamanio: "11px",           // tamaño base del PDF
  columnas_posiciones: 5,           // cuántas columnas en posiciones
  mostrar_folio: true,
  numero_documento: "CR-FTW-003-V01",
};

const SECCIONES = [
  { key: "mostrar_encabezado",       label: "Encabezado (logo, empresa, folio)" },
  { key: "mostrar_tipo_trabajo",     label: "Tipo de Trabajo + Observaciones" },
  { key: "mostrar_especificaciones", label: "Especificaciones (tallas)" },
  { key: "mostrar_vista_prenda",     label: "Vista de Prenda (imagen)" },
  { key: "mostrar_posiciones",       label: "Posiciones de Bordado/Estampado" },
  { key: "mostrar_firma",            label: "Firma del Cliente" },
];

const COLOR_FIELDS = [
  { key: "color_encabezado",   label: "Color línea encabezado" },
  { key: "color_tipo_trabajo", label: "Color sección Tipo de Trabajo" },
  { key: "color_posiciones",   label: "Color sección Posiciones" },
  { key: "color_firma",        label: "Color sección Firma" },
];

export default function PdfLayoutEditor() {
  const [cfg, setCfg] = useState(DEFAULT_PDF_CONFIG);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.OrderSettings.list().then((list) => {
      if (list.length > 0) {
        setRecordId(list[0].id);
        const saved = list[0].pdf_config;
        if (saved) setCfg({ ...DEFAULT_PDF_CONFIG, ...saved });
      }
      setLoading(false);
    });
  }, []);

  const set = (field, value) => setCfg((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    if (recordId) {
      await base44.entities.OrderSettings.update(recordId, { pdf_config: cfg });
    } else {
      const saved = await base44.entities.OrderSettings.create({ pdf_config: cfg });
      setRecordId(saved.id);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">

      {/* Secciones visibles */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Secciones del PDF</p>
        <p className="text-xs text-muted-foreground">Activa o desactiva cada sección para controlar qué aparece en el documento impreso.</p>
        <div className="space-y-2">
          {SECCIONES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                <span className="text-sm">{label}</span>
              </div>
              <button
                type="button"
                onClick={() => set(key, !cfg[key])}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                  cfg[key]
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cfg[key] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {cfg[key] ? "Visible" : "Oculto"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Colores */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Colores del Documento</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cfg[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-9 h-9 rounded border border-border cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-muted-foreground">{cfg[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tipografía y layout */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tipografía y Layout</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Tamaño de fuente base del PDF</label>
            <select
              value={cfg.fuente_tamanio}
              onChange={(e) => set("fuente_tamanio", e.target.value)}
              className="w-full border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="9px">Pequeña (9px)</option>
              <option value="10px">Compacta (10px)</option>
              <option value="11px">Normal (11px)</option>
              <option value="12px">Grande (12px)</option>
              <option value="13px">Extra grande (13px)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Columnas en sección Posiciones</label>
            <select
              value={cfg.columnas_posiciones}
              onChange={(e) => set("columnas_posiciones", Number(e.target.value))}
              className="w-full border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {[2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} columnas</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Número de documento</label>
            <input
              type="text"
              value={cfg.numero_documento}
              onChange={(e) => set("numero_documento", e.target.value)}
              className="w-full border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="CR-FTW-003-V01"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Mostrar folio en encabezado</label>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => set("mostrar_folio", true)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors", cfg.mostrar_folio ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground")}
              >Sí</button>
              <button
                type="button"
                onClick={() => set("mostrar_folio", false)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors", !cfg.mostrar_folio ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground")}
              >No</button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview rápido */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-3">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Vista Previa del Encabezado</p>
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: cfg.color_encabezado }}>
          <div className="flex items-start justify-between px-4 pt-3 pb-2" style={{ borderBottom: `2px solid ${cfg.color_encabezado}` }}>
            <div className="flex items-center gap-1">
              <div className="bg-yellow-600 text-white font-black text-lg px-1.5 py-0.5 rounded-sm">C</div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-xs tracking-widest" style={{ color: cfg.color_encabezado }}>CSI</span>
                <span className="text-[9px] tracking-widest text-gray-500 font-semibold">CREATIVE</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-yellow-600">ORDEN DE TRABAJO</p>
              <p className="text-[9px] text-gray-500 font-mono">No. DOC: {cfg.numero_documento}</p>
              {cfg.mostrar_folio && <p className="text-[9px] text-gray-500 font-mono">OT-0001</p>}
            </div>
          </div>
          <div className="px-4 py-2 text-[10px] text-muted-foreground">
            <span className="font-semibold">Secciones activas:</span>{" "}
            {SECCIONES.filter(s => cfg[s.key]).map(s => s.label.split("(")[0].trim()).join(" • ")}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar diseño del PDF
      </Button>
    </div>
  );
}