import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, FileText, Trash2, Eye, Settings, Package, Scissors, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WorkOrderForm from "../components/workorder/WorkOrderForm";
import WorkOrderView from "../components/workorder/WorkOrderView";
import OrderSettingsPanel from "../components/workorder/OrderSettingsPanel";
import HiloColorManager from "../components/workorder/HiloColorManager";
import GarmentCatalogManager from "../components/workorder/GarmentCatalogManager";
import VinilTextilManager from "../components/workorder/VinilTextilManager";

const estadoConfig = {
  borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
  enviada: { label: "Enviada", cls: "bg-blue-100 text-blue-700" },
  produccion: { label: "En Producción", cls: "bg-yellow-100 text-yellow-700" },
  completada: { label: "Completada", cls: "bg-green-100 text-green-700" },
};

export default function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("ordenes"); // 'ordenes' | 'configuracion' | 'catalogo' | 'hilos' | 'vinil'

  useEffect(() => {
    base44.entities.WorkOrder.list("-created_date", 200).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (savedOrder) => {
    // Re-fetch completo para garantizar que todos los campos (disenos, titulo, diseno_id) estén actualizados
    let fullOrder = savedOrder;
    try {
      const fresh = await base44.entities.WorkOrder.filter({ id: savedOrder.id });
      if (fresh?.length) fullOrder = fresh[0];
    } catch (_) {}
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === fullOrder.id);
      return exists ? prev.map((o) => o.id === fullOrder.id ? fullOrder : o) : [fullOrder, ...prev];
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Órdenes de Trabajo</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orden(es) registradas</p>
        </div>
        {tab === "ordenes" && (
          <Button onClick={() => setView("new")} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva Orden
          </Button>
        )}
      </div>

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
            return (
              <div key={order.id} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/20 hover:shadow-sm transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{order.folio || "—"}</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ec.cls)}>{ec.label}</span>
                  </div>
                  <p className="text-sm font-semibold truncate">{order.nombre_cliente || "Sin cliente"}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {order.fecha_orden && <span>{order.fecha_orden}</span>}
                    {order.garment_titulo && <span className="text-blue-600">{order.garment_titulo}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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