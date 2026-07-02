import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Wallet, Plus, Trash2, Target, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ---------- helpers ----------
const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));
const fmtPct = (n: number) => `${(Number(n || 0)).toFixed(1)}%`;
const toLocalISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const CATEGORY_LABELS: Record<string, string> = {
  marketing_facebook: "Marketing • Facebook",
  marketing_tiktok: "Marketing • TikTok",
  marketing_google: "Marketing • Google",
  taxes: "Impostos",
  other_expense: "Outras despesas",
  extra_revenue: "Receita extra",
};
const CATEGORY_COLORS: Record<string, string> = {
  marketing_facebook: "#1877F2",
  marketing_tiktok: "#ff2d55",
  marketing_google: "#fbbc04",
  taxes: "#a78bfa",
  other_expense: "#94a3b8",
  extra_revenue: "#22c55e",
};

// ---------- period selector ----------
type Preset = "today" | "7d" | "30d" | "this_month" | "last_month" | "custom";
const usePeriod = () => {
  const [preset, setPreset] = useState<Preset>("30d");
  const [customStart, setCustomStart] = useState<string>(toLocalISODate(new Date()));
  const [customEnd, setCustomEnd] = useState<string>(toLocalISODate(new Date()));

  const range = useMemo(() => {
    const today = new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (preset === "today") return { start: toLocalISODate(t), end: toLocalISODate(t) };
    if (preset === "7d") {
      const s = new Date(t); s.setDate(s.getDate() - 6);
      return { start: toLocalISODate(s), end: toLocalISODate(t) };
    }
    if (preset === "30d") {
      const s = new Date(t); s.setDate(s.getDate() - 29);
      return { start: toLocalISODate(s), end: toLocalISODate(t) };
    }
    if (preset === "this_month") {
      return { start: toLocalISODate(startOfMonth(t)), end: toLocalISODate(endOfMonth(t)) };
    }
    if (preset === "last_month") {
      const prev = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      return { start: toLocalISODate(startOfMonth(prev)), end: toLocalISODate(endOfMonth(prev)) };
    }
    return { start: customStart, end: customEnd };
  }, [preset, customStart, customEnd]);

  return { preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, range };
};

// ---------- main ----------
export default function AdminFinancial() {
  const period = usePeriod();
  const qc = useQueryClient();

  const summaryQ = useQuery({
    queryKey: ["fin-summary", period.range.start, period.range.end],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("user_financial_summary", {
        _start: period.range.start, _end: period.range.end,
      });
      if (error) throw error;
      return data as any;
    },
  });

  const dailyQ = useQuery({
    queryKey: ["fin-daily", period.range.start, period.range.end],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("user_financial_daily", {
        _start: period.range.start, _end: period.range.end,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const rankQ = useQuery({
    queryKey: ["fin-rank", period.range.start, period.range.end],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("user_product_profit_ranking", {
        _start: period.range.start, _end: period.range.end,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const summary = summaryQ.data || {};
  const netProfit = Number(summary.net_profit || 0);
  const positive = netProfit >= 0;

  const pieData = useMemo(() => {
    const cat = summary.expenses_by_category || {};
    return Object.keys(cat)
      .filter((k) => k !== "extra_revenue")
      .map((k) => ({ name: CATEGORY_LABELS[k] || k, value: Number(cat[k] || 0), key: k }))
      .filter((d) => d.value > 0);
  }, [summary]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["fin-summary"] });
    qc.invalidateQueries({ queryKey: ["fin-daily"] });
    qc.invalidateQueries({ queryKey: ["fin-rank"] });
    qc.invalidateQueries({ queryKey: ["fin-month-summary"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["financial-goals"] });
    qc.invalidateQueries({ queryKey: ["product-costs"] });
    qc.invalidateQueries({ queryKey: ["gateway-settings-fin"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel Financeiro</h1>
            <p className="text-sm text-muted-foreground">Analise receita, custos, despesas e lucro real.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period.preset} onValueChange={(v) => period.setPreset(v as Preset)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="this_month">Este mês</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {period.preset === "custom" && (
            <>
              <Input type="date" className="w-[150px]" value={period.customStart}
                max={period.customEnd}
                onChange={(e) => period.setCustomStart(e.target.value)} />
              <Input type="date" className="w-[150px]" value={period.customEnd}
                min={period.customStart}
                onChange={(e) => period.setCustomEnd(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <Card className={`p-6 border ${positive ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {positive ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                  Lucro líquido do período
                </div>
                <div className={`text-4xl md:text-5xl font-bold mt-2 ${positive ? "text-emerald-500" : "text-red-500"}`}>
                  {fmtBRL(netProfit)}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={positive ? "default" : "destructive"}>
                    Margem {fmtPct(summary.margin_pct || 0)}
                  </Badge>
                  <Badge variant="secondary">
                    {Number(summary.total_orders_paid || 0)} pedidos pagos
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Kpi label="Receita bruta" value={fmtBRL(summary.gross_revenue || 0)} />
            <Kpi label="Custos de produto" value={fmtBRL(summary.product_costs_total || 0)} />
            <Kpi label="Taxas de gateway" value={fmtBRL(summary.gateway_fees_total || 0)} />
            <Kpi label="Despesas" value={fmtBRL(summary.expenses_total || 0)} />
            <Kpi label="Ticket médio" value={fmtBRL(summary.avg_ticket || 0)} />
            <Kpi label="ROI" value={fmtPct(summary.roi || 0)} />
            <Kpi label="CPA" value={fmtBRL(summary.cpa || 0)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-3">Evolução diária</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyQ.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tickFormatter={(d) => d?.slice(5)} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${Math.round(v)}`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(v: any) => fmtBRL(Number(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" name="Receita" stroke="#22c55e" fill="#22c55e33" />
                    <Area type="monotone" dataKey="costs_and_fees" name="Custos+Taxas" stroke="#f59e0b" fill="#f59e0b33" />
                    <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" fill="#ef444433" />
                    <Area type="monotone" dataKey="net_profit" name="Lucro" stroke="#3b82f6" fill="#3b82f633" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Despesas por categoria</h3>
              <div className="h-[300px]">
                {pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Sem despesas no período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                        {pieData.map((d) => (
                          <Cell key={d.key} fill={CATEGORY_COLORS[d.key] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmtBRL(Number(v))}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Ranking de produtos por lucro</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Taxas</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rankQ.data || []).map((r: any) => (
                    <TableRow key={r.product_id}>
                      <TableCell className="max-w-[220px] truncate">{r.title}</TableCell>
                      <TableCell className="text-right">{r.units_sold}</TableCell>
                      <TableCell className="text-right">{fmtBRL(r.revenue)}</TableCell>
                      <TableCell className="text-right">{fmtBRL(r.product_cost)}</TableCell>
                      <TableCell className="text-right">{fmtBRL(r.gateway_fees)}</TableCell>
                      <TableCell className={`text-right font-semibold ${Number(r.profit) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {fmtBRL(r.profit)}
                      </TableCell>
                      <TableCell className="text-right">{fmtPct(r.margin_pct)}</TableCell>
                    </TableRow>
                  ))}
                  {(!rankQ.data || rankQ.data.length === 0) && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Sem dados no período.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* COSTS */}
        <TabsContent value="costs">
          <CostsTab onChanged={invalidateAll} />
        </TabsContent>

        {/* GATEWAYS */}
        <TabsContent value="gateways">
          <GatewaysTab onChanged={invalidateAll} />
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses">
          <ExpensesTab range={period.range} onChanged={invalidateAll} />
        </TabsContent>

        {/* GOALS */}
        <TabsContent value="goals">
          <GoalsTab onChanged={invalidateAll} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- KPI ----------
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </Card>
  );
}

// ---------- Costs Tab ----------
function CostsTab({ onChanged }: { onChanged: () => void }) {
  const productsQ = useQuery({
    queryKey: ["product-costs"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      const [{ data: prods }, { data: costs }] = await Promise.all([
        supabase.from("products").select("id, title").eq("user_id", uid as any).order("title"),
        (supabase as any).from("product_costs").select("*").eq("user_id", uid),
      ]);
      const map: Record<string, number> = {};
      (costs || []).forEach((c: any) => { map[c.product_id] = Number(c.unit_cost || 0); });
      return (prods || []).map((p: any) => ({ ...p, unit_cost: map[p.id] ?? 0 }));
    },
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (productsQ.data) {
      const d: Record<string, string> = {};
      productsQ.data.forEach((p: any) => { d[p.id] = String(p.unit_cost ?? 0); });
      setDrafts(d);
    }
  }, [productsQ.data]);

  const save = async (product_id: string) => {
    const value = Number((drafts[product_id] || "0").replace(",", "."));
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) return;
    const { error } = await (supabase as any)
      .from("product_costs")
      .upsert({ user_id: uid, product_id, unit_cost: value }, { onConflict: "user_id,product_id" });
    if (error) { toast.error("Erro ao salvar custo"); return; }
    toast.success("Custo atualizado");
    onChanged();
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">Custo unitário por produto</h3>
      <div className="space-y-2">
        {(productsQ.data || []).map((p: any) => (
          <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-lg border border-border/60 bg-card/50">
            <div className="flex-1 truncate">{p.title}</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                className="w-[140px]"
                value={drafts[p.id] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [p.id]: e.target.value })}
              />
              <Button size="sm" onClick={() => save(p.id)}>Salvar</Button>
            </div>
          </div>
        ))}
        {(!productsQ.data || productsQ.data.length === 0) && (
          <div className="text-sm text-muted-foreground">Nenhum produto cadastrado.</div>
        )}
      </div>
    </Card>
  );
}

// ---------- Gateways Tab ----------
function GatewaysTab({ onChanged }: { onChanged: () => void }) {
  const q = useQuery({
    queryKey: ["gateway-settings-fin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gateway_settings").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (q.data) {
      const d: Record<string, string> = {};
      q.data.forEach((g: any) => { d[g.id] = String(g.fee_percent ?? 0); });
      setDrafts(d);
    }
  }, [q.data]);

  const save = async (id: string) => {
    const v = Number((drafts[id] || "0").replace(",", "."));
    const { error } = await (supabase as any).from("gateway_settings").update({ fee_percent: v }).eq("id", id);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Taxa atualizada");
    onChanged();
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">Taxa (%) por gateway</h3>
      <div className="space-y-2">
        {(q.data || []).map((g: any) => (
          <div key={g.id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-lg border border-border/60 bg-card/50">
            <div className="flex-1">
              <div className="font-medium">{g.display_name || g.gateway_name}</div>
              <div className="text-xs text-muted-foreground">{g.gateway_name}</div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                className="w-[120px]"
                value={drafts[g.id] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [g.id]: e.target.value })}
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button size="sm" onClick={() => save(g.id)}>Salvar</Button>
            </div>
          </div>
        ))}
        {(!q.data || q.data.length === 0) && (
          <div className="text-sm text-muted-foreground">Nenhum gateway configurado.</div>
        )}
      </div>
    </Card>
  );
}

// ---------- Expenses Tab ----------
function ExpensesTab({ range, onChanged }: { range: { start: string; end: string }; onChanged: () => void }) {
  const q = useQuery({
    queryKey: ["expenses", range.start, range.end],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("expenses")
        .select("*")
        .gte("date", range.start)
        .lte("date", range.end)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    date: toLocalISODate(new Date()),
    category: "marketing_facebook",
    description: "",
    amount: "",
    is_recurring: false,
    recurring_day: new Date().getDate(),
  });

  const submit = async () => {
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) return;
    const payload: any = {
      user_id: uid,
      date: form.date,
      category: form.category,
      description: form.description || null,
      amount: Number(String(form.amount).replace(",", ".")) || 0,
      is_recurring: !!form.is_recurring,
      recurring_day: form.is_recurring ? Number(form.recurring_day) : null,
    };
    const { error } = await (supabase as any).from("expenses").insert(payload);
    if (error) { toast.error("Erro ao adicionar despesa"); return; }
    toast.success("Despesa adicionada");
    setOpen(false);
    setForm({ ...form, description: "", amount: "" });
    onChanged();
  };

  const del = async (id: string) => {
    const { error } = await (supabase as any).from("expenses").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluída");
    onChanged();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Despesas do período</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova despesa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CATEGORY_LABELS).map((k) => (
                        <SelectItem key={k} value={k}>{CATEGORY_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                <div>
                  <div className="text-sm font-medium">Recorrente mensal</div>
                  <div className="text-xs text-muted-foreground">Gera cópias todo mês no dia escolhido</div>
                </div>
                <Switch checked={form.is_recurring} onCheckedChange={(v) => setForm({ ...form, is_recurring: v })} />
              </div>
              {form.is_recurring && (
                <div>
                  <Label>Dia do mês</Label>
                  <Input type="number" min={1} max={31} value={form.recurring_day} onChange={(e) => setForm({ ...form, recurring_day: e.target.value })} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Recorrente</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data || []).map((e: any) => (
              <TableRow key={e.id}>
                <TableCell>{e.date}</TableCell>
                <TableCell>
                  <Badge variant="secondary" style={{ background: `${CATEGORY_COLORS[e.category] || "#94a3b8"}22`, color: CATEGORY_COLORS[e.category] || undefined }}>
                    {CATEGORY_LABELS[e.category] || e.category}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">{e.description || "—"}</TableCell>
                <TableCell className={`text-right font-medium ${e.category === "extra_revenue" ? "text-emerald-500" : ""}`}>
                  {fmtBRL(e.amount)}
                </TableCell>
                <TableCell>
                  {e.is_recurring ? <Badge>Mensal (dia {e.recurring_day})</Badge> : e.recurring_parent_id ? <Badge variant="outline">Gerada</Badge> : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => del(e.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!q.data || q.data.length === 0) && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Sem despesas no período.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// ---------- Goals Tab ----------
function GoalsTab({ onChanged }: { onChanged: () => void }) {
  const today = new Date();
  const monthStart = toLocalISODate(startOfMonth(today));
  const monthEnd = toLocalISODate(endOfMonth(today));

  const goalQ = useQuery({
    queryKey: ["financial-goals", monthStart],
    queryFn: async () => {
      const { data } = await (supabase as any).from("financial_goals").select("*").eq("month", monthStart).maybeSingle();
      return data as any;
    },
  });

  const monthSummaryQ = useQuery({
    queryKey: ["fin-month-summary", monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("user_financial_summary", { _start: monthStart, _end: monthEnd });
      if (error) throw error;
      return data as any;
    },
  });

  const [rev, setRev] = useState("");
  const [profit, setProfit] = useState("");
  useEffect(() => {
    if (goalQ.data) {
      setRev(String(goalQ.data.revenue_goal ?? ""));
      setProfit(String(goalQ.data.profit_goal ?? ""));
    }
  }, [goalQ.data]);

  const save = async () => {
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) return;
    const payload = {
      user_id: uid,
      month: monthStart,
      revenue_goal: Number(String(rev).replace(",", ".")) || 0,
      profit_goal: Number(String(profit).replace(",", ".")) || 0,
    };
    const { error } = await (supabase as any).from("financial_goals").upsert(payload, { onConflict: "user_id,month" });
    if (error) { toast.error("Erro ao salvar meta"); return; }
    toast.success("Metas salvas");
    onChanged();
  };

  const s = monthSummaryQ.data || {};
  const revActual = Number(s.gross_revenue || 0);
  const profitActual = Number(s.net_profit || 0);
  const revGoal = Number(goalQ.data?.revenue_goal || 0);
  const profitGoal = Number(goalQ.data?.profit_goal || 0);
  const revPct = revGoal > 0 ? Math.min(100, (revActual / revGoal) * 100) : 0;
  const profitPct = profitGoal > 0 ? Math.min(100, (profitActual / profitGoal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Metas do mês</h3>
        </div>
        <div>
          <Label>Meta de receita (R$)</Label>
          <Input type="number" step="0.01" value={rev} onChange={(e) => setRev(e.target.value)} />
        </div>
        <div>
          <Label>Meta de lucro (R$)</Label>
          <Input type="number" step="0.01" value={profit} onChange={(e) => setProfit(e.target.value)} />
        </div>
        <Button onClick={save}>Salvar metas</Button>
      </Card>

      <Card className="p-4 space-y-5">
        <h3 className="text-sm font-semibold">Progresso do mês</h3>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Receita</span>
            <span className="text-muted-foreground">{fmtBRL(revActual)} / {fmtBRL(revGoal)}</span>
          </div>
          <Progress value={revPct} />
          <div className="text-xs text-muted-foreground mt-1">{fmtPct(revPct)}</div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Lucro</span>
            <span className="text-muted-foreground">{fmtBRL(profitActual)} / {fmtBRL(profitGoal)}</span>
          </div>
          <Progress value={profitPct} />
          <div className="text-xs text-muted-foreground mt-1">{fmtPct(profitPct)}</div>
        </div>
      </Card>
    </div>
  );
}
