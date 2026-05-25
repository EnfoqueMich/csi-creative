import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2 } from "lucide-react";

export default function HiloColorManager() {
  const [colores, setColores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ codigo: "", nombre: "", hex: "#000000" });

  useEffect(() => {
    base44.entities.HiloColor.list("codigo").then(data => {
      setColores(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    setSaving(true);
    const nuevo = await base44.entities.HiloColor.create(form);
    setColores(prev => [...prev, nuevo].sort((a, b) => a.codigo.localeCompare(b.codigo)));
    setForm({ codigo: "", nombre: "", hex: "#000000" });
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.HiloColor.delete(id);
    setColores(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Catálogo de Colores de Hilo</p>

      {/* Formulario agregar */}
      <div className="flex items-end gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-blue-700 uppercase">Código</label>
          <Input
            value={form.codigo}
            onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
            placeholder="1234"
            className="h-8 w-24 text-sm"
          />
        </div>
        <div className="space-y-0.5 flex-1">
          <label className="text-[10px] font-bold text-blue-700 uppercase">Nombre</label>
          <Input
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Rojo Carmín..."
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-blue-700 uppercase">Color (hex)</label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={form.hex}
              onChange={e => setForm(f => ({ ...f, hex: e.target.value }))}
              className="h-8 w-10 rounded border border-input cursor-pointer p-0.5"
            />
            <Input
              value={form.hex}
              onChange={e => setForm(f => ({ ...f, hex: e.target.value }))}
              placeholder="#000000"
              className="h-8 w-24 text-sm font-mono"
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving || !form.codigo.trim() || !form.nombre.trim()} size="sm" className="gap-1 h-8">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Agregar
        </Button>
      </div>

      {/* Lista de colores */}
      {colores.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay colores registrados aún.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Código</th>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-left px-3 py-2">Color</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {colores.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                  <td className="px-3 py-2 font-mono font-semibold">{c.codigo}</td>
                  <td className="px-3 py-2">{c.nombre}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: c.hex || "#ccc" }} />
                      <span className="font-mono text-xs text-muted-foreground">{c.hex}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}