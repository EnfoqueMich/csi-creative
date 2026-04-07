import { useState } from "react";
import { Scissors, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionCard from "./SectionCard";
import FieldLabel from "./FieldLabel";
import YesNoButtons from "./YesNoButtons";

export default function ProductionSection({ project, onChange }) {
  const [corteInput, setCorteInput] = useState("");

  const meta = project.cortes_vinil_meta || 0;
  const total = project.cortes_realizados_total || 0;
  const noAplica = project.cortes_vinil_no_aplica === true;
  const metaAlcanzada = noAplica || (total >= meta && meta > 0);

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
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cortes de Vinil</h3>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={noAplica}
              onChange={(e) => onChange({ cortes_vinil_no_aplica: e.target.checked })}
              className="rounded"
            />
            No Aplica
          </label>
        </div>
        {!noAplica && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <FieldLabel>Meta de Cortes</FieldLabel>
              <Input type="number" placeholder="0" value={project.cortes_vinil_meta || ""} onChange={(e) => onChange({ cortes_vinil_meta: Number(e.target.value) })} className="font-mono" />
            </div>
            <div>
              <FieldLabel>Agregar Cortes</FieldLabel>
              <div className="flex gap-2">
                <Input type="number" placeholder="Cantidad" value={corteInput} onChange={(e) => setCorteInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCorte()} className="font-mono" />
                <Button onClick={handleAddCorte} size="icon" variant="outline"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
            <div>
              <FieldLabel>Completados</FieldLabel>
              <div className={cn("flex items-center justify-center h-10 rounded-lg font-mono font-bold text-lg border", metaAlcanzada ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>
                {total} / {meta}
              </div>
            </div>
          </div>
        )}
        {noAplica && <p className="text-sm text-muted-foreground italic">No se requieren cortes de vinil para este proyecto.</p>}
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
          <YesNoButtons value={project.cortes_laser_listos} onChange={(v) => onChange({ cortes_laser_listos: v })} />
        </div>
      </div>

      {/* DTF */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">DTF</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Piezas Solicitadas</FieldLabel>
            <Input type="number" placeholder="0" value={project.dtf_piezas || ""} onChange={(e) => onChange({ dtf_piezas: Number(e.target.value) })} className="font-mono" />
          </div>
          <div>
            <FieldLabel>Diseños Solicitados</FieldLabel>
            <Input type="number" placeholder="0" value={project.dtf_disenos || ""} onChange={(e) => onChange({ dtf_disenos: Number(e.target.value) })} className="font-mono" />
          </div>
          <div>
            <FieldLabel>Total en Metros</FieldLabel>
            <Input type="number" placeholder="0" value={project.dtf_metros || ""} onChange={(e) => onChange({ dtf_metros: Number(e.target.value) })} className="font-mono" />
          </div>
        </div>
        <div>
          <FieldLabel>DTF Listo?</FieldLabel>
          <div className="flex gap-2">
            {[{ val: "si", label: "Sí" }, { val: "no", label: "No" }, { val: "no_aplica", label: "No Aplica" }].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ dtf_listo: val })}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold border transition-all",
                  project.dtf_listo === val
                    ? val === "si" ? "bg-green-100 text-green-700 border-green-300" : val === "no" ? "bg-red-100 text-red-700 border-red-300" : "bg-muted text-muted-foreground border-border"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}