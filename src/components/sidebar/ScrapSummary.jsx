import { useState, useEffect } from "react";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

const fmt$ = (n) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function matArea(m) {
  return (Number(m?.base) || 0) * (Number(m?.altura) || 0) * (Number(m?.cantidad) || 1);
}

function calcProjectCost(project, prices) {
  const bordados = project.bordados_scrap || [];
  const totalHilo = bordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = bordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTatami = bordados.reduce((s, b) => s + matArea(b.materiales?.tatami), 0);
  const totalTelaCanasta = bordados.reduce((s, b) => s + matArea(b.materiales?.tela_canasta), 0);
  const totalTelaScrap = bordados.reduce((s, b) => s + matArea(b.materiales?.tela_scrap), 0);
  const totalVelcro = bordados.reduce((s, b) => s + matArea(b.materiales?.velcro_macho) + matArea(b.materiales?.velcro_hembra), 0);
  const totalSecs = bordados.reduce((s, b) =>
    s + (Number(b.tiempo_horas) || 0) * 3600 + (Number(b.tiempo_minutos) || 0) * 60 + (Number(b.tiempo_segundos) || 0), 0);
  return (
    totalHilo * (Number(prices.precio_hilo_m) || 0) +
    totalBobina * (Number(prices.precio_bobina_m) || 0) +
    totalTatami * (Number(prices.precio_tatami_cm2) || 0) +
    totalTelaCanasta * (Number(prices.precio_tela_canasta_cm2) || 0) +
    totalTelaScrap * (Number(prices.precio_tela_scrap_cm2) || 0) +
    totalVelcro * (Number(prices.precio_velcro_cm2) || 0) +
    (totalSecs / 60) * (Number(prices.precio_minuto_bordado) || 0) +
    (Number(project.diseno_horas) || 0) * (Number(prices.precio_hora_diseno) || 0)
  );
}

export default function ScrapSummary() {
  const [projects, setProjects] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Project.filter({ proceso: "finalizado" }),
      base44.entities.PriceSettings.list(),
    ]).then(([projs, priceList]) => {
      setProjects(projs);
      if (priceList.length > 0) setPrices(priceList[0]);
      setLoading(false);
    });
  }, []);

  const targetMonth = moment().add(monthOffset, "months");
  const monthStart = targetMonth.clone().startOf("month");
  const monthEnd = targetMonth.clone().endOf("month");

  const monthProjects = projects.filter((p) =>
    p.fecha_final && moment(p.fecha_final).isBetween(monthStart, monthEnd, null, "[]")
  );

  const allBordados = monthProjects.flatMap((p) => p.bordados_scrap || []);
  const totalHilo = allBordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = allBordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTiempoMins = allBordados.reduce((s, b) =>
    s + (Number(b.tiempo_horas) || 0) * 60 + (Number(b.tiempo_minutos) || 0) + (Number(b.tiempo_segundos) || 0) / 60, 0);
  const fmtTiempo = `${Math.floor(totalTiempoMins / 60)}h ${Math.round(totalTiempoMins % 60)}m`;
  const costoMes = monthProjects.reduce((s, p) => s + calcProjectCost(p, prices), 0);
  const hayPrecios = Object.values(prices).some((v) => Number(v) > 0);

  return (
    <div className="mx-2 mt-2 rounded-xl border border-sidebar-border bg-sidebar-accent/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-sidebar-accent/50 transition-colors text-left"
      >
        <TrendingUp className="w-4 h-4 text-sidebar-foreground/60 flex-shrink-0" />
        <span className="text-xs font-semibold text-sidebar-foreground/80 flex-1 uppercase tracking-wide">Scrap del Mes</span>
        {!loading && hayPrecios && (
          <span className="text-xs font-bold text-green-400 font-mono">{fmt$(costoMes)}</span>
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1 rounded hover:bg-sidebar-accent transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-sidebar-foreground/60" />
            </button>
            <span className="text-xs text-sidebar-foreground/70 capitalize font-medium">
              {targetMonth.format("MMM YYYY")}
            </span>
            <button
              onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
              disabled={monthOffset === 0}
              className="p-1 rounded hover:bg-sidebar-accent transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/60" />
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-sidebar-foreground/50 text-center py-1">Cargando...</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-sidebar-foreground/50">{monthProjects.length} proy. finalizados</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Hilo", value: `${totalHilo.toFixed(1)}m` },
                  { label: "Bobina", value: `${totalBobina.toFixed(1)}m` },
                  { label: "Tiempo", value: fmtTiempo },
                  hayPrecios ? { label: "Costo", value: fmt$(costoMes), green: true } : null,
                ].filter(Boolean).map(({ label, value, green }) => (
                  <div key={label} className={`rounded-lg px-2 py-1.5 text-center ${green ? "bg-green-900/30 border border-green-700/30" : "bg-sidebar-accent/40 border border-sidebar-border"}`}>
                    <p className={`text-xs font-bold font-mono ${green ? "text-green-400" : "text-sidebar-foreground/90"}`}>{value}</p>
                    <p className="text-xs text-sidebar-foreground/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}