import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Plus, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const POSICIONES_DEFAULT = [
  { numero: 1, nombre: "FRENTE IZQUIERDO" },
  { numero: 2, nombre: "FRENTE DERECHO" },
  { numero: 3, nombre: "MANGA DERECHA" },
  { numero: 4, nombre: "MANGA IZQUIERDA" },
  { numero: 5, nombre: "ESPALDA" },
];

const TIPOS_TRABAJO = [
  ["bordado", "Bordado"], ["muestras", "Muestras"],
  ["estampado", "Estampado"], ["sublimado", "Sublimado"],
  ["costura", "Costura"], ["parche", "Parche"],
  ["riveteado", "Riveteado"], ["dtf", "DTF"],
];

const TALLAS = ["xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl"];

// Posiciones en la silueta de playera: coordenadas relativas al contenedor (%)
const SILUETA_ZONAS = {
  1: { top: "28%", left: "30%", label: "FI" },   // FRENTE IZQUIERDO
  2: { top: "28%", left: "55%", label: "FD" },   // FRENTE DERECHO
  3: { top: "28%", left: "72%", label: "MD" },   // MANGA DERECHA
  4: { top: "28%", left: "12%", label: "MI" },   // MANGA IZQUIERDA
  5: { top: "28%", left: "50%", label: "ESP" },  // ESPALDA (vista trasera, no se superpone)
};

function CheckBox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={onChange}
        className={cn(
          "w-4 h-4 border-2 rounded-sm flex items-center justify-center cursor-pointer transition-colors flex-shrink-0",
          checked ? "bg-blue-600 border-blue-600" : "border-gray-400 bg-white"
        )}
      >
        {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
      </div>
      <span className="text-sm">{label}</span>
    </label>
  );
}

function EspecRow({ row, onChange, onRemove, canRemove }) {
  return (
    <div className="border border-green-300 rounded-lg p-3 space-y-2 bg-green-50/30 relative">
      {canRemove && (
        <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-0.5 rounded hover:bg-red-100 text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="flex flex-wrap items-end gap-3 pr-6">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Tipo de Prenda</label>
          <Input value={row.tipo_prenda || ""} onChange={(e) => onChange("tipo_prenda", e.target.value)} placeholder="Playera..." className="w-32" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Color</label>
          <Input value={row.color_prenda || ""} onChange={(e) => onChange("color_prenda", e.target.value)} placeholder="Negro..." className="w-28" />
        </div>
        {TALLAS.map((t) => (
          <div key={t} className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium uppercase">{t}</label>
            <Input
              type="number" min="0"
              value={row.tallas?.[t] || ""}
              onChange={(e) => onChange("tallas", { ...(row.tallas || {}), [t]: Number(e.target.value) || 0 })}
              className="w-14 text-center"
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-xs font-bold text-green-700">Total Piezas</label>
          <Input
            type="number" min="0"
            value={row.total_piezas || ""}
            onChange={(e) => onChange("total_piezas", e.target.value)}
            className="w-24 font-bold text-center border-green-400 border-2"
          />
        </div>
      </div>
    </div>
  );
}

// Silueta de playera con imágenes superpuestas en posiciones (solo frente: 1,2,3,4)
const FRENTE_URL = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/6b6aec754_frente.png";
const ESPALDA_URL = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/173365721_espalda.png";

function TshirtPreview({ posiciones }) {
  const espalda = posiciones.find(p => p.numero === 5);

  return (
    <div className="flex gap-10 justify-center items-start py-2">
      {/* Vista Frontal */}
      <div className="text-center flex-1 max-w-sm">
        <p className="text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Vista Frontal</p>
        <div className="relative inline-block w-full">
          <img src={FRENTE_URL} alt="Frente" className="w-full object-contain" />
          {posiciones.find(p => p.numero === 1)?.imagen_url && (
            <img src={posiciones.find(p => p.numero === 1).imagen_url} alt="FI" className="absolute object-contain rounded" style={{ top: "32%", left: "50%", width: "26%", height: "26%", pointerEvents: "none" }} />
          )}
          {posiciones.find(p => p.numero === 2)?.imagen_url && (
            <img src={posiciones.find(p => p.numero === 2).imagen_url} alt="FD" className="absolute object-contain rounded" style={{ top: "32%", left: "24%", width: "26%", height: "26%", pointerEvents: "none" }} />
          )}
          {posiciones.find(p => p.numero === 3)?.imagen_url && (
            <img src={posiciones.find(p => p.numero === 3).imagen_url} alt="MD" className="absolute object-contain rounded" style={{ top: "30%", left: "3%", width: "20%", height: "20%", pointerEvents: "none" }} />
          )}
          {posiciones.find(p => p.numero === 4)?.imagen_url && (
            <img src={posiciones.find(p => p.numero === 4).imagen_url} alt="MI" className="absolute object-contain rounded" style={{ top: "30%", left: "77%", width: "20%", height: "20%", pointerEvents: "none" }} />
          )}
        </div>
      </div>

      {/* Vista Trasera */}
      <div className="text-center flex-1 max-w-sm">
        <p className="text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Vista Trasera</p>
        <div className="relative inline-block w-full">
          <img src={ESPALDA_URL} alt="Espalda" className="w-full object-contain" />
          {espalda?.imagen_url && (
            <img src={espalda.imagen_url} alt="ESP" className="absolute object-contain rounded" style={{ top: "22%", left: "22%", width: "56%", height: "50%", pointerEvents: "none" }} />
          )}
        </div>
      </div>
    </div>
  );
}

const emptyEspec = () => ({ tipo_prenda: "", color_prenda: "", tallas: {}, total_piezas: "" });

const emptyOrder = () => ({
  nombre_cliente: "",
  agente_ventas: "",
  fecha_orden: new Date().toISOString().split("T")[0],
  articulo_solicitado: "",
  telefono: "",
  observaciones: "",
  tipo_trabajo: {},
  especificaciones: [emptyEspec()],
  posiciones: POSICIONES_DEFAULT.map((p) => ({
    numero: p.numero, nombre: p.nombre, descripcion: "", imagen_url: "", color_hilos: [""],
    bobina_negra: false, bobina_blanca: false,
    extras: {},
  })),
  estado: "borrador",
});

export default function WorkOrderForm({ order, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = emptyOrder();
    if (!order) return base;
    return {
      ...base,
      ...order,
      especificaciones: order.especificaciones?.length
        ? order.especificaciones
        : (order.tipo_prenda !== undefined
            ? [{ tipo_prenda: order.tipo_prenda || "", color_prenda: order.color_prenda || "", tallas: order.tallas || {}, total_piezas: order.total_piezas || "" }]
            : [emptyEspec()]),
      posiciones: order.posiciones?.length
        ? order.posiciones.map((p) => ({
            ...p,
            color_hilos: p.color_hilos?.length ? p.color_hilos : [""],
            imagen_url: p.imagen_url || "",
            bobina_negra: p.bobina_negra ?? order.bobina_negra ?? false,
            bobina_blanca: p.bobina_blanca ?? order.bobina_blanca ?? false,
            extras: p.extras || (order.extras && Object.keys(order.extras).length ? order.extras : {}),
          }))
        : base.posiciones,
      tipo_trabajo: order.tipo_trabajo || {},
    };
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPos, setUploadingPos] = useState(null);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setNested = (field, key, value) => setForm((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), [key]: value } }));

  const updateEspec = (idx, field, value) =>
    setForm((prev) => {
      const especificaciones = [...prev.especificaciones];
      especificaciones[idx] = { ...especificaciones[idx], [field]: value };
      return { ...prev, especificaciones };
    });
  const addEspec = () => setForm((prev) => ({ ...prev, especificaciones: [...prev.especificaciones, emptyEspec()] }));
  const removeEspec = (idx) => setForm((prev) => ({ ...prev, especificaciones: prev.especificaciones.filter((_, i) => i !== idx) }));

  const setPosicion = (idx, field, value) =>
    setForm((prev) => {
      const posiciones = [...prev.posiciones];
      posiciones[idx] = { ...posiciones[idx], [field]: value };
      return { ...prev, posiciones };
    });

  const setPosicionNested = (posIdx, field, key, value) =>
    setForm((prev) => {
      const posiciones = [...prev.posiciones];
      posiciones[posIdx] = { ...posiciones[posIdx], [field]: { ...(posiciones[posIdx][field] || {}), [key]: value } };
      return { ...prev, posiciones };
    });

  const setPosicionHilo = (posIdx, hiloIdx, value) =>
    setForm((prev) => {
      const posiciones = [...prev.posiciones];
      const color_hilos = [...(posiciones[posIdx].color_hilos || [""])];
      color_hilos[hiloIdx] = value;
      posiciones[posIdx] = { ...posiciones[posIdx], color_hilos };
      return { ...prev, posiciones };
    });

  const addHilo = (posIdx) =>
    setForm((prev) => {
      const posiciones = [...prev.posiciones];
      posiciones[posIdx] = { ...posiciones[posIdx], color_hilos: [...(posiciones[posIdx].color_hilos || [""]), ""] };
      return { ...prev, posiciones };
    });

  const removeHilo = (posIdx, hiloIdx) =>
    setForm((prev) => {
      const posiciones = [...prev.posiciones];
      const color_hilos = posiciones[posIdx].color_hilos.filter((_, i) => i !== hiloIdx);
      posiciones[posIdx] = { ...posiciones[posIdx], color_hilos: color_hilos.length ? color_hilos : [""] };
      return { ...prev, posiciones };
    });

  const addPosicion = () =>
    setForm((prev) => {
      const nums = prev.posiciones.map(p => p.numero);
      const next = Math.max(...nums) + 1;
      return {
        ...prev,
        posiciones: [...prev.posiciones, {
          numero: next, nombre: `POSICIÓN ${next}`, descripcion: "", imagen_url: "", color_hilos: [""],
          bobina_negra: false, bobina_blanca: false, extras: {},
        }],
      };
    });

  const removePosicion = (idx) =>
    setForm((prev) => ({ ...prev, posiciones: prev.posiciones.filter((_, i) => i !== idx) }));

  const handlePosImageUpload = async (e, posIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPos(posIdx);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPosicion(posIdx, "imagen_url", file_url);
    setUploadingPos(null);
  };

  const generateFolio = async () => {
    const existing = await base44.entities.WorkOrder.list("-created_date", 1);
    const last = existing[0]?.folio || "OT-0000";
    const num = parseInt(last.replace("OT-", "") || "0") + 1;
    return `OT-${String(num).padStart(4, "0")}`;
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, folio: form.folio || await generateFolio() };
    let saved;
    if (order?.id) {
      saved = await base44.entities.WorkOrder.update(order.id, data);
    } else {
      saved = await base44.entities.WorkOrder.create(data);
    }
    setSaving(false);
    onSave(saved);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{order ? "Editar Orden de Trabajo" : "Nueva Orden de Trabajo"}</h1>
          <p className="text-xs text-muted-foreground font-mono">No. DOCUMENTO: CR-FTW-003-V01</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </Button>
      </div>

      {/* Encabezado cliente */}
      <div className="rounded-xl border-2 border-blue-300 bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Nombre Cliente</label>
            <Input value={form.nombre_cliente} onChange={(e) => set("nombre_cliente", e.target.value)} placeholder="Nombre del cliente..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Fecha de Orden</label>
            <Input type="date" value={form.fecha_orden} onChange={(e) => set("fecha_orden", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Agente de Ventas</label>
            <Input value={form.agente_ventas || ""} onChange={(e) => set("agente_ventas", e.target.value)} placeholder="Nombre del agente..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Teléfono</label>
            <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="Teléfono..." />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Artículo Solicitado</label>
            <Input value={form.articulo_solicitado} onChange={(e) => set("articulo_solicitado", e.target.value)} placeholder="Playera, gorra, uniforme..." />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border-2 border-green-400 p-4 space-y-2">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Tipo de Trabajo</p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_TRABAJO.map(([key, label]) => (
                <CheckBox key={key} label={label} checked={!!form.tipo_trabajo[key]} onChange={() => setNested("tipo_trabajo", key, !form.tipo_trabajo[key])} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 p-4 space-y-1">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Observaciones</p>
            <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} rows={5} placeholder="Observaciones adicionales..." className="resize-none text-sm" />
          </div>
        </div>
      </div>

      {/* Especificaciones */}
      <div className="rounded-xl border-2 border-green-400 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-green-700 uppercase tracking-widest">Especificaciones</p>
          <Button type="button" variant="outline" size="sm" onClick={addEspec} className="gap-1 text-green-700 border-green-400 hover:bg-green-50">
            <Plus className="w-3.5 h-3.5" /> Agregar modelo
          </Button>
        </div>
        {form.especificaciones.map((row, idx) => (
          <EspecRow key={idx} row={row} onChange={(field, value) => updateEspec(idx, field, value)} onRemove={() => removeEspec(idx)} canRemove={form.especificaciones.length > 1} />
        ))}
      </div>

      {/* Simulación de playera */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 px-6 pt-3 pb-4">
        <TshirtPreview posiciones={form.posiciones} />
      </div>

      {/* Posiciones */}
      <div className="rounded-xl border-2 border-blue-300 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Posiciones de Bordado / Estampado</p>
          <Button type="button" variant="outline" size="sm" onClick={addPosicion} className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50">
            <Plus className="w-3.5 h-3.5" /> Agregar posición
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {form.posiciones.map((pos, i) => (
            <div key={i} className="border-2 border-blue-200 rounded-lg p-3 space-y-2 relative">
              {/* Quitar posición (solo si hay más de 1) */}
              {form.posiciones.length > 1 && (
                <button type="button" onClick={() => removePosicion(i)} className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-red-100 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}

              <div className="bg-blue-600 text-white text-xs font-bold rounded px-2 py-1 text-center pr-6">
                POSICIÓN # {pos.numero}
              </div>
              {/* Nombre editable */}
              <Input
                value={pos.nombre}
                onChange={(e) => setPosicion(i, "nombre", e.target.value)}
                className="text-xs font-semibold text-center bg-green-50 border-green-300 text-green-800 h-7"
              />

              {/* Imagen */}
              {pos.imagen_url ? (
                <div className="relative">
                  <img src={pos.imagen_url} alt="pos" className="w-[80%] mx-auto rounded border border-blue-200 object-contain" />
                  <button type="button" onClick={() => setPosicion(i, "imagen_url", "")} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center gap-1 border border-dashed border-blue-300 rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition-colors text-blue-400",
                  uploadingPos === i && "opacity-50 pointer-events-none"
                )}>
                  {uploadingPos === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  <span className="text-[10px]">{uploadingPos === i ? "Subiendo..." : "Cargar imagen"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePosImageUpload(e, i)} disabled={uploadingPos !== null} />
                </label>
              )}

              <Textarea
                placeholder="Descripción..."
                value={pos.descripcion}
                onChange={(e) => setPosicion(i, "descripcion", e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />

              {/* Color de hilos */}
              <div className="space-y-1 border-t border-blue-100 pt-2">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Color de Hilo</p>
                {pos.color_hilos.map((c, hi) => (
                  <div key={hi} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm border border-gray-400 bg-white flex-shrink-0" />
                    <Input value={c} onChange={(e) => setPosicionHilo(i, hi, e.target.value)} placeholder="Color..." className="text-xs h-6 flex-1" />
                    {pos.color_hilos.length > 1 && (
                      <button type="button" onClick={() => removeHilo(i, hi)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addHilo(i)} className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5">
                  <Plus className="w-3 h-3" /> agregar color
                </button>
              </div>

              {/* Bobina por posición */}
              <div className="space-y-1 border-t border-blue-100 pt-2">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Bobina</p>
                <CheckBox label="Negra" checked={!!pos.bobina_negra} onChange={() => setPosicion(i, "bobina_negra", !pos.bobina_negra)} />
                <CheckBox label="Blanca" checked={!!pos.bobina_blanca} onChange={() => setPosicion(i, "bobina_blanca", !pos.bobina_blanca)} />
              </div>

              {/* Extras por posición */}
              <div className="space-y-1 border-t border-orange-100 pt-2">
                <p className="text-[10px] font-bold text-orange-600 uppercase">Extras</p>
                {[["foamy","Foamy"],["velcro_macho","Velcro macho"],["velcro_hembra","Velcro hembra"],["adhesivo_termico","Adhesivo térmico"]].map(([key, label]) => (
                  <CheckBox key={key} label={label} checked={!!pos.extras?.[key]} onChange={() => setPosicionNested(i, "extras", key, !pos.extras?.[key])} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estado */}
      <div className="rounded-xl border-2 border-gray-200 bg-card p-5">
        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Estado de la Orden</p>
        <div className="flex flex-wrap gap-4">
          {[["borrador","Borrador"],["enviada","Enviada"],["produccion","En Producción"],["completada","Completada"]].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="estado" value={val} checked={form.estado === val} onChange={() => set("estado", val)} className="accent-blue-600" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}