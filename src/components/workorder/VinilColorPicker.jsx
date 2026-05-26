import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function VinilColorPicker({ value, onChange, placeholder = "Código vinil..." }) {
  const [viniles, setViniles] = useState([]);
  const [search, setSearch] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    base44.entities.VinilTextil.list("codigo").then(setViniles);
  }, []);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    if (!search) { setFiltered(viniles); return; }
    const q = search.toLowerCase();
    setFiltered(viniles.filter(v =>
      v.codigo?.toLowerCase().includes(q) ||
      v.color?.toLowerCase().includes(q) ||
      v.efecto?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q)
    ));
  }, [search, viniles]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (v) => { onChange(v.codigo); setSearch(v.codigo); setOpen(false); };
  const clear = () => { onChange(""); setSearch(""); };
  const match = viniles.find(v => v.codigo === value);

  return (
    <div className="relative flex-1" ref={ref}>
      <div className="flex items-center gap-1 border border-input rounded-md px-2 h-7 bg-white">
        {match?.hex && (
          <div className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" style={{ backgroundColor: match.hex }} />
        )}
        <input
          className="flex-1 text-[10px] outline-none bg-transparent placeholder:text-muted-foreground"
          value={search}
          placeholder={placeholder}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => select(v)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-muted transition-colors"
            >
              <div className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" style={{ backgroundColor: v.hex || "#ffffff" }} />
              <span className="font-mono text-[10px] font-semibold text-blue-700 whitespace-nowrap">{v.codigo}</span>
              <span className="text-[10px] text-gray-500 truncate">{v.color}{v.efecto ? ` · ${v.efecto}` : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}