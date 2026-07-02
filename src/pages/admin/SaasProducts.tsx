import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import { format } from "date-fns";

interface AdminProduct {
  product_id: string;
  title: string;
  slug: string;
  sale_price: number;
  original_price: number;
  active: boolean;
  created_at: string;
  thumbnail_url: string | null;
  owner_user_id: string;
  owner_email: string;
  owner_full_name: string | null;
  total_orders: number;
  total_paid_orders: number;
  total_revenue: number;
}

const brl = (n: number) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SaasProducts = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc("admin_list_all_products", {
        _limit: 500,
        _offset: 0,
        _search: search || null,
      });
      if (!error && data) setProducts(data as AdminProduct[]);
      setLoading(false);
    };
    const t = setTimeout(fetchProducts, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Todos os Produtos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {products.length} produto(s) cadastrado(s) na plataforma
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou email do dono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Package className="w-4 h-4 text-accent" />
            Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-accent" />
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="space-y-3 p-3 md:hidden">
                {products.map((p) => (
                  <div key={p.product_id} className="rounded-2xl border border-border bg-background p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <Link to={`/admin/users/${p.owner_user_id}`} className="text-[11px] text-muted-foreground hover:text-accent truncate block">
                          {p.owner_email}
                        </Link>
                      </div>
                      <Badge variant="outline" className={p.active
                        ? "text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "text-[9px] bg-muted text-muted-foreground border-border"}>
                        {p.active ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center rounded-lg border border-border/50 bg-muted/20 p-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Preço</p>
                        <p className="text-[11px] font-semibold">{brl(p.sale_price)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Vendas</p>
                        <p className="text-[11px] font-semibold text-emerald-400">{brl(p.total_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Pagos</p>
                        <p className="text-[11px] font-semibold">{p.total_paid_orders}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="text-center text-muted-foreground py-12 text-sm">Nenhum produto encontrado.</p>
                )}
              </div>

              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Produto</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Dono</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium text-right">Preço</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium text-right">Vendas</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium text-right">Pagos</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium text-right">Total pedidos</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Criado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.product_id} className="border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {p.thumbnail_url ? (
                              <img src={p.thumbnail_url} alt={p.title} className="w-9 h-9 rounded-md object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-sm font-medium truncate max-w-[240px]">{p.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/users/${p.owner_user_id}`} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                            {p.owner_email}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={p.active
                            ? "text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "text-[10px] bg-muted text-muted-foreground border-border"}>
                            {p.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{brl(p.sale_price)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-emerald-400 tabular-nums">
                          {brl(p.total_revenue)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{p.total_paid_orders}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{p.total_orders}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(p.created_at), "dd/MM/yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12 text-sm">
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    )}
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

export default SaasProducts;
