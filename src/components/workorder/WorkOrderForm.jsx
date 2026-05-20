import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const POSICIONES = [
  { numero: 1, nombre: "FRENTE IZQUIERDO" },
  { numero: 2, nombre: "FRENTE DERECHO" },
  { numero: 3, nombre: "MANGA DERECHA" },
  { numero: 4, nombre: "MANGA IZQUIERDA" },
  { numero: 5, nombre: "ESPALDA" },
];

const TIPOS_TRABAJO = [
  ["bordado", "Bordado"],
  ["muestras", "Muestras"],
  ["estampado", "Estampado"],
  ["sublimado", "Sublimado"],
  ["costura", "Costura"],
  ["parche", "Parche"],
  ["riveteado", "Riveteado"],
  ["dtf", "DTF"],
];

const TALLAS = ["xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl"];

function CheckBox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={onChange}
        className={cn(
          "w-4 h-4 border-2 rounded-sm flex items-center justify-center cursor-pointer transition-colors",
          checked ? "bg-blue-600 border-blue-600" : "border-gray-400 bg-white"
        )}
      >
        {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
      </div>
      <span className="text-sm">{label}</span>
    </label>
  );
}

const emptyOrder = {
  nombre_cliente: "",
  fecha_orden: new Date().toISOString().split("T")[0],
  articulo_solicitado: "",
  telefono: "",
  observaciones: "",
  tipo_trabajo: {},
  tipo_prenda: "",
  color_prenda: "",
  tallas: {},
  total_piezas: "",
  posiciones: POSICIONES.map((p) => ({ numero: p.numero, nombre: p.nombre, descripcion: "" })),
  color_hilos: ["", ""],
  bobina_color: "",
  bobina_negra: false,
  bobina_blanca: false,
  extras: {},
  estado: "borrador",
};

export default function WorkOrderForm({ order, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...emptyOrder,
    ...(order || {}),
    posiciones: order?.posiciones?.length
      ? order.posiciones
      : POSICIONES.map((p) => ({ numero: p.numero, nombre: p.nombre, descripcion: "" })),
    color_hilos: order?.color_hilos?.length ? order.color_hilos : ["", ""],
    tallas: order?.tallas || {},
    tipo_trabajo: order?.tipo_trabajo || {},
    extras: order?.extras || {},
  }));
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setNested = (field, key, value) =>
    setForm((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), [key]: value } }));

  const setPosicion = (index, value) =>
    setForm((prev) => {
      const posiciones = [...prev.posiciones];
      posiciones[index] = { ...posiciones[index], descripcion: value };
      return { ...prev, posiciones };
    });

  const setHilo = (index, value) =>
    setForm((prev) => {
      const color_hilos = [...prev.color_hilos];
      color_hilos[index] = value;
      return { ...prev, color_hilos };
    });

  const generateFolio = async () => {
    const existing = await base44.entities.WorkOrder.list("-created_date", 1);
    const last = existing[0]?.folio || "OT-0000";
    const num = parseInt(last.replace("OT-", "") || "0") + 1;
    return `OT-${String(num).padStart(4, "0")}`;
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      total_piezas: Number(form.total_piezas) || 0,
      folio: form.folio || await generateFolio(),
    };
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
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Artículo Solicitado</label>
            <Input value={form.articulo_solicitado} onChange={(e) => set("articulo_solicitado", e.target.value)} placeholder="Playera, gorra, uniforme..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Teléfono</label>
            <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="Teléfono..." />
          </div>
        </div>

        {/* Tipo de trabajo + observaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border-2 border-green-400 p-4 space-y-2">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Tipo de Trabajo</p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_TRABAJO.map(([key, label]) => (
                <CheckBox
                  key={key}
                  label={label}
                  checked={!!form.tipo_trabajo[key]}
                  onChange={() => setNested("tipo_trabajo", key, !form.tipo_trabajo[key])}
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 p-4 space-y-1">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Observaciones</p>
            <Textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              rows={5}
              placeholder="Observaciones adicionales..."
              className="resize-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Especificaciones */}
      <div className="rounded-xl border-2 border-green-400 bg-card p-5 space-y-3">
        <p className="text-center text-sm font-bold text-green-700 uppercase tracking-widest">Especificaciones</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Tipo de Prenda</label>
            <Input value={form.tipo_prenda} onChange={(e) => set("tipo_prenda", e.target.value)} placeholder="Playera..." className="w-32" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Color</label>
            <Input value={form.color_prenda} onChange={(e) => set("color_prenda", e.target.value)} placeholder="Negro..." className="w-28" />
          </div>
          {TALLAS.map((t) => (
            <div key={t} className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium uppercase">{t}</label>
              <Input
                type="number"
                min="0"
                value={form.tallas[t] || ""}
                onChange={(e) => setNested("tallas", t, Number(e.target.value) || 0)}
                className="w-14 text-center"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Otras Tallas</label>
            <Input
              value={form.tallas?.otras || ""}
              onChange={(e) => setNested("tallas", "otras", e.target.value)}
              placeholder="XS-XXL..."
              className="w-28"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-green-700">Total Piezas</label>
            <Input
              type="number"
              min="0"
              value={form.total_piezas || ""}
              onChange={(e) => set("total_piezas", e.target.value)}
              className="w-24 font-bold text-center border-green-400 border-2"
            />
          </div>
        </div>
      </div>

      {/* Posiciones */}
      <div className="rounded-xl border-2 border-blue-300 bg-card p-5 space-y-3">
        <p className="text-sm font-bold text-blue-700 uppercase tracking-wider text-center">Posiciones de Bordado / Estampado</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {form.posiciones.map((pos, i) => (
            <div key={i} className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
              <div className="bg-blue-600 text-white text-xs font-bold rounded px-2 py-1 text-center">
                POSICIÓN # {pos.numero}
              </div>
              <div className="bg-green-100 text-green-800 text-xs font-semibold rounded px-2 py-1 text-center border border-green-300">
                {pos.nombre}
              </div>
              <Textarea
                placeholder="Descripción..."
                value={pos.descripcion}
                onChange={(e) => setPosicion(i, e.target.value)}
                rows={4}
                className="text-xs resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer: color hilos + extras */}
      <div className="rounded-xl border-2 border-blue-300 bg-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Color de hilos */}
          <div className="border-2 border-blue-400 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase">Color de Hilos</p>
            {form.color_hilos.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border border-gray-400 bg-white flex-shrink-0" />
                <Input
                  value={c}
                  onChange={(e) => setHilo(i, e.target.value)}
                  placeholder={`Color ${i + 1}...`}
                  className="text-xs h-7"
                />
              </div>
            ))}
            <p className="text-xs font-bold text-blue-700 uppercase mt-2">Bobina</p>
            <CheckBox label="Negra" checked={!!form.bobina_negra} onChange={() => set("bobina_negra", !form.bobina_negra)} />
            <CheckBox label="Blanca" checked={!!form.bobina_blanca} onChange={() => set("bobina_blanca", !form.bobina_blanca)} />
            <Input value={form.bobina_color} onChange={(e) => set("bobina_color", e.target.value)} placeholder="Otro color bobina..." className="text-xs h-7 mt-1" />
          </div>

          {/* Extras */}
          <div className="border-2 border-orange-300 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-orange-600 uppercase">Extras</p>
            {[
              ["foamy", "Foamy"],
              ["velcro_macho", "Velcro macho"],
              ["velcro_hembra", "Velcro hembra"],
              ["adhesivo_termico", "Adesivo térmico"],
            ].map(([key, label]) => (
              <CheckBox
                key={key}
                label={label}
                checked={!!form.extras[key]}
                onChange={() => setNested("extras", key, !form.extras[key])}
              />
            ))}
          </div>

          {/* Estado */}
          <div className="border-2 border-gray-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase">Estado de la Orden</p>
            {[
              ["borrador", "Borrador"],
              ["enviada", "Enviada"],
              ["produccion", "En Producción"],
              ["completada", "Completada"],
            ].map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="estado"
                  value={val}
                  checked={form.estado === val}
                  onChange={() => set("estado", val)}
                  className="accent-blue-600"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}