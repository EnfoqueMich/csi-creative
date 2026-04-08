import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, CheckCircle2, Circle, ImagePlus, X, Loader2, ZoomIn, AlertTriangle, Pencil, Check } from "lucide-react";
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

function TaskCard({ task, onToggle, onUploadImage, uploadingId, onUrgente, onEdit }) {
  const [expandedImg, setExpandedImg] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.descripcion);

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === task.descripcion) { setEditing(false); return; }
    await onEdit(task, editText.trim());
    setEditing(false);
  };

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 space-y-4 transition-all",
      task.urgente && !task.completada ? "border-orange-300 bg-orange-50/40 shadow-sm" : task.completada ? "border-green-200 bg-green-50/30" : "border-border"
    )}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onToggle(task)} className="mt-0.5 flex-shrink-0">
          {task.completada
            ? <CheckCircle2 className="w-5 h-5 text-status-green" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-primary font-mono">{task.folio}</span>
            {task.urgente && !task.completada && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> URGENTE
              </span>
            )}
            {task.completada && <span className="text-xs text-status-green font-semibold">Completada</span>}
          </div>
          {editing ? (
            <div className="space-y-2">
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} autoFocus className="text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="gap-1"><Check className="w-3.5 h-3.5" />Guardar</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(task.descripcion); }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", task.completada && "line-through text-muted-foreground")}>
              {task.descripcion}
            </p>
          )}
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {!task.completada && (
            <button
              type="button"
              title="Marcar como urgente"
              onClick={() => onUrgente(task)}
              className={cn(
                "p-1.5 rounded-lg border transition-all",
                task.urgente ? "bg-orange-100 border-orange-300 text-orange-600" : "border-border text-muted-foreground hover:border-orange-300 hover:text-orange-500"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}
          {!editing && (
            <button type="button" title="Editar" onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <label className={cn(
            "flex items-center justify-center p-1.5 rounded-lg border border-dashed cursor-pointer transition-all",
            uploadingId === task.id ? "opacity-50 pointer-events-none" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          )}>
            {uploadingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadImage(e, task)} />
          </label>
        </div>
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

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    // Urgentes pendientes primero
    const aUp = a.urgente && !a.completada;
    const bUp = b.urgente && !b.completada;
    if (aUp && !bUp) return -1;
    if (!aUp && bUp) return 1;
    // Completadas al final
    if (!a.completada && b.completada) return -1;
    if (a.completada && !b.completada) return 1;
    return 0;
  });
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [nuevaUrgente, setNuevaUrgente] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const load = async () => {
    const data = await base44.entities.Task.list("-created_date", 500);
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
      urgente: nuevaUrgente,
      imagenes: [],
    });
    setTasks((prev) => [nueva, ...prev]);
    setTexto("");
    setNuevaUrgente(false);
    setSaving(false);
  };

  const handleToggle = async (task) => {
    const updated = { ...task, completada: !task.completada };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { completada: updated.completada });
  };

  const handleUrgente = async (task) => {
    const updated = { ...task, urgente: !task.urgente };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { urgente: updated.urgente });
  };

  const handleEdit = async (task, newText) => {
    const updated = { ...task, descripcion: newText };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { descripcion: newText });
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

  const urgentes = tasks.filter((t) => t.urgente && !t.completada).length;
  const pendientes = tasks.filter((t) => !t.completada).length;
  const completadas = tasks.filter((t) => t.completada).length;
  const sorted = sortTasks(tasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tareas</h1>
        <p className="text-sm text-muted-foreground">Gestión y seguimiento de tareas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 text-center">
          <p className="text-3xl font-bold font-mono text-orange-500">{urgentes}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Urgentes</p>
        </div>
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
        <div className="flex items-center justify-between gap-3">
          <label className={cn(
            "flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm font-semibold transition-all select-none",
            nuevaUrgente ? "bg-orange-100 border-orange-300 text-orange-700" : "border-border text-muted-foreground hover:border-orange-300 hover:text-orange-500"
          )}>
            <input type="checkbox" className="hidden" checked={nuevaUrgente} onChange={(e) => setNuevaUrgente(e.target.checked)} />
            <AlertTriangle className="w-4 h-4" />
            Urgente
          </label>
          <Button onClick={handleCreate} disabled={saving || !texto.trim()} className="gap-2 flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar Tarea
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-10">No hay tareas aún.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={handleToggle}
              onUrgente={handleUrgente}
              onEdit={handleEdit}
              onUploadImage={handleUploadImage}
              uploadingId={uploadingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}