import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";

const empty = () => ({ codigo: "", color: "", efecto: "", marca: "", hex: "#ffffff" });

export default function VinilTextilManager() {
  const [viniles, setViniles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.VinilTextil.list("codigo").then((data) => {
      setViniles(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.codigo || !form.color) return;
    setSaving(true);
    const created = await base44.entities.VinilTextil.create(form);
    setViniles((prev) => [...prev, created].sort((a, b) => a.codigo.localeCompare(b.codigo)));
    setForm(empty());
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.VinilTextil.delete(id);
    setViniles((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-purple-700 uppercase tracking-wider">Catálogo de Vinil Textil</p>

      {/* Formulario agregar */}
      <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/30 space-y-3">
        <p className="text-xs font-semibold text-purple-600 uppercase">Agregar vinil</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-purple-700 uppercase">Código *</label>
            <Input value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ej: VT-001" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-purple-700 uppercase">Color *</label>
            <Input value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Ej: Rojo" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-purple-700 uppercase">Efecto</label>
            <Input value={form.efecto} onChange={(e) => setForm(f => ({ ...f, efecto: e.target.value }))} placeholder="Mate, Brillante..." className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-purple-700 uppercase">Marca</label>
            <Input value={form.marca} onChange={(e) => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Marca..." className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-purple-700 uppercase">Color Hex</label>
            <div className="flex gap-1">
              <input type="color" value={form.hex} onChange={(e) => setForm(f => ({ ...f, hex: e.target.value }))} className="h-8 w-10 rounded border border-input cursor-pointer p-0.5" />
              <Input value={form.hex} onChange={(e) => setForm(f => ({ ...f, hex: e.target.value }))} className="h-8 text-xs font-mono flex-1" />
            </div>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving || !form.codigo || !form.color} size="sm" className="gap-1 bg-purple-600 hover:bg-purple-700">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Agregar
        </Button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : viniles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay viniles registrados</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-purple-50 border-b border-purple-100">
              <tr>
                <th className="text-left px-3 py-2 font-bold text-purple-700 uppercase text-[10px]">Color</th>
                <th className="text-left px-3 py-2 font-bold text-purple-700 uppercase text-[10px]">Código</th>
                <th className="text-left px-3 py-2 font-bold text-purple-700 uppercase text-[10px]">Nombre Color</th>
                <th className="text-left px-3 py-2 font-bold text-purple-700 uppercase text-[10px]">Efecto</th>
                <th className="text-left px-3 py-2 font-bold text-purple-700 uppercase text-[10px]">Marca</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {viniles.map((v, i) => (
                <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-purple-50/30"}>
                  <td className="px-3 py-2">
                    <div className="w-5 h-5 rounded-sm border border-gray-300" style={{ backgroundColor: v.hex || "#ffffff" }} />
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-purple-700">{v.codigo}</td>
                  <td className="px-3 py-2 font-medium">{v.color}</td>
                  <td className="px-3 py-2 text-gray-500">{v.efecto || "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{v.marca || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleDelete(v.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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