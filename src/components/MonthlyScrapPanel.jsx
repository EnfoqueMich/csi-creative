import { useState, useEffect } from "react";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

function StatBox({ label, value, unit }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <p className="text-2xl font-bold font-mono text-foreground">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {unit && <p className="text-xs text-muted-foreground/60">{unit}</p>}
    </div>
  );
}

function sumMaterial(bordados, key) {
  return bordados.reduce((s, b) => {
    const mat = b.materiales?.[key];
    if (!mat) return s;
    return s + ((Number(mat.base) || 0) * (Number(mat.altura) || 0) * (Number(mat.cantidad) || 1));
  }, 0);
}

export default function MonthlyScrapPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await base44.entities.Project.filter({ proceso: "finalizado" });
    setProjects(data);
    setLoading(false);
  };

  const targetMonth = moment().add(monthOffset, "months");
  const monthStart = targetMonth.clone().startOf("month");
  const monthEnd = targetMonth.clone().endOf("month");

  const monthProjects = projects.filter((p) => {
    if (!p.fecha_final) return false;
    const d = moment(p.fecha_final);
    return d.isBetween(monthStart, monthEnd, null, "[]");
  });

  const allBordados = monthProjects.flatMap((p) => p.bordados_scrap || []);

  const totalHilo = allBordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = allBordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTela = allBordados.reduce((s, b) => {
    const mats = b.materiales || {};
    let area = 0;
    ["tatami", "tela_canasta", "tela_scrap"].forEach((k) => {
      if (mats[k]) area += (Number(mats[k].base) || 0) * (Number(mats[k].altura) || 0) * (Number(mats[k].cantidad) || 1);
    });
    return s + area;
  }, 0);
  const totalVelcro = allBordados.reduce((s, b) => {
    const mats = b.materiales || {};
    let area = 0;
    ["velcro_macho", "velcro_hembra"].forEach((k) => {
      if (mats[k]) area += (Number(mats[k].base) || 0) * (Number(mats[k].altura) || 0) * (Number(mats[k].cantidad) || 1);
    });
    return s + area;
  }, 0);

  const totalTiempoMins = allBordados.reduce((s, b) => {
    return s + (Number(b.tiempo_horas) || 0) * 60 + (Number(b.tiempo_minutos) || 0) + (Number(b.tiempo_segundos) || 0) / 60;
  }, 0);
  const fmtTiempo = `${Math.floor(totalTiempoMins / 60)}h ${Math.round(totalTiempoMins % 60)}m`;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Total Scrap del Mes</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold capitalize min-w-[130px] text-center">
            {targetMonth.format("MMMM YYYY")}
          </span>
          <button
            onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            disabled={monthOffset === 0}
          >
            <ChevronRight className={`w-4 h-4 ${monthOffset === 0 ? "opacity-30" : ""}`} />
          </button>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {monthProjects.length} proyecto(s) finalizado(s) · {allBordados.length} bordado(s) registrado(s)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatBox label="Total Hilo" value={totalHilo} unit="metros" />
              <StatBox label="Total Bobina" value={totalBobina} unit="metros" />
              <StatBox label="Total Tela" value={totalTela} unit="cm²" />
              <StatBox label="Total Velcro" value={totalVelcro} unit="cm²" />
              <StatBox label="Tiempo Total" value={fmtTiempo} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}