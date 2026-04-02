import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Store, ShoppingCart, DollarSign, Crown, TrendingUp, UserPlus } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface DailyOrder {
  day: string;
  order_count: number;
  revenue: number;
  paid_count: number;
}

interface DailySignup {
  day: string;
  signup_count: number;
}

const PLAN_COLORS = ["hsl(var(--muted-foreground))", "hsl(var(--void-cyan))", "hsl(var(--void-purple))"];

const SaasMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [metricsRes, ordersRes, signupsRes] = await Promise.all([
        supabase.rpc("admin_saas_metrics"),
        supabase.rpc("admin_daily_orders", { days: 30 }),
        supabase.rpc("admin_daily_signups", { days: 30 }),
      ]);

      if (!metricsRes.error && metricsRes.data?.length > 0) {
        setMetrics(metricsRes.data[0] as unknown as Metrics);
      }
      if (!ordersRes.error && ordersRes.data) {
        setDailyOrders(ordersRes.data as unknown as DailyOrder[]);
      }
      if (!signupsRes.error && signupsRes.data) {
        setDailySignups(signupsRes.data as unknown as DailySignup[]);
      }
      setLoading(false);
    };
    fetchAll();
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
    { title: "Receita Aprovada", value: `R$ ${Number(metrics.total_revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-emerald-400" },
  ];

  const planPieData = [
    { name: "Free", value: metrics.free_users },
    { name: "Pro", value: metrics.pro_users },
    { name: "Enterprise", value: metrics.enterprise_users },
  ].filter((d) => d.value > 0);

  const formatDay = (day: string) => {
    try { return format(parseISO(day), "dd/MM", { locale: ptBR }); } catch { return day; }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.name === "Receita" ? `R$ ${Number(entry.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Métricas do SaaS</h1>
        <p className="text-muted-foreground text-sm">Visão geral de toda a plataforma VoidTok</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="bg-card/50 border-border backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-void-cyan" />
              Receita Diária (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyOrders.map((d) => ({ ...d, day: formatDay(d.day) }))}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--void-cyan))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--void-cyan))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(var(--void-cyan))" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {planPieData.map((_, i) => (
                    <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {planPieData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[i] }} />
                  <span className="text-muted-foreground">{p.name}: <span className="text-foreground font-medium">{p.value}</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders + Signups Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Orders */}
        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-void-purple" />
              Pedidos Diários (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyOrders.map((d) => ({ ...d, day: formatDay(d.day) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="order_count" name="Total" fill="hsl(var(--void-purple))" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Bar dataKey="paid_count" name="Aprovados" fill="hsl(var(--void-cyan))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Signups */}
        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Novos Cadastros (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailySignups.map((d) => ({ ...d, day: formatDay(d.day) }))}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="signup_count" name="Cadastros" stroke="hsl(142, 71%, 45%)" fill="url(#signupGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SaasMetrics;
