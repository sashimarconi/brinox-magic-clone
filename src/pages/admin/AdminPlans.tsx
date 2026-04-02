import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PLANS } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Crown, Zap, Rocket, Percent, DollarSign, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const planIcons = { free: Zap, pro: Crown, enterprise: Rocket };

const AdminPlans = () => {
  const { plan, planType, isLoading } = usePlanLimits();

  const { data: monthlyFees } = useQuery({
    queryKey: ["monthly-fees"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("invoices")
        .select("fee_amount")
        .gte("created_at", startOfMonth.toISOString());

      return data?.reduce((sum, inv) => sum + Number(inv.fee_amount), 0) ?? 0;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-void-cyan" />
      </div>
    );
  }

  const PlanIcon = planIcons[planType];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Plano & Faturamento</h1>
        <p className="text-muted-foreground text-sm mt-1">Seu plano atual e taxas de transação</p>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-card/80 backdrop-blur-xl border-border p-6 void-glow-purple-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-void-purple to-void-cyan flex items-center justify-center void-glow-purple">
            <PlanIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-black text-foreground">{plan.name}</h2>
              <Badge variant="outline" className="border-void-cyan text-void-cyan text-xs">{plan.badge}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{plan.description}</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/60 border-border p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-void-cyan" />
            <span className="text-sm font-semibold text-foreground">Taxa por venda</span>
          </div>
          <p className="text-3xl font-mono font-black text-void-cyan">{plan.transactionFeePercent}%</p>
          <p className="text-xs text-muted-foreground">Cobrado automaticamente em cada venda aprovada</p>
        </Card>

        <Card className="bg-card/60 border-border p-5 space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-void-purple" />
            <span className="text-sm font-semibold text-foreground">Mensalidade</span>
          </div>
          <p className="text-3xl font-mono font-black text-foreground">
            {plan.monthlyPrice === 0 ? (
              <span className="text-emerald-400">Grátis</span>
            ) : (
              <>R${plan.monthlyPrice}<span className="text-sm text-muted-foreground font-normal">/mês</span></>
            )}
          </p>
        </Card>

        <Card className="bg-card/60 border-border p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-void-cyan" />
            <span className="text-sm font-semibold text-foreground">Taxas do mês</span>
          </div>
          <p className="text-3xl font-mono font-black text-foreground">
            R${(monthlyFees ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Total acumulado de taxas neste mês</p>
        </Card>
      </div>

      {/* All Plans Comparison */}
      <div>
        <h3 className="text-lg font-display font-bold text-foreground mb-4">Comparativo de Planos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PLANS).map((p) => {
            const PlIcon = planIcons[p.type];
            const isCurrent = p.type === planType;

            return (
              <Card
                key={p.type}
                className={`bg-card/60 border p-5 space-y-4 transition-all ${
                  isCurrent ? 'border-void-cyan void-glow-cyan-sm' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isCurrent ? 'bg-gradient-to-br from-void-purple to-void-cyan' : 'bg-muted'
                  }`}>
                    <PlIcon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground">{p.name}</h4>
                    {isCurrent && <span className="text-xs text-void-cyan">Plano atual</span>}
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between text-muted-foreground">
                    <span>Taxa por venda</span>
                    <span className="font-mono font-semibold text-foreground">{p.transactionFeePercent}%</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Mensalidade</span>
                    <span className="font-mono font-semibold text-foreground">
                      {p.monthlyPrice === 0 ? 'Grátis' : `R$${p.monthlyPrice}`}
                    </span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Produtos</span>
                    <span className="font-mono font-semibold text-foreground">Ilimitados</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Lojas</span>
                    <span className="font-mono font-semibold text-foreground">Ilimitadas</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Views/mês</span>
                    <span className="font-mono font-semibold text-foreground">Ilimitados</span>
                  </li>
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;
