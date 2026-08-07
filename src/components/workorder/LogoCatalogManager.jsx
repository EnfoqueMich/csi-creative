import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, Edit2, ImagePlus, Search, BookImage, ChevronDown, ChevronRight, Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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

const SOFTWARE_VECTOR = ["Corel Draw", "Illustrator", "Photoshop", "Affinity"];

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

const logoClientsOf = (l) => {
  const arr = Array.isArray(l?.clientes) && l.clientes.length ? l.clientes : (l?.cliente ? [l.cliente] : []);
  return arr.filter(Boolean);
};

const emptyForm = () => ({
  nombre: "",
  cliente: "",
  clientes: [],
  imagen_url: "",
  costo: "",
  iva: 0,
  puntadas: "",
  alto_cm: "",
  ancho_cm: "",
  descripcion: "",
  archivo_wilcom_url: "",
  archivo_wilcom_nombre: "",
  archivos_wilcom: [],
  archivos_vector: [],
  vector_software: "",
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
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [clientNames, setClientNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem("logo_catalog_clients") || "[]"); } catch { return []; }
  });
  const [newClient, setNewClient] = useState("");
  const [dupMsg, setDupMsg] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [uploadingWilcom, setUploadingWilcom] = useState(false);
  const [uploadingVector, setUploadingVector] = useState(false);
  const fileVectorInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("logo_catalog_clients", JSON.stringify(clientNames));
  }, [clientNames]);

  useEffect(() => {
    base44.entities.LogoCatalog.list("nombre", 300).then((data) => {
      setLogos(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    base44.entities.Client.list("nombre", 500).then(setClients).catch(() => {});
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

  const uploadWilcom = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingWilcom(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, archivos_wilcom: [...(p.archivos_wilcom || []), { url: file_url, nombre: file.name }] }));
    setUploadingWilcom(false);
    e.target.value = "";
  };

  const removeWilcom = (idx) => {
    setForm(p => ({ ...p, archivos_wilcom: (p.archivos_wilcom || []).filter((_, i) => i !== idx) }));
  };

  const uploadVector = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.vector_software) {
      alert("Selecciona primero el software con el que se hizo el archivo vector (Corel, Illustrator, Photoshop o Affinity).");
      e.target.value = "";
      return;
    }
    setUploadingVector(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, archivos_vector: [...(p.archivos_vector || []), { url: file_url, nombre: file.name, software: p.vector_software }] }));
    setUploadingVector(false);
    e.target.value = "";
  };

  const removeVector = (idx) => {
    setForm(p => ({ ...p, archivos_vector: (p.archivos_vector || []).filter((_, i) => i !== idx) }));
  };

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setShowForm(false); };

  const addForClient = (client) => {
    setForm({ ...emptyForm(), clientes: client === "Sin cliente" ? [] : [client] });
    setEditingId(null);
    setShowForm(true);
  };

  const toggleGroup = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleCliente = (c) => {
    setForm(p => {
      const exists = p.clientes.some(x => x.toLowerCase() === c.toLowerCase());
      const next = exists ? p.clientes.filter(x => x.toLowerCase() !== c.toLowerCase()) : [...p.clientes, c];
      return { ...p, clientes: next, cliente: next.find(Boolean) || "" };
    });
  };

  const clientList = useMemo(() => {
    const set = new Set();
    clients.forEach(c => c.nombre && set.add(c.nombre));
    clientNames.forEach(c => set.add(c));
    logos.forEach(l => logoClientsOf(l).forEach(c => set.add(c)));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [clients, clientNames, logos]);

  const filteredClients = useMemo(() => {
    const s = clientQuery.trim().toLowerCase();
    if (!s) return clientList;
    return clientList.filter(c => c.toLowerCase().includes(s));
  }, [clientQuery, clientList]);

  const knownClients = useMemo(() => {
    const set = new Set(clientNames.filter(Boolean));
    clients.forEach(c => c.nombre && set.add(c.nombre));
    logos.forEach(l => logoClientsOf(l).forEach(c => set.add(c.trim())));
    return Array.from(set);
  }, [clientNames, clients, logos]);

  const addClient = () => {
    const name = newClient.trim();
    if (!name) return;
    const exists = knownClients.some(c => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDupMsg(`Ya existe un cliente o empresa con el nombre "${name}"`);
      return;
    }
    setDupMsg("");
    setClientNames(prev => Array.from(new Set([...prev, name])));
    setNewClient("");
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { alert("El nombre del logo es requerido"); return; }
    setSaving(true);
    const data = {
      nombre: form.nombre.trim(),
      cliente: (form.clientes.find(Boolean) || "").trim(),
      clientes: form.clientes.filter(Boolean),
      imagen_url: form.imagen_url,
      costo: Number(form.costo) || 0,
      iva: Number(form.iva) || 0,
      puntadas: Number(form.puntadas) || 0,
      alto_cm: Number(form.alto_cm) || 0,
      ancho_cm: Number(form.ancho_cm) || 0,
      descripcion: form.descripcion.trim(),
      archivos_wilcom: form.archivos_wilcom || [],
      archivos_vector: (form.archivos_vector || []).map(f => ({ url: f.url, nombre: f.nombre, software: f.software })),
      archivo_wilcom_url: form.archivos_wilcom?.[0]?.url || "",
      archivo_wilcom_nombre: form.archivos_wilcom?.[0]?.nombre || "",
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
      clientes: logoClientsOf(logo),
      imagen_url: logo.imagen_url || "",
      costo: logo.costo || "",
      iva: logo.iva || 0,
      puntadas: logo.puntadas || "",
      alto_cm: logo.alto_cm || "",
      ancho_cm: logo.ancho_cm || "",
      descripcion: logo.descripcion || "",
      archivo_wilcom_url: logo.archivo_wilcom_url || "",
      archivo_wilcom_nombre: logo.archivo_wilcom_nombre || "",
      archivos_wilcom: Array.isArray(logo.archivos_wilcom) && logo.archivos_wilcom.length
        ? logo.archivos_wilcom
        : (logo.archivo_wilcom_url ? [{ url: logo.archivo_wilcom_url, nombre: logo.archivo_wilcom_nombre || "Archivo Wilcom" }] : []),
      archivos_vector: Array.isArray(logo.archivos_vector) ? logo.archivos_vector : [],
      vector_software: "",
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
    if (!s) return true;
    return l.nombre?.toLowerCase().includes(s)
      || l.cliente?.toLowerCase().includes(s)
      || (l.clientes || []).some(c => c?.toLowerCase().includes(s));
  });

  const groups = useMemo(() => {
    let entries;
    if (search.trim()) {
      const map = {};
      filtered.forEach(l => {
        const arr = logoClientsOf(l);
        if (!arr.length) { (map["Sin cliente"] ||= []).push(l); }
        else arr.forEach(k => (map[k] ||= []).push(l));
      });
      entries = Object.entries(map);
    } else {
      const allClients = [...knownClients];
      if (logos.some(l => logoClientsOf(l).length === 0)) allClients.push("Sin cliente");
      entries = allClients.map(k => [k, logos.filter(l => {
        const arr = logoClientsOf(l);
        return arr.length ? arr.some(x => x.toLowerCase() === k.toLowerCase()) : k === "Sin cliente";
      })]);
    }
    return entries.filter(([, list]) => list.length > 0).sort((a, b) => {
      if (a[0] === "Sin cliente") return 1;
      if (b[0] === "Sin cliente") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [search, filtered, logos, knownClients]);

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

      {/* Agregar cliente / empresa */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={newClient}
          onChange={e => { setNewClient(e.target.value); setDupMsg(""); }}
          onKeyDown={e => { if (e.key === "Enter") addClient(); }}
          placeholder="Nombre de cliente o empresa para agrupar..."
          className="h-8 text-xs w-72"
        />
        <Button onClick={addClient} variant="outline" className="gap-1 text-xs h-8">
          <Plus className="w-3.5 h-3.5" /> Agregar Cliente
        </Button>
        {dupMsg && <span className="text-xs text-red-600 font-medium">{dupMsg}</span>}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-card border-2 border-violet-300 rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-violet-700 uppercase tracking-widest">{editingId ? "Editar Logo" : "Nuevo Logo"}</p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-violet-700">Clientes / Empresas (marca a los que aplica)</label>
            {clientList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No hay clientes registrados. Agrégalos con el botón "Agregar Cliente" de arriba.</p>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="w-full h-9 px-3 border border-violet-200 rounded-md text-left text-sm flex items-center justify-between gap-2 bg-white hover:bg-violet-50 transition-colors">
                    <span className="truncate">
                      {form.clientes.length === 0
                        ? <span className="text-muted-foreground">Selecciona uno o más clientes...</span>
                        : <span><strong className="text-violet-700">{form.clientes.length}</strong> cliente(s): {form.clientes.join(", ")}</span>}
                    </span>
                    <ChevronDown className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b border-violet-100">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input value={clientQuery} onChange={e => setClientQuery(e.target.value)} placeholder="Buscar cliente..." className="pl-7 h-8 text-xs" autoFocus />
                      {clientQuery && <button type="button" onClick={() => setClientQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3 h-3" /></button>}
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    {filteredClients.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">Sin resultados</p>}
                    {filteredClients.map(c => {
                      const checked = form.clientes.some(x => x.toLowerCase() === c.toLowerCase());
                      return (
                        <label key={c} className="flex items-center gap-2 cursor-pointer select-none text-xs px-2 py-1.5 rounded hover:bg-violet-50">
                          <div onClick={() => toggleCliente(c)} className={cn("w-4 h-4 border-2 rounded-sm flex items-center justify-center cursor-pointer transition-colors flex-shrink-0", checked ? "bg-violet-600 border-violet-600" : "border-gray-400 bg-white")}>
                            {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                          </div>
                          <span className="truncate">{c}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {form.clientes.length === 0 && <p className="text-[10px] text-muted-foreground">El logo aparecerá en el listado de cada cliente marcado.</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-violet-700">Nombre Logo *</label>
            <Input value={form.nombre} onChange={e => setF("nombre", e.target.value)} placeholder="Ej: Logo Frente Principal..." className="text-sm" />
          </div>

          {/* Costo final + IVA incluido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">COSTO FINAL ($)</label>
              <Input type="number" min="0" step="0.01" value={form.costo} onChange={e => setF("costo", e.target.value)} placeholder="0.00" className="text-sm font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-700">IVA</label>
              <div className="flex flex-wrap gap-4 h-9 items-center">
                <CheckBox label="IVA INCLUIDO 8%" checked={form.iva === 0.08} onChange={() => setF("iva", form.iva === 0.08 ? 0 : 0.08)} />
                <CheckBox label="IVA INCLUIDO 16%" checked={form.iva === 0.16} onChange={() => setF("iva", form.iva === 0.16 ? 0 : 0.16)} />
              </div>
            </div>
          </div>

          {ivaRate > 0 && Number(form.costo) > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-md p-2 text-xs text-violet-700 space-y-0.5">
              <p>Costo final (con IVA): <strong>${costo.toFixed(2)}</strong></p>
              <p>Base sin IVA ({Math.round(ivaRate * 100)}%): <strong>${(costo / (1 + ivaRate)).toFixed(2)}</strong></p>
              <p>IVA incluido: <strong>${(costo - costo / (1 + ivaRate)).toFixed(2)}</strong></p>
            </div>
          )}

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

          {/* Archivo Wilcom */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-violet-700">Cargar archivo Wilcom</label>
            {(form.archivos_wilcom || []).map((f, idx) => (
              <div key={idx} className="flex items-start gap-1 flex-wrap">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 min-w-0">
                  <Upload className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{f.nombre || "Archivo Wilcom"}</span>
                </a>
                <button type="button" onClick={() => removeWilcom(idx)} className="flex items-center gap-0.5 text-[11px] text-red-600 hover:text-red-700 font-bold">
                  <X className="w-3 h-3 flex-shrink-0" /> ELIMINAR ARCHIVO
                </button>
              </div>
            ))}
            <label className={cn("flex items-center gap-2 h-9 px-3 border border-dashed border-violet-300 rounded cursor-pointer hover:bg-violet-50 text-violet-500 transition-colors text-xs", uploadingWilcom && "opacity-50 pointer-events-none")}>
              {uploadingWilcom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploadingWilcom ? "Subiendo..." : (form.archivos_wilcom?.length ? "Cargar otro archivo .emb / .dst / .pes..." : "Cargar archivo .emb / .dst / .pes...")}</span>
              <input type="file" accept=".emb,.dst,.pes,.jef,.vp3,.exp,.hus,.pcs,.xxx,.10o,.dsb,.zsk,.dat" className="hidden" onChange={uploadWilcom} disabled={uploadingWilcom} />
            </label>
          </div>

          {/* Archivo Vector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-violet-700">Cargar archivo Vector</label>
            {(form.archivos_vector || []).map((f, idx) => (
              <div key={idx} className="flex items-start gap-1 flex-wrap">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 min-w-0">
                  <Upload className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{f.nombre || "Archivo Vector"}</span>
                </a>
                {f.software && <span className="text-[11px] text-violet-700 font-semibold">({f.software})</span>}
                <button type="button" onClick={() => removeVector(idx)} className="flex items-center gap-0.5 text-[11px] text-red-600 hover:text-red-700 font-bold">
                  <X className="w-3 h-3 flex-shrink-0" /> ELIMINAR ARCHIVO
                </button>
              </div>
            ))}
            <p className="text-[10px] font-semibold text-violet-700 uppercase pt-1">Indica el software</p>
            <div className="flex flex-wrap gap-4">
              {SOFTWARE_VECTOR.map(s => {
                const checked = form.vector_software === s;
                return (
                  <label key={s} className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setF("vector_software", checked ? "" : s)} className={cn("w-4 h-4 border-2 rounded-full flex items-center justify-center cursor-pointer transition-colors flex-shrink-0", checked ? "bg-violet-600 border-violet-600" : "border-gray-400 bg-white")}>
                      {checked && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
                    </div>
                    <span className="text-xs">{s}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileVectorInputRef.current?.click()}
                disabled={uploadingVector}
                className="gap-1 h-8 text-xs border-violet-300 text-violet-700 hover:bg-violet-50"
              >
                {uploadingVector ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Cargar archivo Vector
              </Button>
              {(form.archivos_vector || []).length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileVectorInputRef.current?.click()}
                  disabled={uploadingVector}
                  className="gap-1 h-8 text-xs border-violet-300 text-violet-700 hover:bg-violet-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar otro archivo
                </Button>
              )}
            </div>
            <input ref={fileVectorInputRef} type="file" accept=".ai,.cdr,.eps,.svg,.pdf,.psd,.afdesign,.afphoto" className="hidden" onChange={uploadVector} disabled={uploadingVector} />
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

      {/* Lista de logos agrupados por cliente */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookImage className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay logos en el catálogo</p>
          <p className="text-xs mt-1">Agrega el primer logo con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([clientKey, clientLogos]) => {
            const isExpanded = expanded[clientKey];
            return (
              <div key={clientKey} className="border border-violet-200 rounded-xl overflow-hidden bg-card">
                <div className="flex items-center justify-between bg-violet-50 px-4 py-2.5">
                  <button onClick={() => toggleGroup(clientKey)} className="flex items-center gap-2 flex-1 text-left">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-violet-600" /> : <ChevronRight className="w-4 h-4 text-violet-600" />}
                    <span className="text-sm font-bold text-violet-700 uppercase tracking-wide">{clientKey}</span>
                    <span className="text-xs text-muted-foreground bg-violet-100 px-2 py-0.5 rounded-full">{clientLogos.length}</span>
                  </button>
                  <button onClick={() => addForClient(clientKey)} className="flex items-center gap-1 text-[11px] text-violet-700 hover:bg-violet-200 rounded px-2 py-1 transition-colors">
                    <Plus className="w-3 h-3" /> Agregar logo
                  </button>
                </div>
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {clientLogos.map(logo => {
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
                              {(() => {
                                const cs = logoClientsOf(logo);
                                const extra = cs.length - 1;
                                return <p className="text-xs text-muted-foreground truncate">Cliente: {cs[0] || "Sin cliente"}{extra > 0 ? ` +${extra}` : ""}</p>;
                              })()}
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
                          <div className="pt-1 space-y-1 flex flex-wrap gap-1">
                            {(() => {
                              const archivos = Array.isArray(logo.archivos_wilcom) && logo.archivos_wilcom.length
                                ? logo.archivos_wilcom
                                : (logo.archivo_wilcom_url ? [{ url: logo.archivo_wilcom_url, nombre: logo.archivo_wilcom_nombre || "Archivo Wilcom" }] : []);
                              if (!archivos.length) {
                                return (
                                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground border border-dashed border-gray-200 rounded px-2 py-1">
                                    <Download className="w-3 h-3" /> No existe archivo Wilcom
                                  </span>
                                );
                              }
                              return archivos.map((f, i) => (
                                <a key={i} href={f.url} target="_blank" rel="noreferrer" download className="flex items-center gap-1 text-[11px] text-violet-700 hover:underline border border-violet-200 rounded px-2 py-1">
                                  <Download className="w-3 h-3" /> Descargar {archivos.length > 1 ? `archivo ${i + 1}` : "archivo Wilcom"}
                                </a>
                              ));
                            })()}
                            {(logo.archivos_vector || []).map((f, i) => (
                              <a key={`v${i}`} href={f.url} target="_blank" rel="noreferrer" download className="flex items-center gap-1 text-[11px] text-violet-700 hover:underline border border-violet-200 rounded px-2 py-1">
                                <Download className="w-3 h-3" /> Vector {f.software ? `(${f.software})` : ""}
                              </a>
                            ))}
                          </div>
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
          })}
        </div>
      )}
    </div>
  );
}