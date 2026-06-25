import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Plus, X, ChevronDown, Search, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_LAYOUT } from "./TshirtPreviewInteractive";
import EspecRow from "./EspecRow";
import GarmentDesignBlock from "./GarmentDesignBlock";

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

const USOS_CFDI = [
  { value: "", label: "Seleccionar uso de CFDI..." },
  { value: "G01 - Adquisición de mercancías", label: "G01 - Adquisición de mercancías" },
  { value: "G02 - Devoluciones, descuentos o bonificaciones", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03 - Gastos en general", label: "G03 - Gastos en general" },
  { value: "D01 - Honorarios médicos, dentales y gastos hospitalarios", label: "D01 - Honorarios médicos, dentales y hospitalarios" },
  { value: "D04 - Donativos", label: "D04 - Donativos" },
  { value: "D10 - Pagos por servicios educativos (colegiaturas)", label: "D10 - Pagos por servicios educativos (colegiaturas)" },
  { value: "I01 - Construcciones", label: "I01 - Construcciones" },
  { value: "I02 - Mobiliario y equipo de oficina", label: "I02 - Mobiliario y equipo de oficina" },
  { value: "I03 - Equipo de transporte", label: "I03 - Equipo de transporte" },
  { value: "I04 - Equipo de cómputo y accesorios", label: "I04 - Equipo de cómputo y accesorios" },
  { value: "P01 - Por definir", label: "P01 - Por definir" },
];

const REGIMENES_FISCALES = [
  { value: "", label: "Seleccionar régimen fiscal..." },
  { value: "601 - General de Ley Personas Morales", label: "601 - General de Ley Personas Morales" },
  { value: "603 - Personas Morales con Fines no Lucrativos", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605 - Sueldos y Salarios e Ingresos Asimilados", label: "605 - Sueldos y Salarios e Ingresos Asimilados" },
  { value: "606 - Arrendamiento", label: "606 - Arrendamiento" },
  { value: "612 - Personas Físicas con Actividades Empresariales", label: "612 - Personas Físicas con Actividades Empresariales" },
  { value: "616 - Sin obligaciones fiscales", label: "616 - Sin obligaciones fiscales" },
  { value: "621 - Incorporación Fiscal", label: "621 - Incorporación Fiscal" },
  { value: "626 - Régimen Simplificado de Confianza (RESICO)", label: "626 - Régimen Simplificado de Confianza (RESICO)" },
];

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

const emptyEspec = (base = {}) => ({ tipo_prenda: "", color_prenda: "", modelo: "", marca: "", tallas: {}, total_piezas: 0, ...base });

function makeDefaultDiseno(id) {
  return {
    id: id || `d-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    titulo: "",
    // titulo es el nombre que escribe el usuario en el campo "Nombre del diseño"
    garment_frente_url: "",
    garment_espalda_url: "",
    garment_titulo: "",
    garment_es_gorra: false,
    garment_lateral_izq_url: "",
    garment_lateral_der_url: "",
    garment_id: null,
    preview_layout: { ...DEFAULT_LAYOUT },
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
}

const emptyOrder = () => ({
  nombre_cliente: "",
  agente_ventas: "",
  fecha_orden: new Date().toISOString().split("T")[0],
  telefono: "",
  observaciones: "",
  tipo_trabajo: {},
  especificaciones: [emptyEspec()],
  estado: "borrador",
  cliente_id: "",
  rfc: "",
  cp: "",
  tipo_regimen: "",
  uso_factura: "",
  requiere_factura: false,
  forma_pago: "",
});

// Migra órdenes antiguas que tenían un solo diseño a la nueva estructura
function migrateOrder(order) {
  if (order?.disenos?.length) return order.disenos.map(d => ({ ...d, titulo: d.titulo || "", annotations: d.annotations || [] }));
  // Orden antigua: un solo diseño
  return [
    {
      id: `d-migrated`,
      titulo: order?.garment_titulo || "",
      garment_frente_url: order?.garment_frente_url || "",
      garment_espalda_url: order?.garment_espalda_url || "",
      garment_titulo: order?.garment_titulo || "",
      garment_es_gorra: order?.garment_es_gorra || false,
      garment_lateral_izq_url: order?.garment_lateral_izq_url || "",
      garment_lateral_der_url: order?.garment_lateral_der_url || "",
      garment_id: null,
      annotations: [],
      preview_layout: order?.preview_layout ? { ...DEFAULT_LAYOUT, ...order.preview_layout } : { ...DEFAULT_LAYOUT },
      posiciones: order?.posiciones?.length
        ? order.posiciones.map((p) => ({
            ...p,
            color_hilos: p.color_hilos?.length ? p.color_hilos : [""],
            imagen_url: p.imagen_url || "",
            bobina_negra: p.bobina_negra ?? false,
            bobina_blanca: p.bobina_blanca ?? false,
            extras: p.extras || {},
            alto_cm: p.alto_cm ?? 0,
            ancho_cm: p.ancho_cm ?? 0,
          }))
        : makeDefaultDiseno().posiciones,
    },
  ];
}

// ─── Client Autocomplete ───────────────────────────────────────────────────────
function ClientSearch({ value, onSelect, onTypeName }) {
  const [query, setQuery] = useState(value || "");
  const [clients, setClients] = useState([]);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    base44.entities.Client.list("nombre", 200).then(setClients);
  }, []);

  // Sync query si el valor externo cambia (ej: al cargar una orden)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

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
          onChange={e => {
            const val = e.target.value;
            setQuery(val);
            setOpen(true);
            // Siempre actualiza el nombre en el form mientras escribe
            onTypeName(val);
          }}
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

// Wrapper para estabilizar callbacks de GarmentDesignBlock
function GarmentDesignBlockMemo({ diseno, index, canRemove, disenoId, updateDiseno, removeDiseno, logoCatalog, onLogoCatalogUpdate }) {
  const onUpdate = useCallback((patch) => updateDiseno(disenoId, patch), [disenoId, updateDiseno]);
  const onRemove = useCallback(() => removeDiseno(disenoId), [disenoId, removeDiseno]);
  return (
    <GarmentDesignBlock
      diseno={diseno}
      index={index}
      canRemove={canRemove}
      onUpdate={onUpdate}
      onRemove={onRemove}
      logoCatalog={logoCatalog}
      onLogoCatalogUpdate={onLogoCatalogUpdate}
    />
  );
}

export default function WorkOrderForm({ order, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = emptyOrder();
    if (!order) return base;
    return {
      ...base,
      ...order,
      especificaciones: order.especificaciones?.length
        ? order.especificaciones.map(e => emptyEspec(e))
        : (order.tipo_prenda !== undefined
            ? [emptyEspec({ tipo_prenda: order.tipo_prenda || "", color_prenda: order.color_prenda || "", tallas: order.tallas || {}, total_piezas: order.total_piezas || 0 })]
            : [emptyEspec()]),
      tipo_trabajo: order.tipo_trabajo || {},
    };
  });

  // Array de diseños de prenda
  const [disenos, setDisenos] = useState(() => {
    if (!order) return [makeDefaultDiseno()];
    return migrateOrder(order);
  });

  const [saving, setSaving] = useState(false);
  const [logoCatalog, setLogoCatalog] = useState([]);
  const [activeDiseno, setActiveDiseno] = useState(0);

  useEffect(() => {
    base44.entities.LogoCatalog.list("nombre").then(setLogoCatalog);
  }, []);

  const handleLogoCatalogUpdate = useCallback((savedLogo) => {
    setLogoCatalog((prev) => {
      const exists = prev.find((l) => l.id === savedLogo.id);
      if (exists) return prev.map((l) => l.id === savedLogo.id ? savedLogo : l);
      return [...prev, savedLogo].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }, []);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setNested = (field, key, value) => setForm((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), [key]: value } }));

  const updateEspec = useCallback((idx, field, value) =>
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
    }), []);
  const addEspec = () => setForm((prev) => ({ ...prev, especificaciones: [...prev.especificaciones, emptyEspec()] }));
  const removeEspec = (idx) => setForm((prev) => ({ ...prev, especificaciones: prev.especificaciones.filter((_, i) => i !== idx) }));

  const addDiseno = () => {
    setDisenos((prev) => [...prev, makeDefaultDiseno()]);
    setActiveDiseno(disenos.length); // switch to the new tab
  };
  const removeDiseno = (id) => {
    setDisenos((prev) => prev.filter((d) => d.id !== id));
    // Ajustar tab activo si se eliminó la última o una anterior
    setActiveDiseno((prev) => {
      const idx = disenos.findIndex(d => d.id === id);
      if (idx < prev) return prev - 1;
      if (prev >= disenos.length - 1) return Math.max(0, disenos.length - 2);
      return prev;
    });
  };
  const updateDiseno = useCallback((id, patch) => setDisenos((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d)), []);

  const generateFolio = async () => {
    const existing = await base44.entities.WorkOrder.list("-created_date", 1);
    const last = existing[0]?.folio || "OT-0000";
    const num = parseInt(last.replace("OT-", "") || "0") + 1;
    return `OT-${String(num).padStart(4, "0")}`;
  };

  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const firstDiseno = disenos[0] || {};
      const folio = form.folio || await generateFolio();
      const data = {
        ...form,
        folio,
        especificaciones: form.especificaciones.map(e => ({ ...e, total_piezas: Number(e.total_piezas) || 0 })),
        disenos,
        preview_layout: firstDiseno.preview_layout || DEFAULT_LAYOUT,
        posiciones: firstDiseno.posiciones || [],
        garment_frente_url: firstDiseno.garment_frente_url || "",
        garment_espalda_url: firstDiseno.garment_espalda_url || "",
        garment_titulo: firstDiseno.garment_titulo || "",
        garment_es_gorra: firstDiseno.garment_es_gorra || false,
        garment_lateral_izq_url: firstDiseno.garment_lateral_izq_url || "",
        garment_lateral_der_url: firstDiseno.garment_lateral_der_url || "",
      };
      let saved;
      if (order?.id) {
        saved = await base44.entities.WorkOrder.update(order.id, data);
      } else {
        saved = await base44.entities.WorkOrder.create(data);
      }
      setSaving(false);
      onSave(saved);
    } catch (err) {
      setSaving(false);
      setSaveError(err?.message || "Error al guardar. Intenta de nuevo.");
    }
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
      {saveError && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm font-medium">
          ⚠️ {saveError}
        </div>
      )}

      {/* Encabezado cliente */}
      <div className="rounded-xl border-2 border-blue-300 bg-card p-4 space-y-3">
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Buscar Cliente</label>
          <ClientSearch
            value={form.nombre_cliente}
            onTypeName={(nombre) => set("nombre_cliente", nombre)}
            onSelect={(client) => {
              setForm(prev => ({
                ...prev,
                nombre_cliente: client.nombre,
                cliente_id: client.id,
                rfc: client.rfc || prev.rfc || "",
                cp: client.cp || prev.cp || "",
                tipo_regimen: client.tipo_regimen || prev.tipo_regimen || "",
                uso_factura: client.uso_factura || prev.uso_factura || "",
                telefono: client.tel_celular || prev.telefono || "",
              }));
            }}
          />
        </div>
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
            <select value={form.tipo_regimen || ""} onChange={(e) => set("tipo_regimen", e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {REGIMENES_FISCALES.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Uso de Factura (CFDI)</label>
            <select value={form.uso_factura || ""} onChange={(e) => set("uso_factura", e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {USOS_CFDI.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
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

      {/* Diseños de prenda — pestañas */}
      <div className="rounded-xl border-2 border-blue-300 bg-card overflow-hidden">
        {/* Barra de pestañas */}
        <div className="flex items-center border-b border-blue-200 bg-blue-50/30 px-1 pt-1 gap-1 overflow-x-auto">
          {disenos.map((diseno, idx) => (
            <button
              key={diseno.id}
              type="button"
              onClick={() => setActiveDiseno(idx)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-semibold whitespace-nowrap transition-all border-b-2",
                activeDiseno === idx
                  ? "bg-white text-blue-700 border-blue-600 shadow-sm"
                  : "text-muted-foreground hover:text-blue-600 hover:bg-white/60 border-transparent"
              )}
            >
              <span className="uppercase tracking-wide">Diseño #{idx + 1}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                {diseno.titulo || diseno.garment_titulo || ""}
              </span>
              {disenos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeDiseno(diseno.id); }}
                  className="ml-1 p-0.5 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Eliminar diseño"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addDiseno} className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 flex-shrink-0 ml-auto mr-1">
            <Plus className="w-3.5 h-3.5" /> Nuevo diseño
          </Button>
        </div>
        {/* Contenido del diseño activo */}
        <div className="p-3">
          {disenos[activeDiseno] && (
            <GarmentDesignBlockMemo
              key={disenos[activeDiseno].id}
              diseno={disenos[activeDiseno]}
              index={activeDiseno + 1}
              canRemove={disenos.length > 1}
              disenoId={disenos[activeDiseno].id}
              updateDiseno={updateDiseno}
              removeDiseno={removeDiseno}
              logoCatalog={logoCatalog}
              onLogoCatalogUpdate={handleLogoCatalogUpdate}
            />
          )}
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
          {form.especificaciones.map((row, idx) => {
            // Mapa de qué diseños ya están asignados (excluyendo el de esta fila)
            return (
              <EspecRow
                key={idx}
                row={row}
                onChange={(field, value) => updateEspec(idx, field, value)}
                onRemove={() => removeEspec(idx)}
                canRemove={form.especificaciones.length > 1}
                disenos={disenos}
              />
            );
          })}
        </div>
        {/* Total global de todas las prendas */}
        {(() => {
          const TALLAS_KEYS = ["xs","s","m","l","xl","xxl","xxxl","xxxxl"];
          const totalGlobal = form.especificaciones.reduce((sum, e) =>
            sum + TALLAS_KEYS.reduce((s, t) => s + (Number(e.tallas?.[t]) || 0), 0), 0);
          return totalGlobal > 0 ? (
            <div className="flex items-center justify-end gap-3 px-2">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">TOTAL GLOBAL DE PRENDAS:</span>
              <div className="border-2 border-green-600 rounded-lg px-5 py-1 bg-green-50 text-center">
                <p className="text-2xl font-black text-green-700 leading-none">{totalGlobal}</p>
              </div>
            </div>
          ) : null;
        })()}
        <Button type="button" variant="outline" size="sm" onClick={addEspec} className="gap-1 text-green-700 border-green-400 hover:bg-green-50 w-full">
          <Plus className="w-3.5 h-3.5" /> Agregar modelo de prenda
        </Button>
      </div>
    </div>
  );
}