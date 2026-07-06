import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Search, Share2, ChevronLeft, MessageCircle, Store as StoreIcon, Flame, Sparkles, ArrowUpDown } from "lucide-react";
import { usePageTracking, useVisitorHeartbeat } from "@/hooks/usePageTracking";
import { useUtmifyPixel } from "@/hooks/useUtmifyPixel";
import { fetchStoreBySlug, fetchStoreProducts } from "@/lib/supabase-queries";
import { formatCurrency } from "@/data/mockData";
import { getUrlWithUtm } from "@/utils/utm";
import { toast } from "sonner";

type SortKey = "all" | "hot" | "new" | "price";

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SortKey>("all");
  const [following, setFollowing] = useState(false);
  const [query, setQuery] = useState("");

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => fetchStoreBySlug(slug!),
    enabled: !!slug,
  });

  usePageTracking("page_view", store?.user_id, { surface: "store" });
  useVisitorHeartbeat(store?.user_id);
  useUtmifyPixel(store?.user_id);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["store-products", store?.id],
    queryFn: () => fetchStoreProducts(store!.id),
    enabled: !!store?.id,
  });

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const filtered = query
      ? products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
      : products;
    const arr = [...filtered];
    switch (tab) {
      case "hot":
        return arr.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
      case "new":
        return arr.reverse();
      case "price":
        return arr.sort((a, b) => Number(a.sale_price) - Number(b.sale_price));
      default:
        return arr;
    }
  }, [products, tab, query]);

  const totalSold = useMemo(() => {
    if (!products) return 0;
    return products.reduce((sum, p) => sum + (p.sold_count || 0), 0);
  }, [products]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: store?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  if (storeLoading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const rating = Number(store.rating || 5).toFixed(1);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Cover with gradient + top bar */}
      <div className="relative">
        <div className="h-40 w-full bg-gradient-to-br from-marketplace-red via-marketplace-orange to-marketplace-yellow" />
        <div className="absolute inset-0 h-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_60%)]" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white">
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Store header card */}
      <div className="relative -mt-14 mx-3 rounded-2xl bg-card shadow-lg border border-border/60 px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="relative -mt-8">
            <div className="p-1 rounded-full bg-gradient-to-br from-marketplace-red to-marketplace-orange">
              <img
                src={store.logo_url || "/placeholder.svg"}
                alt={store.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-card bg-card"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-marketplace-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <StoreIcon className="w-2.5 h-2.5" /> LOJA
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-foreground truncate">{store.name}</h1>
              <span className="text-[9px] bg-marketplace-red/10 text-marketplace-red font-bold px-1.5 py-0.5 rounded">
                OFICIAL
              </span>
            </div>
            {store.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{store.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-marketplace-yellow text-marketplace-yellow" />
                <span className="font-semibold text-foreground">{rating}</span>
              </span>
              <span>•</span>
              <span>Resposta rápida</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{products?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Produtos</p>
          </div>
          <div className="text-center border-x border-border/60">
            <p className="text-sm font-bold text-foreground">
              {(Number(store.total_sales) || totalSold).toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground">Vendas</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{rating}</p>
            <p className="text-[10px] text-muted-foreground">Avaliação</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setFollowing((v) => !v)}
            className={`flex-1 h-9 rounded-full text-xs font-bold transition-colors ${
              following
                ? "bg-muted text-foreground"
                : "bg-gradient-to-r from-marketplace-red to-marketplace-orange text-white"
            }`}
          >
            {following ? "Seguindo" : "+ Seguir"}
          </button>
          <button className="h-9 px-4 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </button>
        </div>
      </div>

      {/* Search pill */}
      <div className="px-3 mt-3">
        <div className="flex items-center gap-2 bg-muted rounded-full px-3 h-9">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nesta loja"
            className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur mt-2 border-b border-border/60">
        <div className="flex items-center gap-1 px-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {([
            { key: "all", label: "Tudo", icon: null },
            { key: "hot", label: "Mais vendidos", icon: Flame },
            { key: "new", label: "Novidades", icon: Sparkles },
            { key: "price", label: "Preço", icon: ArrowUpDown },
          ] as { key: SortKey; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex-shrink-0 px-3 py-2.5 text-xs font-semibold flex items-center gap-1 transition-colors ${
                  active ? "text-marketplace-red" : "text-muted-foreground"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-marketplace-red" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products */}
      <div className="px-3 pt-3">
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : !sortedProducts.length ? (
          <div className="py-16 text-center">
            <StoreIcon className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mt-2">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {sortedProducts.map((product, idx) => {
              const isHot = idx < 3 && tab !== "new";
              return (
                <button
                  key={product.id}
                  onClick={() => navigate(getUrlWithUtm(`/product/${product.slug}`))}
                  className="text-left rounded-xl overflow-hidden bg-card border border-border/60 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square overflow-hidden relative bg-muted">
                    <img
                      src={product.product_images?.[0]?.url || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {product.discount_percent > 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[10px] bg-marketplace-red text-white font-bold px-1.5 py-0.5 rounded">
                        -{product.discount_percent}%
                      </span>
                    )}
                    {isHot && (product.sold_count || 0) > 100 && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] bg-black/60 backdrop-blur text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-marketplace-orange" /> HOT
                      </span>
                    )}
                    {product.free_shipping && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-white/90 text-marketplace-red font-bold px-1.5 py-0.5 rounded">
                        FRETE GRÁTIS
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-foreground line-clamp-2 leading-tight min-h-[28px]">
                      {product.title}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[10px] text-marketplace-red font-bold">R$</span>
                      <span className="text-base font-extrabold text-marketplace-red leading-none">
                        {Number(product.sale_price).toFixed(2).replace(".", ",")}
                      </span>
                      {Number(product.original_price) > Number(product.sale_price) && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatCurrency(Number(product.original_price))}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="w-2.5 h-2.5 fill-marketplace-yellow text-marketplace-yellow" />
                        {Number(product.rating || 5).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(product.sold_count || 0).toLocaleString("pt-BR")} vendidos
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;
