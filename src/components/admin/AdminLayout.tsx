import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Star, ShieldCheck, LogOut, Menu, CreditCard, Truck, Tag,
  BarChart3, LayoutDashboard, ClipboardList, Store, PenTool, Radio,
  ChevronLeft, ExternalLink, ShoppingCart, Webhook, Bell, Zap, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import SaleNotification from "@/components/admin/SaleNotification";
import PushNotificationToggle from "@/components/admin/PushNotificationToggle";

const navSections = [
  {
    title: "Central de Comando",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Live View", path: "/dashboard/live-view", icon: Radio },
      { label: "Análises", path: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Vendas",
    items: [
      { label: "Pedidos", path: "/dashboard/orders", icon: ClipboardList },
      { label: "Carrinhos Abandonados", path: "/dashboard/abandoned-carts", icon: ShoppingCart },
    ],
  },
  {
    title: "Construtor de Loja",
    items: [
      { label: "Produtos", path: "/dashboard/products", icon: Package },
      { label: "Editor de Produto", path: "/dashboard/product-builder", icon: PenTool },
      { label: "Avaliações", path: "/dashboard/reviews", icon: Star },
      { label: "Badges", path: "/dashboard/badges", icon: ShieldCheck },
      { label: "Lojas", path: "/dashboard/stores", icon: Store },
    ],
  },
  {
    title: "Checkout",
    items: [
      { label: "Builder", path: "/dashboard/checkout-builder", icon: PenTool },
      { label: "Gateways", path: "/dashboard/gateways", icon: CreditCard },
      { label: "Fretes", path: "/dashboard/shipping", icon: Truck },
      { label: "Order Bumps", path: "/dashboard/order-bumps", icon: Tag },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Pixels", path: "/dashboard/pixels", icon: Zap },
      { label: "Webhooks", path: "/dashboard/webhooks", icon: Webhook },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Notificações", path: "/dashboard/notifications", icon: Bell },
      { label: "Plano & Limites", path: "/dashboard/plans", icon: Crown },
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
      if (!session) navigate("/login");
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(240 10% 4%)' }}>
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-transparent border-t-[hsl(199,89%,48%)]" />
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/60">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-xs">V</span>
          </div>
          {sidebarOpen && (
            <span className="font-bold text-[15px] tracking-tight text-foreground">
              Void<span className="text-accent">Tok</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform duration-200", !sidebarOpen && "rotate-180")} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            {sidebarOpen && (
              <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
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
                    "group flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150",
                    isActive(item.path)
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5",
                    isActive(item.path) && "text-primary"
                  )}>
                    <item.icon className={cn(
                      "w-[15px] h-[15px] shrink-0 transition-colors duration-150",
                      isActive(item.path) ? "text-primary" : "group-hover:text-foreground"
                    )} />
                  </div>
                  {sidebarOpen && <span>{item.label}</span>}
                  {item.label === "Live View" && sidebarOpen && (
                    <span className="ml-auto flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-void-success opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-void-success" />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/60 space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
        >
          <ExternalLink className="w-[15px] h-[15px] shrink-0" />
          {sidebarOpen && <span>Ver Loja</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
        >
          <LogOut className="w-[15px] h-[15px] shrink-0" />
          {sidebarOpen && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen void-gradient-bg flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-0 left-0 h-screen border-r border-border/60 z-50 transition-all duration-200",
          sidebarOpen ? "w-[220px]" : "w-16"
        )}
        style={{ background: 'hsl(240 6% 7% / 0.95)', backdropFilter: 'blur(20px)' }}
      >
        <SidebarNav />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-[220px] bg-card border-r border-border/60 z-50 transition-transform duration-200 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNav />
      </aside>

      {/* Main content */}
      <div className={cn("flex-1 transition-all duration-200", sidebarOpen ? "md:ml-[220px]" : "md:ml-16")}>
        <header className="sticky top-0 z-30 h-14 border-b border-border/60 flex items-center px-5 gap-3" style={{ background: 'hsl(240 6% 7% / 0.8)', backdropFilter: 'blur(20px)' }}>
          <button className="md:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <PushNotificationToggle />
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">VT</span>
            </div>
          </div>
        </header>

        <main className="p-5 md:p-8 max-w-[1280px] mx-auto">
          <SaleNotification />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
