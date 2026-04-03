import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import ProductPage from "./pages/ProductPage";
import StorePage from "./pages/StorePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from "./components/admin/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminGateways from "./pages/admin/AdminGateways";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminOrderBumps from "./pages/admin/AdminOrderBumps";
import CheckoutPage from "./pages/CheckoutPage";
import AdminCheckoutBuilder from "./pages/admin/AdminCheckoutBuilder";
import AdminProductBuilder from "./pages/admin/AdminProductBuilder";
import AdminPixels from "./pages/admin/AdminPixels";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminStores from "./pages/admin/AdminStores";
import AdminLiveView from "./pages/admin/AdminLiveView";
import AdminAbandonedCarts from "./pages/admin/AdminAbandonedCarts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPlans from "./pages/admin/AdminPlans";
import SaasAdminLayout from "./components/admin/SaasAdminLayout";
import SaasMetrics from "./pages/admin/SaasMetrics";
import SaasUsers from "./pages/admin/SaasUsers";
import SaasAnalytics from "./pages/admin/SaasAnalytics";
import SaasOrders from "./pages/admin/SaasOrders";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";
import AdminDomains from "./pages/admin/AdminDomains";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<Index />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/loja/:slug" element={<StorePage />} />
          <Route path="/checkout/:slug" element={<CheckoutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* SaaS Owner Admin */}
          <Route path="/admin" element={<SaasAdminLayout />}>
            <Route index element={<SaasMetrics />} />
            <Route path="analytics" element={<SaasAnalytics />} />
            <Route path="orders" element={<SaasOrders />} />
            <Route path="users" element={<SaasUsers />} />
            <Route path="platform" element={<AdminPlatformSettings />} />
          </Route>
          {/* User Dashboard */}
          <Route path="/dashboard" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="live-view" element={<AdminLiveView />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="gateways" element={<AdminGateways />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="order-bumps" element={<AdminOrderBumps />} />
            <Route path="checkout-builder" element={<AdminCheckoutBuilder />} />
            <Route path="product-builder" element={<AdminProductBuilder />} />
            <Route path="pixels" element={<AdminPixels />} />
            <Route path="webhooks" element={<AdminWebhooks />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="stores" element={<AdminStores />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="domains" element={<AdminDomains />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
