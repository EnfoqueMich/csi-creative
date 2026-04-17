import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, FolderOpen, Trash2, ChevronDown, ChevronRight, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../components/project/StatusBadge";
import MonthlyScrapPanel from "../components/MonthlyScrapPanel";
import DashboardHeader from "../components/DashboardHeader";
import moment from "moment";

function formatDuration(start, end) {
  if (!start || !end) return null;
  const mins = moment(end).diff(moment(start), "minutes");
  if (mins < 60) return `${mins}m`;
  const totalHours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (totalHours < 24) return `${totalHours}h ${remMins}m`;
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  return `${days}d ${remHours}h ${remMins}m`;
}

function ProjectRow({ project, onDelete }) {
  const duration = project.proceso === "finalizado" ? formatDuration(project.fecha_inicio, project.fecha_final) : null;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`¿Eliminar el proyecto CREA #${project.crea}? Esta acción no se puede deshacer.`)) return;
    await base44.entities.Project.delete(project.id);
    onDelete(project.id);
  };

  return (
    <div className="relative group">
      <Link
        to={`/proyecto?id=${project.id}`}
        className="block bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-muted-foreground">CREA #{project.crea || "—"}</span>
              <StatusBadge status={project.proceso || "registrado"} />
              {duration && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-mono font-medium">
                  ⏱ {duration}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">
              {project.titulo || project.proyecto || "Sin descripción"}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {project.asignado && <span>Asignado: <strong>{project.asignado}</strong></span>}
              {project.fecha_inicio && (
                <span>Inicio: {moment(project.fecha_inicio).format("DD/MM/YY HH:mm")}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-destructive transition-all text-muted-foreground"
        title="Eliminar proyecto"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CategoryGroup({ category, projects, onDelete, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color || "#64748b" }} />
        <span className="text-sm font-semibold flex-1">{category.nombre}</span>
        <span className="text-xs text-muted-foreground font-mono">{projects.length} proyecto(s)</span>
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-card">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [groupByCategory, setGroupByCategory] = useState(false);

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

  const filtered = projects
    .filter((p) => {
      const matchSearch =
        !search ||
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

  // Group by category
  const grouped = categories.map((cat) => ({
    category: cat,
    projects: filtered.filter((p) => p.categoria_id === cat.id),
  }));
  const sinCategoria = filtered.filter((p) => !p.categoria_id);

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Proyectos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} proyecto(s) en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
              groupByCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30 text-muted-foreground"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Por categoría
          </button>
          <Link to="/nuevo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </Button>
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
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
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
        <Input
          placeholder="Buscar por proyecto, asignado o CREA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <MonthlyScrapPanel />

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
          {grouped.filter((g) => g.projects.length > 0).map((g) => (
            <CategoryGroup key={g.category.id} category={g.category} projects={g.projects} onDelete={handleDelete} />
          ))}
          {sinCategoria.length > 0 && (
            <CategoryGroup
              category={{ nombre: "Sin categoría", color: "#94a3b8" }}
              projects={sinCategoria}
              onDelete={handleDelete}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectRow key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}