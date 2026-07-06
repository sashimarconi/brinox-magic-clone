import { formatCurrency, type Product } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { getUrlWithUtm } from "@/utils/utm";

interface StoreCarouselProps {
  title: string;
  products: Product[];
}

const StoreCarousel = ({ title, products }: StoreCarouselProps) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  return (
    <div className="bg-card px-4 py-3 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-[11px] text-muted-foreground">{products.length} produtos</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => navigate(getUrlWithUtm(`/product/${product.id}`))}
            className="flex-shrink-0 w-[42%] max-w-[170px] text-left rounded-lg border border-border overflow-hidden bg-card snap-start"
          >
            <div className="aspect-square overflow-hidden relative">
              <img
                src={product.images[0]?.url || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {product.discountPercent > 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] bg-marketplace-red text-white font-bold px-1.5 py-0.5 rounded">
                  -{product.discountPercent}%
                </span>
              )}
            </div>
            <div className="p-2">
              <p className="text-[11px] text-foreground line-clamp-2 leading-tight min-h-[28px]">
                {product.title}
              </p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-marketplace-red">
                  {formatCurrency(product.salePrice)}
                </span>
                {product.originalPrice > product.salePrice && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {product.soldCount.toLocaleString('pt-BR')} vendidos
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoreCarousel;
