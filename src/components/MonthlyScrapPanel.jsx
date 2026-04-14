import { useState, useEffect } from "react";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

const fmt$ = (n) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatBox({ label, value, unit, money }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${money ? "bg-green-50 border-green-200" : "bg-card border-border"}`}>
      <p className={`text-xl font-bold font-mono ${money ? "text-green-800" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {unit && <p className="text-xs text-muted-foreground/60">{unit}</p>}
    </div>
  );
}

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
  const totalMins = totalSecs / 60;

  return (
    totalHilo * (Number(prices.precio_hilo_m) || 0) +
    totalBobina * (Number(prices.precio_bobina_m) || 0) +
    totalTatami * (Number(prices.precio_tatami_cm2) || 0) +
    totalTelaCanasta * (Number(prices.precio_tela_canasta_cm2) || 0) +
    totalTelaScrap * (Number(prices.precio_tela_scrap_cm2) || 0) +
    totalVelcro * (Number(prices.precio_velcro_cm2) || 0) +
    totalMins * (Number(prices.precio_minuto_bordado) || 0) +
    (Number(project.diseno_horas) || 0) * (Number(prices.precio_hora_diseno) || 0)
  );
}

export default function MonthlyScrapPanel() {
  const [projects, setProjects] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

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

  const monthProjects = projects.filter((p) => {
    if (!p.fecha_final) return false;
    return moment(p.fecha_final).isBetween(monthStart, monthEnd, null, "[]");
  });

  const allBordados = monthProjects.flatMap((p) => p.bordados_scrap || []);

  const totalHilo = allBordados.reduce((s, b) => s + (Number(b.total_hilo) || 0), 0);
  const totalBobina = allBordados.reduce((s, b) => s + (Number(b.total_bobina) || 0), 0);
  const totalTela = allBordados.reduce((s, b) => {
    const mats = b.materiales || {};
    let area = 0;
    ["tatami", "tela_canasta", "tela_scrap"].forEach((k) => {
      if (mats[k]) area += matArea(mats[k]);
    });
    return s + area;
  }, 0);
  const totalVelcro = allBordados.reduce((s, b) => {
    const mats = b.materiales || {};
    return s + matArea(mats.velcro_macho) + matArea(mats.velcro_hembra);
  }, 0);
  const totalTiempoMins = allBordados.reduce((s, b) =>
    s + (Number(b.tiempo_horas) || 0) * 60 + (Number(b.tiempo_minutos) || 0) + (Number(b.tiempo_segundos) || 0) / 60, 0);
  const fmtTiempo = `${Math.floor(totalTiempoMins / 60)}h ${Math.round(totalTiempoMins % 60)}m`;

  // Costo total del mes
  const costoMes = monthProjects.reduce((s, p) => s + calcProjectCost(p, prices), 0);
  // Gran total (todos los proyectos finalizados)
  const granTotal = projects.reduce((s, p) => s + calcProjectCost(p, prices), 0);
  const hayPrecios = Object.values(prices).some((v) => Number(v) > 0);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Total Scrap del Mes</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
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
            <ChevronLeft className={`w-4 h-4 rotate-180 ${monthOffset === 0 ? "opacity-30" : ""}`} />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatBox label="Total Hilo" value={totalHilo.toFixed(1)} unit="metros" />
              <StatBox label="Total Bobina" value={totalBobina.toFixed(1)} unit="metros" />
              <StatBox label="Total Tela" value={totalTela.toLocaleString()} unit="cm²" />
              <StatBox label="Total Velcro" value={totalVelcro.toLocaleString()} unit="cm²" />
              <StatBox label="Tiempo Total" value={fmtTiempo} />
              {hayPrecios && <StatBox label="Costo del Mes" value={fmt$(costoMes)} money />}
            </div>

            {hayPrecios && (
              <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-700">Gran Total — Todos los proyectos finalizados</p>
                  <p className="text-xs text-green-600 mt-0.5">{projects.length} proyecto(s) en total</p>
                </div>
                <p className="text-3xl font-bold font-mono text-green-800">{fmt$(granTotal)}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}