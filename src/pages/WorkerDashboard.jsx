import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../components/project/StatusBadge";
import moment from "moment";

export default function WorkerDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      // Filter projects assigned to this worker by name
      const data = await base44.entities.Project.list("-crea", 200);
      const myName = (me.full_name || "").toLowerCase();
      const mine = data.filter((p) =>
        p.asignado && p.asignado.toLowerCase() === myName
      );
      setProjects(mine);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = projects.filter((p) => {
    if (!search) return true;
    return (
      (p.proyecto || "").toLowerCase().includes(search.toLowerCase()) ||
      String(p.crea).includes(search)
    );
  });

  const counts = {
    total: projects.length,
    asignado: projects.filter((p) => p.proceso === "asignado").length,
    finalizado: projects.filter((p) => p.proceso === "finalizado").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Mis Proyectos</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Hola, <strong>{user?.full_name || "..."}</strong> — aquí están los proyectos asignados a ti
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", count: counts.total, color: "bg-primary/10 text-primary" },
          { label: "En Proceso", count: counts.asignado, color: "bg-yellow-50 text-yellow-600" },
          { label: "Finalizados", count: counts.finalizado, color: "bg-green-50 text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card p-4 rounded-xl border border-border text-center">
            <p className="text-2xl font-bold font-mono">{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proyecto..."
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
          <p className="text-sm font-medium">No hay proyectos asignados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              to={`/proyecto?id=${project.id}`}
              className="block bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-muted-foreground">CREA #{project.crea || "—"}</span>
                    <StatusBadge status={project.proceso || "registrado"} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {project.titulo || project.proyecto || "Sin descripción"}
                  </h3>
                  {project.fecha_inicio && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Inicio: {moment(project.fecha_inicio).format("DD/MM/YY HH:mm")}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}