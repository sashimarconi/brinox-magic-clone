import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PLANS, formatLimit, isUnlimited } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Crown, Zap, Rocket, Package, Store, Radio, Webhook, Tag, Truck, Eye } from "lucide-react";

const planIcons = { free: Zap, pro: Crown, enterprise: Rocket };

const resourceLabels: Record<string, { label: string; icon: React.ElementType }> = {
  products: { label: "Produtos", icon: Package },
  stores: { label: "Lojas", icon: Store },
  pixels: { label: "Pixels", icon: Radio },
  webhooks: { label: "Webhooks", icon: Webhook },
  orderBumps: { label: "Order Bumps", icon: Tag },
  shippingOptions: { label: "Opções de Frete", icon: Truck },
};

const AdminPlans = () => {
  const { plan, planType, usage, monthlyViewsUsed, monthlyViewsLimit, isLoading } = usePlanLimits();

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
        <h1 className="text-2xl font-display font-black text-foreground">Plano & Limites</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu plano e acompanhe o uso dos recursos</p>
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

      {/* Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(resourceLabels).map(([key, { label, icon: Icon }]) => {
          const used = usage?.[key as keyof typeof usage] ?? 0;
          const limit = plan.limits[key as keyof typeof plan.limits];
          const unlimited = isUnlimited(limit);
          const percent = unlimited ? 0 : (used / limit) * 100;
          const isNearLimit = !unlimited && percent >= 80;

          return (
            <Card key={key} className="bg-card/60 border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-void-cyan" />
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
                <span className={`text-sm font-mono font-bold ${isNearLimit ? 'text-void-danger' : 'text-muted-foreground'}`}>
                  {used}/{formatLimit(limit)}
                </span>
              </div>
              {!unlimited && (
                <Progress
                  value={percent}
                  className="h-2"
                />
              )}
              {unlimited && (
                <p className="text-xs text-muted-foreground/70">Ilimitado</p>
              )}
            </Card>
          );
        })}

        {/* Monthly Views - special card for Free plan */}
        <Card className="bg-card/60 border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-void-cyan" />
              <span className="text-sm font-semibold text-foreground">Visualizações/mês</span>
            </div>
            <span className={`text-sm font-mono font-bold ${!isUnlimited(monthlyViewsLimit) && monthlyViewsUsed >= monthlyViewsLimit * 0.8 ? 'text-void-danger' : 'text-muted-foreground'}`}>
              {monthlyViewsUsed}/{formatLimit(monthlyViewsLimit)}
            </span>
          </div>
          {!isUnlimited(monthlyViewsLimit) ? (
            <Progress
              value={(monthlyViewsUsed / monthlyViewsLimit) * 100}
              className="h-2"
            />
          ) : (
            <p className="text-xs text-muted-foreground/70">Ilimitado</p>
          )}
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
                    <span>Produtos</span>
                    <span className="font-mono font-semibold text-foreground">{formatLimit(p.limits.products)}</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Lojas</span>
                    <span className="font-mono font-semibold text-foreground">{formatLimit(p.limits.stores)}</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Pixels</span>
                    <span className="font-mono font-semibold text-foreground">{formatLimit(p.limits.pixels)}</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Webhooks</span>
                    <span className="font-mono font-semibold text-foreground">{formatLimit(p.limits.webhooks)}</span>
                  </li>
                  <li className="flex justify-between text-muted-foreground">
                    <span>Views/mês</span>
                    <span className="font-mono font-semibold text-foreground">{formatLimit(p.limits.monthlyViews)}</span>
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
