import { Flag, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import { cn } from "@/lib/utils";

function ConditionRow({ label, met }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
      <span className="text-sm text-foreground">{label}</span>
      {met ? (
        <CheckCircle className="w-5 h-5 text-status-green" />
      ) : (
        <XCircle className="w-5 h-5 text-status-red" />
      )}
    </div>
  );
}

export default function FinalizeSection({ project, onFinalize }) {
  const meta = project.cortes_vinil_meta || 0;
  const total = project.cortes_realizados_total || 0;
  const cortesOk = project.cortes_vinil_no_aplica === true || (total >= meta && meta > 0);
  const sublimadosOk = project.sublimados_listos === true;
  const bordadosOk = project.bordados_listos === true;
  const laserOk = project.cortes_laser_listos === true;
  const calidadOk = project.calidad_estado_final === "aprobada" || project.calidad_estado_final === "no_aplica";
  const desarrolloOk = project.desarrollo_estado === "aprobado";

  const allMet = cortesOk && sublimadosOk && bordadosOk && laserOk && calidadOk && desarrolloOk;
  const isFinalized = project.proceso === "finalizado";

  return (
    <SectionCard icon={Flag} title="Validación Final" number="6">
      <div className="space-y-2">
        <ConditionRow label={`Cortes de Vinil ${project.cortes_vinil_no_aplica ? '(No Aplica)' : 'completados'}`} met={cortesOk} />
        <ConditionRow label="Sublimados listos" met={sublimadosOk} />
        <ConditionRow label="Bordados listos" met={bordadosOk} />
        <ConditionRow label="Cortes Láser listos" met={laserOk} />
        <ConditionRow label={`Calidad ${project.calidad_estado_final === 'no_aplica' ? '(No Aplica)' : 'aprobada'}`} met={calidadOk} />
        <ConditionRow label="Desarrollo aprobado" met={desarrolloOk} />
      </div>

      <div className="pt-4 flex justify-center">
        {isFinalized ? (
          <div className="flex items-center gap-2 text-status-green font-bold text-lg">
            <CheckCircle className="w-6 h-6" />
            PROYECTO FINALIZADO
          </div>
        ) : (
          <Button
            onClick={onFinalize}
            disabled={!allMet}
            size="lg"
            className={cn(
              "px-10 py-6 text-base font-bold rounded-xl transition-all",
              allMet
                ? "bg-status-green hover:bg-green-600 text-white shadow-lg shadow-green-200"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Flag className="w-5 h-5 mr-2" />
            FINALIZAR PROYECTO
          </Button>
        )}
      </div>
    </SectionCard>
  );
}