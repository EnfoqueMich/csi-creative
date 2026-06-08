import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";

export default function HiloColorManager() {
  const [colores, setColores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ codigo: "", nombre: "", hex: "#000000" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ codigo: c.codigo, nombre: c.nombre, hex: c.hex || "#000000" });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    const updated = await base44.entities.HiloColor.update(id, editForm);
    setColores(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.codigo.localeCompare(b.codigo)));
    setEditingId(null);
    setEditForm({});
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Catálogo de Colores de Hilo</p>

      {/* Formulario agregar */}
      <div className="flex items-end gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex-wrap">
        <div className="space-y-0.5">
          <label className="text-[10px] font-bold text-blue-700 uppercase">Código</label>
          <Input
            value={form.codigo}
            onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
            placeholder="1234"
            className="h-8 w-24 text-sm"
          />
        </div>
        <div className="space-y-0.5 flex-1 min-w-[140px]">
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
                <th className="text-left px-3 py-2">Color</th>
                <th className="text-left px-3 py-2">Código</th>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-left px-3 py-2">Hex</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {colores.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                  {editingId === c.id ? (
                    <>
                      <td className="px-3 py-2">
                        <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: editForm.hex || "#ccc" }} />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={editForm.codigo}
                          onChange={e => setEditForm(f => ({ ...f, codigo: e.target.value }))}
                          className="h-7 w-20 text-xs font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={editForm.nombre}
                          onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={editForm.hex}
                            onChange={e => setEditForm(f => ({ ...f, hex: e.target.value }))}
                            className="h-7 w-8 rounded border border-input cursor-pointer p-0.5"
                          />
                          <Input
                            value={editForm.hex}
                            onChange={e => setEditForm(f => ({ ...f, hex: e.target.value }))}
                            className="h-7 w-20 text-xs font-mono"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => handleSaveEdit(c.id)} disabled={saving} className="text-green-600 hover:text-green-800 transition-colors">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={cancelEdit} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">
                        <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: c.hex || "#ccc" }} />
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold">{c.codigo}</td>
                      <td className="px-3 py-2">{c.nombre}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.hex}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => startEdit(c)} className="text-muted-foreground hover:text-blue-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}