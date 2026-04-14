import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Users, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function WorkerCard({ worker, projects, onEdit, onDelete, onPhotoUpload, uploading }) {
  const assigned = projects.filter((p) => p.asignado === worker.nombre && p.proceso !== "finalizado").length;
  const finished = projects.filter((p) => p.asignado === worker.nombre && p.proceso === "finalizado").length;
  const initials = worker.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center gap-3 text-center relative group">
      {/* Foto circular */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
          {worker.foto_url ? (
            <img src={worker.foto_url} alt={worker.nombre} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
          )}
        </div>
        <label className={cn(
          "absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-sm transition-opacity",
          uploading === worker.id ? "opacity-50 pointer-events-none" : "opacity-0 group-hover:opacity-100"
        )}>
          <Camera className="w-3 h-3" />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoUpload(e, worker)} />
        </label>
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-bold text-foreground">{worker.nombre}</p>
        {worker.puesto && <p className="text-xs text-muted-foreground">{worker.puesto}</p>}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${worker.activo !== false ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
          {worker.activo !== false ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="bg-muted/40 rounded-lg py-2 px-3">
          <p className="text-lg font-bold font-mono text-yellow-600">{assigned}</p>
          <p className="text-xs text-muted-foreground">En proceso</p>
        </div>
        <div className="bg-muted/40 rounded-lg py-2 px-3">
          <p className="text-lg font-bold font-mono text-green-600">{finished}</p>
          <p className="text-xs text-muted-foreground">Finalizados</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(worker)} className="p-1.5 hover:text-primary transition-colors rounded-lg hover:bg-muted">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(worker.id)} className="p-1.5 hover:text-destructive transition-colors rounded-lg hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", puesto: "", activo: true });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Worker.list("nombre"),
      base44.entities.Project.list("-crea", 500),
    ]).then(([w, p]) => {
      setWorkers(w);
      setProjects(p);
      setLoading(false);
    });
  }, []);

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
    const data = await base44.entities.Worker.list("nombre");
    setWorkers(data);
    setSaving(false);
  };

  const handleEdit = (worker) => {
    setEditing(worker);
    setForm({ nombre: worker.nombre, puesto: worker.puesto || "", activo: worker.activo !== false });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este trabajador?")) return;
    await base44.entities.Worker.delete(id);
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ nombre: "", puesto: "", activo: true });
  };

  const handlePhotoUpload = async (e, worker) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(worker.id);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Worker.update(worker.id, { foto_url: file_url });
    setWorkers((prev) => prev.map((w) => w.id === worker.id ? { ...w, foto_url: file_url } : w));
    setUploading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">Trabajadores</h1>
          <p className="text-sm text-muted-foreground">Gestiona las personas asignables a proyectos</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4 max-w-xl">
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

      {/* Cards grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : workers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin trabajadores registrados</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {workers.map((w) => (
            <WorkerCard
              key={w.id}
              worker={w}
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPhotoUpload={handlePhotoUpload}
              uploading={uploading}
            />
          ))}
        </div>
      )}
    </div>
  );
}