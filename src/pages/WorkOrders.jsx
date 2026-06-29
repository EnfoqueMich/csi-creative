import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, FileText, Trash2, Eye, Settings, Package, Scissors, Palette, BookImage, CheckCircle, Bell, X, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WorkOrderForm from "../components/workorder/WorkOrderForm";
import WorkOrderView from "../components/workorder/WorkOrderView";
import OrderSettingsPanel from "../components/workorder/OrderSettingsPanel";
import HiloColorManager from "../components/workorder/HiloColorManager";
import GarmentCatalogManager from "../components/workorder/GarmentCatalogManager";
import VinilTextilManager from "../components/workorder/VinilTextilManager";
import LogoCatalogManager from "../components/workorder/LogoCatalogManager";

const estadoConfig = {
  borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
  enviada: { label: "Aprobado", cls: "bg-blue-100 text-blue-700" },
  produccion: { label: "En Producción", cls: "bg-yellow-100 text-yellow-700" },
  completada: { label: "Completada", cls: "bg-green-100 text-green-700" },
};

export default function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("ordenes");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifSeen, setNotifSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wo_notif_seen") || "[]"); } catch { return []; }
  });
  const prevOrderIds = useRef(new Set());
  const notifRef = useRef(null);

  const loadOrders = () =>
    base44.entities.WorkOrder.list("-created_date", 200).then((data) => {
      setOrders(data);
      setLoading(false);
    });

  useEffect(() => {
    loadOrders();
  }, []);

  // Detectar nuevos pedidos aprobados para notificaciones
  const approvedOrders = orders.filter(o => o.estado === "enviada");
  const unseenApproved = approvedOrders.filter(o => !notifSeen.includes(o.id));

  const markAllSeen = () => {
    const ids = approvedOrders.map(o => o.id);
    setNotifSeen(ids);
    localStorage.setItem("wo_notif_seen", JSON.stringify(ids));
  };

  // Cerrar notif al click fuera
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleApprove = async (order) => {
    const newEstado = order.estado === "enviada" ? "produccion" : order.estado === "produccion" ? "completada" : "enviada";
    const updated = await base44.entities.WorkOrder.update(order.id, { estado: newEstado });
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, estado: newEstado } : o));
    if (selected?.id === order.id) setSelected(s => ({ ...s, estado: newEstado }));
  };

  const handleSave = async (savedOrder) => {
    let fullOrder = savedOrder;
    try {
      const fresh = await base44.entities.WorkOrder.filter({ id: savedOrder.id });
      if (fresh?.length) fullOrder = fresh[0];
    } catch (_) {}
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === fullOrder.id);
      const list = exists ? prev.map((o) => o.id === fullOrder.id ? fullOrder : o) : [fullOrder, ...prev];
      return list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    });
    setSelected(fullOrder);
    setView("view");
  };

  const handleDelete = async (order) => {
    if (!confirm(`¿Eliminar la orden de ${order.nombre_cliente}?`)) return;
    await base44.entities.WorkOrder.delete(order.id);
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  };

  if (view === "new") {
    return <WorkOrderForm onSave={handleSave} onCancel={() => setView("list")} />;
  }
  if (view === "edit" && selected) {
    return <WorkOrderForm key={selected.id} order={selected} onSave={handleSave} onCancel={() => { setView("view"); }} />;
  }
  if (view === "view" && selected) {
    return (
      <WorkOrderView
        order={selected}
        onBack={() => { setView("list"); setSelected(null); }}
        onEdit={() => { setSelected(selected); setView("edit"); }}
      />
    );
  }

  // Stats
  const totalNuevas = orders.filter(o => o.estado === "borrador").length;
  const totalAprobadas = orders.filter(o => o.estado === "enviada").length;
  const totalProduccion = orders.filter(o => o.estado === "produccion").length;
  const totalCompletadas = orders.filter(o => o.estado === "completada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Órdenes de Trabajo</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orden(es) registradas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Campana de notificaciones */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(v => !v); if (!notifOpen) markAllSeen(); }}
              className="relative p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              title="Notificaciones de pedidos aprobados"
            >
              <Bell className="w-5 h-5" />
              {unseenApproved.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5">
                  {unseenApproved.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-blue-50">
                  <p className="text-sm font-bold text-blue-700">Pedidos Aprobados</p>
                  <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                {approvedOrders.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">Sin pedidos aprobados aún</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-border">
                    {approvedOrders.map(o => (
                      <div key={o.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/40 cursor-pointer"
                        onClick={() => { setSelected(o); setView("view"); setNotifOpen(false); }}
                      >
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold">{o.nombre_cliente}</p>
                          <p className="text-[10px] text-muted-foreground">{o.folio} · {o.fecha_orden}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {tab === "ordenes" && (
            <Button onClick={() => setView("new")} className="gap-2">
              <Plus className="w-4 h-4" /> Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      {tab === "ordenes" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-black leading-none">{totalNuevas}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Nuevas</p>
            </div>
          </div>
          <div className="bg-card border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black leading-none text-blue-700">{totalAprobadas}</p>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Aprobadas</p>
            </div>
          </div>
          <div className="bg-card border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-black leading-none text-yellow-700">{totalProduccion}</p>
              <p className="text-[11px] text-yellow-600 font-medium mt-0.5">En Producción</p>
            </div>
          </div>
          <div className="bg-card border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black leading-none text-green-700">{totalCompletadas}</p>
              <p className="text-[11px] text-green-600 font-medium mt-0.5">Completadas</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        <button
          onClick={() => setTab("ordenes")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            tab === "ordenes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          Órdenes
        </button>
        <button
          onClick={() => setTab("configuracion")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            tab === "configuracion" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="w-3.5 h-3.5 inline mr-1.5" />
          Configuración
        </button>
        <button
          onClick={() => setTab("catalogo")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            tab === "catalogo" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="w-3.5 h-3.5 inline mr-1.5" />
          Catálogo de Prendas
        </button>
        <button
          onClick={() => setTab("hilos")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            tab === "hilos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="w-3.5 h-3.5 inline mr-1.5" />
          Colores de Hilo
        </button>
        <button
          onClick={() => setTab("vinil")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            tab === "vinil" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Scissors className="w-3.5 h-3.5 inline mr-1.5" />
          Vinil Textil
        </button>
        <button
          onClick={() => setTab("logos")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            tab === "logos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookImage className="w-3.5 h-3.5 inline mr-1.5" />
          Catálogo Logos
        </button>
      </div>

      {/* Contenido según tab */}
      {tab === "hilos" ? (
        <HiloColorManager />
      ) : tab === "vinil" ? (
        <VinilTextilManager />
      ) : tab === "catalogo" ? (
        <GarmentCatalogManager />
      ) : tab === "configuracion" ? (
        <OrderSettingsPanel />
      ) : tab === "logos" ? (
        <LogoCatalogManager />
      ) : loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay órdenes de trabajo</p>
          <p className="text-xs mt-1">Crea la primera orden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const ec = estadoConfig[order.estado] || estadoConfig.borrador;
            const isNew = !order.estado || order.estado === "borrador";
            const isApproved = order.estado === "enviada";
            const isProduccion = order.estado === "produccion";
            const isCompletada = order.estado === "completada";
            return (
              <div key={order.id} className={cn(
                "bg-card rounded-xl border p-4 flex items-center gap-4 hover:shadow-sm transition-all group",
                isApproved ? "border-blue-300" : isProduccion ? "border-yellow-300" : isCompletada ? "border-green-300" : "border-border"
              )}>
                {/* Indicador lateral de color */}
                <div className={cn("w-1 self-stretch rounded-full flex-shrink-0",
                  isApproved ? "bg-blue-400" : isProduccion ? "bg-yellow-400" : isCompletada ? "bg-green-400" : "bg-gray-300"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{order.folio || "—"}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", ec.cls)}>{ec.label}</span>
                    {isNew && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">NUEVO</span>}
                  </div>
                  <p className="text-sm font-semibold truncate">{order.nombre_cliente || "Sin cliente"}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {order.fecha_orden && <span>{order.fecha_orden}</span>}
                    {order.agente_ventas && <span>· {order.agente_ventas}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Botón de avance de estado */}
                  {!isCompletada && (
                    <button
                      onClick={() => handleApprove(order)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all",
                        isNew
                          ? "border-blue-400 text-blue-600 hover:bg-blue-600 hover:text-white"
                          : isApproved
                          ? "border-yellow-400 text-yellow-700 hover:bg-yellow-500 hover:text-white"
                          : "border-green-400 text-green-700 hover:bg-green-600 hover:text-white"
                      )}
                      title={isNew ? "Aprobar pedido" : isApproved ? "Pasar a Producción" : "Marcar Completado"}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isNew ? "Aprobar" : isApproved ? "Producción" : "Completar"}
                    </button>
                  )}
                  {isCompletada && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 px-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Listo
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      const fresh = await base44.entities.WorkOrder.filter({ id: order.id });
                      setSelected(fresh?.length ? fresh[0] : order);
                      setView("view");
                    }}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                    title="Ver / Imprimir"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const fresh = await base44.entities.WorkOrder.filter({ id: order.id });
                      setSelected(fresh?.length ? fresh[0] : order);
                      setView("edit");
                    }}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                    title="Editar"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(order)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:border-red-300 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}