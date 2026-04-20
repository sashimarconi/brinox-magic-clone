import { Routes, Route, Navigate } from "react-router-dom";
import { useDomain } from "@/contexts/DomainContext";
import DomainStorefront from "@/pages/DomainStorefront";
import ProductPage from "@/pages/ProductPage";
import StorePage from "@/pages/StorePage";
import CheckoutPage from "@/pages/CheckoutPage";
import NotFound from "@/pages/NotFound";

/**
 * When accessed via a custom domain, only show public storefront routes.
 * No login, dashboard, admin, or landing page.
 */
const CustomDomainRoutes = () => (
  <Routes>
    {/* Root is intentionally empty (404) — landing lives at /inicio */}
    <Route path="/" element={<NotFound />} />
    <Route path="/inicio" element={<DomainStorefront />} />
    <Route path="/product/:slug" element={<ProductPage />} />
    <Route path="/loja/:slug" element={<StorePage />} />
    <Route path="/checkout/:slug" element={<CheckoutPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default CustomDomainRoutes;
