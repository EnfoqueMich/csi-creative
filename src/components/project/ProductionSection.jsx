import { useState } from "react";
import { Scissors, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import YesNoButtons from "./YesNoButtons";
import { cn } from "@/lib/utils";

export default function ProductionSection({ project, onChange }) {
  const [corteInput, setCorteInput] = useState("");

  const meta = project.cortes_vinil_meta || 0;
  const total = project.cortes_realizados_total || 0;
  const metaAlcanzada = total >= meta && meta > 0;

  const handleAddCorte = () => {
    const val = Number(corteInput);
    if (val > 0) {
      onChange({ cortes_realizados_total: total + val });
      setCorteInput("");
    }
  };

  return (
    <SectionCard icon={Scissors} title="Producción y Cortes" number="2">
      {/* Vinil */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Cortes de Vinil
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <FieldLabel>Meta de Cortes</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.cortes_vinil_meta || ""}
              onChange={(e) => onChange({ cortes_vinil_meta: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Agregar Cortes</FieldLabel>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Cantidad"
                value={corteInput}
                onChange={(e) => setCorteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCorte()}
                className="font-mono"
              />
              <Button onClick={handleAddCorte} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <FieldLabel>Completados</FieldLabel>
            <div
              className={cn(
                "flex items-center justify-center h-10 rounded-lg font-mono font-bold text-lg border",
                metaAlcanzada
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {total} / {meta}
            </div>
          </div>
        </div>
      </div>

      {/* Sublimación */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Sublimación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <FieldLabel>Parches por Sublimar</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.parches_sublimar || ""}
              onChange={(e) => onChange({ parches_sublimar: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Sublimados Listos?</FieldLabel>
            <YesNoButtons
              value={project.sublimados_listos}
              onChange={(v) => onChange({ sublimados_listos: v })}
            />
          </div>
        </div>
      </div>

      {/* Bordado */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Bordado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <FieldLabel>Parches por Bordar</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.parches_bordar || ""}
              onChange={(e) => onChange({ parches_bordar: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Bordados Listos?</FieldLabel>
            <YesNoButtons
              value={project.bordados_listos}
              onChange={(v) => onChange({ bordados_listos: v })}
            />
          </div>
        </div>
      </div>

      {/* Láser */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Cortes Láser
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <FieldLabel>Tatami</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.laser_tatami || ""}
              onChange={(e) => onChange({ laser_tatami: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Velcro Macho</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.laser_velcro_macho || ""}
              onChange={(e) => onChange({ laser_velcro_macho: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Velcro Hembra</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.laser_velcro_hembra || ""}
              onChange={(e) => onChange({ laser_velcro_hembra: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Tela de Canasta</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={project.laser_tela_canasta || ""}
              onChange={(e) => onChange({ laser_tela_canasta: Number(e.target.value) })}
              className="font-mono"
            />
          </div>
        </div>
        <div>
          <FieldLabel>Cortes Láser Listos?</FieldLabel>
          <YesNoButtons
            value={project.cortes_laser_listos}
            onChange={(v) => onChange({ cortes_laser_listos: v })}
          />
        </div>
      </div>
    </SectionCard>
  );
}