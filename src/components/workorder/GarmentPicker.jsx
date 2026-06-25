import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2, ImagePlus, Check, Shirt, Search, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FRENTE = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/6b6aec754_frente.png";
const DEFAULT_ESPALDA = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/173365721_espalda.png";

export { DEFAULT_FRENTE, DEFAULT_ESPALDA };

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

function GarmentForm({ garment, onSaved, onCancel }) {
  const [titulo, setTitulo] = useState(garment?.titulo || "");
  const [modelo, setModelo] = useState(garment?.modelo || "");
  const [marca, setMarca] = useState(garment?.marca || "");
  const [color, setColor] = useState(garment?.color || "");
  const [esGorra, setEsGorra] = useState(garment?.es_gorra || false);
  const [urls, setUrls] = useState({
    frente: garment?.frente_url || "",
    espalda: garment?.espalda_url || "",
    lat_izq: garment?.lateral_izq_url || "",
    lat_der: garment?.lateral_der_url || "",
  });
  const [uploading, setUploading] = useState({ frente: false, espalda: false, lat_izq: false, lat_der: false });
  const [saving, setSaving] = useState(false);

  const uploadImg = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrls((prev) => ({ ...prev, [key]: file_url }));
    setUploading((prev) => ({ ...prev, [key]: false }));
  };

  const clearUrl = (key) => setUrls((prev) => ({ ...prev, [key]: "" }));

  const handleSave = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    const data = {
      titulo: titulo.trim(),
      modelo: modelo.trim(),
      marca: marca.trim(),
      color: color.trim(),
      es_gorra: esGorra,
      frente_url: urls.frente || DEFAULT_FRENTE,
      espalda_url: urls.espalda || DEFAULT_ESPALDA,
      lateral_izq_url: urls.lat_izq || "",
      lateral_der_url: urls.lat_der || "",
    };
    if (garment?.id) {
      await base44.entities.GarmentTemplate.update(garment.id, data);
    } else {
      const saved = await base44.entities.GarmentTemplate.create(data);
      onSaved(saved);
      return;
    }
    setSaving(false);
    onSaved({ ...garment, ...data });
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg p-3 space-y-3 bg-blue-50/40">
      <p className="text-xs font-bold text-blue-700 uppercase">{garment ? "Editar prenda" : "Nueva prenda"}</p>
      <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre (ej: Playera, Chamarra...)" className="text-sm" />
      <div className="grid grid-cols-3 gap-2">
        <Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo" className="text-sm" />
        <Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca" className="text-sm" />
        <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className="text-sm" />
      </div>

      {/* Toggle es gorra */}
      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700">
        <div
          onClick={() => setEsGorra((v) => !v)}
          className={cn(
            "w-8 h-4 rounded-full transition-colors relative",
            esGorra ? "bg-blue-600" : "bg-gray-300"
          )}
        >
          <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all", esGorra ? "left-4" : "left-0.5")} />
        </div>
        Es gorra (4 vistas)
      </label>

      <div className={cn("grid gap-2", esGorra ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2")}>
        <ImgUploadField label="Vista Frontal" url={urls.frente} uploading={uploading.frente} onUpload={(e) => uploadImg(e, "frente")} onClear={() => clearUrl("frente")} />
        {esGorra && <ImgUploadField label="Lateral Izq." url={urls.lat_izq} uploading={uploading.lat_izq} onUpload={(e) => uploadImg(e, "lat_izq")} onClear={() => clearUrl("lat_izq")} />}
        {esGorra && <ImgUploadField label="Lateral Der." url={urls.lat_der} uploading={uploading.lat_der} onUpload={(e) => uploadImg(e, "lat_der")} onClear={() => clearUrl("lat_der")} />}
        <ImgUploadField label="Vista Trasera" url={urls.espalda} uploading={uploading.espalda} onUpload={(e) => uploadImg(e, "espalda")} onClear={() => clearUrl("espalda")} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving || !titulo.trim()} className="gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// Editor de imágenes para la Playera Default (sin guardar en BD)
function DefaultGarmentEditor({ onSaved, onCancel }) {
  const [urls, setUrls] = useState({ frente: DEFAULT_FRENTE, espalda: DEFAULT_ESPALDA });
  const [uploading, setUploading] = useState({ frente: false, espalda: false });

  const uploadImg = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrls((prev) => ({ ...prev, [key]: file_url }));
    setUploading((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg p-3 space-y-3 bg-blue-50/40">
      <p className="text-xs font-bold text-blue-700 uppercase">Editar Playera Default</p>
      <div className="grid grid-cols-2 gap-2">
        <ImgUploadField label="Vista Frontal" url={urls.frente} uploading={uploading.frente} onUpload={(e) => uploadImg(e, "frente")} onClear={() => setUrls((p) => ({ ...p, frente: "" }))} />
        <ImgUploadField label="Vista Trasera" url={urls.espalda} uploading={uploading.espalda} onUpload={(e) => uploadImg(e, "espalda")} onClear={() => setUrls((p) => ({ ...p, espalda: "" }))} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onSaved({ titulo: "Playera Default", frente_url: urls.frente || DEFAULT_FRENTE, espalda_url: urls.espalda || DEFAULT_ESPALDA, es_gorra: false })} className="gap-1">
          <Check className="w-3 h-3" /> Aplicar
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// selectedId=null significa "Playera Default seleccionada"
// selectedId="__default_custom__" significa "Default personalizada (sin BD) seleccionada"
export default function GarmentPicker({ selectedId, onSelect }) {
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingDefault, setEditingDefault] = useState(false);
  const [search, setSearch] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    base44.entities.GarmentTemplate.list("titulo").then((g) => {
      setGarments(g);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await base44.entities.GarmentTemplate.delete(id);
    setGarments((prev) => prev.filter((g) => g.id !== id));
    if (selectedId === id) onSelect(null);
  };

  const handleSaved = (updated) => {
    if (editingId) {
      setGarments((prev) => prev.map((g) => g.id === editingId ? updated : g));
      setEditingId(null);
    } else {
      setGarments((prev) => [...prev, updated]);
    }
    setShowForm(false);
    onSelect(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
          <Shirt className="w-4 h-4" /> Prenda para Vista Previa
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50">
          <Plus className="w-3.5 h-3.5" /> Nueva prenda
        </Button>
      </div>

      {showForm && (
        <GarmentForm
          garment={editingId ? garments.find((g) => g.id === editingId) : null}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      {editingDefault && (
        <DefaultGarmentEditor
          onSaved={(data) => {
            setEditingDefault(false);
            onSelect({ ...data, id: "__default_custom__" });
          }}
          onCancel={() => setEditingDefault(false)}
        />
      )}

      {/* Buscador */}
      {!loading && garments.length > 0 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o código..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
      ) : (() => {
          // Build flat list: default first, then filtered garments
          const defaultItem = { id: null, titulo: "Playera Default", frente_url: DEFAULT_FRENTE, _isDefault: true };
          const filtered = garments.filter(g => {
            if (!search) return true;
            const s = search.toLowerCase();
            return g.titulo?.toLowerCase().includes(s) || g.modelo?.toLowerCase().includes(s) || g.marca?.toLowerCase().includes(s) || g.color?.toLowerCase().includes(s);
          });
          const allItems = [defaultItem, ...filtered];
          const total = allItems.length;
          const safeIdx = Math.min(carouselIndex, total - 1);
          const item = allItems[safeIdx];
          const isSelected = item._isDefault
            ? (!selectedId || selectedId === "__default_custom__")
            : selectedId === item.id;

          return (
            <div className="flex items-center gap-3 bg-blue-50/40 border border-blue-200 rounded-xl px-3 py-2">
              {/* Flecha izquierda */}
              <button
                type="button"
                onClick={() => setCarouselIndex((i) => (i - 1 + total) % total)}
                className="p-1.5 rounded-full border border-blue-200 hover:bg-blue-100 text-blue-600 flex-shrink-0"
                disabled={total <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Tarjeta central */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => item._isDefault ? onSelect(null) : onSelect(item)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 border-2 rounded-lg p-2 w-20 flex-shrink-0 transition-all group",
                    isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <img src={item.frente_url || DEFAULT_FRENTE} alt={item.titulo} className="w-12 h-12 object-contain" />
                  <span className="text-[9px] font-semibold text-center leading-tight">{item.titulo}</span>
                  {isSelected && <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
                  {!item._isDefault && (
                    <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setShowForm(true); }} className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center" title="Editar"><Edit2 className="w-2.5 h-2.5 text-white" /></button>
                      <button type="button" onClick={(e) => handleDelete(e, item.id)} className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Eliminar"><X className="w-2.5 h-2.5 text-white" /></button>
                    </div>
                  )}
                  {item._isDefault && (
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditingDefault(true); }} className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center" title="Editar default"><Edit2 className="w-2.5 h-2.5 text-white" /></button>
                    </div>
                  )}
                </button>

                {/* Info del item */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-700 truncate">{item.titulo}</p>
                  {!item._isDefault && (
                    <div className="space-y-0.5 mt-0.5">
                      {item.modelo && <p className="text-[10px] text-gray-500 truncate">Modelo: {item.modelo}</p>}
                      {item.marca && <p className="text-[10px] text-gray-500 truncate">Marca: {item.marca}</p>}
                      {item.color && <p className="text-[10px] text-gray-500 truncate">Color: {item.color}</p>}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{safeIdx + 1} / {total}</p>
                </div>
              </div>

              {/* Flecha derecha */}
              <button
                type="button"
                onClick={() => setCarouselIndex((i) => (i + 1) % total)}
                className="p-1.5 rounded-full border border-blue-200 hover:bg-blue-100 text-blue-600 flex-shrink-0"
                disabled={total <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}
    </div>
  );
}