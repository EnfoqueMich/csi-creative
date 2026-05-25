import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const TALLAS_LABELS = ["XS","S","M","L","XL","2XL","3XL","4XL"];
const TALLAS_KEYS =   ["xs","s","m","l","xl","xxl","xxxl","xxxxl"];

const DEFAULT_FRENTE = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/6b6aec754_frente.png";
const DEFAULT_ESPALDA = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/173365721_espalda.png";

const DEFAULT_SETTINGS = {
  logo_url: "",
  empresa_nombre: "CSI CREATIVE",
  empresa_telefono: "",
  empresa_direccion: "",
  empresa_redes: "",
  atencion_nombre: "SILVIA LIRA",
  atencion_puesto: "Atención a Clientes",
  leyenda_autorizacion: "Autorizo que se realice el trabajo con las indicaciones anotadas en este documento.",
  texto_firma_cliente: "Firma y nombre del cliente",
};

const DEFAULT_LAYOUT = {
  1: { x: 50, y: 32, w: 22 },
  2: { x: 24, y: 32, w: 22 },
  3: { x: 5,  y: 28, w: 17 },
  4: { x: 76, y: 28, w: 17 },
  5: { x: 22, y: 20, w: 56 },
  6: { x: 22, y: 20, w: 56 },
  7: { x: 22, y: 20, w: 56 },
};

function Check({ checked }) {
  return (
    <span className={cn(
      "inline-flex items-center justify-center w-3.5 h-3.5 border border-gray-500 rounded-sm mr-1 flex-shrink-0",
      checked ? "bg-blue-600 border-blue-600" : "bg-white"
    )}>
      {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
    </span>
  );
}

function Field({ label, value, blue }) {
  return (
    <div className="border border-gray-300 rounded">
      <div className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide", blue ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
        {label}:
      </div>
      <div className="px-2 py-1.5 text-sm font-medium min-h-[28px]">{value || ""}</div>
    </div>
  );
}

function GarmentPreviewPrint({ posiciones, layout, order }) {
  const resolvedLayout = layout || DEFAULT_LAYOUT;
  const esGorra = order.garment_es_gorra;

  const renderImages = (nums, bgUrl) => (
    <div className="text-center flex-1">
      <div className="relative inline-block w-full">
        <img src={bgUrl} alt="" className="w-full object-contain" />
        {nums.map((num) => {
          const pos = posiciones.find(p => p.numero === num);
          if (!pos?.imagen_url) return null;
          const l = resolvedLayout[num] || DEFAULT_LAYOUT[num] || { x: 20, y: 20, w: 25 };
          return (
            <img
              key={num}
              src={pos.imagen_url}
              alt={pos.nombre}
              style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, objectFit: "contain", pointerEvents: "none" }}
            />
          );
        })}
      </div>
    </div>
  );

  if (esGorra) {
    return (
      <div className="space-y-1">
        <div className="flex gap-3 justify-center items-start">
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Vista Frontal</p>
            {renderImages([1], order.garment_frente_url || DEFAULT_FRENTE)}
          </div>
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Lateral Izquierda</p>
            {renderImages([6], order.garment_lateral_izq_url || order.garment_frente_url || DEFAULT_FRENTE)}
          </div>
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Lateral Derecha</p>
            {renderImages([7], order.garment_lateral_der_url || order.garment_frente_url || DEFAULT_FRENTE)}
          </div>
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Vista Trasera</p>
            {renderImages([5], order.garment_espalda_url || DEFAULT_ESPALDA)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 justify-center items-start">
      <div className="text-center flex-1 max-w-xs">
        <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Vista Frontal</p>
        {renderImages([1, 2, 3, 4], order.garment_frente_url || DEFAULT_FRENTE)}
      </div>
      <div className="text-center flex-1 max-w-xs">
        <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Vista Trasera</p>
        {renderImages([5], order.garment_espalda_url || DEFAULT_ESPALDA)}
      </div>
    </div>
  );
}

export default function WorkOrderView({ order, onBack, onEdit }) {
  const [cfg, setCfg] = useState(DEFAULT_SETTINGS);
  const [pdfCfg, setPdfCfg] = useState(null);
  const [hiloColores, setHiloColores] = useState([]);

  useEffect(() => {
    base44.entities.OrderSettings.list().then((list) => {
      if (list.length > 0) {
        setCfg({ ...DEFAULT_SETTINGS, ...list[0] });
        if (list[0].pdf_config) setPdfCfg(list[0].pdf_config);
      }
    });
    base44.entities.HiloColor.list("codigo").then(setHiloColores);
  }, []);

  const hiloMap = Object.fromEntries(hiloColores.map(c => [c.codigo, c]));

  const handlePrint = () => window.print();

  const especificaciones = order.especificaciones?.length
    ? order.especificaciones
    : [{ tipo_prenda: order.tipo_prenda, color_prenda: order.color_prenda, tallas: order.tallas, total_piezas: order.total_piezas }];

  const posiciones = order.posiciones || [];

  return (
    <>
      {/* Controles */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={onBack} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold flex-1">{order.nombre_cliente}</span>
        <Button variant="outline" onClick={onEdit} className="gap-2">
          <Pencil className="w-4 h-4" /> Editar
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
      </div>

      {/* Documento */}
      <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none" id="orden-print" style={{ fontSize: pdfCfg?.fuente_tamanio || "11px" }}>

        {/* Encabezado */}
        {(pdfCfg?.mostrar_encabezado !== false) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b-2" style={{ borderColor: pdfCfg?.color_encabezado || "#1e3a8a" }}>
            <div className="flex items-center gap-2">
              {cfg.logo_url ? (
                <img src={cfg.logo_url} alt="Logo" className="h-12 object-contain" />
              ) : (
                <div className="flex items-center gap-1">
                  <div className="bg-yellow-600 text-white font-black text-xl px-2 py-1 rounded-sm">C</div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-sm tracking-widest text-blue-900">CSI</span>
                    <span className="text-xs tracking-widest text-gray-600 font-semibold">CREATIVE</span>
                  </div>
                </div>
              )}
              {(cfg.empresa_telefono || cfg.empresa_direccion || cfg.empresa_redes) && (
                <div className="ml-2 text-[9px] text-gray-500 space-y-0.5 leading-tight">
                  {cfg.empresa_telefono && <p>📞 {cfg.empresa_telefono}</p>}
                  {cfg.empresa_direccion && <p>📍 {cfg.empresa_direccion}</p>}
                  {cfg.empresa_redes && <p>🌐 {cfg.empresa_redes}</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-yellow-600 tracking-wider">ORDEN DE TRABAJO</p>
              <p className="text-xs text-gray-600 font-mono mt-1">No. DOCUMENTO: {pdfCfg?.numero_documento || "CR-FTW-003-V01"}</p>
              {(pdfCfg?.mostrar_folio !== false) && order.folio && <p className="text-xs text-gray-600 font-mono">{order.folio}</p>}
            </div>
          </div>
        )}

        <div className="px-6 py-4 space-y-4">

          {/* Datos cliente — una sola línea dentro de un recuadro */}
          <div className="border border-gray-300 rounded px-3 py-1.5 flex flex-wrap items-center gap-x-5 gap-y-0.5">
            {[
              { label: "Nombre Cliente", value: order.nombre_cliente },
              { label: "Teléfono", value: order.telefono },
              { label: "Agente", value: order.agente_ventas },
              { label: "Fecha Ingreso", value: order.fecha_orden },
            ].map(({ label, value }) => (
              <span key={label} className="whitespace-nowrap text-[11px]">
                <span className="text-gray-500 font-semibold uppercase text-[9px] mr-1">{label}:</span>
                <span className="font-medium text-black">{value || ""}</span>
              </span>
            ))}
          </div>

          {/* Vista de prenda + Posiciones juntas */}
          {posiciones.length > 0 && (
            <div className="border-2 border-blue-200 rounded px-3 pt-2 pb-3 bg-blue-50/20 space-y-3">
              {(pdfCfg?.mostrar_vista_prenda !== false) && (
                <GarmentPreviewPrint posiciones={posiciones} layout={order.preview_layout} order={order} />
              )}
              {(pdfCfg?.mostrar_posiciones !== false) && (
                <div>
                  <p className="text-xs font-bold text-center uppercase tracking-widest mb-2" style={{ color: pdfCfg?.color_posiciones || "#1d4ed8" }}>Posiciones de Bordado / Estampado</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(posiciones.length, pdfCfg?.columnas_posiciones || 5)}, minmax(0, 1fr))` }}>
                    {posiciones.map((pos, i) => (
                    <div key={i} className="border border-blue-200 rounded space-y-1">
                      <div className="text-white text-[10px] font-bold text-center py-1 rounded-t" style={{ backgroundColor: pdfCfg?.color_posiciones || "#1d4ed8" }}>POSICIÓN # {pos.numero}</div>
                      <div className="bg-green-100 text-green-800 text-[10px] font-semibold text-center py-0.5 mx-1 rounded border border-green-300">{pos.nombre}</div>
                      {pos.imagen_url && (
                        <div className="px-1 mt-0.5">
                          <img src={pos.imagen_url} alt={pos.nombre} className="w-[80%] mx-auto object-contain rounded border border-blue-100" />
                        </div>
                      )}
                      {(pos.alto_cm || pos.ancho_cm) && (
                        <div className="px-2 pt-1 space-y-0.5 text-[10px]">
                          {pos.alto_cm && <div><span className="font-bold text-blue-600 uppercase">Alto:</span> {pos.alto_cm} cm</div>}
                          {pos.ancho_cm && <div><span className="font-bold text-blue-600 uppercase">Ancho:</span> {pos.ancho_cm} cm</div>}
                        </div>
                      )}
                      {pos.descripcion && (
                        <div className="px-2 py-1">
                          <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap">{pos.descripcion}</p>
                        </div>
                      )}
                      {pos.color_hilos?.filter(Boolean).length > 0 && (
                        <div className="px-2 border-t border-blue-100 pt-1 pb-1">
                          <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Hilo</p>
                          {pos.color_hilos.filter(Boolean).map((c, hi) => {
                            const match = hiloMap[c];
                            return (
                              <div key={hi} className="flex items-center gap-1 text-[10px] mb-0.5">
                                <div className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" style={{ backgroundColor: match?.hex || "#ffffff" }} />
                                <span className="font-mono font-semibold text-blue-700">{c}</span>
                                {match && <span className="text-gray-500 truncate">{match.nombre}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(pos.bobina_negra || pos.bobina_blanca) && (
                        <div className="px-2 border-t border-blue-100 pt-1 pb-1">
                          <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Bobina</p>
                          <div className="flex items-center gap-2 text-[10px]">
                            {pos.bobina_negra && <div className="flex items-center gap-0.5"><Check checked={true} />Negra</div>}
                            {pos.bobina_blanca && <div className="flex items-center gap-0.5"><Check checked={true} />Blanca</div>}
                          </div>
                        </div>
                      )}
                      {pos.extras && Object.values(pos.extras).some(Boolean) && (
                        <div className="px-2 border-t border-orange-100 pt-1 pb-1">
                          <p className="text-[9px] font-bold text-orange-500 uppercase mb-0.5">Extras</p>
                          {[["foamy","Foamy"],["velcro_macho","Velcro m."],["velcro_hembra","Velcro h."],["adhesivo_termico","Adhesivo"]].map(([key,label]) =>
                            pos.extras[key] ? <div key={key} className="flex items-center gap-1 text-[10px]"><Check checked={true} />{label}</div> : null
                          )}
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tipo trabajo + observaciones */}
          {(pdfCfg?.mostrar_tipo_trabajo !== false) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded p-3" style={{ borderColor: pdfCfg?.color_tipo_trabajo || "#22c55e" }}>
                <p className="text-[10px] font-bold text-green-700 mb-1.5 uppercase">Tipo de Trabajo:</p>
                <div className="flex flex-wrap gap-2">
                  {[["bordado","Bordado"],["muestras","Muestras"],["estampado","Estampado"],["sublimado","Sublimado"],["costura","Costura"],["parche","Parche"],["riveteado","Riveteado"],["dtf","DTF"]]
                    .filter(([key]) => !!order.tipo_trabajo?.[key])
                    .map(([key,label]) => (
                      <span key={key} className="inline-flex items-center gap-1 border border-green-500 rounded px-2 py-0.5 text-[10px] font-bold text-green-800 bg-green-50">
                        <span className="text-green-600 text-[11px]">✓</span>{label}
                      </span>
                    ))}
                </div>
              </div>
              {(pdfCfg?.mostrar_observaciones !== false) && (
                <div className="border border-blue-300 rounded p-3">
                  <p className="text-[10px] font-bold text-blue-700 mb-1 uppercase">Observaciones:</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[40px]">{order.observaciones || ""}</p>
                </div>
              )}
            </div>
          )}

          {/* Especificaciones */}
          {(pdfCfg?.mostrar_especificaciones !== false) && (
            <div className="border-2 border-green-500 rounded p-3 space-y-3">
              <p className="text-xs font-bold text-green-700 text-center uppercase tracking-widest">Prendas que Ingresaron</p>
              {especificaciones.map((row, idx) => (
                <div key={idx} className={cn("space-y-1", idx > 0 && "border-t border-green-200 pt-2")}>
                  {especificaciones.length > 1 && <p className="text-[10px] font-bold text-green-600 uppercase">Modelo {idx + 1}</p>}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <div className="border border-gray-400 rounded px-2 py-1 min-w-[80px]">
                      <p className="text-gray-500 text-[10px] uppercase">Tipo Prenda</p>
                      <p className="font-semibold">{row.tipo_prenda || ""}</p>
                    </div>
                    <div className="border border-gray-400 rounded px-2 py-1 min-w-[60px]">
                      <p className="text-gray-500 text-[10px] uppercase">Color</p>
                      <p className="font-semibold">{row.color_prenda || ""}</p>
                    </div>
                    {TALLAS_KEYS.map((t, i) => (
                      <div key={t} className="border border-gray-400 rounded px-2 py-1 w-10 text-center">
                        <p className="text-gray-500 text-[10px] uppercase">{TALLAS_LABELS[i]}</p>
                        <p className="font-bold min-h-[16px]">{row.tallas?.[t] || ""}</p>
                      </div>
                    ))}
                    <div className="border-2 border-green-500 rounded px-2 py-1 min-w-[60px] text-center ml-auto">
                      <p className="text-gray-500 text-[10px] uppercase">Total Piezas</p>
                      <p className="font-black text-base text-green-700 min-h-[20px]">{row.total_piezas || ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Firmas */}
          {(pdfCfg?.mostrar_firma !== false) && (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Firma cliente */}
                <div className="border border-gray-300 rounded p-3 text-center">
                  <div className="border-b border-gray-400 mb-1 mx-4 mt-6" />
                  <p className="text-[10px] font-semibold text-gray-600 uppercase">Firma del Cliente</p>
                  <p className="text-[9px] text-gray-400">{cfg.texto_firma_cliente}</p>
                  <p className="text-[8px] text-gray-400 italic mt-1 px-2">{cfg.leyenda_autorizacion}</p>
                </div>
                {/* Firma atención */}
                <div className="border border-gray-300 rounded p-3 text-center">
                  <div className="border-b border-gray-400 mb-1 mx-4 mt-6" />
                  <p className="text-[10px] font-semibold text-gray-700">{cfg.atencion_nombre}</p>
                  <p className="text-[9px] text-gray-500">{cfg.atencion_puesto}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @media print {
          @page { size: letter portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #orden-print, #orden-print * { visibility: visible; }
          #orden-print { position: absolute; left: 0; top: 0; width: 100%; font-size: 11px; }
        }
      `}</style>
    </>
  );
}