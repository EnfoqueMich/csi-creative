import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ListOrdered, Plus, X, GripVertical, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ProductionOrderPanel({ projects }) {
  const [record, setRecord] = useState(null); // the singleton ProductionOrder record
  const [open, setOpen] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [searchCrea, setSearchCrea] = useState("");
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    base44.entities.ProductionOrder.list().then((list) => {
      if (list.length > 0) setRecord(list[0]);
      else setRecord({ items: [] });
    });
  }, []);

  const items = record?.items || [];

  const save = async (newItems) => {
    const updated = { ...record, items: newItems };
    setRecord(updated);
    if (record?.id) {
      await base44.entities.ProductionOrder.update(record.id, { items: newItems });
    } else {
      const created = await base44.entities.ProductionOrder.create({ nombre: "principal", items: newItems });
      setRecord(created);
    }
  };

  const handleAdd = (project) => {
    if (items.find((i) => i.project_id === project.id)) return;
    const newItems = [...items, {
      crea: project.crea,
      project_id: project.id,
      titulo: project.titulo || project.proyecto || "",
      orden: items.length + 1,
    }];
    save(newItems);
    setSearchCrea("");
  };

  const handleRemove = (project_id) => {
    const newItems = items
      .filter((i) => i.project_id !== project_id)
      .map((i, idx) => ({ ...i, orden: idx + 1 }));
    save(newItems);
  };

  const handleDragStart = (idx) => setDragging(idx);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragging === null || dragging === idx) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragging, 1);
    newItems.splice(idx, 0, moved);
    const reordered = newItems.map((i, n) => ({ ...i, orden: n + 1 }));
    setRecord((prev) => ({ ...prev, items: reordered }));
    setDragging(idx);
  };

  const handleDragEnd = () => {
    save(items);
    setDragging(null);
  };

  // Suggestions: projects not already in the list, matching search
  const suggestions = projects.filter((p) => {
    if (items.find((i) => i.project_id === p.id)) return false;
    if (!searchCrea) return false;
    return (
      String(p.crea).includes(searchCrea) ||
      (p.titulo || p.proyecto || "").toLowerCase().includes(searchCrea.toLowerCase())
    );
  }).slice(0, 6);

  if (!record) return null;

  return (
    <div className="bg-card rounded-xl border-2 border-primary/20 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ListOrdered className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold uppercase tracking-wide text-primary">Orden de Producción</span>
          {items.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
      </button>

      {open && (
        <div className="p-5 space-y-4">
          {/* Search to add */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar CREA o nombre para agregar..."
              value={searchCrea}
              onChange={(e) => setSearchCrea(e.target.value)}
              className="pl-10"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAdd(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">CREA #{p.crea}</span>
                    <span className="text-sm truncate">{p.titulo || p.proyecto}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Busca proyectos por CREA para definir el orden de producción.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.project_id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 bg-muted/30 rounded-xl border border-border px-4 py-3 cursor-grab active:cursor-grabbing transition-all ${dragging === idx ? "opacity-50 scale-95" : ""}`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground flex-shrink-0 w-16">CREA #{item.crea}</span>
                  <Link
                    to={`/proyecto?id=${item.project_id}`}
                    className="flex-1 text-sm font-medium truncate hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.titulo || "Sin título"}
                  </Link>
                  <button
                    onClick={() => handleRemove(item.project_id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}