import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingCart, TrendingUp, DollarSign, CheckCircle2, Package2, CalendarDays, Activity, Shield, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

interface Stats {
  onlineNow: number;
  visits: number;
  checkouts: number;
  pendingOrders: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  paidRevenue: number;
  conversionRate: number;
}

const quickPeriods = [
  { label: "Hoje", days: 0 },
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
];

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [stats, setStats] = useState<Stats>({
    onlineNow: 0, visits: 0, checkouts: 0, pendingOrders: 0,
    totalOrders: 0, paidOrders: 0, totalRevenue: 0, paidRevenue: 0, conversionRate: 0,
  });
  const [revenueData, setRevenueData] = useState<{ hour: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const rangeStart = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(new Date());
  const rangeEnd = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date());

  const fetchAll = async () => {
    setLoading(true);
    const startISO = rangeStart.toISOString();
    const endISO = rangeEnd.toISOString();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [onlineRes, eventsRes, ordersRes] = await Promise.all([
      supabase.from("visitor_sessions").select("session_id", { count: "exact", head: true }).gte("last_seen_at", fiveMinAgo),
      supabase.from("page_events").select("event_type, created_at").gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("orders").select("id, total, payment_status, created_at").gte("created_at", startISO).lte("created_at", endISO),
    ]);

    const events = eventsRes.data || [];
    const orders = ordersRes.data || [];
    const paid = orders.filter(o => o.payment_status === "paid" || o.payment_status === "approved");
    const pending = orders.filter(o => o.payment_status === "pending");
    const paidRevenue = paid.reduce((s, o) => s + Number(o.total), 0);
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const checkouts = events.filter(e => e.event_type === "checkout_view").length;
    const visits = events.filter(e => e.event_type === "page_view").length;

    setStats({
      onlineNow: onlineRes.count || 0,
      visits,
      checkouts,
      pendingOrders: pending.length,
      totalOrders: orders.length,
      paidOrders: paid.length,
      totalRevenue,
      paidRevenue,
      conversionRate: checkouts > 0 ? (paid.length / checkouts) * 100 : 0,
    });

    const isToday = dateRange?.from?.toDateString() === new Date().toDateString() && (!dateRange.to || dateRange.to.toDateString() === new Date().toDateString());
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}h`,
      value: 0,
    }));

    if (isToday) {
      paid.forEach(o => {
        const h = new Date(o.created_at).getHours();
        hours[h].value += Number(o.total);
      });
    } else {
      const dayMap = new Map<string, number>();
      paid.forEach(o => {
        const key = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        dayMap.set(key, (dayMap.get(key) || 0) + Number(o.total));
      });
      const dayEntries = Array.from(dayMap.entries()).sort();
      setRevenueData(dayEntries.map(([day, value]) => ({ hour: day, value })));
      setLoading(false);
      return;
    }

    setRevenueData(hours);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase.from("visitor_sessions").select("session_id", { count: "exact", head: true }).gte("last_seen_at", fiveMinAgo);
      setStats(prev => ({ ...prev, onlineNow: count || 0 }));
    }, 15000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const periodLabel = useMemo(() => {
    if (!dateRange?.from) return "Selecionar período";
    const from = format(dateRange.from, "dd/MM/yyyy");
    const to = dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : from;
    return from === to ? from : `${from} — ${to}`;
  }, [dateRange]);

  const statCards = [
    { label: "Visitantes agora", value: String(stats.onlineNow), icon: Activity, live: true, color: "text-void-success" },
    { label: "Visitas", value: String(stats.visits), icon: Users, color: "text-accent" },
    { label: "Checkouts", value: String(stats.checkouts), icon: ShoppingCart, color: "text-void-warning" },
    { label: "Vendas pendentes", value: String(stats.pendingOrders), icon: Package2, color: "text-marketplace-orange" },
    { label: "Vendas aprovadas", value: String(stats.paidOrders), icon: CheckCircle2, color: "text-void-success" },
    { label: "Pedidos totais", value: String(stats.totalOrders), icon: Package2, color: "text-muted-foreground" },
    { label: "Receita total", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-muted-foreground" },
    { label: "Receita aprovada", value: formatCurrency(stats.paidRevenue), icon: DollarSign, color: "text-accent" },
    { label: "Conversão", value: `${stats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-primary" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-transparent border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Central de <span className="void-text-gradient">Comando</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da sua loja em tempo real</p>
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-border hover:bg-muted transition-colors">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs">{periodLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Período rápido</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPeriods.map((p) => (
                  <button
                    key={p.label}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      dateRange?.from?.toDateString() === (p.days === 0 ? new Date() : subDays(new Date(), p.days)).toDateString()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      setDateRange({
                        from: p.days === 0 ? new Date() : subDays(new Date(), p.days),
                        to: new Date(),
                      });
                      setFilterOpen(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) setFilterOpen(false);
              }}
              locale={ptBR}
              numberOfMonths={1}
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border/60 bg-card hover:bg-muted/30 transition-colors duration-150">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                {card.live && (
                  <span className="flex items-center gap-1 text-[9px] text-void-success font-semibold bg-void-success/8 px-1.5 py-0.5 rounded-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-void-success opacity-50" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-void-success" />
                    </span>
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <card.icon className={cn("w-4 h-4 shrink-0", card.color)} />
                <p className="text-lg font-semibold text-foreground truncate">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Store Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-void-success/8 flex items-center justify-center">
              <Shield className="w-4 h-4 text-void-success" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Status do Domínio</p>
              <p className="text-sm font-semibold text-void-success mt-0.5">Saudável</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-accent/8 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Pixels</p>
              <p className="text-sm font-semibold text-accent mt-0.5">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Gateway</p>
              <p className="text-sm font-semibold text-primary mt-0.5">Online</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Fluxo de Receita</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{periodLabel}</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 14%)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$ ${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240, 6%, 10%)",
                    border: "1px solid hsl(230, 15%, 16%)",
                    borderRadius: 8,
                    color: "hsl(210, 20%, 92%)",
                    fontSize: 12,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Receita"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(199, 89%, 48%)"
                  strokeWidth={1.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(199, 89%, 48%)", stroke: "hsl(240, 6%, 10%)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
