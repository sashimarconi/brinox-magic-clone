import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface SaasOrder {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_title: string | null;
  product_variant: string | null;
  quantity: number;
  total: number;
  payment_status: string;
  payment_method: string;
  pix_copied: boolean | null;
  created_at: string;
  owner_email: string | null;
}

const statusMap: Record<string, { label: string; className: string }> = {
  paid: { label: "Aprovado", className: "bg-void-success/20 text-void-success border-void-success/30" },
  pending: { label: "Pendente", className: "bg-void-warning/20 text-void-warning border-void-warning/30" },
  refused: { label: "Recusado", className: "bg-void-danger/20 text-void-danger border-void-danger/30" },
  refunded: { label: "Reembolsado", className: "bg-void-purple/20 text-void-purple border-void-purple/30" },
};

const SaasOrders = () => {
  const [orders, setOrders] = useState<SaasOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_orders", {
      _limit: limit,
      _offset: page * limit,
      _status: statusFilter === "all" ? null : statusFilter,
    });

    if (!error && data) {
      setOrders(data as unknown as SaasOrder[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const filtered = orders.filter((o) =>
    (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.product_title || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.owner_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Todos os Pedidos</h1>
        <p className="text-muted-foreground text-sm">Pedidos de todos os usuários da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, produto ou dono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Aprovado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="refused">Recusado</SelectItem>
            <SelectItem value="refunded">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-4 h-4 text-void-cyan" />
            Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-void-cyan" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PIX Copiado</TableHead>
                  <TableHead>Dono</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const st = statusMap[order.payment_status] || { label: order.payment_status, className: "" };
                  return (
                    <TableRow key={order.order_id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{order.product_title || "—"}</p>
                          {order.product_variant && (
                            <p className="text-xs text-muted-foreground">{order.product_variant}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        R$ {Number(order.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st.className}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {order.payment_method === "pix" ? (
                          <Badge variant="outline" className={order.pix_copied ? "bg-void-success/20 text-void-success border-void-success/30" : "bg-muted text-muted-foreground"}>
                            {order.pix_copied ? "Sim" : "Não"}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.owner_email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum pedido encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page + 1} · {filtered.length} resultado(s)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={orders.length < limit} onClick={() => setPage(page + 1)}>
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaasOrders;
