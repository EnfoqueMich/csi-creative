import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, FolderOpen, Trash2, ChevronDown, ChevronRight, Tag, Check, X, Pencil, DollarSign, Save, TrendingUp, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../components/project/StatusBadge";
import DashboardHeader from "../components/DashboardHeader";
import ProductionOrderPanel from "../components/dashboard/ProductionOrderPanel";
import MonthlyScrapPanel from "../components/MonthlyScrapPanel";
import moment from "moment";

moment.locale("es");

// ─── Categorías ────────────────────────────────────────────────────────────────
const CAT_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

function CategoriesTab({ categories, onCategoriesChange }) {
  const [form, setForm] = useState({ nombre: "", color: CAT_COLORS[0], descripcion: "" });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.Category.list("nombre");
    onCategoriesChange(data);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    if (editing) { await base44.entities.Category.update(editing.id, form); }
    else { await base44.entities.Category.create(form); }
    setForm({ nombre: "", color: CAT_COLORS[0], descripcion: "" });
    setEditing(null);
    await load();
    setSaving(false);
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({ nombre: cat.nombre, color: cat.color || CAT_COLORS[0], descripcion: cat.descripcion || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await base44.entities.Category.delete(id);
    await load();
  };

  const handleCancel = () => { setEditing(null); setForm({ nombre: "", color: CAT_COLORS[0], descripcion: "" }); };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-muted/20 rounded-xl border border-border p-5 space-y-3">
        <p className="text-sm font-semibold">{editing ? "Editar categoría" : "Nueva categoría"}</p>
        <Input
          placeholder="Nombre de la categoría..."
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <div className="flex gap-2 flex-wrap">
          {CAT_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              className="w-6 h-6 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: form.color === c ? "#000" : "transparent" }}
            />
          ))}
        </div>
        <Input
          placeholder="Descripción (opcional)..."
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving || !form.nombre.trim()} className="gap-1.5">
            <Check className="w-3.5 h-3.5" />{editing ? "Actualizar" : "Crear"}
          </Button>
          {editing && (
            <Button size="sm" variant="outline" onClick={handleCancel}><X className="w-3.5 h-3.5 mr-1" />Cancelar</Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No hay categorías aún</p>}
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border group">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || "#64748b" }} />
              <div>
                <p className="text-sm font-semibold">{cat.nombre}</p>
                {cat.descripcion && <p className="text-xs text-muted-foreground">{cat.descripcion}</p>}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(cat)} className="p-1.5 hover:text-primary rounded-lg hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:text-destructive rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Precios Unitarios ─────────────────────────────────────────────────────────
function PriceRow({ label, unit, field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </div>
      <div className="relative w-36">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input type="number" placeholder="0.000" step="0.001" min="0"
          value={value || ""}
          onChange={(e) => onChange(field, Number(e.target.value))}
          className="font-mono pl-7 text-right"
        />
      </div>
    </div>
  );
}

function PreciosTab() {
  const [prices, setPrices] = useState({});
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.PriceSettings.list().then((data) => {
      if (data.length > 0) { setRecordId(data[0].id); setPrices(data[0]); }
      setLoading(false);
    });
  }, []);

  const handleChange = (field, value) => setPrices((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...data } = prices;
    if (recordId) { await base44.entities.PriceSettings.update(recordId, data); }
    else { const created = await base44.entities.PriceSettings.create(data); setRecordId(created.id); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Materiales</p>
        <PriceRow label="Hilo" unit="por metro" field="precio_hilo_m" value={prices.precio_hilo_m} onChange={handleChange} />
        <PriceRow label="Bobina" unit="por metro" field="precio_bobina_m" value={prices.precio_bobina_m} onChange={handleChange} />
        <PriceRow label="Tatami" unit="por cm²" field="precio_tatami_cm2" value={prices.precio_tatami_cm2} onChange={handleChange} />
        <PriceRow label="Tela Canasta" unit="por cm²" field="precio_tela_canasta_cm2" value={prices.precio_tela_canasta_cm2} onChange={handleChange} />
        <PriceRow label="Tela Scrap" unit="por cm²" field="precio_tela_scrap_cm2" value={prices.precio_tela_scrap_cm2} onChange={handleChange} />
        <PriceRow label="Velcro" unit="por cm²" field="precio_velcro_cm2" value={prices.precio_velcro_cm2} onChange={handleChange} />
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Mano de Obra</p>
        <PriceRow label="Bordado" unit="por minuto" field="precio_minuto_bordado" value={prices.precio_minuto_bordado} onChange={handleChange} />
        <PriceRow label="Diseño Gráfico" unit="por hora" field="precio_hora_diseno" value={prices.precio_hora_diseno} onChange={handleChange} />
      </div>
      <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Guardando..." : "Guardar Precios"}
      </Button>
    </div>
  );
}

// ─── Proyectos (lista) ─────────────────────────────────────────────────────────
function formatDuration(start, end) {
  if (!start || !end) return null;
  const mins = moment(end).diff(moment(start), "minutes");
  if (mins < 60) return `${mins}m`;
  const totalHours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (totalHours < 24) return `${totalHours}h ${remMins}m`;
  const days = Math.floor(totalHours / 24);
  return `${days}d ${Math.floor(totalHours % 24)}h ${remMins}m`;
}

function ProjectRow({ project, onDelete }) {
  const duration = project.proceso === "finalizado" ? formatDuration(project.fecha_inicio, project.fecha_final) : null;

  const handleDelete = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(`¿Eliminar el proyecto CREA #${project.crea}? Esta acción no se puede deshacer.`)) return;
    await base44.entities.Project.delete(project.id);
    onDelete(project.id);
  };

  return (
    <div className="relative group">
      <Link to={`/proyecto?id=${project.id}`}
        className="block bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-muted-foreground">CREA #{project.crea || "—"}</span>
              <StatusBadge status={project.proceso || "registrado"} />
              {duration && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-mono font-medium">⏱ {duration}</span>
              )}
            </div>
            <h3 className="text-sm font-semibold truncate">{project.titulo || project.proyecto || "Sin descripción"}</h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {project.asignado && <span>Asignado: <strong>{project.asignado}</strong></span>}
              {project.fecha_inicio && <span>Inicio: {moment(project.fecha_inicio).format("DD/MM/YY HH:mm")}</span>}
            </div>
          </div>
        </div>
      </Link>
      <button onClick={handleDelete}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-destructive transition-all text-muted-foreground"
        title="Eliminar"
      ><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function CategoryGroup({ category, projects, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color || "#64748b" }} />
        <span className="text-sm font-semibold flex-1">{category.nombre}</span>
        <span className="text-xs text-muted-foreground font-mono">{projects.length} proyecto(s)</span>
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-card">
          {projects.map((p) => <ProjectRow key={p.id} project={p} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ───────────────────────────────────────────────────────
const TABS = [
  { key: "proyectos", label: "Proyectos", icon: LayoutDashboard },
  { key: "categorias", label: "Categorías", icon: Tag },
  { key: "scrap", label: "Scrap del Mes", icon: TrendingUp },
  { key: "precios", label: "Precios Unitarios", icon: DollarSign },
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [activeTab, setActiveTab] = useState("proyectos");

  useEffect(() => {
    Promise.all([
      base44.entities.Project.list("-crea", 200),
      base44.entities.Category.list("nombre"),
    ]).then(([projs, cats]) => {
      setProjects(projs);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const handleDelete = (id) => setProjects((prev) => prev.filter((p) => p.id !== id));
  const handleCategoriesChange = (data) => setCategories(data);

  const filtered = projects
    .filter((p) => {
      const matchSearch = !search ||
        (p.proyecto || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.titulo || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.asignado || "").toLowerCase().includes(search.toLowerCase()) ||
        String(p.crea).includes(search);
      const matchFilter = filter === "all" || p.proceso === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => (b.crea || 0) - (a.crea || 0));

  const counts = {
    all: projects.length,
    registrado: projects.filter((p) => p.proceso === "registrado").length,
    asignado: projects.filter((p) => p.proceso === "asignado").length,
    finalizado: projects.filter((p) => p.proceso === "finalizado").length,
  };

  const grouped = categories
    .map((cat) => ({ category: cat, projects: filtered.filter((p) => p.categoria_id === cat.id) }))
    .filter((g) => g.projects.length > 0)
    .sort((a, b) => {
      const aA = a.projects.some((p) => p.proceso === "asignado");
      const bA = b.projects.some((p) => p.proceso === "asignado");
      return aA === bA ? 0 : aA ? -1 : 1;
    });
  const sinCategoria = filtered.filter((p) => !p.categoria_id);

  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Proyectos */}
      {activeTab === "proyectos" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">{projects.length} proyecto(s) en total</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGroupByCategory(!groupByCategory)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                  groupByCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30 text-muted-foreground"
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> Por categoría
              </button>
              <Link to="/nuevo">
                <Button className="gap-2"><Plus className="w-4 h-4" />Nuevo Proyecto</Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "all", label: "Total", count: counts.all },
              { key: "registrado", label: "Registrados", count: counts.registrado },
              { key: "asignado", label: "En Proceso", count: counts.asignado },
              { key: "finalizado", label: "Finalizados", count: counts.finalizado },
            ].map((stat) => (
              <button key={stat.key} onClick={() => setFilter(stat.key)}
                className={`p-4 rounded-xl border transition-all text-left bg-card ${
                  filter === stat.key ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-border hover:border-primary/20"
                }`}
              >
                <p className="text-2xl font-bold font-mono">{stat.count}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por proyecto, asignado o CREA..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          {/* Production Order */}
          {!loading && <ProductionOrderPanel projects={projects} />}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No se encontraron proyectos</p>
              <p className="text-xs mt-1">Crea uno nuevo para comenzar</p>
            </div>
          ) : groupByCategory ? (
            <div className="space-y-3">
              {grouped.map((g) => (
                <CategoryGroup key={g.category.id} category={g.category} projects={g.projects} onDelete={handleDelete} />
              ))}
              {sinCategoria.length > 0 && (
                <CategoryGroup category={{ nombre: "Sin categoría", color: "#94a3b8" }} projects={sinCategoria} onDelete={handleDelete} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => <ProjectRow key={p.id} project={p} onDelete={handleDelete} />)}
            </div>
          )}
        </div>
      )}

      {/* Tab: Categorías */}
      {activeTab === "categorias" && (
        <CategoriesTab categories={categories} onCategoriesChange={handleCategoriesChange} />
      )}

      {/* Tab: Scrap del Mes */}
      {activeTab === "scrap" && <MonthlyScrapPanel />}

      {/* Tab: Precios Unitarios */}
      {activeTab === "precios" && <PreciosTab />}
    </div>
  );
}