import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, UserCircle2, Pencil, Trash2, X, Check, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const REGIMENES = [
  "601 - General de Ley Personas Morales",
  "603 - Personas Morales con Fines no Lucrativos",
  "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "606 - Arrendamiento",
  "608 - Demás Ingresos",
  "612 - Personas Físicas con Actividades Empresariales y Profesionales",
  "616 - Sin Obligaciones Fiscales",
  "621 - Incorporación Fiscal",
  "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  "626 - Régimen Simplificado de Confianza RESICO",
];

const USOS_CFDI = [
  "G01 - Adquisición de mercancias",
  "G02 - Devoluciones, descuentos o bonificaciones",
  "G03 - Gastos en general",
  "I01 - Construcciones",
  "I02 - Mobiliario y equipo de oficina por inversiones",
  "I03 - Equipo de transporte",
  "I04 - Equipo de computo y accesorios",
  "S01 - Sin efectos fiscales",
  "CP01 - Pagos",
];

const emptyForm = {
  nombre: "", rfc: "", cp: "", tipo_regimen: "", uso_factura: "",
  correo: "", tel_celular: "", tel_local: "",
};

async function generateFolioId() {
  const list = await base44.entities.Client.list("-folio_id", 1);
  const last = list[0]?.folio_id || "CLI-0000";
  const num = parseInt(last.replace("CLI-", "") || "0") + 1;
  return `CLI-${String(num).padStart(4, "0")}`;
}

function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState(client ? { ...client } : { ...emptyForm });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    const data = { ...form };
    if (client) {
      await base44.entities.Client.update(client.id, data);
    } else {
      data.folio_id = await generateFolioId();
      await base44.entities.Client.create(data);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">{client ? "Editar Cliente" : "Nuevo Cliente"}</h2>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre Completo o Empresa *</label>
          <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Juan Pérez / CSI Creative SA de CV" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">RFC</label>
          <Input value={form.rfc} onChange={e => set("rfc", e.target.value.toUpperCase())} placeholder="XAXX010101000" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">C.P.</label>
          <Input value={form.cp} onChange={e => set("cp", e.target.value)} placeholder="64000" maxLength={5} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Régimen</label>
          <select
            value={form.tipo_regimen}
            onChange={e => set("tipo_regimen", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar...</option>
            {REGIMENES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uso de la Factura (CFDI)</label>
          <select
            value={form.uso_factura}
            onChange={e => set("uso_factura", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar...</option>
            {USOS_CFDI.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Correo Electrónico</label>
          <Input type="email" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="cliente@email.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teléfono Celular</label>
          <Input type="tel" value={form.tel_celular} onChange={e => set("tel_celular", e.target.value)} placeholder="81 1234 5678" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teléfono Local</label>
          <Input type="tel" value={form.tel_local} onChange={e => set("tel_local", e.target.value)} placeholder="81 8765 4321" />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {client ? "Actualizar" : "Registrar Cliente"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function ClientCard({ client, orders, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const clientOrders = orders.filter(o =>
    o.cliente_id === client.id ||
    o.nombre_cliente?.toLowerCase() === client.nombre?.toLowerCase()
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserCircle2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground font-bold">{client.folio_id || "—"}</span>
            <p className="text-sm font-semibold truncate">{client.nombre}</p>
          </div>
          <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {client.rfc && <span>RFC: <strong>{client.rfc}</strong></span>}
            {client.tel_celular && <span>📱 {client.tel_celular}</span>}
            {client.correo && <span>✉️ {client.correo}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {clientOrders.length} pedido(s)
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(client)} className="p-1.5 rounded-lg hover:bg-muted hover:text-primary transition-colors text-muted-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(client)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-destructive transition-colors text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3 space-y-2">
          {clientOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Sin pedidos registrados</p>
          ) : (
            clientOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 text-xs bg-card rounded-lg border border-border px-3 py-2">
                <span className="font-mono font-bold text-muted-foreground">{order.folio || "—"}</span>
                <span className="flex-1 truncate font-medium">{order.garment_titulo || "Orden de trabajo"}</span>
                <span className="text-muted-foreground">{order.fecha_orden || ""}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full font-semibold",
                  order.estado === "completada" ? "bg-green-100 text-green-700" :
                  order.estado === "produccion" ? "bg-yellow-100 text-yellow-700" :
                  order.estado === "enviada" ? "bg-blue-100 text-blue-700" :
                  "bg-muted text-muted-foreground"
                )}>{order.estado || "borrador"}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [cls, ords] = await Promise.all([
      base44.entities.Client.list("nombre"),
      base44.entities.WorkOrder.list("-created_date", 500),
    ]);
    setClients(cls);
    setOrders(ords);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (client) => {
    if (!confirm(`¿Eliminar al cliente "${client.nombre}"?`)) return;
    await base44.entities.Client.delete(client.id);
    setClients(prev => prev.filter(c => c.id !== client.id));
  };

  const handleEdit = (client) => { setEditing(client); setShowForm(true); };

  const handleSaved = () => { setShowForm(false); setEditing(null); load(); };

  const filtered = clients.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(s) ||
      c.rfc?.toLowerCase().includes(s) ||
      c.folio_id?.toLowerCase().includes(s) ||
      c.correo?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} cliente(s) registrados</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </Button>
      </div>

      {showForm && (
        <ClientForm
          client={editing}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, RFC o ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <UserCircle2 className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <ClientCard key={c.id} client={c} orders={orders} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}