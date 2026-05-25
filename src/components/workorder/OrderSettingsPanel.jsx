import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, ImagePlus, X } from "lucide-react";

const DEFAULTS = {
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

export default function OrderSettingsPanel() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    base44.entities.OrderSettings.list().then((list) => {
      if (list.length > 0) {
        setRecordId(list[0].id);
        setCfg({ ...DEFAULTS, ...list[0] });
      }
      setLoading(false);
    });
  }, []);

  const set = (field, value) => setCfg((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("logo_url", file_url);
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (recordId) {
      await base44.entities.OrderSettings.update(recordId, cfg);
    } else {
      const saved = await base44.entities.OrderSettings.create(cfg);
      setRecordId(saved.id);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Encabezado del Documento</p>

        {/* Logo */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Logo de empresa</label>
          {cfg.logo_url ? (
            <div className="flex items-center gap-3">
              <img src={cfg.logo_url} alt="Logo" className="h-14 object-contain border border-border rounded p-1" />
              <button onClick={() => set("logo_url", "")} className="text-destructive hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:bg-muted/40 transition-colors w-fit">
              {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <ImagePlus className="w-4 h-4 text-muted-foreground" />}
              <span className="text-sm text-muted-foreground">{uploadingLogo ? "Subiendo..." : "Cargar logo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Teléfono empresa</label>
            <Input value={cfg.empresa_telefono} onChange={(e) => set("empresa_telefono", e.target.value)} placeholder="Ej: 81 1234 5678" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Redes sociales</label>
            <Input value={cfg.empresa_redes} onChange={(e) => set("empresa_redes", e.target.value)} placeholder="@csicreative" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold">Dirección</label>
            <Input value={cfg.empresa_direccion} onChange={(e) => set("empresa_direccion", e.target.value)} placeholder="Calle, Colonia, Ciudad..." />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Firma de Atención</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Nombre de atención</label>
            <Input value={cfg.atencion_nombre} onChange={(e) => set("atencion_nombre", e.target.value)} placeholder="SILVIA LIRA" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Puesto</label>
            <Input value={cfg.atencion_puesto} onChange={(e) => set("atencion_puesto", e.target.value)} placeholder="Atención a Clientes" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sección de Firma del Cliente</p>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Leyenda de autorización</label>
          <Textarea
            value={cfg.leyenda_autorizacion}
            onChange={(e) => set("leyenda_autorizacion", e.target.value)}
            rows={3}
            placeholder="Autorizo que se realice el trabajo..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Etiqueta bajo línea de firma del cliente</label>
          <Input value={cfg.texto_firma_cliente} onChange={(e) => set("texto_firma_cliente", e.target.value)} placeholder="Firma y nombre del cliente" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar configuración
      </Button>
    </div>
  );
}