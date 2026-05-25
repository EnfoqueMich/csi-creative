import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2, ImagePlus, Check, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FRENTE = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/6b6aec754_frente.png";
const DEFAULT_ESPALDA = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/173365721_espalda.png";

export { DEFAULT_FRENTE, DEFAULT_ESPALDA };

function NewGarmentForm({ onSaved, onCancel }) {
  const [titulo, setTitulo] = useState("");
  const [frenteUrl, setFrenteUrl] = useState("");
  const [espaldaUrl, setEspaldaUrl] = useState("");
  const [uploadingFrente, setUploadingFrente] = useState(false);
  const [uploadingEspalda, setUploadingEspalda] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadImg = async (file, setUrl, setUploading) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    const saved = await base44.entities.GarmentTemplate.create({
      titulo: titulo.trim(),
      frente_url: frenteUrl || DEFAULT_FRENTE,
      espalda_url: espaldaUrl || DEFAULT_ESPALDA,
    });
    setSaving(false);
    onSaved(saved);
  };

  const ImgUpload = ({ label, url, uploading, onFile }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-blue-600 uppercase">{label}</p>
      {url ? (
        <div className="relative">
          <img src={url} alt={label} className="w-full h-20 object-contain border border-blue-200 rounded" />
          <button type="button" onClick={() => onFile(null)} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
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
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImg(f, (u) => onFile(u), uploading ? () => {} : (v) => {}) }}
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="border-2 border-blue-300 rounded-lg p-3 space-y-2 bg-blue-50/40">
      <p className="text-xs font-bold text-blue-700 uppercase">Nueva prenda</p>
      <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre (ej: Chamarra, Gorra...)" className="text-sm" />
      <div className="grid grid-cols-2 gap-2">
        {/* Frente */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-blue-600 uppercase">Vista Frontal</p>
          {frenteUrl ? (
            <div className="relative">
              <img src={frenteUrl} alt="frente" className="w-full h-20 object-contain border border-blue-200 rounded" />
              <button type="button" onClick={() => setFrenteUrl("")} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ) : (
            <label className={cn(
              "flex flex-col items-center justify-center gap-1 h-20 border border-dashed border-blue-300 rounded cursor-pointer hover:bg-blue-50 text-blue-400 transition-colors",
              uploadingFrente && "opacity-50 pointer-events-none"
            )}>
              {uploadingFrente ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              <span className="text-[9px]">{uploadingFrente ? "Subiendo..." : "Cargar frente"}</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImg(f, setFrenteUrl, setUploadingFrente); }}
              />
            </label>
          )}
        </div>
        {/* Espalda */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-blue-600 uppercase">Vista Trasera</p>
          {espaldaUrl ? (
            <div className="relative">
              <img src={espaldaUrl} alt="espalda" className="w-full h-20 object-contain border border-blue-200 rounded" />
              <button type="button" onClick={() => setEspaldaUrl("")} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ) : (
            <label className={cn(
              "flex flex-col items-center justify-center gap-1 h-20 border border-dashed border-blue-300 rounded cursor-pointer hover:bg-blue-50 text-blue-400 transition-colors",
              uploadingEspalda && "opacity-50 pointer-events-none"
            )}>
              {uploadingEspalda ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              <span className="text-[9px]">{uploadingEspalda ? "Subiendo..." : "Cargar espalda"}</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImg(f, setEspaldaUrl, setUploadingEspalda); }}
              />
            </label>
          )}
        </div>
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

export default function GarmentPicker({ selectedId, onSelect }) {
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  const handleSaved = (newGarment) => {
    setGarments((prev) => [...prev, newGarment]);
    setShowForm(false);
    onSelect(newGarment);
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

      {showForm && <NewGarmentForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {/* Opción: Playera default */}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "relative flex flex-col items-center gap-1 border-2 rounded-lg p-2 w-24 transition-all",
              !selectedId ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
            )}
          >
            <img src={DEFAULT_FRENTE} alt="Playera" className="w-12 h-12 object-contain" />
            <span className="text-[10px] font-semibold text-center leading-tight">Playera<br/>Default</span>
            {!selectedId && <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
          </button>

          {garments.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g)}
              className={cn(
                "relative flex flex-col items-center gap-1 border-2 rounded-lg p-2 w-24 transition-all group",
                selectedId === g.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
              )}
            >
              <img src={g.frente_url || DEFAULT_FRENTE} alt={g.titulo} className="w-12 h-12 object-contain" />
              <span className="text-[10px] font-semibold text-center leading-tight">{g.titulo}</span>
              {selectedId === g.id && <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
              <button
                type="button"
                onClick={(e) => handleDelete(e, g.id)}
                className="absolute top-1 left-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center hidden group-hover:flex"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}