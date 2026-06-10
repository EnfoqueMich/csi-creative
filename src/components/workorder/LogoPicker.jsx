import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, X, Plus, Check, Loader2, ImagePlus, Edit2, BookImage } from "lucide-react";
import { cn } from "@/lib/utils";
import HiloColorPicker from "./HiloColorPicker";
import VinilColorPicker from "./VinilColorPicker";

const EXTRAS_LIST = [
  ["foamy", "Foamy"],
  ["velcro_macho", "Velcro macho"],
  ["velcro_hembra", "Velcro hembra"],
  ["adhesivo_termico", "Adhesivo térmico"],
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

// Formulario para crear/editar un logo del catálogo
function LogoForm({ logo, onSaved, onCancel, onUseWithoutSaving }) {
  const [nombre, setNombre] = useState(logo?.nombre || "");
  const [cliente, setCliente] = useState(logo?.cliente || "");
  const [imagenUrl, setImagenUrl] = useState(logo?.imagen_url || "");
  const [descripcion, setDescripcion] = useState(logo?.descripcion || "");
  const [altoCm, setAltoCm] = useState(logo?.alto_cm || "");
  const [anchoCm, setAnchoCm] = useState(logo?.ancho_cm || "");
  const [colorHilos, setColorHilos] = useState(logo?.color_hilos?.length ? logo.color_hilos : [""]);
  const [bobinaNegra, setBobinaNegra] = useState(logo?.bobina_negra || false);
  const [bobinaBlanca, setBobinaBlanca] = useState(logo?.bobina_blanca || false);
  const [vinilCodigo, setVinilCodigo] = useState(logo?.vinil_codigo || "");
  const [extras, setExtras] = useState(logo?.extras || {});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImagenUrl(file_url);
    setUploading(false);
  };

  const buildData = () => ({
    nombre: nombre.trim(),
    cliente: cliente.trim(),
    imagen_url: imagenUrl,
    descripcion: descripcion.trim(),
    alto_cm: Number(altoCm) || 0,
    ancho_cm: Number(anchoCm) || 0,
    color_hilos: colorHilos.filter(Boolean),
    bobina_negra: bobinaNegra,
    bobina_blanca: bobinaBlanca,
    vinil_codigo: vinilCodigo,
    extras,
  });

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    const data = buildData();
    let saved;
    if (logo?.id) {
      saved = await base44.entities.LogoCatalog.update(logo.id, data);
      saved = { ...logo, ...data };
    } else {
      saved = await base44.entities.LogoCatalog.create(data);
    }
    setSaving(false);
    onSaved(saved);
  };

  const handleUseWithoutSaving = () => {
    onUseWithoutSaving(buildData());
  };

  const setHilo = (idx, val) => {
    const arr = [...colorHilos];
    arr[idx] = val;
    setColorHilos(arr);
  };
  const addHilo = () => setColorHilos((prev) => [...prev, ""]);
  const removeHilo = (idx) => {
    const arr = colorHilos.filter((_, i) => i !== idx);
    setColorHilos(arr.length ? arr : [""]);
  };

  return (
    <div className="border-2 border-violet-300 rounded-lg p-3 space-y-3 bg-violet-50/40">
      <p className="text-xs font-bold text-violet-700 uppercase">{logo?.id ? "Editar Logo" : "Nuevo Logo"}</p>

      <div className="space-y-2">
        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-violet-700 uppercase">Nombre del logo</label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej: Logo Frente..."
            className="text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-violet-700 uppercase">Cliente</label>
          <Input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="ej: Empresa X..."
            className="text-sm"
          />
        </div>
      </div>

      {/* Imagen */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-violet-600 uppercase">Imagen del Logo</p>
        {imagenUrl ? (
          <div className="relative w-28">
            <img src={imagenUrl} alt="logo" className="w-28 h-20 object-contain border border-violet-200 rounded" />
            <button type="button" onClick={() => setImagenUrl("")} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ) : (
          <label className={cn(
            "flex flex-col items-center justify-center gap-1 h-20 w-28 border border-dashed border-violet-300 rounded cursor-pointer hover:bg-violet-50 text-violet-400 transition-colors",
            uploading && "opacity-50 pointer-events-none"
          )}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            <span className="text-[9px]">{uploading ? "Subiendo..." : "Cargar imagen"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadImg} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Medidas */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-violet-700 uppercase">Alto (cm)</label>
          <Input type="number" min="0" step="0.1" value={altoCm} onChange={(e) => setAltoCm(e.target.value)} placeholder="cm" className="h-7 text-xs" />
        </div>
        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-violet-700 uppercase">Ancho (cm)</label>
          <Input type="number" min="0" step="0.1" value={anchoCm} onChange={(e) => setAnchoCm(e.target.value)} placeholder="cm" className="h-7 text-xs" />
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-0.5">
        <label className="text-[9px] font-bold text-violet-700 uppercase">Descripción / Instrucciones</label>
        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Instrucciones de bordado, estampado..." className="text-xs resize-none" />
      </div>

      {/* Colores de hilo */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-blue-700 uppercase">Color de Hilo</p>
        {colorHilos.map((c, hi) => (
          <div key={hi} className="flex items-center gap-1">
            <HiloColorPicker value={c} onChange={(val) => setHilo(hi, val)} placeholder="Código o nombre..." />
            {colorHilos.length > 1 && (
              <button type="button" onClick={() => removeHilo(hi)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
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
          <CheckBox label="Negra" checked={bobinaNegra} onChange={() => setBobinaNegra((v) => !v)} />
          <CheckBox label="Blanca" checked={bobinaBlanca} onChange={() => setBobinaBlanca((v) => !v)} />
        </div>
      </div>

      {/* Vinil */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-purple-700 uppercase">Vinil Textil</p>
        <VinilColorPicker value={vinilCodigo} onChange={setVinilCodigo} placeholder="Código o color vinil..." />
      </div>

      {/* Extras */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-orange-600 uppercase">Extras</p>
        <div className="grid grid-cols-2 gap-1">
          {EXTRAS_LIST.map(([key, label]) => (
            <CheckBox
              key={key}
              label={label}
              checked={!!extras[key]}
              onChange={() => setExtras((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving || !nombre.trim()} className="gap-1 bg-violet-600 hover:bg-violet-700">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {logo?.id ? "Guardar cambios" : "Guardar en catálogo"}
        </Button>
        {!logo?.id && (
          <Button size="sm" variant="outline" onClick={handleUseWithoutSaving} disabled={!imagenUrl} className="gap-1 text-violet-700 border-violet-300">
            Usar sin guardar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// Buscador inline con dropdown de resultados
function LogoSearchDropdown({ logos, onSelect, onNew }) {
  const [queryCliente, setQueryCliente] = useState("");
  const [queryNombre, setQueryNombre] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = logos.filter((l) => {
    const nombre = l.nombre?.toLowerCase() || "";
    const clienteField = l.cliente?.toLowerCase() || "";
    const matchCliente = !queryCliente.trim() || clienteField.includes(queryCliente.toLowerCase()) || nombre.includes(queryCliente.toLowerCase());
    const matchNombre = !queryNombre.trim() || nombre.includes(queryNombre.toLowerCase());
    return matchCliente && matchNombre;
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Dos campos de filtro */}
      <div className="flex gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={queryCliente}
            onChange={(e) => { setQueryCliente(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Cliente..."
            className="w-full pl-6 pr-6 py-1 text-[11px] border border-violet-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          {queryCliente && (
            <button type="button" onClick={() => setQueryCliente("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={queryNombre}
            onChange={(e) => { setQueryNombre(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Nombre del logo..."
            className="w-full px-2 py-1 text-[11px] border border-violet-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          {queryNombre && (
            <button type="button" onClick={() => setQueryNombre("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-muted-foreground">Sin resultados</div>
          ) : (
            results.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => { onSelect(l); setOpen(false); setQueryCliente(""); setQueryNombre(""); }}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
              >
                {l.imagen_url
                  ? <img src={l.imagen_url} alt={l.nombre} className="w-8 h-8 object-contain rounded border border-violet-100 flex-shrink-0" />
                  : <div className="w-8 h-8 bg-violet-100 rounded flex items-center justify-center flex-shrink-0"><BookImage className="w-4 h-4 text-violet-400" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{l.nombre}</p>
                  {l.cliente && <p className="text-[10px] text-violet-600 font-medium truncate">{l.cliente}</p>}
                  {(l.alto_cm || l.ancho_cm) && (
                    <p className="text-[10px] text-muted-foreground">{l.alto_cm}×{l.ancho_cm} cm</p>
                  )}
                </div>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => { onNew(); setOpen(false); setQueryCliente(""); setQueryNombre(""); }}
            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 border-t border-border text-violet-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Cargar nuevo logo...</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente principal que va en cada posición ──────────────────────────────
// logos y onLogoCatalogUpdate se pasan desde WorkOrderForm para compartir el catálogo
export default function LogoPicker({ posicion, onChange, logos = [], onLogoCatalogUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingLogo, setEditingLogo] = useState(null);

  // Aplicar un logo (del catálogo o sin guardar) a la posición
  const applyLogo = (logoData) => {
    onChange({
      imagen_url: logoData.imagen_url || "",
      alto_cm: logoData.alto_cm || 0,
      ancho_cm: logoData.ancho_cm || 0,
      descripcion: logoData.descripcion || "",
      color_hilos: logoData.color_hilos?.length ? logoData.color_hilos : [""],
      bobina_negra: logoData.bobina_negra || false,
      bobina_blanca: logoData.bobina_blanca || false,
      vinil_codigo: logoData.vinil_codigo || "",
      extras: logoData.extras || {},
      logo_catalog_id: logoData.id || null,
    });
    setShowForm(false);
    setEditingLogo(null);
  };

  const handleSaved = (savedLogo) => {
    onLogoCatalogUpdate?.(savedLogo);
    applyLogo(savedLogo);
  };

  const hasLogo = !!posicion.imagen_url;
  const linkedLogo = posicion.logo_catalog_id ? logos.find((l) => l.id === posicion.logo_catalog_id) : null;

  return (
    <div className="space-y-2">
      {/* Buscador de catálogo */}
      {!showForm && (
        <LogoSearchDropdown
          logos={logos}
          onSelect={(l) => applyLogo(l)}
          onNew={() => { setEditingLogo(null); setShowForm(true); }}
        />
      )}

      {/* Formulario nuevo/editar */}
      {showForm && (
        <LogoForm
          logo={editingLogo}
          onSaved={handleSaved}
          onUseWithoutSaving={(data) => { applyLogo(data); setShowForm(false); }}
          onCancel={() => { setShowForm(false); setEditingLogo(null); }}
        />
      )}

      {/* Vista previa del logo seleccionado */}
      {hasLogo && !showForm && (
        <div className="border border-violet-200 rounded-lg p-2 bg-violet-50/30 space-y-1.5">
          {/* Imagen + acciones */}
          <div className="flex items-start gap-2">
            <div className="relative flex-shrink-0">
              <img src={posicion.imagen_url} alt="logo" className="w-16 h-16 object-contain border border-violet-200 rounded" />
              <button
                type="button"
                onClick={() => onChange({ imagen_url: "", alto_cm: 0, ancho_cm: 0, descripcion: "", color_hilos: [""], bobina_negra: false, bobina_blanca: false, vinil_codigo: "", extras: {}, logo_catalog_id: null })}
                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              {linkedLogo && <p className="text-[10px] font-bold text-violet-700 truncate">📌 {linkedLogo.nombre}</p>}
              {(posicion.alto_cm || posicion.ancho_cm) && (
                <p className="text-[10px] text-muted-foreground">{posicion.alto_cm || 0} × {posicion.ancho_cm || 0} cm</p>
              )}
              {posicion.descripcion && (
                <p className="text-[9px] text-gray-600 leading-snug line-clamp-2">{posicion.descripcion}</p>
              )}
            </div>
          </div>

          {/* Hilos */}
          {posicion.color_hilos?.filter(Boolean).length > 0 && (
            <p className="text-[10px] text-blue-700">🧵 {posicion.color_hilos.filter(Boolean).join(", ")}</p>
          )}

          {/* Bobina */}
          {(posicion.bobina_negra || posicion.bobina_blanca) && (
            <p className="text-[10px] text-blue-600">
              Bobina: {[posicion.bobina_negra && "Negra", posicion.bobina_blanca && "Blanca"].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Vinil */}
          {posicion.vinil_codigo && (
            <p className="text-[10px] text-purple-700">Vinil: {posicion.vinil_codigo}</p>
          )}

          {/* Extras */}
          {posicion.extras && Object.values(posicion.extras).some(Boolean) && (
            <p className="text-[10px] text-orange-600">
              Extras: {EXTRAS_LIST.filter(([k]) => posicion.extras[k]).map(([, l]) => l).join(", ")}
            </p>
          )}

          {/* Botón editar */}
          <button
            type="button"
            onClick={() => {
              setEditingLogo(linkedLogo
                ? { ...linkedLogo, ...posicion, id: linkedLogo.id }
                : { ...posicion, id: null }
              );
              setShowForm(true);
            }}
            className="flex items-center gap-1 text-[10px] text-violet-600 hover:underline"
          >
            <Edit2 className="w-2.5 h-2.5" /> Editar datos del logo
          </button>
        </div>
      )}

      {/* Sin logo aún */}
      {!hasLogo && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 w-full justify-center border border-dashed border-violet-300 rounded-lg py-3 text-[11px] text-violet-500 hover:bg-violet-50 transition-colors"
        >
          <ImagePlus className="w-3.5 h-3.5" /> Cargar logo
        </button>
      )}
    </div>
  );
}