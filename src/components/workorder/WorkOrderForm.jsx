import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Plus, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import TshirtPreviewInteractive, { DEFAULT_LAYOUT } from "./TshirtPreviewInteractive";
import GarmentPicker from "./GarmentPicker";
import HiloColorPicker from "./HiloColorPicker";
import VinilColorPicker from "./VinilColorPicker";
import EspecRow from "./EspecRow";
import LogoPicker from "./LogoPicker";

// TshirtPreview removido — ahora en TshirtPreviewInteractive.jsx

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





const EXTRAS_LIST = [["foamy","Foamy"],["velcro_macho","Velcro macho"],["velcro_hembra","Velcro hembra"],["adhesivo_termico","Adhesivo térmico"]];

function ExtrasCollapsible({ extras, onChange }) {
  const [open, setOpen] = useState(false);
  const activeCount = EXTRAS_LIST.filter(([key]) => !!extras?.[key]).length;
  return (
    <div className="border-t border-orange-100 pt-2">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-1 w-full text-left">
        <p className="text-[10px] font-bold text-orange-600 uppercase flex-1">
          Extras {activeCount > 0 && <span className="bg-orange-500 text-white rounded-full px-1 ml-1">{activeCount}</span>}
        </p>
        <ChevronDown className={cn("w-3 h-3 text-orange-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {EXTRAS_LIST.map(([key, label]) => (
            <CheckBox key={key} label={label} checked={!!extras?.[key]} onChange={() => onChange(key, !extras?.[key])} />
          ))}
        </div>
      )}
    </div>
  );
}

const emptyEspec = (base = {}) => ({ tipo_prenda: "", color_prenda: "", modelo: "", marca: "", tallas: {}, total_piezas: 0, ...base });

const emptyOrder = () => ({
  nombre_cliente: "",
  agente_ventas: "",
  fecha_orden: new Date().toISOString().split("T")[0],
  articulo_solicitado: "",
  telefono: "",
  observaciones: "",
  tipo_trabajo: {},
  especificaciones: [emptyEspec()],
  posiciones: [],
  estado: "borrador",
  cliente_id: "",
  rfc: "",
  cp: "",
  tipo_regimen: "",
  uso_factura: "",
  requiere_factura: false,
  forma_pago: "",
});

// ─── Client Autocomplete ───────────────────────────────────────────────────────
function ClientSearch({ value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [clients, setClients] = useState([]);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    base44.entities.Client.list("nombre", 200).then(setClients);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(clients.filter(c =>
      c.nombre?.toLowerCase().includes(q) ||
      c.rfc?.toLowerCase().includes(q) ||
      c.folio_id?.toLowerCase().includes(q)
    ).slice(0, 6));
  }, [query, clients]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (client) => {
    setQuery(client.nombre);
    setOpen(false);
    onSelect(client);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onSelect(null); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente por nombre, RFC o ID..."
          className="h-8 text-xs pl-8"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {results.map(c => (
            <button key={c.id} type="button" onClick={() => handleSelect(c)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{c.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{c.folio_id} {c.rfc ? `· RFC: ${c.rfc}` : ""}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkOrderForm({ order, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = {
      ...emptyOrder(),
      // Si es nueva orden, inicializa con posiciones por defecto
      posiciones: POSICIONES_DEFAULT.map(p => ({
        ...p,
        descripcion: "",
        imagen_url: "",
        color_hilos: [""],
        bobina_negra: false,
        bobina_blanca: false,
        extras: {},
        alto_cm: 0,
        ancho_cm: 0,
      })),
    };
    if (!order) return base;
    return {
      ...base,
      ...order,
      especificaciones: order.especificaciones?.length
        ? order.especificaciones.map(e => emptyEspec(e))
        : (order.tipo_prenda !== undefined
            ? [emptyEspec({ tipo_prenda: order.tipo_prenda || "", color_prenda: order.color_prenda || "", tallas: order.tallas || {}, total_piezas: order.total_piezas || 0 })]
            : [emptyEspec()]),
      posiciones: order.posiciones?.length
        ? order.posiciones.map((p) => ({
            ...p,
            color_hilos: p.color_hilos?.length ? p.color_hilos : [""],
            imagen_url: p.imagen_url || "",
            bobina_negra: p.bobina_negra ?? order.bobina_negra ?? false,
            bobina_blanca: p.bobina_blanca ?? order.bobina_blanca ?? false,
            extras: p.extras || (order.extras && Object.keys(order.extras).length ? order.extras : {}),
            alto_cm: p.alto_cm ?? 0,
            ancho_cm: p.ancho_cm ?? 0,
          }))
        : base.posiciones,
      tipo_trabajo: order.tipo_trabajo || {},
    };
  });
  const [saving, setSaving] = useState(false);
  const [logoCatalog, setLogoCatalog] = useState([]);

  // Carga el catálogo de logos una sola vez para todas las posiciones
  useEffect(() => {
    base44.entities.LogoCatalog.list("nombre").then(setLogoCatalog);
  }, []);

  // Cuando una posición guarda un logo nuevo/editado, actualiza el catálogo compartido
  const handleLogoCatalogUpdate = useCallback((savedLogo) => {
    setLogoCatalog((prev) => {
      const exists = prev.find((l) => l.id === savedLogo.id);
      if (exists) return prev.map((l) => l.id === savedLogo.id ? savedLogo : l);
      return [...prev, savedLogo].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }, []);
  const [previewLayout, setPreviewLayout] = useState(() => ({
    ...DEFAULT_LAYOUT,
    ...(order?.preview_layout || {}),
  }));
  const [selectedGarment, setSelectedGarment] = useState(() =>
    order?.garment_frente_url
      ? {
          frente_url: order.garment_frente_url,
          espalda_url: order.garment_espalda_url,
          titulo: order.garment_titulo,
          es_gorra: order.garment_es_gorra || false,
          lateral_izq_url: order.garment_lateral_izq_url || "",
          lateral_der_url: order.garment_lateral_der_url || "",
        }
      : null
  );

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setNested = (field, key, value) => setForm((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), [key]: value } }));

  const updateEspec = (idx, field, value) =>
    setForm((prev) => {
      const especificaciones = prev.especificaciones.map((e, i) => {
        if (i !== idx) return e;
        const updated = { ...e, [field]: field === "total_piezas" ? Number(value) || 0 : value };
        if (field === "tallas") {
          updated.total_piezas = Object.values(value).reduce((sum, v) => sum + (Number(v) || 0), 0);
        }
        return updated;
      });
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
      const next = Math.max(...(nums.length ? nums : [0])) + 1;
      // Usa nombres de POSICIONES_DEFAULT si existen, sino genera
      const defaultName = POSICIONES_DEFAULT.find(p => p.numero === next)?.nombre || `POSICIÓN ${next}`;
      return {
        ...prev,
        posiciones: [...prev.posiciones, {
          numero: next, nombre: defaultName, descripcion: "", imagen_url: "", color_hilos: [""],
          bobina_negra: false, bobina_blanca: false, extras: {},
          alto_cm: 0, ancho_cm: 0,
        }],
      };
    });

  const removePosicion = (idx) =>
    setForm((prev) => ({ ...prev, posiciones: prev.posiciones.filter((_, i) => i !== idx) }));

  const generateFolio = async () => {
    const existing = await base44.entities.WorkOrder.list("-created_date", 1);
    const last = existing[0]?.folio || "OT-0000";
    const num = parseInt(last.replace("OT-", "") || "0") + 1;
    return `OT-${String(num).padStart(4, "0")}`;
  };

  const handleSave = async () => {
    setSaving(true);
    // Asegura que preview_layout tenga valores por defecto si está vacío
    const finalLayout = Object.keys(previewLayout).length > 0 ? previewLayout : DEFAULT_LAYOUT;
    const data = {
      ...form,
      folio: form.folio || await generateFolio(),
      preview_layout: finalLayout,
      // Sanitiza especificaciones: convierte total_piezas a número
      especificaciones: form.especificaciones.map(e => ({
        ...e,
        total_piezas: Number(e.total_piezas) || 0,
      })),
      posiciones: form.posiciones.length > 0 ? form.posiciones : POSICIONES_DEFAULT.map(p => ({
        ...p,
        descripcion: "",
        imagen_url: "",
        color_hilos: [""],
        bobina_negra: false,
        bobina_blanca: false,
        extras: {},
        alto_cm: 0,
        ancho_cm: 0,
      })),
      garment_frente_url: selectedGarment?.frente_url || form.garment_frente_url || "",
      garment_espalda_url: selectedGarment?.espalda_url || form.garment_espalda_url || "",
      garment_titulo: selectedGarment?.titulo || form.garment_titulo || "",
      garment_es_gorra: selectedGarment?.es_gorra || false,
      garment_lateral_izq_url: selectedGarment?.lateral_izq_url || "",
      garment_lateral_der_url: selectedGarment?.lateral_der_url || "",
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
      <div className="rounded-xl border-2 border-blue-300 bg-card p-4 space-y-3">
        {/* Buscador de cliente */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Buscar Cliente</label>
          <ClientSearch
            value={form.nombre_cliente}
            onSelect={(client) => {
              if (!client) return;
              setForm(prev => ({
                ...prev,
                nombre_cliente: client.nombre,
                cliente_id: client.id,
                rfc: client.rfc || "",
                cp: client.cp || "",
                tipo_regimen: client.tipo_regimen || "",
                uso_factura: client.uso_factura || "",
                telefono: prev.telefono || client.tel_celular || "",
              }));
            }}
          />
        </div>

        {/* Fila 1: datos básicos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Nombre Cliente</label>
            <Input value={form.nombre_cliente} onChange={(e) => set("nombre_cliente", e.target.value)} placeholder="Nombre del cliente..." className="h-8 text-xs" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Teléfono</label>
            <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="Teléfono..." className="h-8 text-xs" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Agente de Ventas</label>
            <Input value={form.agente_ventas || ""} onChange={(e) => set("agente_ventas", e.target.value)} placeholder="Nombre del agente..." className="h-8 text-xs" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Fecha de Orden</label>
            <Input type="date" value={form.fecha_orden} onChange={(e) => set("fecha_orden", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        {/* Fila 2: datos fiscales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">RFC</label>
            <Input value={form.rfc || ""} onChange={(e) => set("rfc", e.target.value.toUpperCase())} placeholder="RFC..." className="h-8 text-xs font-mono" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">C.P.</label>
            <Input value={form.cp || ""} onChange={(e) => set("cp", e.target.value)} placeholder="C.P..." className="h-8 text-xs" maxLength={5} />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Régimen Fiscal</label>
            <Input value={form.tipo_regimen || ""} onChange={(e) => set("tipo_regimen", e.target.value)} placeholder="Régimen fiscal..." className="h-8 text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Uso de Factura (CFDI)</label>
            <Input value={form.uso_factura || ""} onChange={(e) => set("uso_factura", e.target.value)} placeholder="Uso de CFDI..." className="h-8 text-xs" />
          </div>
          {/* Requiere Factura + Forma de Pago */}
          <div className="flex gap-4 items-end">
            <div className="space-y-0.5 flex-1">
              <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Requiere Factura</label>
              <div className="flex gap-2">
                {[["true", "Sí"], ["false", "No"]].map(([val, lbl]) => (
                  <button key={val} type="button"
                    onClick={() => set("requiere_factura", val === "true")}
                    className={cn(
                      "flex-1 h-8 text-xs font-semibold rounded-md border-2 transition-all",
                      String(form.requiere_factura) === val
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-card border-border text-muted-foreground hover:border-blue-300"
                    )}
                  >{lbl}</button>
                ))}
              </div>
            </div>
            <div className="space-y-0.5 flex-1">
              <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Forma de Pago</label>
              <div className="flex gap-2">
                {["Efectivo", "Transferencia"].map((op) => (
                  <button key={op} type="button"
                    onClick={() => set("forma_pago", op)}
                    className={cn(
                      "flex-1 h-8 text-xs font-semibold rounded-md border-2 transition-all",
                      form.forma_pago === op
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-card border-border text-muted-foreground hover:border-blue-300"
                    )}
                  >{op}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de prenda + Vista previa */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 px-6 pt-4 pb-5 space-y-4">
        <GarmentPicker
          selectedId={selectedGarment?.id || null}
          onSelect={(g) => setSelectedGarment(g)}
        />
        <TshirtPreviewInteractive
          posiciones={form.posiciones}
          layout={previewLayout}
          onLayoutChange={setPreviewLayout}
          frenteUrl={selectedGarment?.frente_url || form.garment_frente_url}
          espaldaUrl={selectedGarment?.espalda_url || form.garment_espalda_url}
          latIzqUrl={selectedGarment?.lateral_izq_url || form.garment_lateral_izq_url}
          latDerUrl={selectedGarment?.lateral_der_url || form.garment_lateral_der_url}
          esGorra={selectedGarment?.es_gorra || false}
        />
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

              {/* Logo / Imagen — catálogo compartido de logos */}
              <LogoPicker
                posicion={pos}
                logos={logoCatalog}
                onLogoCatalogUpdate={handleLogoCatalogUpdate}
                onChange={(logoFields) =>
                  setForm((prev) => {
                    const posiciones = [...prev.posiciones];
                    posiciones[i] = { ...posiciones[i], ...logoFields };
                    return { ...prev, posiciones };
                  })
                }
              />

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
                    <HiloColorPicker
                      value={c}
                      onChange={(val) => setPosicionHilo(i, hi, val)}
                      placeholder="Código o nombre..."
                    />
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
              <div className="border-t border-blue-100 pt-2">
                <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Bobina</p>
                <div className="flex items-center gap-3">
                  <CheckBox label="Negra" checked={!!pos.bobina_negra} onChange={() => setPosicion(i, "bobina_negra", !pos.bobina_negra)} />
                  <CheckBox label="Blanca" checked={!!pos.bobina_blanca} onChange={() => setPosicion(i, "bobina_blanca", !pos.bobina_blanca)} />
                </div>
              </div>

              {/* Vinil Textil por posición */}
              <div className="border-t border-purple-100 pt-2">
                <p className="text-[10px] font-bold text-purple-700 uppercase mb-1">Vinil Textil</p>
                <VinilColorPicker
                  value={pos.vinil_codigo || ""}
                  onChange={(val) => setPosicion(i, "vinil_codigo", val)}
                  placeholder="Código o color vinil..."
                />
              </div>

              {/* Extras por posición — colapsable */}
              <ExtrasCollapsible
                extras={pos.extras || {}}
                onChange={(key, val) => setPosicionNested(i, "extras", key, val)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tipo de Trabajo + Observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-green-400 bg-card p-4 space-y-2">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Tipo de Trabajo</p>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_TRABAJO.map(([key, label]) => (
              <CheckBox key={key} label={label} checked={!!form.tipo_trabajo[key]} onChange={() => setNested("tipo_trabajo", key, !form.tipo_trabajo[key])} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-card p-4 space-y-1">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Observaciones</p>
          <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} rows={5} placeholder="Observaciones adicionales..." className="resize-none text-sm" />
        </div>
      </div>

      {/* Especificaciones */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.especificaciones.map((row, idx) => (
            <EspecRow key={idx} row={row} onChange={(field, value) => updateEspec(idx, field, value)} onRemove={() => removeEspec(idx)} canRemove={form.especificaciones.length > 1} />
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEspec} className="gap-1 text-green-700 border-green-400 hover:bg-green-50 w-full">
          <Plus className="w-3.5 h-3.5" /> Agregar modelo de prenda
        </Button>
      </div>

    </div>
  );
}