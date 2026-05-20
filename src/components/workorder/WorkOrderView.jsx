import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const TALLAS_LABELS = ["XS","S","M","L","XL","2XL","3XL","4XL"];
const TALLAS_KEYS =   ["xs","s","m","l","xl","xxl","xxxl","xxxxl"];

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

export default function WorkOrderView({ order, onBack, onEdit }) {
  const handlePrint = () => window.print();

  // Normalizar especificaciones (compatibilidad con formato antiguo)
  const especificaciones = order.especificaciones?.length
    ? order.especificaciones
    : (order.tipo_prenda !== undefined
        ? [{ tipo_prenda: order.tipo_prenda, color_prenda: order.color_prenda, tallas: order.tallas, total_piezas: order.total_piezas }]
        : []);

  return (
    <>
      {/* Controles (ocultos en impresión) */}
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
      <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none" id="orden-print">
        {/* Encabezado */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b-2 border-blue-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="bg-yellow-600 text-white font-black text-xl px-2 py-1 rounded-sm">C</div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-sm tracking-widest text-blue-900">CSI</span>
                <span className="text-xs tracking-widest text-gray-600 font-semibold">CREATIVE</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-yellow-600 tracking-wider">ORDEN DE TRABAJO</p>
            <p className="text-xs text-gray-600 font-mono mt-1">No. DOCUMENTO: CR-FTW-003-V01</p>
            {order.folio && <p className="text-xs text-gray-600 font-mono">{order.folio}</p>}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Fila cliente */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="NOMBRE CLIENTE" value={order.nombre_cliente} blue />
            <Field label="FECHA DE ORDEN" value={order.fecha_orden} blue />
            <Field label="AGENTE DE VENTAS" value={order.agente_ventas} blue />
            <Field label="TELÉFONO" value={order.telefono} blue />
            <div className="col-span-2">
              <Field label="ARTÍCULO SOLICITADO" value={order.articulo_solicitado} blue />
            </div>
          </div>

          {/* Tipo trabajo + observaciones */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-2 border-green-500 rounded p-3">
              <p className="text-xs font-bold text-yellow-600 mb-2 uppercase">Tipo de Trabajo:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  ["bordado","Bordado"],["muestras","Muestras"],
                  ["estampado","Estampado"],["sublimado","Sublimado"],
                  ["costura","Costura"],["parche","Parche"],
                  ["riveteado","Riveteado"],["dtf","DTF"],
                ].map(([key,label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <Check checked={!!order.tipo_trabajo?.[key]} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-blue-300 rounded p-3">
              <p className="text-xs font-bold text-blue-700 mb-1 uppercase">Observaciones:</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[60px]">{order.observaciones || ""}</p>
            </div>
          </div>

          {/* Especificaciones — puede haber múltiples */}
          <div className="border-2 border-green-500 rounded p-3 space-y-3">
            <p className="text-xs font-bold text-green-700 text-center uppercase tracking-widest">Especificaciones</p>
            {especificaciones.map((row, idx) => (
              <div key={idx} className={cn("space-y-1", idx > 0 && "border-t border-green-200 pt-2")}>
                {especificaciones.length > 1 && (
                  <p className="text-[10px] font-bold text-green-600 uppercase">Modelo {idx + 1}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="border border-gray-400 rounded px-2 py-1 min-w-[80px]">
                    <p className="text-gray-500 text-[10px] uppercase">Tipo Prenda</p>
                    <p className="font-semibold">{row.tipo_prenda || "—"}</p>
                  </div>
                  <div className="border border-gray-400 rounded px-2 py-1 min-w-[60px]">
                    <p className="text-gray-500 text-[10px] uppercase">Color</p>
                    <p className="font-semibold">{row.color_prenda || "—"}</p>
                  </div>
                  {TALLAS_KEYS.map((t, i) => (
                    <div key={t} className="border border-gray-400 rounded px-2 py-1 w-10 text-center">
                      <p className="text-gray-500 text-[10px] uppercase">{TALLAS_LABELS[i]}</p>
                      <p className="font-bold">{row.tallas?.[t] || ""}</p>
                    </div>
                  ))}
                  {row.tallas?.otras && (
                    <div className="border border-gray-400 rounded px-2 py-1">
                      <p className="text-gray-500 text-[10px] uppercase">Otras</p>
                      <p className="font-semibold">{row.tallas.otras}</p>
                    </div>
                  )}
                  <div className="border-2 border-green-500 rounded px-2 py-1 min-w-[60px] text-center ml-auto">
                    <p className="text-gray-500 text-[10px] uppercase">Total Piezas</p>
                    <p className="font-black text-base text-green-700">{row.total_piezas || "0"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Posiciones */}
          <div className="border-2 border-blue-300 rounded p-3">
            <div className="grid grid-cols-5 gap-2">
              {(order.posiciones || []).map((pos, i) => (
                <div key={i} className="border border-blue-200 rounded space-y-1">
                  <div className="bg-blue-700 text-white text-[10px] font-bold text-center py-1 rounded-t">
                    POSICIÓN # {pos.numero}
                  </div>
                  <div className="bg-green-100 text-green-800 text-[10px] font-semibold text-center py-0.5 mx-1 rounded border border-green-300">
                    {pos.nombre}
                  </div>
                  {pos.imagen_url && (
                    <div className="px-1">
                      <img src={pos.imagen_url} alt={pos.nombre} className="w-[80%] mx-auto object-contain rounded border border-blue-100" />
                    </div>
                  )}
                  <div className="px-2 pb-1 min-h-[40px]">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{pos.descripcion || ""}</p>
                  </div>
                  {pos.color_hilos?.filter(Boolean).length > 0 && (
                    <div className="px-2 pb-2 border-t border-blue-100 pt-1">
                      <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Hilo</p>
                      {pos.color_hilos.filter(Boolean).map((c, hi) => (
                        <div key={hi} className="flex items-center gap-1 text-[10px]">
                          <div className="w-2.5 h-2.5 rounded-sm border border-gray-400 bg-white flex-shrink-0" />
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer: bobina + extras + firma */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {/* Bobina */}
            <div className="border-2 border-blue-400 rounded p-3 text-xs space-y-1">
              <p className="font-bold text-blue-700 uppercase text-[10px]">Bobina</p>
              <div className="flex items-center gap-1"><Check checked={!!order.bobina_negra} /> Negra</div>
              <div className="flex items-center gap-1"><Check checked={!!order.bobina_blanca} /> Blanca</div>
            </div>

            {/* Extras */}
            <div className="border-2 border-orange-300 rounded p-3 text-xs space-y-1">
              <p className="font-bold text-orange-600 uppercase text-[10px]">Extras</p>
              {[["foamy","Foamy"],["velcro_macho","Velcro macho"],["velcro_hembra","Velcro hembra"],["adhesivo_termico","Adesivo térmico"]].map(([key,label]) => (
                <div key={key} className="flex items-center gap-1"><Check checked={!!order.extras?.[key]} /> {label}</div>
              ))}
            </div>

            {/* Firma */}
            <div className="text-xs text-center space-y-2">
              <p className="font-bold text-blue-900 tracking-widest text-[10px] uppercase">Firma de Autorización</p>
              <div className="border-b border-gray-400 mt-8 mb-1" />
              <p className="font-semibold text-gray-700">SILVIA LIRA</p>
              <p className="text-gray-500 text-[10px]">Atención a Clientes</p>
              <div className="border-b border-gray-400 mt-6 mb-1" />
              <p className="text-gray-500 text-[10px]">Firma Cliente</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #orden-print, #orden-print * { visibility: visible; }
          #orden-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </>
  );
}