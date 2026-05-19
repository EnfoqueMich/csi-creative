import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus, CheckCircle2, Circle, ImagePlus, X, Loader2, ZoomIn,
  AlertTriangle, Pencil, Check, Clock, ChevronDown, ChevronRight,
  Search, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── Reloj en tiempo real desde fecha_asignacion ──────────────────────────────
function ElapsedTimer({ since }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!since) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(diff % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  if (!since || !elapsed) return null;

  return (
    <span className="flex items-center gap-1 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      {elapsed}
    </span>
  );
}

// ── Modal imagen ampliada ────────────────────────────────────────────────────
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

// ── Tarjeta individual de tarea ──────────────────────────────────────────────
function TaskCard({ task, onToggle, onUploadImage, uploadingId, onUrgente, onEdit }) {
  const [expandedImg, setExpandedImg] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState(task.titulo || "");
  const [editDesc, setEditDesc] = useState(task.descripcion || "");

  const handleSaveEdit = async () => {
    await onEdit(task, editTitulo.trim(), editDesc.trim());
    setEditing(false);
  };

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 space-y-4 transition-all",
      task.urgente && !task.completada
        ? "border-orange-300 bg-orange-50/40 shadow-sm"
        : task.completada
          ? "border-green-200 bg-green-50/30"
          : "border-border"
    )}>
      <div className="flex items-start gap-3">
        {/* Toggle completada */}
        <button type="button" onClick={() => onToggle(task)} className="mt-0.5 flex-shrink-0">
          {task.completada
            ? <CheckCircle2 className="w-5 h-5 text-status-green" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-primary font-mono">{task.folio}</span>
            {task.urgente && !task.completada && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> URGENTE
              </span>
            )}
            {task.completada && (
              <span className="text-xs text-status-green font-semibold">Completada</span>
            )}
            {task.asignado_nombre && (
              <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                <User className="w-3 h-3" /> {task.asignado_nombre}
              </span>
            )}
            {!task.completada && task.fecha_asignacion && (
              <ElapsedTimer since={task.fecha_asignacion} />
            )}
          </div>

          {/* Edición o visualización */}
          {editing ? (
            <div className="space-y-2">
              <Input
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Título..."
                className="text-sm font-semibold"
                autoFocus
              />
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Descripción..."
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                  <Check className="w-3.5 h-3.5" /> Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditing(false);
                  setEditTitulo(task.titulo || "");
                  setEditDesc(task.descripcion || "");
                }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div>
              {task.titulo && (
                <p className={cn("text-sm font-semibold mb-0.5", task.completada && "line-through text-muted-foreground")}>
                  {task.titulo}
                </p>
              )}
              <p className={cn("text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground", task.completada && "line-through")}>
                {task.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {!task.completada && (
            <button
              type="button"
              title="Urgente"
              onClick={() => onUrgente(task)}
              className={cn(
                "p-1.5 rounded-lg border transition-all",
                task.urgente
                  ? "bg-orange-100 border-orange-300 text-orange-600"
                  : "border-border text-muted-foreground hover:border-orange-300 hover:text-orange-500"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}
          {!editing && (
            <button
              type="button"
              title="Editar"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <label className={cn(
            "flex items-center justify-center p-1.5 rounded-lg border border-dashed cursor-pointer transition-all",
            uploadingId === task.id
              ? "opacity-50 pointer-events-none"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          )}>
            {uploadingId === task.id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ImagePlus className="w-3.5 h-3.5" />}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUploadImage(e, task)} />
          </label>
        </div>
      </div>

      {/* Miniaturas */}
      {task.imagenes?.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-8">
          {task.imagenes.map((url, i) => (
            <div
              key={i}
              className="relative group cursor-pointer w-20 h-20 rounded-lg overflow-hidden border border-border"
              onClick={() => setExpandedImg(url)}
            >
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

// ── Grupo colapsable de completadas ──────────────────────────────────────────
function CompletedGroup({ tasks, onToggle, onUploadImage, uploadingId, onUrgente, onEdit }) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;
  return (
    <div className="rounded-xl border border-green-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 bg-green-50/50 hover:bg-green-50 transition-colors text-left"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-green-600" />
          : <ChevronRight className="w-4 h-4 text-green-600" />}
        <CheckCircle2 className="w-4 h-4 text-status-green" />
        <span className="text-sm font-semibold text-green-800 flex-1">Tareas Completadas</span>
        <span className="text-xs text-green-700 font-mono bg-green-100 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-card">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={onToggle}
              onUrgente={onUrgente}
              onEdit={onEdit}
              onUploadImage={onUploadImage}
              uploadingId={uploadingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Formulario nueva tarea
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [nuevaUrgente, setNuevaUrgente] = useState(false);
  const [asignadoId, setAsignadoId] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Task.list("-created_date", 500),
      base44.entities.Worker.filter({ activo: true }, "nombre"),
    ]).then(([taskData, workerData]) => {
      setTasks(taskData);
      setWorkers(workerData);
      setLoading(false);
    });
  }, []);

  const generateFolio = () => `TAREA-${String(tasks.length + 1).padStart(4, "0")}`;

  const handleNewImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingNew(true);
    const urls = await Promise.all(
      files.map((file) => base44.integrations.Core.UploadFile({ file }).then((r) => r.file_url))
    );
    setNewImages((prev) => [...prev, ...urls]);
    setUploadingNew(false);
  };

  const handleCreate = async () => {
    if (!texto.trim()) return;
    setSaving(true);
    const worker = workers.find((w) => w.id === asignadoId);
    const nueva = await base44.entities.Task.create({
      folio: generateFolio(),
      titulo: titulo.trim() || undefined,
      descripcion: texto.trim(),
      completada: false,
      urgente: nuevaUrgente,
      imagenes: newImages,
      asignado_id: worker?.id || undefined,
      asignado_nombre: worker?.nombre || undefined,
      fecha_asignacion: worker ? new Date().toISOString() : undefined,
    });
    setTasks((prev) => [nueva, ...prev]);
    setTitulo("");
    setTexto("");
    setNuevaUrgente(false);
    setAsignadoId("");
    setNewImages([]);
    setSaving(false);
  };

  const handleToggle = async (task) => {
    const completada = !task.completada;
    const updated = { ...task, completada, fecha_completada: completada ? new Date().toISOString() : undefined };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { completada, fecha_completada: updated.fecha_completada });
  };

  const handleUrgente = async (task) => {
    const updated = { ...task, urgente: !task.urgente };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { urgente: updated.urgente });
  };

  const handleEdit = async (task, newTitulo, newDesc) => {
    const updated = { ...task, titulo: newTitulo, descripcion: newDesc };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    await base44.entities.Task.update(task.id, { titulo: newTitulo, descripcion: newDesc });
  };

  const handleUploadImage = async (e, task) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingId(task.id);
    const urls = await Promise.all(
      files.map((file) => base44.integrations.Core.UploadFile({ file }).then((r) => r.file_url))
    );
    const imagenes = [...(task.imagenes || []), ...urls];
    await base44.entities.Task.update(task.id, { imagenes });
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, imagenes } : t));
    setUploadingId(null);
  };

  // Filtrado por búsqueda
  const filtered = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.titulo || "").toLowerCase().includes(q) ||
      (t.descripcion || "").toLowerCase().includes(q) ||
      (t.folio || "").toLowerCase().includes(q)
    );
  });

  const pendientes = filtered
    .filter((t) => !t.completada)
    .sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));

  const completadas = filtered.filter((t) => t.completada);

  const urgentesCount = tasks.filter((t) => t.urgente && !t.completada).length;
  const pendientesCount = tasks.filter((t) => !t.completada).length;
  const completadasCount = tasks.filter((t) => t.completada).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tareas</h1>
        <p className="text-sm text-muted-foreground">Gestión y seguimiento de tareas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 text-center">
          <p className="text-3xl font-bold font-mono text-orange-500">{urgentesCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Urgentes</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold font-mono text-status-yellow">{pendientesCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Pendientes</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50/30 p-4 text-center">
          <p className="text-3xl font-bold font-mono text-status-green">{completadasCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Completadas</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, descripción o folio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Formulario nueva tarea */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold">Nueva Tarea</p>

        <Input
          placeholder="Título de la tarea..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="font-medium"
        />

        <Textarea
          placeholder="Descripción de la tarea..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleCreate(); }}
          rows={3}
        />

        {/* Asignar trabajador */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Asignar trabajador (inicia cronómetro automáticamente)</label>
          <select
            value={asignadoId}
            onChange={(e) => setAsignadoId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Sin asignar —</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.nombre} · {w.puesto}</option>
            ))}
          </select>
        </div>

        {/* Subir imágenes en la creación */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">Imágenes adjuntas</label>
          <label className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer text-sm transition-all",
            uploadingNew
              ? "opacity-50 pointer-events-none"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          )}>
            {uploadingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {uploadingNew ? "Subiendo..." : "Agregar imágenes"}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewImageUpload} disabled={uploadingNew} />
          </label>

          {newImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {newImages.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className={cn(
            "flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm font-semibold transition-all select-none",
            nuevaUrgente
              ? "bg-orange-100 border-orange-300 text-orange-700"
              : "border-border text-muted-foreground hover:border-orange-300 hover:text-orange-500"
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
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.length === 0 && completadas.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">No hay tareas aún.</p>
          )}
          {pendientes.map((t) => (
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
          <CompletedGroup
            tasks={completadas}
            onToggle={handleToggle}
            onUrgente={handleUrgente}
            onEdit={handleEdit}
            onUploadImage={handleUploadImage}
            uploadingId={uploadingId}
          />
        </div>
      )}
    </div>
  );
}