import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, CheckCircle2, Circle, ImagePlus, X, Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function ImageModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="Tarea" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onUploadImage, uploadingId }) {
  const [expandedImg, setExpandedImg] = useState(null);

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 space-y-4 transition-all",
      task.completada ? "border-green-200 bg-green-50/30" : "border-border"
    )}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onToggle(task)} className="mt-0.5 flex-shrink-0">
          {task.completada
            ? <CheckCircle2 className="w-5 h-5 text-status-green" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary font-mono">{task.folio}</span>
            {task.completada && <span className="text-xs text-status-green font-semibold">Completada</span>}
          </div>
          <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", task.completada && "line-through text-muted-foreground")}>
            {task.descripcion}
          </p>
        </div>
        <label className={cn(
          "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed cursor-pointer text-xs text-muted-foreground transition-all",
          uploadingId === task.id ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-muted/50"
        )}>
          {uploadingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {uploadingId === task.id ? "..." : "Imagen"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadImage(e, task)} />
        </label>
      </div>

      {task.imagenes?.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-8">
          {task.imagenes.map((url, i) => (
            <div key={i} className="relative group cursor-pointer w-20 h-20 rounded-lg overflow-hidden border border-border" onClick={() => setExpandedImg(url)}>
              <img src={url} alt="img" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {expandedImg && <ImageModal url={expandedImg} onClose={() => setExpandedImg(null)} />}
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const load = async () => {
    const data = await base44.entities.Task.list("-created_date", 200);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateFolio = () => {
    const num = String(tasks.length + 1).padStart(4, "0");
    return `TAREA-${num}`;
  };

  const handleCreate = async () => {
    if (!texto.trim()) return;
    setSaving(true);
    const nueva = await base44.entities.Task.create({
      folio: generateFolio(),
      descripcion: texto.trim(),
      completada: false,
      imagenes: [],
    });
    setTasks((prev) => [nueva, ...prev]);
    setTexto("");
    setSaving(false);
  };

  const handleToggle = async (task) => {
    const updated = { ...task, completada: !task.completada };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { completada: updated.completada });
  };

  const handleUploadImage = async (e, task) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(task.id);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const imagenes = [...(task.imagenes || []), file_url];
    await base44.entities.Task.update(task.id, { imagenes });
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, imagenes } : t));
    setUploadingId(null);
  };

  const pendientes = tasks.filter((t) => !t.completada).length;
  const completadas = tasks.filter((t) => t.completada).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tareas</h1>
        <p className="text-sm text-muted-foreground">Gestión y seguimiento de tareas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold font-mono text-status-yellow">{pendientes}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Pendientes</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50/30 p-4 text-center">
          <p className="text-3xl font-bold font-mono text-status-green">{completadas}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Completadas</p>
        </div>
      </div>

      {/* Nueva tarea */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold">Nueva Tarea</p>
        <Textarea
          placeholder="Describa la tarea..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleCreate(); }}
          rows={3}
        />
        <Button onClick={handleCreate} disabled={saving || !texto.trim()} className="gap-2 w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar Tarea
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-10">No hay tareas aún.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onToggle={handleToggle} onUploadImage={handleUploadImage} uploadingId={uploadingId} />
          ))}
        </div>
      )}
    </div>
  );
}