import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Store, ShoppingCart, DollarSign, Crown } from "lucide-react";

interface Metrics {
  total_users: number;
  total_products: number;
  total_stores: number;
  total_orders: number;
  total_revenue: number;
  free_users: number;
  pro_users: number;
  enterprise_users: number;
}

const SaasMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.rpc("admin_saas_metrics");
      if (!error && data && data.length > 0) {
        setMetrics(data[0] as unknown as Metrics);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-void-cyan" />
      </div>
    );
  }

  if (!metrics) return <p className="text-muted-foreground">Erro ao carregar métricas.</p>;

  const cards = [
    { title: "Total de Usuários", value: metrics.total_users, icon: Users, color: "text-void-cyan" },
    { title: "Produtos Criados", value: metrics.total_products, icon: Package, color: "text-void-purple" },
    { title: "Lojas Criadas", value: metrics.total_stores, icon: Store, color: "text-green-400" },
    { title: "Pedidos Totais", value: metrics.total_orders, icon: ShoppingCart, color: "text-yellow-400" },
    { title: "Receita Total (Aprovada)", value: `R$ ${Number(metrics.total_revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-emerald-400" },
  ];

  const planCards = [
    { title: "Free", value: metrics.free_users, color: "text-muted-foreground" },
    { title: "Pro", value: metrics.pro_users, color: "text-void-cyan" },
    { title: "Enterprise", value: metrics.enterprise_users, color: "text-void-purple" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Métricas do SaaS</h1>
        <p className="text-muted-foreground text-sm">Visão geral de toda a plataforma VoidTok</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Distribuição por Plano
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {planCards.map((p) => (
            <Card key={p.title} className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${p.color}`}>{p.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{p.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SaasMetrics;
