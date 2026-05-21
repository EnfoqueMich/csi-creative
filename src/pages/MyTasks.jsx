import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Circle, Clock, ZoomIn, Loader2,
  AlertTriangle, FolderOpen, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ElapsedTimer({ since }) {
  const [elapsed, setElapsed] = useState("");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!since) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
      setSeconds(diff);
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(diff % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  return { elapsed, seconds };
}

function TaskTimer({ since }) {
  const [elapsed, setElapsed] = useState("00:00:00");

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

  return (
    <span className="flex items-center gap-1 text-sm font-mono bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold">
      <Clock className="w-4 h-4" />
      {elapsed}
    </span>
  );
}

function ImageModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function TaskCard({ task, userName, onComplete }) {
  const [completing, setCompleting] = useState(false);
  const [expandedImg, setExpandedImg] = useState(null);

  const handleComplete = async () => {
    setCompleting(true);
    const now = new Date();
    const segundos = task.fecha_asignacion
      ? Math.max(0, Math.floor((now.getTime() - new Date(task.fecha_asignacion).getTime()) / 1000))
      : 0;

    await base44.entities.Task.update(task.id, {
      completada: true,
      fecha_completada: now.toISOString(),
    });

    // Crear notificación para el admin
    const durStr = formatDuration(segundos);
    await base44.entities.Notification.create({
      tipo: "tarea_completada",
      leida: false,
      titulo: `✅ Tarea completada por ${userName}`,
      mensaje: `El trabajador "${userName}" completó la tarea "${task.titulo || task.descripcion?.substring(0, 50)}" (${task.folio}). Tiempo total: ${durStr}.`,
      referencia_id: task.id,
      trabajador_nombre: userName,
      tiempo_segundos: segundos,
    });

    onComplete(task.id);
    setCompleting(false);
  };

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 space-y-4",
      task.urgente ? "border-orange-300 bg-orange-50/40" : "border-border"
    )}>
      <div className="flex items-start gap-3">
        <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-bold text-primary font-mono">{task.folio}</span>
            {task.urgente && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> URGENTE
              </span>
            )}
            {task.fecha_asignacion && <TaskTimer since={task.fecha_asignacion} />}
          </div>
          {task.titulo && (
            <p className="text-sm font-semibold mb-0.5">{task.titulo}</p>
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {task.descripcion}
          </p>
        </div>
      </div>

      {task.imagenes?.length > 0 && (
        <div className="flex flex-wrap gap-3 pl-8">
          {task.imagenes.map((img, i) => {
            const { url, titulo } = typeof img === "string" ? { url: img, titulo: "" } : img;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="relative group cursor-pointer w-20 h-20 rounded-lg overflow-hidden border border-border"
                  onClick={() => setExpandedImg(url)}
                >
                  <img src={url} alt={titulo || ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
                {titulo && <span className="text-[10px] text-muted-foreground text-center max-w-[80px] truncate">{titulo}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="pl-8">
        <Button
          onClick={handleComplete}
          disabled={completing}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
        >
          {completing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />}
          Finalizar Tarea
        </Button>
      </div>

      {expandedImg && <ImageModal url={expandedImg} onClose={() => setExpandedImg(null)} />}
    </div>
  );
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Buscar el worker por nombre o email
      const workers = await base44.entities.Worker.list("nombre");
      const myWorker = workers.find(
        (w) => w.nombre?.trim().toLowerCase() === (me.full_name || "").trim().toLowerCase()
      );
      setWorker(myWorker);

      // Cargar tareas asignadas a este worker
      const allTasks = await base44.entities.Task.list("-created_date", 500);
      const myTasks = allTasks.filter((t) => {
        if (myWorker) return t.asignado_id === myWorker.id || t.asignado_nombre?.toLowerCase() === (me.full_name || "").toLowerCase();
        return t.asignado_nombre?.toLowerCase() === (me.full_name || "").toLowerCase();
      });

      setTasks(myTasks);
      setLoading(false);
    };
    load();
  }, []);

  const handleComplete = (taskId) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completada: true, fecha_completada: new Date().toISOString() } : t));
  };

  const pendientes = tasks.filter((t) => !t.completada).sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));
  const completadas = tasks.filter((t) => t.completada);
  const userName = worker?.nombre || user?.full_name || "Trabajador";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mis Tareas</h1>
        <p className="text-sm text-muted-foreground">Hola, <strong>{userName}</strong> — tareas asignadas a ti</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold font-mono">{tasks.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="bg-orange-50/40 rounded-xl border border-orange-200 p-4 text-center">
          <p className="text-2xl font-bold font-mono text-orange-500">{pendientes.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
        </div>
        <div className="bg-green-50/30 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-2xl font-bold font-mono text-status-green">{completadas.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : pendientes.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No tienes tareas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map((t) => (
            <TaskCard key={t.id} task={t} userName={userName} onComplete={handleComplete} />
          ))}
        </div>
      )}

      {completadas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tareas completadas ({completadas.length})</p>
          {completadas.map((t) => (
            <div key={t.id} className="rounded-xl border border-green-200 bg-green-50/30 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-status-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {t.titulo && <p className="text-sm font-semibold line-through text-muted-foreground">{t.titulo}</p>}
                <p className="text-sm text-muted-foreground line-through truncate">{t.descripcion}</p>
              </div>
              {t.fecha_asignacion && t.fecha_completada && (
                <span className="text-xs font-mono text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {formatDuration(Math.floor((new Date(t.fecha_completada) - new Date(t.fecha_asignacion)) / 1000))}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}