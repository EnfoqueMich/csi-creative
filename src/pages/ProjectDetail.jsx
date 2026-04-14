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
  titulo: "",
  proyecto: "",
  diseno_horas: null,
  precio_hilo_m: null,
  precio_bobina_m: null,
  precio_tatami_cm2: null,
  precio_tela_canasta_cm2: null,
  precio_tela_scrap_cm2: null,
  precio_velcro_cm2: null,
  precio_minuto_bordado: null,
  precio_hora_diseno: null,
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

  const sanitize = (proj) => {
    const cleanMat = (m) => ({
      cantidad: Number(m?.cantidad) || 0,
      base: Number(m?.base) || 0,
      altura: Number(m?.altura) || 0,
    });
    return {
      ...proj,
      bordados_scrap: (proj.bordados_scrap || []).map((b) => ({
        ...b,
        base: Number(b.base) || 0,
        altura: Number(b.altura) || 0,
        puntadas: Number(b.puntadas) || 0,
        tiempo_horas: Number(b.tiempo_horas) || 0,
        tiempo_minutos: Number(b.tiempo_minutos) || 0,
        tiempo_segundos: Number(b.tiempo_segundos) || 0,
        total_hilo: Number(b.total_hilo) || 0,
        total_bobina: Number(b.total_bobina) || 0,
        materiales: {
          tatami: cleanMat(b.materiales?.tatami),
          velcro_macho: cleanMat(b.materiales?.velcro_macho),
          velcro_hembra: cleanMat(b.materiales?.velcro_hembra),
          tela_canasta: cleanMat(b.materiales?.tela_canasta),
          tela_scrap: cleanMat(b.materiales?.tela_scrap),
        },
      })),
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, created_date, updated_date, created_by, ...raw } = project;
      const data = sanitize(raw);
      if (isNew) {
        const created = await base44.entities.Project.create(data);
        navigate(`/proyecto?id=${created.id}`, { replace: true });
      } else {
        await base44.entities.Project.update(projectId, data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    const updates = { proceso: "finalizado", fecha_final: new Date().toISOString() };
    const merged = { ...project, ...updates };
    setProject(merged);
    setSaving(true);
    try {
      const { id, created_date, updated_date, created_by, ...data } = merged;
      await base44.entities.Project.update(projectId, data);
    } finally {
      setSaving(false);
    }
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