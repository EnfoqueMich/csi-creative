import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import HiloColorPicker from "./HiloColorPicker";

const TALLAS = ["xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl"];

// Un personalizado = { nombre, color_hilo, nota }
const emptyPersonalizado = () => ({ nombre: "", color_hilo: "", nota: "" });

export default function EspecRow({ row, onChange, onRemove, canRemove, disenos = [], assignedDisenos = {} }) {
  const [collapsed, setCollapsed] = useState(false);

  // personalizados: { [talla]: [ { nombre, color_hilo, nota } ] }
  const personalizados = row.personalizados || {};

  const updatePersonalizado = (talla, idx, field, value) => {
    const lista = [...(personalizados[talla] || [])];
    lista[idx] = { ...lista[idx], [field]: value };
    onChange("personalizados", { ...personalizados, [talla]: lista });
  };

  const addPersonalizado = (talla) => {
    const lista = [...(personalizados[talla] || []), emptyPersonalizado()];
    onChange("personalizados", { ...personalizados, [talla]: lista });
  };

  const removePersonalizado = (talla, idx) => {
    const lista = (personalizados[talla] || []).filter((_, i) => i !== idx);
    onChange("personalizados", { ...personalizados, [talla]: lista });
  };

  const updateTalla = (talla, value) => {
    const newTallas = { ...(row.tallas || {}), [talla]: Number(value) || 0 };
    // Recalcular total
    const total = Object.values(newTallas).reduce((s, v) => s + (Number(v) || 0), 0);
    onChange("tallas", newTallas);
    onChange("total_piezas", total);
  };

  const updatePersonalizadoCount = (talla, delta) => {
    const current = (personalizados[talla] || []).length;
    const newCount = Math.max(0, current + delta);
    let lista = [...(personalizados[talla] || [])];
    if (newCount > current) {
      lista = [...lista, emptyPersonalizado()];
    } else if (newCount < current) {
      lista = lista.slice(0, newCount);
    }
    onChange("personalizados", { ...personalizados, [talla]: lista });
  };

  const totalPiezas = TALLAS.reduce((s, t) => s + (Number(row.tallas?.[t]) || 0), 0);

  return (
    <div className="border-2 border-green-400 rounded-xl bg-white overflow-hidden">
      {/* Header con campos de prenda */}
      <div className="bg-green-700 px-4 py-2 flex items-center justify-between gap-2">
        <p className="text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap">PRENDAS QUE INGRESARON</p>
        <div className="flex items-center gap-2 flex-1 justify-end">
          {canRemove && (
            <button type="button" onClick={onRemove} className="p-0.5 rounded hover:bg-red-500/30 text-white/70 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={() => setCollapsed(c => !c)} className="text-white/70 hover:text-white">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Selector de diseño vinculado */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
        <span className="text-[10px] font-bold text-blue-700 uppercase whitespace-nowrap">Diseño vinculado:</span>
        <select
          value={row.diseno_id || ""}
          onChange={e => onChange("diseno_id", e.target.value || null)}
          className="flex-1 h-7 text-xs border border-blue-300 rounded px-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">— Sin diseño asignado —</option>
          {disenos.map((d, di) => {
            const alreadyUsed = d.id !== row.diseno_id && assignedDisenos[d.id];
            const label = d.titulo || d.garment_titulo || "";
            return (
              <option key={d.id} value={d.id} disabled={!!alreadyUsed}>
                Diseño #{di + 1}{label ? ` — ${label}` : ""}{alreadyUsed ? " (ya asignado)" : ""}
              </option>
            );
          })}
        </select>
        {row.diseno_id && (
          <button type="button" onClick={() => onChange("diseno_id", null)} className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Datos de la prenda */}
      <div className="px-4 py-3 flex flex-wrap items-end gap-3 border-b border-green-200 bg-green-50/40">
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo Prenda</label>
          <Input value={row.tipo_prenda || ""} onChange={e => onChange("tipo_prenda", e.target.value)} placeholder="Playera..." className="h-8 text-xs w-32" />
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Color</label>
          <Input value={row.color_prenda || ""} onChange={e => onChange("color_prenda", e.target.value)} placeholder="Negro..." className="h-8 text-xs w-28" />
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Modelo</label>
          <Input value={row.modelo || ""} onChange={e => onChange("modelo", e.target.value)} placeholder="Modelo..." className="h-8 text-xs w-28" />
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Marca</label>
          <Input value={row.marca || ""} onChange={e => onChange("marca", e.target.value)} placeholder="Marca..." className="h-8 text-xs w-28" />
        </div>
        {/* Total piezas */}
        <div className="ml-auto space-y-0.5 text-center">
          <label className="text-[10px] font-bold text-green-700 uppercase">Total Piezas</label>
          <div className="border-2 border-green-500 rounded-lg px-4 py-1 text-center bg-white">
            <p className="text-2xl font-black text-green-700 leading-none">{totalPiezas}</p>
          </div>
        </div>
      </div>

      {/* Tallas */}
      {!collapsed && (
        <div className="divide-y divide-green-100">
          {TALLAS.map((talla) => {
            const cantidad = Number(row.tallas?.[talla]) || 0;
            const listaP = personalizados[talla] || [];
            const countP = listaP.length;
            const sinPersonalizar = cantidad - countP;

            return (
              <div key={talla} className="px-4 py-2 space-y-2">
                {/* Fila principal de talla */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Badge talla + cantidad */}
                  <div className="flex flex-col items-center justify-center border-2 border-green-500 rounded-lg w-14 py-1 bg-white flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">{talla}</span>
                    <Input
                      type="number" min="0"
                      value={cantidad || ""}
                      onChange={e => updateTalla(talla, e.target.value)}
                      className="w-10 h-7 text-center text-base font-black border-0 p-0 focus-visible:ring-0 shadow-none"
                    />
                  </div>

                  {/* Botón agregar personalizado */}
                  <button
                    type="button"
                    onClick={() => addPersonalizado(talla)}
                    className="text-[11px] font-bold text-green-700 border border-green-400 rounded px-2 py-1 hover:bg-green-50 transition-colors whitespace-nowrap"
                  >
                    + AGREGAR PERSONALIZADO
                  </button>

                  {/* Spinner de cuántos personalizados */}
                  {cantidad > 0 && (
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button type="button" onClick={() => updatePersonalizadoCount(talla, -1)} className="px-1.5 py-1 hover:bg-gray-100 text-gray-600 text-xs">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-700 min-w-[20px] text-center">{countP}</span>
                      <button type="button" onClick={() => updatePersonalizadoCount(talla, 1)} className="px-1.5 py-1 hover:bg-gray-100 text-gray-600 text-xs">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Resumen sin personalizar / personalizadas */}
                  {cantidad > 0 && (
                    <div className="flex flex-col text-[11px] text-gray-600 ml-auto">
                      <span><strong className="text-gray-800">{Math.max(0, sinPersonalizar)}</strong> tallas {talla.toUpperCase()} <span className="font-bold text-gray-500">SIN PERSONALIZAR</span></span>
                      {countP > 0 && <span><strong className="text-green-700">{countP}</strong> tallas {talla.toUpperCase()} <span className="font-bold text-green-700">PERSONALIZADAS</span></span>}
                    </div>
                  )}
                </div>

                {/* Lista de personalizados */}
                {listaP.map((p, pi) => (
                  <div key={pi} className="ml-16 border border-yellow-300 rounded-lg p-2 bg-yellow-50/40 flex gap-2 items-start relative">
                    <button type="button" onClick={() => removePersonalizado(talla, pi)} className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>

                    {/* Badge talla mini */}
                    <div className="flex flex-col items-center justify-center border border-green-400 rounded w-10 flex-shrink-0 bg-white py-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">{talla}</span>
                      <span className="text-xs font-black text-green-700">1</span>
                    </div>

                    <div className="flex-1 space-y-1.5 pr-5">
                      {/* Nombre */}
                      <Input
                        value={p.nombre}
                        onChange={e => updatePersonalizado(talla, pi, "nombre", e.target.value)}
                        placeholder="Nombre del cliente..."
                        className="h-7 text-xs font-semibold uppercase"
                      />
                      {/* Color de hilo */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase whitespace-nowrap">Color Hilo:</span>
                        <HiloColorPicker
                          value={p.color_hilo}
                          onChange={val => updatePersonalizado(talla, pi, "color_hilo", val)}
                          placeholder="Código o nombre..."
                        />
                      </div>
                      {/* Nota */}
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase whitespace-nowrap mt-1">Nota:</span>
                        <Textarea
                          value={p.nota}
                          onChange={e => updatePersonalizado(talla, pi, "nota", e.target.value)}
                          placeholder="Comentario..."
                          rows={1}
                          className="text-[11px] resize-none h-7 py-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}