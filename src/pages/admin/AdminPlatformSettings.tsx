import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Save } from "lucide-react";

const AdminPlatformSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const logoOpenRef = useRef<HTMLInputElement>(null);
  const logoClosedRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings" as any)
        .select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.key] = row.value || "";
      });
      return map;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await (supabase as any)
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({ title: "Configuração salva!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleUpload = async (file: File, key: string) => {
    setUploading(key);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `platform-${key}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      await updateSetting.mutateAsync({ key, value: urlData.publicUrl });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-transparent border-t-accent" />
      </div>
    );
  }

  const items = [
    {
      key: "sidebar_logo_open",
      label: "Logo da Sidebar (Aberta)",
      desc: "Logo exibida quando a sidebar está expandida. Recomendado: 160×32 px (PNG transparente)",
      ref: logoOpenRef,
    },
    {
      key: "sidebar_logo_collapsed",
      label: "Logo da Sidebar (Fechada)",
      desc: "Ícone exibido quando a sidebar está colapsada. Recomendado: 32×32 px (PNG transparente)",
      ref: logoClosedRef,
    },
    {
      key: "dashboard_banner_url",
      label: "Banner do Dashboard",
      desc: "Banner exibido no topo do dashboard dos usuários. Recomendado: 1200×300 px (JPG ou PNG)",
      ref: bannerRef,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações da <span className="text-destructive">Plataforma</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie logos e banner do dashboard</p>
      </div>

      <div className="grid gap-5">
        {items.map((item) => (
          <Card key={item.key} className="border-border/60 bg-card">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-sm font-semibold">{item.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>

                {settings?.[item.key] && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex items-center justify-center">
                    <img
                      src={settings[item.key]}
                      alt={item.label}
                      className={item.key === "dashboard_banner_url" ? "max-h-[120px] w-full object-cover rounded-md" : "max-h-[40px] object-contain"}
                    />
                  </div>
                )}

                <input
                  ref={item.ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, item.key);
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={uploading === item.key}
                    onClick={() => item.ref.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === item.key ? "Enviando..." : "Upload"}
                  </Button>
                  {settings?.[item.key] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => updateSetting.mutate({ key: item.key, value: "" })}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Banner link */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Link do Banner (opcional)</Label>
              <p className="text-xs text-muted-foreground">URL para onde o banner redireciona ao clicar</p>
              <div className="flex gap-2">
                <Input
                  defaultValue={settings?.dashboard_banner_link || ""}
                  placeholder="https://..."
                  className="flex-1"
                  onBlur={(e) => updateSetting.mutate({ key: "dashboard_banner_link", value: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPlatformSettings;
