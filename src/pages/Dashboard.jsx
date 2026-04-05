import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../components/project/StatusBadge";
import moment from "moment";

function ProjectRow({ project }) {
  const meta = project.cortes_vinil_meta || 0;
  const total = project.cortes_realizados_total || 0;
  const progress = meta > 0 ? Math.min(100, Math.round((total / meta) * 100)) : 0;

  return (
    <Link
      to={`/proyecto?id=${project.id}`}
      className="block bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs font-bold text-muted-foreground">#{project.crea || "—"}</span>
            <StatusBadge status={project.proceso || "registrado"} />
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.proyecto || "Sin descripción"}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {project.asignado && <span>Asignado: <strong>{project.asignado}</strong></span>}
            {project.fecha_inicio && (
              <span>Inicio: {moment(project.fecha_inicio).format("DD/MM/YY HH:mm")}</span>
            )}
          </div>
        </div>

        {/* Progress mini */}
        <div className="flex-shrink-0 w-20 text-right">
          <div className="text-xs font-mono font-bold text-muted-foreground mb-1">
            {total}/{meta}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? "hsl(var(--status-green))" : "hsl(var(--status-red))",
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await base44.entities.Project.list("-updated_date", 100);
    setProjects(data);
    setLoading(false);
  };

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      (p.proyecto || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.asignado || "").toLowerCase().includes(search.toLowerCase()) ||
      String(p.crea).includes(search);
    const matchFilter = filter === "all" || p.proceso === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: projects.length,
    registrado: projects.filter((p) => p.proceso === "registrado").length,
    asignado: projects.filter((p) => p.proceso === "asignado").length,
    finalizado: projects.filter((p) => p.proceso === "finalizado").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} proyecto(s) en total</p>
        </div>
        <Link to="/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "all", label: "Total", count: counts.all, color: "bg-primary/10 text-primary" },
          { key: "registrado", label: "Registrados", count: counts.registrado, color: "bg-red-50 text-red-600" },
          { key: "asignado", label: "En Proceso", count: counts.asignado, color: "bg-yellow-50 text-yellow-600" },
          { key: "finalizado", label: "Finalizados", count: counts.finalizado, color: "bg-green-50 text-green-600" },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
            className={`p-4 rounded-xl border transition-all text-left ${
              filter === stat.key ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-border hover:border-primary/20"
            } bg-card`}
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
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}