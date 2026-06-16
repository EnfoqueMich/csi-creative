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
        <div className="flex gap-3 justify-center items-start" style={{ width: "90%", margin: "0 auto" }}>
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
    <div className="flex gap-6 justify-center items-start" style={{ width: "90%", margin: "0 auto" }}>
      <div className="text-center flex-1">
        <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Vista Frontal</p>
        {renderImages([1, 2, 3, 4], order.garment_frente_url || DEFAULT_FRENTE)}
      </div>
      <div className="text-center flex-1">
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

  // Soporte multi-diseño: usa order.disenos si existe, sino crea uno con datos legacy
  const disenos = order.disenos?.length
    ? order.disenos
    : [{ id: "legacy", titulo: order.garment_titulo, garment_frente_url: order.garment_frente_url, garment_espalda_url: order.garment_espalda_url, garment_titulo: order.garment_titulo, garment_es_gorra: order.garment_es_gorra, garment_lateral_izq_url: order.garment_lateral_izq_url, garment_lateral_der_url: order.garment_lateral_der_url, preview_layout: order.preview_layout, posiciones: order.posiciones || [] }];

  // Mapa id -> diseño para lookup rápido
  const disenoPorId = Object.fromEntries(disenos.map((d, i) => [d.id, { ...d, index: i + 1 }]));

  const renderHeader = () => (
    <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b-2" style={{ borderColor: pdfCfg?.color_encabezado || "#7B9DBD" }}>
      <div className="flex items-center gap-3">
        {cfg.logo_url ? (
          <img src={cfg.logo_url} alt="Logo" className="h-20 object-contain" />
        ) : (
          <div className="flex items-center gap-1">
            <div className="text-[#C69C45] font-black text-2xl px-2 py-1 rounded-sm" style={{ backgroundColor: "transparent" }}>C</div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg tracking-widest" style={{ color: "#C69C45" }}>CSI</span>
              <span className="text-sm tracking-widest font-semibold" style={{ color: "#C69C45" }}>CREATIVE</span>
            </div>
          </div>
        )}
        {(cfg.empresa_telefono || cfg.empresa_direccion || cfg.empresa_redes) && (
          <div className="ml-2 text-[11px] text-gray-500 space-y-0.5 leading-tight">
            {cfg.empresa_telefono && <p>📞 {cfg.empresa_telefono}</p>}
            {cfg.empresa_direccion && <p>📍 {cfg.empresa_direccion}</p>}
            {cfg.empresa_redes && <p>🌐 {cfg.empresa_redes}</p>}
          </div>
        )}
      </div>
      <div className="text-right">
        <p className="text-2xl font-black tracking-wider" style={{ color: "#C69C45" }}>ORDEN DE TRABAJO</p>
        <p className="text-xs text-gray-600 font-mono mt-1">No. DOCUMENTO: {pdfCfg?.numero_documento || "CR-FTW-003-V01"}</p>
        {(pdfCfg?.mostrar_folio !== false) && order.folio && <p className="text-xs text-gray-600 font-mono">{order.folio}</p>}
      </div>
    </div>
  );

  const renderClienteInfo = () => (
    <div className="px-6 pt-3 pb-2 space-y-1.5" style={{ borderBottom: `2px solid ${pdfCfg?.color_encabezado || "#7B9DBD"}`, fontSize: pdfCfg?.fuente_datos_cliente || "11px" }}>
      {/* Row 1: datos principales */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
        {[
          { label: "NOMBRE CLIENTE:", value: order.nombre_cliente },
          { label: "TELÉFONO:", value: order.telefono },
          { label: "AGENTE:", value: order.agente_ventas },
          { label: "FECHA INGRESO:", value: order.fecha_orden },
        ].map(({ label, value }) => value ? (
          <div key={label} className="flex items-baseline gap-1">
            <span className="inline-block px-1.5 py-0.5 text-xs font-semibold uppercase rounded border" style={{ borderColor: "#F7CAAC", backgroundColor: "transparent" }}>{label}</span>
            <span className="font-bold text-black text-sm">{value}</span>
          </div>
        ) : null)}
      </div>
      {/* Row 2: datos fiscales */}
      {(order.rfc || order.cp || order.uso_factura || order.forma_pago || order.requiere_factura !== undefined) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
          {[
            { label: "RFC:", value: order.rfc },
            { label: "C.P.:", value: order.cp },
            { label: "USO CFDI:", value: order.uso_factura },
            { label: "PAGO:", value: order.forma_pago },
            { label: "FACTURA:", value: order.requiere_factura ? "SI" : "NO" },
          ].map(({ label, value }) => value ? (
            <div key={label} className="flex items-baseline gap-1">
              <span className="inline-block px-1.5 py-0.5 text-xs font-semibold uppercase rounded border" style={{ borderColor: "#F7CAAC", backgroundColor: "transparent" }}>{label}</span>
              <span className="font-bold text-black text-sm">{value}</span>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );

  const renderPosiciones = (posiciones, disenoOrder) => {
    if (!posiciones?.length) return null;
    return (
      <div className="border-2 border-blue-200 rounded px-3 pt-2 pb-3 bg-blue-50/20 space-y-3">
        {(pdfCfg?.mostrar_vista_prenda !== false) && (
          <GarmentPreviewPrint posiciones={posiciones} layout={disenoOrder.preview_layout} order={disenoOrder} />
        )}
        {(pdfCfg?.mostrar_posiciones !== false) && (
          <div>
            <p className="text-xs font-bold text-center uppercase tracking-widest mb-2" style={{ color: pdfCfg?.color_posiciones || "#1d4ed8" }}>Posiciones de Bordado / Estampado</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(posiciones.length, pdfCfg?.columnas_posiciones || 5)}, minmax(0, 1fr))` }}>
              {posiciones.map((pos, i) => (
                <div key={i} className="border border-blue-200 rounded text-[10px]">
                  <div className="text-white font-bold text-center py-1 rounded-t print:hidden" style={{ backgroundColor: pdfCfg?.color_posiciones || "#1d4ed8" }}>POSICIÓN # {pos.numero}</div>
                  <div className="bg-green-100 text-green-800 font-semibold text-center py-0.5 mx-1 mt-1 rounded border border-green-300">{pos.nombre}</div>
                  <div className="px-2 pb-2 space-y-1 mt-1">
                    {pos.imagen_url && <img src={pos.imagen_url} alt={pos.nombre} className="w-[80%] mx-auto object-contain rounded border border-blue-100" />}
                    {(pos.alto_cm || pos.ancho_cm) && (
                      <div className="flex gap-2 border-t border-blue-100 pt-1">
                        {pos.alto_cm && <span className="text-[10px]"><span className="font-bold text-blue-600 uppercase">ALTO:</span> {pos.alto_cm}<span className="text-gray-400">cm</span></span>}
                        {pos.ancho_cm && <span className="text-[10px]"><span className="font-bold text-blue-600 uppercase">ANCHO:</span> {pos.ancho_cm}<span className="text-gray-400">cm</span></span>}
                      </div>
                    )}
                    {pos.descripcion && <div className="border-t border-blue-100 pt-1"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{pos.descripcion}</p></div>}
                    {pos.color_hilos?.filter(Boolean).length > 0 && (
                      <div className="border-t border-blue-100 pt-1">
                        <p className="font-bold text-blue-600 uppercase mb-0.5">Hilo</p>
                        {pos.color_hilos.filter(Boolean).map((c, hi) => {
                          const match = hiloMap[c];
                          return (
                            <div key={hi} className="flex items-center gap-1 mb-0.5">
                              <div className="w-3 h-3 border border-gray-300 flex-shrink-0" style={{ backgroundColor: match?.hex || "#ffffff" }} />
                              <span className="font-mono font-semibold text-blue-700">{c}</span>
                              {match && <span className="text-gray-500 truncate">{match.nombre}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(pos.bobina_negra || pos.bobina_blanca) && (
                      <div className="border-t border-blue-100 pt-1">
                        <p className="font-bold text-blue-600 uppercase mb-0.5">Bobina</p>
                        <div className="flex items-center gap-2">
                          {pos.bobina_negra && <span className="flex items-center gap-0.5"><Check checked={true} />Negra</span>}
                          {pos.bobina_blanca && <span className="flex items-center gap-0.5"><Check checked={true} />Blanca</span>}
                        </div>
                      </div>
                    )}
                    {pos.vinil_codigo && (
                      <div className="border-t border-purple-100 pt-1">
                        <p className="font-bold text-purple-600 uppercase mb-0.5">Vinil Textil</p>
                        <span className="font-mono font-semibold text-purple-700 text-[10px]">{pos.vinil_codigo}</span>
                      </div>
                    )}
                    {pos.extras && Object.values(pos.extras).some(Boolean) && (
                      <div className="border-t border-orange-100 pt-1">
                        <p className="font-bold text-orange-500 uppercase mb-0.5">Extras</p>
                        {[["foamy","Foamy"],["velcro_macho","Velcro m."],["velcro_hembra","Velcro h."],["adhesivo_termico","Adhesivo"]].map(([key,label]) =>
                          pos.extras[key] ? <div key={key} className="flex items-center gap-1"><Check checked={true} />{label}</div> : null
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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

      {/* Contenedor de impresión */}
      <div id="print-container">

      {/* ── UNA HOJA POR DISEÑO ── */}
      {disenos.map((diseno, di) => {
        const posiciones = diseno.posiciones || [];
        const disenoOrder = {
          ...order,
          garment_frente_url: diseno.garment_frente_url,
          garment_espalda_url: diseno.garment_espalda_url,
          garment_titulo: diseno.garment_titulo,
          garment_es_gorra: diseno.garment_es_gorra,
          garment_lateral_izq_url: diseno.garment_lateral_izq_url,
          garment_lateral_der_url: diseno.garment_lateral_der_url,
          preview_layout: diseno.preview_layout,
        };
        return (
          <div key={diseno.id || di} className="bg-white text-black rounded-xl border border-gray-300 shadow-sm w-full mx-auto print:shadow-none print:border-none print:rounded-none print:w-full print-page" style={{ fontSize: pdfCfg?.fuente_tamanio || "11px" }}>
            {renderHeader()}
            <div className="px-6 py-4 space-y-4">
              {di === 0 ? renderClienteInfo() : renderClienteInfo()}

              {/* Etiqueta del diseño — siempre visible */}
              <div className="text-center">
                <span className="inline-block border-2 border-blue-500 text-blue-700 font-bold text-xs rounded-lg px-4 py-1 uppercase tracking-wider">
                  Diseño #{di + 1}{(diseno.titulo || diseno.garment_titulo) ? ` — ${diseno.titulo || diseno.garment_titulo}` : ""}
                </span>
              </div>

              {renderPosiciones(posiciones, disenoOrder)}

              {/* Tipo trabajo + observaciones solo en el primer diseño */}
              {di === 0 && (pdfCfg?.mostrar_tipo_trabajo !== false) && (
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

              {/* Firmas — siempre al final de cada hoja */}
              {(pdfCfg?.mostrar_firma !== false) && (
                <div className="page-footer grid grid-cols-2 gap-4 mt-2">
                  <div className="border border-gray-300 rounded p-3 text-center">
                    <div className="border-b border-gray-400 mb-1 mx-4 mt-6" />
                    <p className="font-semibold text-gray-800 uppercase" style={{ fontSize: pdfCfg?.fuente_firma || "10px" }}>{order.nombre_cliente}</p>
                    <p style={{ fontSize: pdfCfg?.fuente_leyenda || "9px" }} className="text-black">{cfg.texto_firma_cliente}</p>
                    <p style={{ fontSize: pdfCfg?.fuente_leyenda || "9px" }} className="text-black italic mt-1 px-2">{cfg.leyenda_autorizacion}</p>
                  </div>
                  <div className="border border-gray-300 rounded p-3 text-center">
                    <div className="border-b border-gray-400 mb-1 mx-4 mt-6" />
                    <p className="font-semibold text-gray-700" style={{ fontSize: pdfCfg?.fuente_firma || "10px" }}>{cfg.atencion_nombre}</p>
                    <p style={{ fontSize: pdfCfg?.fuente_leyenda || "9px" }} className="text-gray-500">{cfg.atencion_puesto}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── HOJA 2: Prendas que Ingresaron ── */}
      {(pdfCfg?.mostrar_especificaciones !== false) && (
        <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm w-full mx-auto mt-6 print:shadow-none print:border-none print:rounded-none print:mt-0 print-page" id="orden-print-2" style={{ position: "relative", paddingBottom: "80px" }}>

          {/* Header empresa (igual al principal) */}
          <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b-2" style={{ borderColor: pdfCfg?.color_encabezado || "#7B9DBD" }}>
            <div className="flex items-center gap-3">
              {cfg.logo_url ? (
                <img src={cfg.logo_url} alt="Logo" className="h-20 object-contain" />
              ) : (
                <div className="flex items-center gap-1">
                  <div className="text-[#C69C45] font-black text-2xl px-2 py-1 rounded-sm" style={{ backgroundColor: "transparent" }}>C</div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-lg tracking-widest" style={{ color: "#C69C45" }}>CSI</span>
                    <span className="text-sm tracking-widest font-semibold" style={{ color: "#C69C45" }}>CREATIVE</span>
                  </div>
                </div>
              )}
              {(cfg.empresa_telefono || cfg.empresa_direccion || cfg.empresa_redes) && (
                <div className="ml-2 text-[11px] text-gray-500 space-y-0.5 leading-tight">
                  {cfg.empresa_telefono && <p>📞 {cfg.empresa_telefono}</p>}
                  {cfg.empresa_direccion && <p>📍 {cfg.empresa_direccion}</p>}
                  {cfg.empresa_redes && <p>🌐 {cfg.empresa_redes}</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tracking-wider" style={{ color: "#C69C45" }}>ORDEN DE TRABAJO</p>
              <p className="text-xs text-gray-600 font-mono mt-1">No. DOCUMENTO: {pdfCfg?.numero_documento || "CR-FTW-003-V01"}</p>
              {order.folio && <p className="text-xs text-gray-600 font-mono">{order.folio}</p>}
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="px-6 pt-3 pb-2 space-y-1.5" style={{ borderBottom: `2px solid ${pdfCfg?.color_encabezado || "#7B9DBD"}`, fontSize: pdfCfg?.fuente_datos_cliente || "11px" }}>
            <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
              {[
                { label: "NOMBRE CLIENTE:", value: order.nombre_cliente },
                { label: "TELÉFONO:", value: order.telefono },
                { label: "AGENTE:", value: order.agente_ventas },
                { label: "FECHA INGRESO:", value: order.fecha_orden },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex items-baseline gap-1">
                  <span className="inline-block px-1.5 py-0.5 text-xs font-semibold uppercase rounded border" style={{ borderColor: "#F7CAAC", backgroundColor: "transparent" }}>{label}</span>
                  <span className="font-bold text-black text-sm">{value}</span>
                </div>
              ) : null)}
            </div>
            {(order.rfc || order.cp || order.uso_factura || order.forma_pago || order.requiere_factura !== undefined) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
                {[
                  { label: "RFC:", value: order.rfc },
                  { label: "C.P.:", value: order.cp },
                  { label: "USO CFDI:", value: order.uso_factura },
                  { label: "PAGO:", value: order.forma_pago },
                  { label: "FACTURA:", value: order.requiere_factura ? "SI" : "NO" },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-baseline gap-1">
                    <span className="inline-block px-1.5 py-0.5 text-xs font-semibold uppercase rounded border" style={{ borderColor: "#F7CAAC", backgroundColor: "transparent" }}>{label}</span>
                    <span className="font-bold text-black text-sm">{value}</span>
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          {/* ─── Contenido: Agrupado por Diseño ─── */}
          <div className="px-4 py-4">
            {(() => {
              // Agrupa filas de especificaciones por diseno_id
              const grupos = new Map();
              // Diseños sin fila vinculada — los mostramos al final
              const sinDiseno = [];
              especificaciones.forEach(row => {
                const did = row.diseno_id || "";
                if (did && disenoPorId[did]) {
                  if (!grupos.has(did)) grupos.set(did, []);
                  grupos.get(did).push(row);
                } else {
                  sinDiseno.push(row);
                }
              });
              // Diseños que sí están en grupos, ordenados por el index del diseño
              const disenosGrupo = Array.from(grupos.entries())
                .sort(([a], [b]) => (disenoPorId[a]?.index || 99) - (disenoPorId[b]?.index || 99));

              return (
                <>
                  {/* Secciones por diseño — en 2 columnas */}
                  <div className="grid grid-cols-2 gap-4">
                  {disenosGrupo.map(([disenoId, rows]) => {
                    const d = disenoPorId[disenoId];
                    const totalPiezasGrupo = rows.reduce((s, r) => s + (TALLAS_KEYS.reduce((a, t) => a + (Number(r.tallas?.[t]) || 0), 0)), 0);
                    const esGorra = d.garment_es_gorra;
                    return (
                      <div key={disenoId} className="border border-green-500 rounded overflow-hidden">
                        {/* Banner azul con título del diseño */}
                        <div className="px-4 py-2 text-center" style={{ backgroundColor: "#007bbd" }}>
                          <p className="text-white font-bold text-sm uppercase tracking-wider">
                            DISEÑO #{d.index} — {d.titulo || d.garment_titulo || "SIN NOMBRE"}
                          </p>
                        </div>

                        {/* Imágenes del diseño + metadatos de prenda */}
                        <div className="flex gap-4 p-4 border-b border-gray-200">
                          {/* Preview prenda */}
                          <div className="flex gap-2 flex-shrink-0" style={{ width: "55%" }}>
                            {esGorra ? (
                              <>
                                <div className="flex-1 text-center">
                                  <p className="text-[7px] font-bold text-gray-500 uppercase mb-1">Frente</p>
                                  <img src={d.garment_frente_url || DEFAULT_FRENTE} alt="Frente" className="w-full object-contain max-h-[120px]" />
                                </div>
                                <div className="flex-1 text-center">
                                  <p className="text-[7px] font-bold text-gray-500 uppercase mb-1">Espalda</p>
                                  <img src={d.garment_espalda_url || DEFAULT_ESPALDA} alt="Espalda" className="w-full object-contain max-h-[120px]" />
                                </div>
                                <div className="flex-1 text-center">
                                  <p className="text-[7px] font-bold text-gray-500 uppercase mb-1">Lat.Izq</p>
                                  <img src={d.garment_lateral_izq_url || d.garment_frente_url || DEFAULT_FRENTE} alt="Lat Izq" className="w-full object-contain max-h-[120px]" />
                                </div>
                                <div className="flex-1 text-center">
                                  <p className="text-[7px] font-bold text-gray-500 uppercase mb-1">Lat.Der</p>
                                  <img src={d.garment_lateral_der_url || d.garment_frente_url || DEFAULT_FRENTE} alt="Lat Der" className="w-full object-contain max-h-[120px]" />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1 text-center">
                                  <p className="text-[7px] font-bold text-gray-500 uppercase mb-1">Frente</p>
                                  <img src={d.garment_frente_url || DEFAULT_FRENTE} alt="Frente" className="w-full object-contain max-h-[120px]" />
                                </div>
                                <div className="flex-1 text-center">
                                  <p className="text-[7px] font-bold text-gray-500 uppercase mb-1">Espalda</p>
                                  <img src={d.garment_espalda_url || DEFAULT_ESPALDA} alt="Espalda" className="w-full object-contain max-h-[120px]" />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Metadata: Total Piezas + prenda info */}
                          <div className="flex-1 space-y-2">
                            <div className="border-2 border-green-500 rounded px-3 py-2 text-center">
                              <p className="text-[10px] font-bold text-green-700 uppercase">TOTAL PIEZAS</p>
                              <p className="text-2xl font-black text-green-600 leading-none mt-1">{totalPiezasGrupo}</p>
                            </div>
                            {rows.length === 1 ? (
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { label: "TIPO PRENDA", value: rows[0].tipo_prenda },
                                  { label: "COLOR", value: rows[0].color_prenda },
                                  rows[0].modelo && { label: "MODELO", value: rows[0].modelo },
                                  rows[0].marca && { label: "MARCA", value: rows[0].marca },
                                ].filter(Boolean).map(({ label, value }) => (
                                  <div key={label} className="border border-gray-300 rounded px-2 py-1 text-center">
                                    <p className="text-[8px] text-gray-500 uppercase leading-tight">{label}</p>
                                    <p className="text-[12px] font-bold leading-tight">{value}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] text-gray-500 italic text-center">{rows.length} modelos vinculados a este diseño</p>
                            )}
                          </div>
                        </div>

                        {/* Filas de tallas por cada modelo */}
                        <div className="divide-y divide-gray-200">
                          {rows.map((row, ri) => {
                            const personalizados = row.personalizados || {};
                            const totalPiezas = TALLAS_KEYS.reduce((s, t) => s + (Number(row.tallas?.[t]) || 0), 0);
                            return (
                              <div key={ri} className="px-4 py-3">
                                {/* Si hay más de 1 fila en este diseño, mostramos los metadatos */}
                                {rows.length > 1 && (
                                  <div className="flex items-center gap-2 flex-wrap mb-3">
                                    {[
                                      { label: "TIPO PRENDA", value: row.tipo_prenda },
                                      { label: "COLOR", value: row.color_prenda },
                                      row.modelo && { label: "MODELO", value: row.modelo },
                                      row.marca && { label: "MARCA", value: row.marca },
                                    ].filter(Boolean).map(({ label, value }) => (
                                      <div key={label} className="border border-gray-300 rounded px-1.5 py-0.5 text-center">
                                        <p className="text-[8px] text-gray-500 uppercase">{label}</p>
                                        <p className="text-[10px] font-bold">{value}</p>
                                      </div>
                                    ))}
                                    <div className="ml-auto border-2 border-green-500 rounded px-2 py-0.5 text-center">
                                      <p className="text-[8px] text-gray-500 uppercase">Total Piezas</p>
                                      <p className="text-base font-black text-green-700 leading-none">{totalPiezas}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Tallas */}
                                <div className="space-y-1.5">
                                  {TALLAS_KEYS.map((t, ti) => {
                                    const cantidad = Number(row.tallas?.[t]) || 0;
                                    if (!cantidad) return null;
                                    const listaP = personalizados[t] || [];
                                    const sinP = cantidad - listaP.length;
                                    return (
                                      <div key={t} className="border border-gray-300 rounded overflow-hidden">
                                        <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50/50">
                                          <div className="flex flex-col items-center justify-center border border-green-500 rounded-lg w-[38px] py-0.5 bg-white flex-shrink-0">
                                            <span className="text-[9px] font-bold text-gray-600 uppercase">{TALLAS_LABELS[ti]}</span>
                                            <span className="text-sm font-black text-green-700 leading-none">{cantidad}</span>
                                          </div>
                                          <div className="flex flex-col text-[10px] text-gray-700">
                                            {sinP > 0 && <span><strong className="text-black">{sinP}</strong> tallas {TALLAS_LABELS[ti]} <span className="font-semibold text-gray-500">SIN PERSONALIZAR</span></span>}
                                            {listaP.length > 0 && <span className="text-green-700 font-semibold"><strong>{listaP.length}</strong> tallas {TALLAS_LABELS[ti]} PERSONALIZADAS</span>}
                                          </div>
                                        </div>
                                        {listaP.map((p, pi) => (
                                          <div key={pi} className="flex items-start gap-2 px-3 py-1.5 border-t border-orange-300 bg-orange-50/20">
                                            <div className="flex flex-col items-center justify-center border border-green-400 rounded-lg w-[34px] py-0.5 bg-white flex-shrink-0">
                                              <span className="text-[8px] font-bold text-gray-500 uppercase">{TALLAS_LABELS[ti]}</span>
                                              <span className="text-[11px] font-black text-green-700 leading-none">1</span>
                                            </div>
                                            <div className="flex-1 text-[10px] space-y-0.5">
                                              <p className="font-bold text-black">{p.nombre}</p>
                                              <div className="flex gap-4 flex-wrap text-gray-600">
                                                {p.color_hilo && (
                                                  <span>
                                                    <span className="font-semibold text-blue-700">Hilo:</span>{" "}
                                                    {(() => {
                                                      const m = hiloMap[p.color_hilo];
                                                      return m ? `${p.color_hilo} - ${m.nombre}` : p.color_hilo;
                                                    })()}
                                                  </span>
                                                )}
                                                {p.nota && <span className="text-gray-500 italic">Nota: {p.nota}</span>}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  </div>{/* /grid-cols-2 */}

                  {/* Filas sin diseño vinculado — full width */}
                  {sinDiseno.length > 0 && (
                    <div className="mt-4 border border-gray-300 rounded overflow-hidden">
                      <div className="px-4 py-2 text-center bg-gray-100">
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">Prendas sin Diseño Asignado</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-4 py-3">
                        {sinDiseno.map((row, idx) => {
                          const personalizados = row.personalizados || {};
                          const totalPiezas = TALLAS_KEYS.reduce((s, t) => s + (Number(row.tallas?.[t]) || 0), 0);
                          return (
                            <div key={idx} className="border border-gray-200 rounded p-2">
                              <div className="flex items-center gap-1 flex-wrap mb-1.5">
                                {[
                                  { label: "TIPO PRENDA", value: row.tipo_prenda },
                                  { label: "COLOR", value: row.color_prenda },
                                  row.modelo && { label: "MODELO", value: row.modelo },
                                  row.marca && { label: "MARCA", value: row.marca },
                                ].filter(Boolean).map(({ label, value }) => (
                                  <div key={label} className="border border-gray-300 rounded px-1 py-0.5 text-center">
                                    <p className="text-[7px] text-gray-500 uppercase">{label}</p>
                                    <p className="text-[9px] font-bold">{value}</p>
                                  </div>
                                ))}
                                <div className="ml-auto border-2 border-green-500 rounded px-1.5 py-0.5 text-center">
                                  <p className="text-[7px] text-gray-500 uppercase">Piezas</p>
                                  <p className="text-sm font-black text-green-700 leading-none">{totalPiezas}</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {TALLAS_KEYS.map((t, ti) => {
                                  const cantidad = Number(row.tallas?.[t]) || 0;
                                  if (!cantidad) return null;
                                  const listaP = personalizados[t] || [];
                                  const sinP = cantidad - listaP.length;
                                  return (
                                    <div key={t} className="border border-gray-200 rounded overflow-hidden">
                                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50/30">
                                        <div className="flex flex-col items-center justify-center border border-green-500 rounded w-[32px] py-0.5 bg-white flex-shrink-0">
                                          <span className="text-[8px] font-bold text-gray-600 uppercase">{TALLAS_LABELS[ti]}</span>
                                          <span className="text-xs font-black text-green-700 leading-none">{cantidad}</span>
                                        </div>
                                        <div className="flex flex-col text-[9px] text-gray-700">
                                          {sinP > 0 && <span><strong className="text-black">{sinP}</strong> tallas {TALLAS_LABELS[ti]} <span className="font-semibold text-gray-500">SIN PERSONALIZAR</span></span>}
                                          {listaP.length > 0 && <span className="text-green-700 font-semibold"><strong>{listaP.length}</strong> tallas {TALLAS_LABELS[ti]} PERSONALIZADAS</span>}
                                        </div>
                                      </div>
                                      {listaP.map((p, pi) => (
                                        <div key={pi} className="flex items-start gap-1.5 px-2 py-1 border-t border-orange-200 bg-orange-50/20">
                                          <div className="flex flex-col items-center justify-center border border-green-400 rounded w-[28px] py-0.5 bg-white flex-shrink-0">
                                            <span className="text-[7px] font-bold text-gray-500 uppercase">{TALLAS_LABELS[ti]}</span>
                                            <span className="text-[9px] font-black text-green-700 leading-none">1</span>
                                          </div>
                                          <div className="flex-1 text-[9px] space-y-0.5">
                                            <p className="font-bold text-black">{p.nombre}</p>
                                            <div className="flex gap-2 flex-wrap text-gray-600">
                                              {p.color_hilo && (
                                                <span>
                                                  <span className="font-semibold text-blue-700">Hilo:</span>{" "}
                                                  {(() => {
                                                    const m = hiloMap[p.color_hilo];
                                                    return m ? `${p.color_hilo} - ${m.nombre}` : p.color_hilo;
                                                  })()}
                                                </span>
                                              )}
                                              {p.nota && <span className="text-gray-500 italic">Nota: {p.nota}</span>}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Footer firmas hoja especificaciones */}
          {(pdfCfg?.mostrar_firma !== false) && (
            <div className="page-footer grid grid-cols-2 gap-4">
              <div className="border border-gray-300 rounded p-3 text-center">
                <div className="border-b border-gray-400 mb-1 mx-4 mt-6" />
                <p className="font-semibold text-gray-800 uppercase" style={{ fontSize: pdfCfg?.fuente_firma || "10px" }}>{order.nombre_cliente}</p>
                <p style={{ fontSize: pdfCfg?.fuente_leyenda || "9px" }} className="text-black">{cfg.texto_firma_cliente}</p>
                <p style={{ fontSize: pdfCfg?.fuente_leyenda || "9px" }} className="text-black italic mt-1 px-2">{cfg.leyenda_autorizacion}</p>
              </div>
              <div className="border border-gray-300 rounded p-3 text-center">
                <div className="border-b border-gray-400 mb-1 mx-4 mt-6" />
                <p className="font-semibold text-gray-700" style={{ fontSize: pdfCfg?.fuente_firma || "10px" }}>{cfg.atencion_nombre}</p>
                <p style={{ fontSize: pdfCfg?.fuente_leyenda || "9px" }} className="text-gray-500">{cfg.atencion_puesto}</p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>{/* /print-container */}

      <style>{`
        @media print {
          @page { size: letter portrait; margin: 8mm; }
          body * { visibility: hidden; }
          #print-container, #print-container * { visibility: visible; }
          #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .print-page {
            width: 100%;
            min-height: calc(100vh - 16mm);
            font-size: 11px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            page-break-after: always;
            break-after: page;
            position: relative;
            padding-bottom: 80px;
          }
          .print-page:last-of-type {
            page-break-after: avoid;
            break-after: avoid;
          }
          .page-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 0 24px 8px 24px;
          }
        }
      `}</style>
    </>
  );
}