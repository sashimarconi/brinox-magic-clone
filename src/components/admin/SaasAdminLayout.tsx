import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, BarChart3, LogOut, Shield, ChevronLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Métricas", path: "/admin", icon: BarChart3 },
  { label: "Usuários", path: "/admin/users", icon: Users },
];

const SaasAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => { document.documentElement.classList.remove("dark"); };
  }, []);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (!data) { navigate("/dashboard"); return; }
      setLoading(false);
    };

    check();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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

  return (
    <div className="min-h-screen void-gradient-bg flex">
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col fixed top-0 left-0 h-screen bg-card/80 backdrop-blur-xl border-r border-border z-50 transition-all duration-300",
        sidebarOpen ? "w-56" : "w-16"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-display font-black text-lg tracking-tight">
                <span className="text-foreground">SaaS</span>
                <span className="text-red-400"> Admin</span>
              </span>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex text-muted-foreground hover:text-void-cyan transition-colors">
            <ChevronLeft className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.path)
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive(item.path) ? "text-red-400" : "group-hover:text-red-400")} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-void-cyan hover:bg-muted transition-colors group">
            <BarChart3 className="w-4 h-4 shrink-0 group-hover:text-void-cyan" />
            {sidebarOpen && <span>Voltar ao Dashboard</span>}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-void-danger hover:bg-void-danger/10 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "md:ml-56" : "md:ml-16")}>
        <header className="sticky top-0 z-30 h-14 bg-card/60 backdrop-blur-xl border-b border-border flex items-center px-4 gap-3">
          <button className="md:hidden text-muted-foreground hover:text-void-cyan" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Painel do SaaS Owner</span>
          </div>
          <div className="flex-1" />
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SaasAdminLayout;
