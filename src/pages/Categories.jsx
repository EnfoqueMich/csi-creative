import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", color: COLORS[0], descripcion: "" });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Category.list("nombre");
    setCategories(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    if (editing) {
      await base44.entities.Category.update(editing.id, form);
    } else {
      await base44.entities.Category.create(form);
    }
    setForm({ nombre: "", color: COLORS[0], descripcion: "" });
    setEditing(null);
    await load();
    setSaving(false);
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({ nombre: cat.nombre, color: cat.color || COLORS[0], descripcion: cat.descripcion || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await base44.entities.Category.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ nombre: "", color: COLORS[0], descripcion: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">Categorías</h1>
          <p className="text-sm text-muted-foreground">Organiza los proyectos por categoría</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4 max-w-xl">
        <p className="text-sm font-semibold">{editing ? "Editar categoría" : "Nueva categoría"}</p>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Nombre *</label>
          <Input
            placeholder="Ej. Temporada Verano, Clientes VIP..."
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{ backgroundColor: c, borderColor: form.color === c ? "#000" : "transparent" }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Descripción (opcional)</label>
          <Input
            placeholder="Descripción breve..."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="gap-2">
            <Check className="w-4 h-4" />
            {editing ? "Actualizar" : "Crear"}
          </Button>
          {editing && (
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin categorías registradas</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || "#64748b" }} />
                <div>
                  <p className="text-sm font-semibold">{cat.nombre}</p>
                  {cat.descripcion && <p className="text-xs text-muted-foreground">{cat.descripcion}</p>}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(cat)} className="p-1.5 hover:text-primary transition-colors rounded-lg hover:bg-muted">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:text-destructive transition-colors rounded-lg hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}