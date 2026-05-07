import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Clock3, CopyCheck, Download, Eye, Filter, Package2, RefreshCw, Search, Wallet, X } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatCurrency, formatDateTime, getDisplayVariantLabel, getEffectiveStatus, getShortOrderId, orderDateOptions, orderStatusOptions } from "./order-utils";
import type { AdminOrderRecord, DateFilter, DateRange, OrderStats, StatusFilter } from "./types";

interface OrdersListViewProps {
  orders: AdminOrderRecord[];
  filteredOrders: AdminOrderRecord[];
  loading: boolean;
  search: string;
  statusFilter: StatusFilter;
  dateFilter: DateFilter;
  dateRange: DateRange;
  stats: OrderStats;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onDateRangeChange: (value: DateRange) => void;
  onRefresh: () => void;
  onSelectOrder: (id: string) => void;
}

type ExportStatus = "all" | "paid" | "pending";

const csvEscape = (value: any) => {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

const downloadCsv = (filename: string, rows: AdminOrderRecord[]) => {
  const headers = [
    "ID", "Data", "Status", "Nome", "Email", "Telefone", "Documento",
    "CEP", "Endereço", "Número", "Complemento", "Bairro", "Cidade", "UF",
    "Produto", "Variante", "Quantidade", "Total", "Método", "Transação", "PIX copiado",
  ];
  const lines = [headers.join(",")];
  for (const o of rows) {
    lines.push([
      o.id,
      o.created_at,
      getEffectiveStatus(o),
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.customer_document,
      o.customer_cep,
      o.customer_address,
      o.customer_number,
      o.customer_complement,
      o.customer_neighborhood,
      o.customer_city,
      o.customer_state,
      o.product?.title,
      o.variant_name || o.product_variant,
      o.quantity,
      o.total,
      o.payment_method,
      o.transaction_id,
      o.pix_copied ? "sim" : "não",
    ].map(csvEscape).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const OrdersListView = ({
  orders,
  filteredOrders,
  loading,
  search,
  statusFilter,
  dateFilter,
  dateRange,
  stats,
  onSearchChange,
  onStatusFilterChange,
  onDateFilterChange,
  onDateRangeChange,
  onRefresh,
  onSelectOrder,
}: OrdersListViewProps) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("all");
  const [exportRange, setExportRange] = useState<DateRange>({});

  const statCards = [
    { label: "Pedidos totais", value: stats.total, icon: Package2, tone: "text-muted-foreground" },
    { label: "Pagos", value: stats.paid, icon: Wallet, tone: "text-void-success" },
    { label: "Pendentes", value: stats.pending, icon: Clock3, tone: "text-void-warning" },
    { label: "Pix copiado", value: stats.copied, icon: CopyCheck, tone: "text-accent" },
  ];

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0);

  const dateButtonLabel = () => {
    if (dateFilter === "custom" && (dateRange.from || dateRange.to)) {
      const f = dateRange.from ? format(dateRange.from, "dd/MM/yy") : "...";
      const t = dateRange.to ? format(dateRange.to, "dd/MM/yy") : "...";
      return `${f} → ${t}`;
    }
    return null;
  };

  const handleExport = () => {
    const rows = orders.filter((o) => {
      const st = getEffectiveStatus(o);
      if (exportStatus === "paid" && st !== "paid") return false;
      if (exportStatus === "pending" && st !== "pending") return false;
      const created = new Date(o.created_at);
      if (exportRange.from) {
        const f = new Date(exportRange.from.getFullYear(), exportRange.from.getMonth(), exportRange.from.getDate(), 0, 0, 0);
        if (created < f) return false;
      }
      if (exportRange.to) {
        const t = new Date(exportRange.to.getFullYear(), exportRange.to.getMonth(), exportRange.to.getDate(), 23, 59, 59, 999);
        if (created > t) return false;
      }
      return true;
    });
    if (rows.length === 0) {
      return;
    }
    const today = format(new Date(), "yyyy-MM-dd");
    downloadCsv(`leads_${exportStatus}_${today}.csv`, rows);
    setExportOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Vendas</p>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Pedidos</h1>
                <p className="text-sm text-muted-foreground">Gerencie pedidos pagos, pendentes e os cliques no botão de copiar PIX.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Popover open={exportOpen} onOpenChange={setExportOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar leads
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4" align="end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { v: "all", l: "Ambos" },
                        { v: "paid", l: "Pagos" },
                        { v: "pending", l: "Pendentes" },
                      ] as Array<{ v: ExportStatus; l: string }>).map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setExportStatus(opt.v)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            exportStatus === opt.v
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Período (opcional)</p>
                    <Calendar
                      mode="range"
                      selected={exportRange as any}
                      onSelect={(r: any) => setExportRange(r || {})}
                      locale={ptBR}
                      className={cn("p-0 pointer-events-auto")}
                    />
                    {(exportRange.from || exportRange.to) && (
                      <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground" onClick={() => setExportRange({})}>
                        Limpar período
                      </Button>
                    )}
                  </div>
                  <Button onClick={handleExport} className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Baixar CSV
                  </Button>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground truncate">{card.label}</p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold text-foreground">{card.value}</p>
                  </div>
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm">
                    <card.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", card.tone)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border">
        <CardContent className="space-y-4 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div className="relative flex-1 xl:max-w-md">
                <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar..."
                  className="h-10 sm:h-11 rounded-2xl border-border bg-background pl-9 sm:pl-11 text-sm"
                />
              </div>

              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 relative shrink-0">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtrar</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {orderStatusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onStatusFilterChange(option.value)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                              statusFilter === option.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Período</p>
                      <div className="flex flex-wrap gap-2">
                        {orderDateOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              onDateFilterChange(option.value);
                              if (option.value !== "custom") onDateRangeChange({});
                            }}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                              dateFilter === option.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Período personalizado
                        {dateButtonLabel() && <span className="ml-2 normal-case tracking-normal text-foreground">{dateButtonLabel()}</span>}
                      </p>
                      <Calendar
                        mode="range"
                        selected={dateRange as any}
                        onSelect={(r: any) => {
                          onDateRangeChange(r || {});
                          onDateFilterChange("custom");
                        }}
                        locale={ptBR}
                        className={cn("p-0 pointer-events-auto")}
                      />
                    </div>

                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => {
                          onStatusFilterChange("all");
                          onDateFilterChange("all");
                          onDateRangeChange({});
                        }}
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              {filteredOrders.length} de {orders.length} pedidos
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-20 text-center text-sm text-muted-foreground">
              Carregando pedidos...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-20 text-center text-sm text-muted-foreground">
              Nenhum pedido encontrado com os filtros atuais.
            </div>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 md:hidden">
                {filteredOrders.map((order) => {
                  const variantLabel = getDisplayVariantLabel(order);
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-border bg-background p-4 space-y-3 cursor-pointer active:bg-muted/50 transition-colors"
                      onClick={() => onSelectOrder(order.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.customer_email}</p>
                        </div>
                        <OrderStatusBadge order={order} />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {order.product?.title || "Produto removido"}
                            {variantLabel ? ` · ${variantLabel}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(order.total)}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getShortOrderId(order.id)}</span>
                        <div className="flex items-center gap-2">
                          {order.pix_copied ? (
                            <span className="flex items-center gap-1 text-marketplace-green">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PIX copiado
                            </span>
                          ) : null}
                          <span>{formatDateTime(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table layout */}
              <div className="rounded-2xl border border-border bg-background overflow-x-auto hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">ID</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">Cliente</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">Produto</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">Data</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">Total</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">Status</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-[0.18em]">Pix copiado</TableHead>
                      <TableHead className="text-right text-[11px] uppercase tracking-[0.18em]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const variantLabel = getDisplayVariantLabel(order);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="whitespace-nowrap font-semibold text-foreground">{getShortOrderId(order.id)}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">{order.product?.title || "Produto removido"}</p>
                              {variantLabel ? <p className="text-xs text-muted-foreground">Variante: {variantLabel}</p> : null}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(order.created_at)}</TableCell>
                          <TableCell className="whitespace-nowrap font-semibold text-foreground">{formatCurrency(order.total)}</TableCell>
                          <TableCell><OrderStatusBadge order={order} /></TableCell>
                          <TableCell className="text-center">
                            {order.pix_copied ? (
                              <CheckCircle2 className="h-5 w-5 text-marketplace-green inline-block" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/40 inline-block" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => onSelectOrder(order.id)} className="gap-2">
                              <Eye className="h-4 w-4" />Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
