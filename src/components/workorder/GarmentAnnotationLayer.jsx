import { useState, useRef, useCallback, useEffect } from "react";
import { X, Pencil, Trash2, Type, Minus, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Tipos de anotación ──────────────────────────────────────────────────────
// anotación = {
//   id, type: "text"|"line"|"sticker",
//   x, y (%), w (solo sticker/text), h (opcional),
//   text (text), color (text+line), fontSize (text),
//   x1, y1, x2, y2 (%), color, strokeWidth, dashStyle (line),
//   image_url, label (sticker),
// }

let annCounter = 0;
function nextAnnId() { annCounter++; return `ann-${Date.now()}-${annCounter}`; }

// ─── Utilidad: obtener % dentro del contenedor ──────────────────────────────
function getPercent(containerEl, clientX, clientY) {
  const rect = containerEl.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

// ─── Text Callout Bubble ─────────────────────────────────────────────────────
function TextAnnotation({ ann, containerRef, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(ann.text || "");
  const dragging = useRef(false);
  const startData = useRef({});
  const elRef = useRef(null);

  useEffect(() => { setText(ann.text || ""); }, [ann.text]);

  const onMouseDown = useCallback((e) => {
    if (editing) return;
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    startData.current = { mx: e.clientX, my: e.clientY, ox: ann.x, oy: ann.y };
    const onMove = (ev) => {
      if (!dragging.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startData.current.mx) / rect.width) * 100;
      const dy = ((ev.clientY - startData.current.my) / rect.height) * 100;
      onUpdate({ ...ann, x: Math.max(2, Math.min(90, startData.current.ox + dx)), y: Math.max(2, Math.min(90, startData.current.oy + dy)) });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [ann, containerRef, onUpdate, editing]);

  const finishEdit = () => {
    onUpdate({ ...ann, text });
    setEditing(false);
  };

  return (
    <div
      ref={elRef}
      style={{
        position: "absolute",
        left: `${ann.x}%`,
        top: `${ann.y}%`,
        transform: "translate(-50%, -100%)",
        zIndex: 30,
        cursor: editing ? "text" : "grab",
        userSelect: "none",
        maxWidth: "40%",
      }}
      onMouseDown={onMouseDown}
    >
      <div
        style={{
          background: "#fff",
          border: "2px solid #444",
          borderRadius: 6,
          padding: editing ? "2px 4px" : "3px 6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: ann.fontSize || 10,
          color: ann.color || "#333",
          fontWeight: 600,
          lineHeight: 1.3,
          position: "relative",
        }}
      >
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={finishEdit}
              onKeyDown={e => { if (e.key === "Enter") finishEdit(); if (e.key === "Escape") { setText(ann.text || ""); setEditing(false); } }}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 w-[120px] outline-none focus:border-blue-400"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={finishEdit} className="text-green-600 hover:text-green-800">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-1 min-w-[60px]" onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            <span className="whitespace-pre-wrap">{ann.text || "Doble clic para editar"}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
              className="text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        {/* Flechita hacia abajo */}
        <div style={{
          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "6px solid #444",
        }} />
      </div>
    </div>
  );
}

// ─── Line Annotation ─────────────────────────────────────────────────────────
function LineAnnotation({ ann, containerRef, onUpdate, onDelete }) {
  const dragging = useRef(null); // "start" | "end" | "whole"
  const startData = useRef({});
  const lineRef = useRef(null);

  const onMouseDownStart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = "start";
    startData.current = { mx: e.clientX, my: e.clientY, ox: ann.x1, oy: ann.y1, ox2: ann.x2, oy2: ann.y2 };
    const onMove = (ev) => {
      if (dragging.current !== "start") return;
      const { x, y } = getPercent(containerRef.current, ev.clientX, ev.clientY);
      onUpdate({ ...ann, x1: x, y1: y });
    };
    const onUp = () => { dragging.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [ann, containerRef, onUpdate]);

  const onMouseDownEnd = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = "end";
    startData.current = { mx: e.clientX, my: e.clientY, ox: ann.x2, oy: ann.y2 };
    const onMove = (ev) => {
      if (dragging.current !== "end") return;
      const { x, y } = getPercent(containerRef.current, ev.clientX, ev.clientY);
      onUpdate({ ...ann, x2: x, y2: y });
    };
    const onUp = () => { dragging.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [ann, containerRef, onUpdate]);

  const onMouseDownLine = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = "whole";
    startData.current = { mx: e.clientX, my: e.clientY, ox1: ann.x1, oy1: ann.y1, ox2: ann.x2, oy2: ann.y2 };
    const onMove = (ev) => {
      if (dragging.current !== "whole") return;
      const dx = ((ev.clientX - startData.current.mx) / containerRef.current.getBoundingClientRect().width) * 100;
      const dy = ((ev.clientY - startData.current.my) / containerRef.current.getBoundingClientRect().height) * 100;
      onUpdate({
        ...ann,
        x1: Math.max(1, Math.min(99, startData.current.ox1 + dx)),
        y1: Math.max(1, Math.min(99, startData.current.oy1 + dy)),
        x2: Math.max(1, Math.min(99, startData.current.ox2 + dx)),
        y2: Math.max(1, Math.min(99, startData.current.oy2 + dy)),
      });
    };
    const onUp = () => { dragging.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [ann, containerRef, onUpdate]);

  const dashArray = ann.dashStyle === "dotted" ? "4,6" : ann.dashStyle === "solid" ? "" : "8,6";
  const color = ann.color || "#33B2E0";
  const sw = ann.strokeWidth || 2;

  return (
    <g>
      <line
        ref={lineRef}
        x1={`${ann.x1}%`} y1={`${ann.y1}%`}
        x2={`${ann.x2}%`} y2={`${ann.y2}%`}
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={dashArray}
        style={{ cursor: "move", pointerEvents: "stroke" }}
        onMouseDown={onMouseDownLine}
      />
      {/* Handle inicio */}
      <circle
        cx={`${ann.x1}%`} cy={`${ann.y1}%`} r={6}
        fill="white" stroke={color} strokeWidth={2}
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDownStart}
      />
      {/* Handle fin */}
      <circle
        cx={`${ann.x2}%`} cy={`${ann.y2}%`} r={6}
        fill="white" stroke={color} strokeWidth={2}
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDownEnd}
      />
    </g>
  );
}

// ─── Sticker Annotation ─────────────────────────────────────────────────────
function StickerAnnotation({ ann, containerRef, onUpdate, onDelete }) {
  const dragging = useRef(false);
  const startData = useRef({});
  const stickerW = ann.w || 15;

  const onMouseDown = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    startData.current = { mx: e.clientX, my: e.clientY, ox: ann.x, oy: ann.y };
    const onMove = (ev) => {
      if (!dragging.current) return;
      const dx = ((ev.clientX - startData.current.mx) / containerRef.current.getBoundingClientRect().width) * 100;
      const dy = ((ev.clientY - startData.current.my) / containerRef.current.getBoundingClientRect().height) * 100;
      onUpdate({ ...ann, x: Math.max(0, Math.min(100 - stickerW, startData.current.ox + dx)), y: Math.max(0, Math.min(95, startData.current.oy + dy)) });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [ann, containerRef, onUpdate, stickerW]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${ann.x}%`,
        top: `${ann.y}%`,
        width: `${stickerW}%`,
        cursor: "grab",
        zIndex: 25,
        userSelect: "none",
      }}
      onMouseDown={onMouseDown}
    >
      <div style={{ position: "relative", border: "1px dashed #f59e0b", borderRadius: 4, padding: 1 }}>
        <img src={ann.image_url} alt={ann.label || "sticker"} style={{ width: "100%", display: "block", pointerEvents: "none", objectFit: "contain" }} />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow"
          style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X className="w-2.5 h-2.5" />
        </button>
        {ann.label && (
          <div className="text-center mt-0.5">
            <span className="text-[8px] text-gray-600 font-semibold">{ann.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Annotation Layer ───────────────────────────────────────────────────────
export default function GarmentAnnotationLayer({ annotations = [], containerRef, onUpdate, onDelete }) {
  const lines = annotations.filter(a => a.type === "line");
  const texts = annotations.filter(a => a.type === "text");
  const stickers = annotations.filter(a => a.type === "sticker");

  return (
    <>
      {/* SVG layer para líneas */}
      {lines.length > 0 && (
        <svg
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none", zIndex: 25, overflow: "visible",
          }}
        >
          <g style={{ pointerEvents: "auto" }}>
            {lines.map(ann => (
              <LineAnnotation key={ann.id} ann={ann} containerRef={containerRef} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </g>
        </svg>
      )}

      {/* Botones eliminar para líneas (posicionados como DOM) */}
      {lines.map(ann => (
        <div
          key={`del-${ann.id}`}
          style={{
            position: "absolute",
            left: `${(ann.x1 + ann.x2) / 2}%`,
            top: `${(ann.y1 + ann.y2) / 2}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 35,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
            className="bg-white rounded-full p-0.5 shadow border border-gray-300 hover:bg-red-50"
          >
            <X className="w-2.5 h-2.5 text-red-500" />
          </button>
        </div>
      ))}

      {/* Text bubbles */}
      {texts.map(ann => (
        <TextAnnotation key={ann.id} ann={ann} containerRef={containerRef} onUpdate={onUpdate} onDelete={onDelete} />
      ))}

      {/* Stickers */}
      {stickers.map(ann => (
        <StickerAnnotation key={ann.id} ann={ann} containerRef={containerRef} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </>
  );
}

// ─── Mini Toolbar para agregar anotaciones ──────────────────────────────────
export function AnnotationToolbar({ onAddText, onAddLine, onAddSticker }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onAddSticker(file_url, file.name.replace(/\.[^.]+$/, ""));
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
      <span className="text-[10px] font-semibold text-gray-500 uppercase mr-1">Anotar:</span>
      <button
        type="button"
        onClick={onAddText}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:bg-blue-50 text-blue-700 transition-colors"
        title="Añadir texto"
      >
        <Type className="w-3 h-3" /> Texto
      </button>
      <button
        type="button"
        onClick={onAddLine}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:bg-cyan-50 text-cyan-700 transition-colors"
        title="Añadir línea guía"
      >
        <Minus className="w-3 h-3 rotate-45" /> Línea
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:bg-amber-50 text-amber-700 transition-colors"
        title="Subir sticker"
      >
        {uploading ? (
          <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        Sticker
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export { nextAnnId };