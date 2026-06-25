import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, Edit2, ImagePlus, Search, ChevronDown, ChevronUp, FolderPlus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

function ImgUploadField({ label, url, uploading, onUpload, onClear }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-blue-600 uppercase">{label}</p>
      {url ? (
        <div className="relative">
          <img src={url} alt={label} className="w-full h-20 object-contain border border-blue-200 rounded" />
          <button type="button" onClick={onClear} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      ) : (
        <label className={cn(
          "flex flex-col items-center justify-center gap-1 h-20 border border-dashed border-blue-300 rounded cursor-pointer hover:bg-blue-50 text-blue-400 transition-colors",
          uploading && "opacity-50 pointer-events-none"
        )}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          <span className="text-[9px]">{uploading ? "Subiendo..." : "Cargar"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

const emptyForm = () => ({ categoria: "", codigo: "", marca: "", modelo: "", talla: "", precio: "", stock: 0, frente_url: "", espalda_url: "" });

export default function GarmentCatalogManager() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState({ frente: false, espalda: false });
  const [showForm, setShowForm] = useState(false);

  // Categorías personalizadas
  const [categorias, setCategorias] = useState([]);
  const [newCategoria, setNewCategoria] = useState("");
  const [showCatForm, setShowCatForm] = useState(false);

  // Buscador
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Expandidos por categoría
  const [expandedCats, setExpandedCats] = useState({});

  useEffect(() => {
    base44.entities.GarmentCatalog.list("-created_date", 200).then((data) => {
      setCatalogo(data);
      // Extraer categorías únicas de los registros
      const cats = [...new Set(data.map(d => d.categoria).filter(Boolean))].sort();
      setCategorias(cats);
      setLoading(false);
    });
  }, []);

  const setF = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const uploadImg = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(p => ({ ...p, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setF(key === "frente" ? "frente_url" : "espalda_url", file_url);
    setUploading(p => ({ ...p, [key]: false }));
  };

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.marca || !form.modelo || !form.talla || !form.precio) {
      alert("Por favor completa Marca, Modelo, Talla y Precio");
      return;
    }
    setSaving(true);
    const data = {
      categoria: form.categoria.trim(),
      codigo: form.codigo.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      talla: form.talla.trim(),
      precio: Number(form.precio),
      stock: Number(form.stock) || 0,
      frente_url: form.frente_url,
      espalda_url: form.espalda_url,
    };
    if (editingId) {
      const updated = await base44.entities.GarmentCatalog.update(editingId, data);
      setCatalogo(prev => prev.map(item => item.id === editingId ? updated : item));
    } else {
      const created = await base44.entities.GarmentCatalog.create(data);
      setCatalogo(prev => [created, ...prev]);
    }
    // Actualizar lista de categorías
    if (data.categoria && !categorias.includes(data.categoria)) {
      setCategorias(prev => [...prev, data.categoria].sort());
    }
    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este artículo del catálogo?")) {
      await base44.entities.GarmentCatalog.delete(id);
      setCatalogo(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEdit = (item) => {
    setForm({
      categoria: item.categoria || "",
      codigo: item.codigo || "",
      marca: item.marca || "",
      modelo: item.modelo || "",
      talla: item.talla || "",
      precio: item.precio || "",
      stock: item.stock || 0,
      frente_url: item.frente_url || "",
      espalda_url: item.espalda_url || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const addCategoria = () => {
    const cat = newCategoria.trim();
    if (!cat || categorias.includes(cat)) return;
    setCategorias(prev => [...prev, cat].sort());
    setNewCategoria("");
    setShowCatForm(false);
  };

  const removeCategoria = (cat) => {
    setCategorias(prev => prev.filter(c => c !== cat));
    if (filterCat === cat) setFilterCat("");
  };

  // Filtros
  const filtered = catalogo.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = !s || item.marca?.toLowerCase().includes(s) || item.modelo?.toLowerCase().includes(s) || item.codigo?.toLowerCase().includes(s) || item.talla?.toLowerCase().includes(s);
    const matchCat = !filterCat || item.categoria === filterCat;
    return matchSearch && matchCat;
  });

  // Agrupar por categoría para visualización
  const sinCategoria = filtered.filter(i => !i.categoria);
  const porCategoria = categorias.map(cat => ({
    cat,
    items: filtered.filter(i => i.categoria === cat),
  })).filter(g => g.items.length > 0);

  const toggleCat = (cat) => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Prenda
          </Button>
          <Button variant="outline" onClick={() => setShowCatForm(v => !v)} className="gap-2 text-violet-700 border-violet-300">
            <FolderPlus className="w-4 h-4" /> Gestionar Categorías
          </Button>
        </div>
        {/* Buscador */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo, código..."
              className="pl-8 h-8 text-xs w-56"
            />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3 h-3" /></button>}
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="h-8 text-xs border border-input rounded-md px-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Panel gestión de categorías */}
      {showCatForm && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Categorías</p>
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <span key={cat} className="flex items-center gap-1 bg-violet-100 border border-violet-300 text-violet-700 text-xs font-semibold px-2 py-1 rounded-full">
                {cat}
                <button type="button" onClick={() => removeCategoria(cat)} className="text-violet-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {categorias.length === 0 && <p className="text-xs text-muted-foreground italic">No hay categorías creadas</p>}
          </div>
          <div className="flex gap-2 items-center">
            <Input value={newCategoria} onChange={e => setNewCategoria(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategoria()} placeholder="Nueva categoría..." className="h-8 text-xs w-48" />
            <Button size="sm" onClick={addCategoria} disabled={!newCategoria.trim()} className="gap-1"><Plus className="w-3 h-3" /> Agregar</Button>
          </div>
        </div>
      )}

      {/* Formulario agregar/editar prenda */}
      {showForm && (
        <div className="bg-card rounded-xl border-2 border-blue-300 p-5 space-y-4">
          <p className="text-sm font-bold text-blue-700 uppercase tracking-widest">{editingId ? "Editar Prenda" : "Nueva Prenda"}</p>
          {/* Fila 1: categoría, código, marca, modelo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Categoría</label>
              <select
                value={form.categoria}
                onChange={e => setF("categoria", e.target.value)}
                className="h-9 w-full border border-input rounded-md px-2 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Código</label>
              <Input value={form.codigo} onChange={e => setF("codigo", e.target.value)} placeholder="Ej: CAM-001" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Marca *</label>
              <Input value={form.marca} onChange={e => setF("marca", e.target.value)} placeholder="Nike, Adidas..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Modelo *</label>
              <Input value={form.modelo} onChange={e => setF("modelo", e.target.value)} placeholder="Polo, Camiseta..." className="text-sm" />
            </div>
          </div>
          {/* Fila 2: talla, precio, stock */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Talla *</label>
              <Input value={form.talla} onChange={e => setF("talla", e.target.value)} placeholder="S, M, L..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Precio *</label>
              <Input type="number" step="0.01" value={form.precio} onChange={e => setF("precio", e.target.value)} placeholder="0.00" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Stock</label>
              <Input type="number" value={form.stock} onChange={e => setF("stock", e.target.value)} placeholder="0" className="text-sm" />
            </div>
          </div>
          {/* Imágenes */}
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <ImgUploadField label="Vista Frontal" url={form.frente_url} uploading={uploading.frente} onUpload={e => uploadImg(e, "frente")} onClear={() => setF("frente_url", "")} />
            <ImgUploadField label="Vista Trasera" url={form.espalda_url} uploading={uploading.espalda} onUpload={e => uploadImg(e, "espalda")} onClear={() => setF("espalda_url", "")} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Actualizar" : "Guardar"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Catálogo agrupado */}
      <div className="space-y-4">
        {/* Grupos por categoría */}
        {porCategoria.map(({ cat, items }) => (
          <div key={cat} className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-600" />
                <span className="font-bold text-sm text-violet-700 uppercase tracking-wider">{cat}</span>
                <span className="text-xs text-violet-500 font-medium">({items.length} prenda{items.length !== 1 ? "s" : ""})</span>
              </div>
              {expandedCats[cat] ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-violet-500" />}
            </button>
            {expandedCats[cat] && (
              <GarmentTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
            )}
          </div>
        ))}

        {/* Sin categoría */}
        {sinCategoria.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCat("__sin__")}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Sin Categoría</span>
                <span className="text-xs text-muted-foreground">({sinCategoria.length})</span>
              </div>
              {expandedCats["__sin__"] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expandedCats["__sin__"] && (
              <GarmentTable items={sinCategoria} onEdit={handleEdit} onDelete={handleDelete} />
            )}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No se encontraron prendas con esos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GarmentTable({ items, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-2 text-left font-semibold">Imagen</th>
            <th className="px-3 py-2 text-left font-semibold">Código</th>
            <th className="px-3 py-2 text-left font-semibold">Marca</th>
            <th className="px-3 py-2 text-left font-semibold">Modelo</th>
            <th className="px-3 py-2 text-left font-semibold">Talla</th>
            <th className="px-3 py-2 text-right font-semibold">Precio</th>
            <th className="px-3 py-2 text-center font-semibold">Stock</th>
            <th className="px-3 py-2 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  {item.frente_url
                    ? <img src={item.frente_url} alt="frente" className="w-10 h-10 object-contain rounded border border-gray-200" />
                    : <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[9px] text-gray-400">F</div>
                  }
                  {item.espalda_url
                    ? <img src={item.espalda_url} alt="espalda" className="w-10 h-10 object-contain rounded border border-gray-200" />
                    : <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[9px] text-gray-400">E</div>
                  }
                </div>
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.codigo || "—"}</td>
              <td className="px-3 py-2 font-medium">{item.marca}</td>
              <td className="px-3 py-2">{item.modelo}</td>
              <td className="px-3 py-2">{item.talla}</td>
              <td className="px-3 py-2 text-right font-semibold">${Number(item.precio).toFixed(2)}</td>
              <td className="px-3 py-2 text-center">
                <span className={cn(
                  "inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold",
                  item.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {item.stock}
                </span>
              </td>
              <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors" title="Editar">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors" title="Eliminar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}