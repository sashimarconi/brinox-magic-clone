import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Star, ShieldCheck, LogOut, Menu, CreditCard, Truck, Tag,
  BarChart3, LayoutDashboard, ClipboardList, Store, PenTool, Radio,
  ChevronLeft, ExternalLink, ShoppingCart, Webhook, Bell, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import SaleNotification from "@/components/admin/SaleNotification";
import PushNotificationToggle from "@/components/admin/PushNotificationToggle";

const navSections = [
  {
    title: "Central de Comando",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { label: "Live View", path: "/admin/live-view", icon: Radio },
      { label: "Análises", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Vendas",
    items: [
      { label: "Pedidos", path: "/admin/orders", icon: ClipboardList },
      { label: "Carrinhos Abandonados", path: "/admin/abandoned-carts", icon: ShoppingCart },
    ],
  },
  {
    title: "Construtor de Loja",
    items: [
      { label: "Produtos", path: "/admin/products", icon: Package },
      { label: "Editor de Produto", path: "/admin/product-builder", icon: PenTool },
      { label: "Avaliações", path: "/admin/reviews", icon: Star },
      { label: "Badges", path: "/admin/badges", icon: ShieldCheck },
      { label: "Lojas", path: "/admin/stores", icon: Store },
    ],
  },
  {
    title: "Checkout",
    items: [
      { label: "Builder", path: "/admin/checkout-builder", icon: PenTool },
      { label: "Gateways", path: "/admin/gateways", icon: CreditCard },
      { label: "Fretes", path: "/admin/shipping", icon: Truck },
      { label: "Order Bumps", path: "/admin/order-bumps", icon: Tag },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Pixels", path: "/admin/pixels", icon: Zap },
      { label: "Webhooks", path: "/admin/webhooks", icon: Webhook },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Notificações", path: "/admin/notifications", icon: Bell },
    ],
  },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Force dark mode for VoidTok admin
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    localStorage.setItem("admin-theme", "dark");
    return () => {
      root.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/admin/login");
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/admin/login");
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-void-cyan" />
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-void-purple to-void-cyan flex items-center justify-center void-glow-purple-sm group-hover:void-glow-purple transition-shadow">
            <span className="text-white font-display font-black text-sm">V</span>
          </div>
          {sidebarOpen && (
            <span className="font-display font-black text-lg tracking-tight">
              <span className="text-foreground">Void</span>
              <span className="text-void-cyan">Tok</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex text-muted-foreground hover:text-void-cyan transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navSections.map((section) => (
          <div key={section.title}>
            {sidebarOpen && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.path)
                      ? "bg-void-purple/15 text-void-cyan border border-void-purple/30 void-glow-purple-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 shrink-0 transition-all duration-200",
                    isActive(item.path) ? "text-void-cyan" : "group-hover:text-void-cyan"
                  )} />
                  {sidebarOpen && <span>{item.label}</span>}
                  {item.label === "Live View" && sidebarOpen && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-void-cyan opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-void-cyan" />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-void-cyan hover:bg-muted transition-colors group"
        >
          <ExternalLink className="w-4 h-4 shrink-0 group-hover:text-void-cyan" />
          {sidebarOpen && <span>Ver Loja</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-void-danger hover:bg-void-danger/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen void-gradient-bg flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-0 left-0 h-screen bg-card/80 backdrop-blur-xl border-r border-border z-50 transition-all duration-300",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        <SidebarNav />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-56 bg-card border-r border-border z-50 transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNav />
      </aside>

      {/* Main content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "md:ml-56" : "md:ml-16")}>
        <header className="sticky top-0 z-30 h-14 bg-card/60 backdrop-blur-xl border-b border-border flex items-center px-4 gap-3">
          <button className="md:hidden text-muted-foreground hover:text-void-cyan" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <PushNotificationToggle />
            {/* User avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-void-purple to-void-cyan flex items-center justify-center void-glow-purple-sm">
              <span className="text-white text-xs font-display font-bold">VT</span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <SaleNotification />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
