import { useState, useEffect } from "react";
import { Bell, X, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import moment from "moment";

function formatDuration(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const data = await base44.entities.Notification.list("-created_date", 50);
    setNotifications(data);
  };

  useEffect(() => {
    load();
    // Poll every 15 seconds
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const unread = notifications.filter((n) => !n.leida).length;

  const markRead = async (notif) => {
    if (notif.leida) return;
    await base44.entities.Notification.update(notif.id, { leida: true });
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, leida: true } : n));
  };

  const markAllRead = async () => {
    const unreadOnes = notifications.filter((n) => !n.leida);
    await Promise.all(unreadOnes.map((n) => base44.entities.Notification.update(n.id, { leida: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const deleteNotif = async (notif) => {
    await base44.entities.Notification.delete(notif.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };

  return (
    <div className="relative px-4 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
      >
        <Bell className="w-4 h-4" />
        Notificaciones
        {unread > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Notificaciones</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Marcar todas leídas
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Sin notificaciones</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                    !n.leida && "bg-primary/5"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 text-status-green mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", !n.leida && "text-foreground", n.leida && "text-muted-foreground")}>
                      {n.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.mensaje}</p>
                    {n.tiempo_segundos > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(n.tiempo_segundos)}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">{moment(n.created_date).fromNow()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n); }}
                    className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}