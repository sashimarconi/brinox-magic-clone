import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SaasUser {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "enterprise";
  transaction_fee_percent: number;
  monthly_price: number;
  created_at: string;
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground border-border",
  pro: "bg-accent/10 text-accent border-accent/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const SaasUsers = () => {
  const [users, setUsers] = useState<SaasUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc("admin_list_users");
    if (!error && data) {
      setUsers(data as unknown as SaasUser[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handlePlanChange = async (userId: string, newPlan: string) => {
    const { error } = await supabase.rpc("admin_update_user_plan", {
      _target_user_id: userId,
      _new_plan: newPlan as "free" | "pro" | "enterprise",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano atualizado!" });
      fetchUsers();
    }
  };

  const filtered = users.filter((u) =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-transparent border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} usuário(s) cadastrado(s)</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="w-4 h-4 text-accent" />
            Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((user) => (
              <div key={user.user_id} className="rounded-2xl border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.full_name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-medium shrink-0 ${planColors[user.plan] || ""}`}>
                    {user.plan.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Taxa: {user.transaction_fee_percent}%</span>
                  <span>{format(new Date(user.created_at), "dd/MM/yyyy")}</span>
                </div>
                <Select value={user.plan} onValueChange={(val) => handlePlanChange(user.user_id, val)}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum usuário encontrado.</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Usuário</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Email</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Plano</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Taxa</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Cadastro</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.user_id} className="border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{user.full_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-medium ${planColors[user.plan] || ""}`}>
                        {user.plan.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {user.transaction_fee_percent}%
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.plan}
                        onValueChange={(val) => handlePlanChange(user.user_id, val)}
                      >
                        <SelectTrigger className="w-28 h-7 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaasUsers;
