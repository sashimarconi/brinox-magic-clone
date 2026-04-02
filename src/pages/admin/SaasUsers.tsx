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
  free: "bg-muted text-muted-foreground",
  pro: "bg-void-cyan/20 text-void-cyan border-void-cyan/30",
  enterprise: "bg-void-purple/20 text-void-purple border-void-purple/30",
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-void-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Gerenciar Usuários</h1>
        <p className="text-muted-foreground text-sm">{users.length} usuário(s) cadastrado(s)</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-void-cyan" />
            Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-void-purple to-void-cyan flex items-center justify-center text-white text-xs font-bold">
                        {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{user.full_name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={planColors[user.plan] || ""}>
                      {user.plan.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
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
                      <SelectTrigger className="w-32 h-8 text-xs">
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaasUsers;
