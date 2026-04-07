import { useState, useEffect } from "react";
import { Pencil, Check, X, Upload, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function DashboardHeader() {
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const data = await base44.entities.AppSettings.list();
    if (data.length > 0) {
      setSettings(data[0]);
      setTitulo(data[0].titulo || "");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { titulo };
    if (settings) {
      const updated = await base44.entities.AppSettings.update(settings.id, data);
      setSettings({ ...settings, ...data });
    } else {
      const created = await base44.entities.AppSettings.create(data);
      setSettings(created);
    }
    setSaving(false);
    setEditing(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const data = { logo_url: file_url };
    if (settings) {
      await base44.entities.AppSettings.update(settings.id, data);
      setSettings({ ...settings, logo_url: file_url });
    } else {
      const created = await base44.entities.AppSettings.create(data);
      setSettings(created);
    }
    setUploading(false);
  };

  const logo = settings?.logo_url;
  const title = settings?.titulo || "Gestión de Producción";

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-5">
      {/* Logo */}
      <div className="flex-shrink-0">
        <label className="cursor-pointer group relative block">
          {logo ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Logo</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
        </label>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título principal..."
              className="text-lg font-bold h-10"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <Button size="icon" onClick={handleSave} disabled={saving} className="h-10 w-10">
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(false); setTitulo(settings?.titulo || ""); }} className="h-10 w-10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 group">
            <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
            <button
              onClick={() => { setTitulo(settings?.titulo || ""); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-lg"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
        {uploading && <p className="text-xs text-muted-foreground mt-1">Subiendo logo...</p>}
      </div>
    </div>
  );
}