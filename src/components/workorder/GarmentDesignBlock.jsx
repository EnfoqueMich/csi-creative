import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import TshirtPreviewInteractive, { DEFAULT_LAYOUT } from "./TshirtPreviewInteractive";
import GarmentPicker from "./GarmentPicker";
import HiloColorPicker from "./HiloColorPicker";
import VinilColorPicker from "./VinilColorPicker";
import LogoPicker from "./LogoPicker";

const POSICIONES_DEFAULT = [
  { numero: 1, nombre: "FRENTE IZQUIERDO" },
  { numero: 2, nombre: "FRENTE DERECHO" },
  { numero: 3, nombre: "MANGA DERECHA" },
  { numero: 4, nombre: "MANGA IZQUIERDA" },
  { numero: 5, nombre: "ESPALDA" },
];

const EXTRAS_LIST = [
  ["foamy","Foamy"],["velcro_macho","Velcro macho"],
  ["velcro_hembra","Velcro hembra"],["adhesivo_termico","Adhesivo térmico"]
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

function makeDefaultPosiciones() {
  return POSICIONES_DEFAULT.map(p => ({
    ...p,
    descripcion: "",
    imagen_url: "",
    color_hilos: [""],
    bobina_negra: false,
    bobina_blanca: false,
    extras: {},
    alto_cm: 0,
    ancho_cm: 0,
  }));
}

/**
 * Un bloque de diseño de prenda: selector de prenda, preview interactivo y posiciones.
 * Props:
 *   diseno: { id, garment_frente_url, garment_espalda_url, garment_titulo, garment_es_gorra,
 *             garment_lateral_izq_url, garment_lateral_der_url, garment_id,
 *             preview_layout, posiciones }
 *   index: número del diseño (1-based)
 *   canRemove: boolean
 *   onUpdate(diseno): callback con el diseño actualizado
 *   onRemove(): callback para eliminar este diseño
 *   logoCatalog: array de logos
 *   onLogoCatalogUpdate(logo): callback
 */
export default function GarmentDesignBlock({ diseno, index, canRemove, onUpdate, onRemove, logoCatalog, onLogoCatalogUpdate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [titulo, setTitulo] = useState(diseno.titulo || "");

  // Sync si el prop cambia desde afuera (ej: al cargar orden guardada)
  useEffect(() => {
    setTitulo(diseno.titulo || "");
  }, [diseno.id]);

  const selectedGarment = diseno.garment_frente_url
    ? {
        id: diseno.garment_id || null,
        frente_url: diseno.garment_frente_url,
        espalda_url: diseno.garment_espalda_url,
        titulo: diseno.garment_titulo,
        es_gorra: diseno.garment_es_gorra || false,
        lateral_izq_url: diseno.garment_lateral_izq_url || "",
        lateral_der_url: diseno.garment_lateral_der_url || "",
      }
    : null;

  const posiciones = diseno.posiciones?.length ? diseno.posiciones : makeDefaultPosiciones();
  const layout = diseno.preview_layout && Object.keys(diseno.preview_layout).length > 0
    ? diseno.preview_layout
    : { ...DEFAULT_LAYOUT };

  const update = (patch) => onUpdate(patch);

  const handleSelectGarment = (g) => {
    update({
      garment_id: g?.id && g.id !== "__default_custom__" ? g.id : null,
      garment_frente_url: g?.frente_url || "",
      garment_espalda_url: g?.espalda_url || "",
      garment_titulo: g?.titulo || "",
      garment_es_gorra: g?.es_gorra || false,
      garment_lateral_izq_url: g?.lateral_izq_url || "",
      garment_lateral_der_url: g?.lateral_der_url || "",
    });
  };

  const setPosicion = (idx, field, value) => {
    const next = [...posiciones];
    next[idx] = { ...next[idx], [field]: value };
    update({ posiciones: next });
  };

  const setPosicionNested = (posIdx, field, key, value) => {
    const next = [...posiciones];
    next[posIdx] = { ...next[posIdx], [field]: { ...(next[posIdx][field] || {}), [key]: value } };
    update({ posiciones: next });
  };

  const setPosicionHilo = (posIdx, hiloIdx, value) => {
    const next = [...posiciones];
    const color_hilos = [...(next[posIdx].color_hilos || [""])];
    color_hilos[hiloIdx] = value;
    next[posIdx] = { ...next[posIdx], color_hilos };
    update({ posiciones: next });
  };

  const addHilo = (posIdx) => {
    const next = [...posiciones];
    next[posIdx] = { ...next[posIdx], color_hilos: [...(next[posIdx].color_hilos || [""]), ""] };
    update({ posiciones: next });
  };

  const removeHilo = (posIdx, hiloIdx) => {
    const next = [...posiciones];
    const color_hilos = next[posIdx].color_hilos.filter((_, i) => i !== hiloIdx);
    next[posIdx] = { ...next[posIdx], color_hilos: color_hilos.length ? color_hilos : [""] };
    update({ posiciones: next });
  };

  const addPosicion = () => {
    const nums = posiciones.map(p => p.numero);
    const next = Math.max(...(nums.length ? nums : [0])) + 1;
    const defaultName = POSICIONES_DEFAULT.find(p => p.numero === next)?.nombre || `POSICIÓN ${next}`;
    update({
      posiciones: [...posiciones, {
        numero: next, nombre: defaultName, descripcion: "", imagen_url: "", color_hilos: [""],
        bobina_negra: false, bobina_blanca: false, extras: {}, alto_cm: 0, ancho_cm: 0,
      }]
    });
  };

  const removePosicion = (idx) => {
    update({ posiciones: posiciones.filter((_, i) => i !== idx) });
  };

  const selectedId = diseno.garment_id || (diseno.garment_frente_url ? "__default_custom__" : null);

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/20">
      {/* Header del bloque */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-blue-200 bg-blue-50/60 rounded-t-xl">
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1 flex-shrink-0"
        >
          {collapsed ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronUp className="w-4 h-4 text-blue-600" />}
          <span className="text-sm font-bold text-blue-700 uppercase tracking-wide whitespace-nowrap">Diseño #{index}</span>
        </button>
        {/* Título editable */}
        <Input
          value={titulo}
          onChange={e => {
            const val = e.target.value;
            setTitulo(val);
            update({ titulo: val });
          }}
          placeholder="Nombre del diseño (ej: Playera Azul)..."
          className="h-7 text-xs font-semibold flex-1 border-blue-300 bg-white"
          onClick={e => e.stopPropagation()}
        />
        {canRemove && (
          <button type="button" onClick={onRemove} className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pt-4 pb-5 space-y-4">
          {/* Selector de prenda + vista previa */}
          <GarmentPicker
            selectedId={selectedId}
            onSelect={handleSelectGarment}
          />
          <TshirtPreviewInteractive
            posiciones={posiciones}
            layout={layout}
            onLayoutChange={(newLayout) => update({ preview_layout: newLayout })}
            frenteUrl={diseno.garment_frente_url}
            espaldaUrl={diseno.garment_espalda_url}
            latIzqUrl={diseno.garment_lateral_izq_url}
            latDerUrl={diseno.garment_lateral_der_url}
            esGorra={diseno.garment_es_gorra || false}
          />

          {/* Posiciones */}
          <div className="rounded-xl border-2 border-blue-300 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Posiciones de Bordado / Estampado</p>
              <Button type="button" variant="outline" size="sm" onClick={addPosicion} className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50">
                <Plus className="w-3.5 h-3.5" /> Agregar posición
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {posiciones.map((pos, i) => (
                <div key={i} className="border-2 border-blue-200 rounded-lg p-3 space-y-2 relative">
                  {posiciones.length > 1 && (
                    <button type="button" onClick={() => removePosicion(i)} className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-red-100 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div className="bg-blue-600 text-white text-xs font-bold rounded px-2 py-1 text-center pr-6">
                    POSICIÓN # {pos.numero}
                  </div>
                  <Input
                    value={pos.nombre}
                    onChange={(e) => setPosicion(i, "nombre", e.target.value)}
                    className="text-xs font-semibold text-center bg-green-50 border-green-300 text-green-800 h-7"
                  />
                  <LogoPicker
                    posicion={pos}
                    logos={logoCatalog}
                    onLogoCatalogUpdate={onLogoCatalogUpdate}
                    onChange={(logoFields) => {
                      const next = [...posiciones];
                      next[i] = { ...next[i], ...logoFields };
                      update({ posiciones: next });
                    }}
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
                        <HiloColorPicker value={c} onChange={(val) => setPosicionHilo(i, hi, val)} placeholder="Código o nombre..." />
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
                  {/* Bobina */}
                  <div className="border-t border-blue-100 pt-2">
                    <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Bobina</p>
                    <div className="flex items-center gap-3">
                      <CheckBox label="Negra" checked={!!pos.bobina_negra} onChange={() => setPosicion(i, "bobina_negra", !pos.bobina_negra)} />
                      <CheckBox label="Blanca" checked={!!pos.bobina_blanca} onChange={() => setPosicion(i, "bobina_blanca", !pos.bobina_blanca)} />
                    </div>
                  </div>
                  {/* Vinil */}
                  <div className="border-t border-purple-100 pt-2">
                    <p className="text-[10px] font-bold text-purple-700 uppercase mb-1">Vinil Textil</p>
                    <VinilColorPicker value={pos.vinil_codigo || ""} onChange={(val) => setPosicion(i, "vinil_codigo", val)} placeholder="Código o color vinil..." />
                  </div>
                  <ExtrasCollapsible extras={pos.extras || {}} onChange={(key, val) => setPosicionNested(i, "extras", key, val)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}