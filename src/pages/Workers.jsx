import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

function WorkerRow({ worker, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border border-border">
      <div>
        <p className="text-sm font-semibold text-foreground">{worker.nombre}</p>
        {worker.puesto && <p className="text-xs text-muted-foreground">{worker.puesto}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${worker.activo !== false ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
          {worker.activo !== false ? "Activo" : "Inactivo"}
        </span>
        <button onClick={() => onEdit(worker)} className="p-1.5 hover:text-primary transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(worker.id)} className="p-1.5 hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", puesto: "", activo: true });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadWorkers(); }, []);

  const loadWorkers = async () => {
    setLoading(true);
    const data = await base44.entities.Worker.list("nombre");
    setWorkers(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    if (editing) {
      await base44.entities.Worker.update(editing.id, form);
    } else {
      await base44.entities.Worker.create(form);
    }
    setForm({ nombre: "", puesto: "", activo: true });
    setEditing(null);
    await loadWorkers();
    setSaving(false);
  };

  const handleEdit = (worker) => {
    setEditing(worker);
    setForm({ nombre: worker.nombre, puesto: worker.puesto || "", activo: worker.activo !== false });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este trabajador?")) return;
    await base44.entities.Worker.delete(id);
    await loadWorkers();
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ nombre: "", puesto: "", activo: true });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">Trabajadores</h1>
          <p className="text-sm text-muted-foreground">Gestiona las personas asignables a proyectos</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <p className="text-sm font-semibold">{editing ? "Editar trabajador" : "Agregar trabajador"}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Nombre *</label>
            <Input
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Puesto</label>
            <Input
              placeholder="Ej. Bordador, Operador..."
              value={form.puesto}
              onChange={(e) => setForm({ ...form, puesto: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="rounded"
            />
            Activo
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="gap-2">
            <Check className="w-4 h-4" />
            {editing ? "Actualizar" : "Agregar"}
          </Button>
          {editing && (
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        ) : workers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin trabajadores registrados</p>
        ) : (
          workers.map((w) => (
            <WorkerRow key={w.id} worker={w} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}