import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, Edit2, ImagePlus, Search, BookImage } from "lucide-react";
import { cn } from "@/lib/utils";
import HiloColorPicker from "./HiloColorPicker";
import VinilColorPicker from "./VinilColorPicker";

const EXTRAS_LIST = [
  ["foamy", "Foamy"],
  ["velcro_macho", "Velcro macho"],
  ["velcro_hembra", "Velcro hembra"],
  ["adhesivo_termico", "Adhesivo térmico"],
];

const IVA_OPCIONES = [
  { value: 0, label: "Sin IVA" },
  { value: 0.08, label: "IVA 8%" },
  { value: 0.16, label: "IVA 16%" },
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
      <span className="text-xs">{label}</span>
    </label>
  );
}

const emptyForm = () => ({
  nombre: "",
  cliente: "",
  imagen_url: "",
  costo: "",
  iva: 0,
  puntadas: "",
  alto_cm: "",
  ancho_cm: "",
  descripcion: "",
  color_hilos: [""],
  bobina_negra: false,
  bobina_blanca: false,
  vinil_codigo: "",
  extras: {},
});

export default function LogoCatalogManager() {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.entities.LogoCatalog.list("nombre", 300).then((data) => {
      setLogos(data);
      setLoading(false);
    });
  }, []);

  const setF = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const uploadImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setF("imagen_url", file_url);
    setUploading(false);
  };

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { alert("El nombre del logo es requerido"); return; }
    setSaving(true);
    const data = {
      nombre: form.nombre.trim(),
      cliente: form.cliente.trim(),
      imagen_url: form.imagen_url,
      costo: Number(form.costo) || 0,
      iva: Number(form.iva) || 0,
      puntadas: Number(form.puntadas) || 0,
      alto_cm: Number(form.alto_cm) || 0,
      ancho_cm: Number(form.ancho_cm) || 0,
      descripcion: form.descripcion.trim(),
      color_hilos: form.color_hilos.filter(Boolean),
      bobina_negra: form.bobina_negra,
      bobina_blanca: form.bobina_blanca,
      vinil_codigo: form.vinil_codigo,
      extras: form.extras,
    };
    if (editingId) {
      const updated = await base44.entities.LogoCatalog.update(editingId, data);
      setLogos(prev => prev.map(l => l.id === editingId ? { ...l, ...data } : l));
    } else {
      const created = await base44.entities.LogoCatalog.create(data);
      setLogos(prev => [created, ...prev]);
    }
    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este logo del catálogo?")) {
      await base44.entities.LogoCatalog.delete(id);
      setLogos(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleEdit = (logo) => {
    setForm({
      nombre: logo.nombre || "",
      cliente: logo.cliente || "",
      imagen_url: logo.imagen_url || "",
      costo: logo.costo || "",
      iva: logo.iva || 0,
      puntadas: logo.puntadas || "",
      alto_cm: logo.alto_cm || "",
      ancho_cm: logo.ancho_cm || "",
      descripcion: logo.descripcion || "",
      color_hilos: logo.color_hilos?.length ? logo.color_hilos : [""],
      bobina_negra: logo.bobina_negra || false,
      bobina_blanca: logo.bobina_blanca || false,
      vinil_codigo: logo.vinil_codigo || "",
      extras: logo.extras || {},
    });
    setEditingId(logo.id);
    setShowForm(true);
  };

  const costo = Number(form.costo) || 0;
  const ivaRate = Number(form.iva) || 0;
  const total = costo + costo * ivaRate;

  const setHilo = (idx, val) => {
    const arr = [...form.color_hilos];
    arr[idx] = val;
    setF("color_hilos", arr);
  };
  const addHilo = () => setF("color_hilos", [...form.color_hilos, ""]);
  const removeHilo = (idx) => {
    const arr = form.color_hilos.filter((_, i) => i !== idx);
    setF("color_hilos", arr.length ? arr : [""]);
  };

  const filtered = logos.filter(l => {
    const s = search.toLowerCase();
    return !s || l.nombre?.toLowerCase().includes(s) || l.cliente?.toLowerCase().includes(s);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar logo o cliente..." className="pl-8 h-8 text-xs w-52" />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3 h-3" /></button>}
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} logo(s)</span>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Logo
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-card border-2 border-violet-300 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-violet-700 uppercase tracking-widest">{editingId ? "Editar Logo" : "Nuevo Logo"}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">Cliente</label>
              <Input value={form.cliente} onChange={e => setF("cliente", e.target.value)} placeholder="Empresa / Cliente..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">Nombre Logo *</label>
              <Input value={form.nombre} onChange={e => setF("nombre", e.target.value)} placeholder="Ej: Logo Frente Principal..." className="text-sm" />
            </div>
          </div>

          {/* Costo + IVA + Total */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">Costo ($)</label>
              <Input type="number" min="0" step="0.01" value={form.costo} onChange={e => setF("costo", e.target.value)} placeholder="0.00" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">IVA</label>
              <select value={form.iva} onChange={e => setF("iva", Number(e.target.value))} className="h-9 w-full border border-input rounded-md px-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
                {IVA_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">Total ($)</label>
              <div className="h-9 border-2 border-violet-400 rounded-md px-3 flex items-center bg-violet-50">
                <span className="font-black text-violet-700">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Puntadas */}
          <div className="space-y-1 max-w-[180px]">
            <label className="text-xs font-semibold text-violet-700">Puntadas</label>
            <Input type="number" min="0" value={form.puntadas} onChange={e => setF("puntadas", e.target.value)} placeholder="0" className="text-sm" />
          </div>

          {/* Imagen */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-violet-700">Imagen del Logo</label>
            {form.imagen_url ? (
              <div className="relative w-32">
                <img src={form.imagen_url} alt="logo" className="w-32 h-24 object-contain border border-violet-200 rounded" />
                <button type="button" onClick={() => setF("imagen_url", "")} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"><X className="w-2.5 h-2.5 text-white" /></button>
              </div>
            ) : (
              <label className={cn("flex flex-col items-center justify-center gap-1 h-24 w-32 border border-dashed border-violet-300 rounded cursor-pointer hover:bg-violet-50 text-violet-400 transition-colors", uploading && "opacity-50 pointer-events-none")}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                <span className="text-[9px]">{uploading ? "Subiendo..." : "Cargar imagen"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadImg} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Medidas */}
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">Base (cm)</label>
              <Input type="number" min="0" step="0.1" value={form.ancho_cm} onChange={e => setF("ancho_cm", e.target.value)} placeholder="cm" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">Altura (cm)</label>
              <Input type="number" min="0" step="0.1" value={form.alto_cm} onChange={e => setF("alto_cm", e.target.value)} placeholder="cm" className="h-8 text-xs" />
            </div>
          </div>

          {/* Instrucciones */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-violet-700">Instrucciones</label>
            <Textarea value={form.descripcion} onChange={e => setF("descripcion", e.target.value)} rows={2} placeholder="Instrucciones de bordado, estampado..." className="text-xs resize-none" />
          </div>

          {/* Colores de hilo */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Color de Hilo</p>
            {form.color_hilos.map((c, hi) => (
              <div key={hi} className="flex items-center gap-1">
                <HiloColorPicker value={c} onChange={val => setHilo(hi, val)} placeholder="Código o nombre..." />
                {form.color_hilos.length > 1 && (
                  <button type="button" onClick={() => removeHilo(hi)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addHilo} className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5">
              <Plus className="w-3 h-3" /> agregar color
            </button>
          </div>

          {/* Bobina */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Bobina</p>
            <div className="flex gap-4">
              <CheckBox label="Negra" checked={form.bobina_negra} onChange={() => setF("bobina_negra", !form.bobina_negra)} />
              <CheckBox label="Blanca" checked={form.bobina_blanca} onChange={() => setF("bobina_blanca", !form.bobina_blanca)} />
            </div>
          </div>

          {/* Vinil */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-purple-700 uppercase">Vinil Textil o Reflectivo</p>
            <VinilColorPicker value={form.vinil_codigo} onChange={v => setF("vinil_codigo", v)} placeholder="Código o color vinil..." />
          </div>

          {/* Extras */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-orange-600 uppercase">Extras</p>
            <div className="grid grid-cols-2 gap-1">
              {EXTRAS_LIST.map(([key, label]) => (
                <CheckBox key={key} label={label} checked={!!form.extras[key]} onChange={() => setF("extras", { ...form.extras, [key]: !form.extras[key] })} />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="gap-1 bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {editingId ? "Guardar cambios" : "Guardar Logo"}
            </Button>
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de logos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookImage className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay logos en el catálogo</p>
          <p className="text-xs mt-1">Agrega el primer logo con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(logo => {
            const t = (logo.costo || 0) + (logo.costo || 0) * (logo.iva || 0);
            return (
              <div key={logo.id} className="bg-card border border-violet-200 rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  {logo.imagen_url ? (
                    <img src={logo.imagen_url} alt={logo.nombre} className="w-16 h-16 object-contain border border-violet-100 rounded flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-violet-50 border border-violet-100 rounded flex items-center justify-center flex-shrink-0">
                      <BookImage className="w-6 h-6 text-violet-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-violet-700 truncate">{logo.nombre}</p>
                    {logo.cliente && <p className="text-xs text-muted-foreground truncate">Cliente: {logo.cliente}</p>}
                    {(logo.alto_cm || logo.ancho_cm) && <p className="text-[10px] text-muted-foreground">{logo.ancho_cm || 0} × {logo.alto_cm || 0} cm</p>}
                    {logo.puntadas > 0 && <p className="text-[10px] text-muted-foreground">{logo.puntadas.toLocaleString()} puntadas</p>}
                  </div>
                </div>
                {logo.costo > 0 && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-500">Costo: <strong>${(logo.costo || 0).toFixed(2)}</strong></span>
                    {logo.iva > 0 && <span className="text-gray-500">IVA: {Math.round(logo.iva * 100)}%</span>}
                    <span className="font-bold text-violet-700">Total: ${t.toFixed(2)}</span>
                  </div>
                )}
                {logo.color_hilos?.filter(Boolean).length > 0 && (
                  <p className="text-[10px] text-blue-700">🧵 {logo.color_hilos.filter(Boolean).join(", ")}</p>
                )}
                {logo.descripcion && <p className="text-[10px] text-gray-500 line-clamp-2">{logo.descripcion}</p>}
                <div className="flex gap-2 pt-1 border-t border-violet-100">
                  <button onClick={() => handleEdit(logo)} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => handleDelete(logo.id)} className="flex items-center gap-1 text-[11px] text-red-500 hover:underline ml-auto">
                    <X className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}