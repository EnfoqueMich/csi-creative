import { useState, useRef, useCallback, useEffect } from "react";
import { Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const FRENTE_URL = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/6b6aec754_frente.png";
const ESPALDA_URL = "https://media.base44.com/images/public/69d2f43e55d64f6bbfa30f2c/173365721_espalda.png";

// Posiciones iniciales por defecto para cada posición en % del contenedor
const DEFAULT_LAYOUT = {
  1: { x: 50, y: 32, w: 22 }, // Frente Izquierdo
  2: { x: 24, y: 32, w: 22 }, // Frente Derecho
  3: { x: 5,  y: 28, w: 17 }, // Manga Derecha
  4: { x: 76, y: 28, w: 17 }, // Manga Izquierda
  5: { x: 22, y: 20, w: 56 }, // Espalda
};

function DraggableImage({ imgUrl, posNum, layout, onUpdateLayout, containerRef }) {
  const imgRef = useRef(null);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const startData = useRef({});

  const pos = layout[posNum] || DEFAULT_LAYOUT[posNum] || { x: 20, y: 20, w: 25 };

  const getContainerSize = () => {
    if (!containerRef.current) return { w: 1, h: 1 };
    const rect = containerRef.current.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  };

  // Drag
  const onMouseDownDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startData.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const { w: cw, h: ch } = getContainerSize();
      const dx = ((ev.clientX - startData.current.mouseX) / cw) * 100;
      const dy = ((ev.clientY - startData.current.mouseY) / ch) * 100;
      onUpdateLayout(posNum, {
        ...pos,
        x: Math.max(0, Math.min(100 - pos.w, startData.current.origX + dx)),
        y: Math.max(0, Math.min(95, startData.current.origY + dy)),
      });
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos, posNum, onUpdateLayout]);

  // Resize handle
  const onMouseDownResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startData.current = {
      mouseX: e.clientX,
      origW: pos.w,
    };

    const onMove = (ev) => {
      if (!resizing.current) return;
      const { w: cw } = getContainerSize();
      const dw = ((ev.clientX - startData.current.mouseX) / cw) * 100;
      onUpdateLayout(posNum, {
        ...pos,
        w: Math.max(5, Math.min(90, startData.current.origW + dw)),
      });
    };

    const onUp = () => {
      resizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos, posNum, onUpdateLayout]);

  return (
    <div
      ref={imgRef}
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${pos.w}%`,
        cursor: "move",
        userSelect: "none",
        zIndex: 10,
      }}
      onMouseDown={onMouseDownDrag}
    >
      {/* Borde de selección */}
      <div style={{
        position: "relative",
        border: "2px dashed rgba(59,130,246,0.7)",
        borderRadius: 4,
        background: "rgba(255,255,255,0.05)",
      }}>
        <img
          src={imgUrl}
          alt=""
          style={{ width: "100%", display: "block", objectFit: "contain", pointerEvents: "none" }}
        />

        {/* Ícono de mover (esquina superior izquierda) */}
        <div style={{
          position: "absolute", top: -10, left: -10,
          background: "#3b82f6", borderRadius: "50%", padding: 2,
          cursor: "move", zIndex: 20,
        }}>
          <Move style={{ width: 10, height: 10, color: "white" }} />
        </div>

        {/* Handle de resize (esquina inferior derecha) */}
        <div
          onMouseDown={onMouseDownResize}
          style={{
            position: "absolute", bottom: -8, right: -8,
            width: 14, height: 14,
            background: "#10b981",
            borderRadius: "50%",
            cursor: "se-resize",
            zIndex: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
            <path d="M1 7L7 1M4 7L7 4M7 7V4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function ShirtView({ bgUrl, posNums, posiciones, layout, onUpdateLayout }) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block", width: "100%" }}>
      <img src={bgUrl} alt="playera" style={{ width: "100%", display: "block", objectFit: "contain" }} />
      {posNums.map((num) => {
        const pos = posiciones.find(p => p.numero === num);
        if (!pos?.imagen_url) return null;
        return (
          <DraggableImage
            key={num}
            imgUrl={pos.imagen_url}
            posNum={num}
            layout={layout}
            onUpdateLayout={onUpdateLayout}
            containerRef={containerRef}
          />
        );
      })}
    </div>
  );
}

export default function TshirtPreviewInteractive({ posiciones, layout, onLayoutChange }) {
  const handleUpdate = (posNum, newPos) => {
    onLayoutChange({ ...layout, [posNum]: newPos });
  };

  const resetLayout = () => {
    onLayoutChange({ ...DEFAULT_LAYOUT });
  };

  const hasImages = posiciones.some(p => p.imagen_url);

  return (
    <div className="space-y-2">
      {hasImages && (
        <div className="flex items-center justify-end gap-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Move className="w-3 h-3" /> Arrastra para mover · Esquina verde para redimensionar
          </p>
          <button
            type="button"
            onClick={resetLayout}
            className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}
      <div className="flex gap-6 justify-center items-start">
        <div className="text-center flex-1 max-w-sm">
          <p className="text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Vista Frontal</p>
          <ShirtView
            bgUrl={FRENTE_URL}
            posNums={[1, 2, 3, 4]}
            posiciones={posiciones}
            layout={layout}
            onUpdateLayout={handleUpdate}
          />
        </div>
        <div className="text-center flex-1 max-w-sm">
          <p className="text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Vista Trasera</p>
          <ShirtView
            bgUrl={ESPALDA_URL}
            posNums={[5]}
            posiciones={posiciones}
            layout={layout}
            onUpdateLayout={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_LAYOUT };