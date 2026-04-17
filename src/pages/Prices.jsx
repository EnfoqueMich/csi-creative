import { useState, useEffect } from "react";
import { DollarSign, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

function PriceRow({ label, unit, field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </div>
      <div className="relative w-36">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          type="number"
          placeholder="0.000"
          step="0.001"
          min="0"
          value={value || ""}
          onChange={(e) => onChange(field, Number(e.target.value))}
          className="font-mono pl-7 text-right"
        />
      </div>
    </div>
  );
}

export default function Prices() {
  const [prices, setPrices] = useState({});
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setLoading(true);
    const data = await base44.entities.PriceSettings.list();
    if (data.length > 0) {
      setRecordId(data[0].id);
      setPrices(data[0]);
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setPrices((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...data } = prices;
    if (recordId) {
      await base44.entities.PriceSettings.update(recordId, data);
    } else {
      const created = await base44.entities.PriceSettings.create(data);
      setRecordId(created.id);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">Precios Unitarios</h1>
          <p className="text-sm text-muted-foreground">Precios globales que aplican a todos los proyectos</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Materiales</p>
        <PriceRow label="Hilo" unit="por metro" field="precio_hilo_m" value={prices.precio_hilo_m} onChange={handleChange} />
        <PriceRow label="Bobina" unit="por metro" field="precio_bobina_m" value={prices.precio_bobina_m} onChange={handleChange} />
        <PriceRow label="Tatami" unit="por cm²" field="precio_tatami_cm2" value={prices.precio_tatami_cm2} onChange={handleChange} />
        <PriceRow label="Tela Canasta" unit="por cm²" field="precio_tela_canasta_cm2" value={prices.precio_tela_canasta_cm2} onChange={handleChange} />
        <PriceRow label="Tela Scrap" unit="por cm²" field="precio_tela_scrap_cm2" value={prices.precio_tela_scrap_cm2} onChange={handleChange} />
        <PriceRow label="Velcro" unit="por cm²" field="precio_velcro_cm2" value={prices.precio_velcro_cm2} onChange={handleChange} />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Mano de Obra</p>
        <PriceRow label="Bordado" unit="por minuto" field="precio_minuto_bordado" value={prices.precio_minuto_bordado} onChange={handleChange} />
        <PriceRow label="Diseño Gráfico" unit="por hora" field="precio_hora_diseno" value={prices.precio_hora_diseno} onChange={handleChange} />
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Guardando..." : "Guardar Precios"}
      </Button>
    </div>
  );
}