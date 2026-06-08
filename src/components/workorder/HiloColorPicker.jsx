import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function HiloColorPicker({ value, onChange, placeholder = "Buscar código..." }) {
  const [colores, setColores] = useState([]);
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    base44.entities.HiloColor.list("codigo").then(setColores);
  }, []);

  // Si value cambia externamente, sincronizar
  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? colores.filter(c =>
        c.codigo.toLowerCase().includes(query.toLowerCase()) ||
        c.nombre.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = (c) => {
    setQuery(c.codigo);
    onChange(c.codigo);
    setOpen(false);
  };

  const handleClear = () => { setQuery(""); onChange(""); };

  const matchExacto = colores.find(c => c.codigo === value);

  return (
    <div ref={ref} className="relative flex-1">
      {/* Si hay match exacto, muestra chip con color + código + nombre */}
      {matchExacto && !open ? (
        <div
          className="flex items-center gap-1.5 border border-blue-200 rounded px-1.5 py-0.5 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => { setOpen(true); }}
        >
          <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: matchExacto.hex || "#ccc" }} />
          <span className="font-mono text-xs font-bold text-blue-700">{matchExacto.codigo}</span>
          <span className="text-xs text-muted-foreground truncate">{matchExacto.nombre}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }} className="ml-auto text-muted-foreground hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="text-xs h-6 flex-1"
            autoFocus={open}
          />
          {query && (
            <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 text-left transition-colors"
            >
              <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: c.hex || "#ccc" }} />
              <span className="font-mono text-xs font-semibold text-blue-700">{c.codigo}</span>
              <span className="text-xs text-muted-foreground truncate">{c.nombre}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}