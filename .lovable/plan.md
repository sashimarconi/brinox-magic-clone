

# Remover limite de views de todos os planos

Atualizar o sistema para que todos os planos (Free, Pro, Enterprise) tenham views/mês ilimitados. A única diferença entre planos será a taxa de transação e o preço mensal.

## Mudanças

### 1. Migration SQL
- Remover colunas `monthly_views_used`, `monthly_views_limit`, `views_reset_at` da tabela `user_plans`
- Remover função `increment_plan_views`
- Atualizar `admin_list_users` para não retornar campos de views
- Atualizar `admin_update_user_plan` para não setar `monthly_views_limit`

### 2. `src/lib/plans.ts`
- Remover `monthlyViews` do `PlanLimits` (e todo o tipo `PlanLimits` se ficar vazio)
- Adicionar `transactionFeePercent` e `monthlyPrice` ao `PlanInfo`
- Free: 2.5%, R$0 | Pro: 2.0%, R$147 | Enterprise: 1.5%, R$497

### 3. `src/hooks/usePlanLimits.ts`
- Remover toda lógica de views (monthlyViewsUsed, monthlyViewsLimit)
- Remover contagem de recursos
- Simplificar para retornar apenas plan info

### 4. `src/pages/admin/AdminPlans.tsx`
- Remover card de "Visualizações/mês"
- Remover grid de uso de recursos
- Mostrar: plano atual, taxa de transação, preço mensal
- Comparativo focado em taxa e preço

### 5. `src/pages/admin/SaasUsers.tsx`
- Remover coluna "Views (mês)" da tabela de usuários

### 6. `src/hooks/usePageTracking.ts`
- Remover chamada a `increment_plan_views` se existir

### 7. Tabela `invoices` (nova)
- Criar tabela para registrar taxas por pedido pago (order_id, user_id, order_total, fee_percent, fee_amount, created_at)
- RLS: usuário lê próprias invoices
- Trigger: ao marcar order como `paid`, insere invoice automaticamente

### 8. Memory
- Atualizar `mem://features/plan-system`

## Arquivos
- Nova migration SQL
- `src/lib/plans.ts`
- `src/hooks/usePlanLimits.ts`
- `src/pages/admin/AdminPlans.tsx`
- `src/pages/admin/SaasUsers.tsx`
- `src/hooks/usePageTracking.ts` (se referencia views)

