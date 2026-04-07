import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import GeneralSection from "../components/project/GeneralSection";
import ProductionSection from "../components/project/ProductionSection";
import QualitySection from "../components/project/QualitySection";
import DevelopmentSection from "../components/project/DevelopmentSection";
import FinalizeSection from "../components/project/FinalizeSection";
import ScrapSection from "../components/project/ScrapSection";

const defaultProject = {
  crea: null,
  proyecto: "",
  asignado: "",
  fecha_inicio: null,
  fecha_final: null,
  proceso: "registrado",
  cortes_vinil_meta: 0,
  cortes_realizados_total: 0,
  parches_sublimar: 0,
  sublimados_listos: null,
  parches_bordar: 0,
  bordados_listos: null,
  laser_tatami: 0,
  laser_velcro_macho: 0,
  laser_velcro_hembra: 0,
  laser_tela_canasta: 0,
  cortes_laser_listos: null,
  calidad_folios: [],
  calidad_estado_final: null,
  calidad_nombre: "",
  calidad_nombre_extra: "",
  desarrollo_archivo_url: "",
  desarrollo_estado: null,
  desarrollo_rechazos: [],
  desarrollo_nombre: "",
  desarrollo_nombre_extra: "",
  bordados_scrap: [],
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");
  const isNew = !projectId;

  const [project, setProject] = useState(defaultProject);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Reset form when navigating to new project
  useEffect(() => {
    if (isNew) setProject(defaultProject);
  }, [isNew]);

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    const data = await base44.entities.Project.filter({ id: projectId });
    if (data.length > 0) setProject({ ...defaultProject, ...data[0] });
    setLoading(false);
  };

  const handleChange = (updates) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...data } = project;
    if (isNew) {
      const created = await base44.entities.Project.create(data);
      navigate(`/proyecto?id=${created.id}`, { replace: true });
    } else {
      await base44.entities.Project.update(projectId, data);
    }
    setSaving(false);
  };

  const handleFinalize = async () => {
    const updates = { proceso: "finalizado", fecha_final: new Date().toISOString() };
    const merged = { ...project, ...updates };
    setProject(merged);
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...data } = merged;
    await base44.entities.Project.update(projectId, data);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el proyecto CREA #${project.crea}? Esta acción no se puede deshacer.`)) return;
    await base44.entities.Project.delete(projectId);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isNew ? "Nuevo Proyecto" : `PROYECTO CREA #${project.crea || "—"}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Complete los datos para crear el proyecto" : project.proyecto?.slice(0, 60)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <GeneralSection project={project} onChange={handleChange} isNew={isNew} />
      <ProductionSection project={project} onChange={handleChange} />
      <QualitySection project={project} onChange={handleChange} />
      <DevelopmentSection project={project} onChange={handleChange} />
      <ScrapSection project={project} onChange={handleChange} />
      {!isNew && <FinalizeSection project={project} onFinalize={handleFinalize} />}
    </div>
  );
}