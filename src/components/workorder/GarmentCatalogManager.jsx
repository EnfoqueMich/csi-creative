import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GarmentCatalogManager() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ marca: "", modelo: "", talla: "", precio: "", stock: 0 });

  useEffect(() => {
    base44.entities.GarmentCatalog.list("-created_date", 100).then((data) => {
      setCatalogo(data);
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setForm({ marca: "", modelo: "", talla: "", precio: "", stock: 0 });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.marca || !form.modelo || !form.talla || !form.precio) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setSaving(true);
    const data = {
      marca: form.marca,
      modelo: form.modelo,
      talla: form.talla,
      precio: Number(form.precio),
      stock: Number(form.stock) || 0,
    };

    if (editingId) {
      const updated = await base44.entities.GarmentCatalog.update(editingId, data);
      setCatalogo((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
    } else {
      const created = await base44.entities.GarmentCatalog.create(data);
      setCatalogo((prev) => [created, ...prev]);
    }

    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este artículo del catálogo?")) {
      await base44.entities.GarmentCatalog.delete(id);
      setCatalogo((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleEdit = (item) => {
    setForm({
      marca: item.marca,
      modelo: item.modelo,
      talla: item.talla,
      precio: item.precio,
      stock: item.stock || 0,
    });
    setEditingId(item.id);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Formulario de entrada */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Agregar / Editar Prenda</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Marca *</label>
            <Input
              value={form.marca}
              onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
              placeholder="Nike, Adidas..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Modelo *</label>
            <Input
              value={form.modelo}
              onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
              placeholder="Polo, Camiseta..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Talla *</label>
            <Input
              value={form.talla}
              onChange={(e) => setForm((prev) => ({ ...prev, talla: e.target.value }))}
              placeholder="S, M, L..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Precio *</label>
            <Input
              type="number"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
              placeholder="0.00"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Stock</label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              placeholder="0"
              className="text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? "Actualizar" : "Agregar"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de catálogo */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <p className="text-sm font-bold uppercase tracking-widest">Catálogo de Prendas ({catalogo.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-semibold">Marca</th>
                <th className="px-4 py-2 text-left font-semibold">Modelo</th>
                <th className="px-4 py-2 text-left font-semibold">Talla</th>
                <th className="px-4 py-2 text-right font-semibold">Precio</th>
                <th className="px-4 py-2 text-center font-semibold">Stock</th>
                <th className="px-4 py-2 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {catalogo.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                    No hay prendas en el catálogo. Agrega tu primera prenda.
                  </td>
                </tr>
              ) : (
                catalogo.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium">{item.marca}</td>
                    <td className="px-4 py-2">{item.modelo}</td>
                    <td className="px-4 py-2">{item.talla}</td>
                    <td className="px-4 py-2 text-right font-semibold">${item.precio.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold",
                        item.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}