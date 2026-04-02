

# Transformar VoidTok em SaaS Multi-Tenant

## Visao Geral

Transformar o painel admin single-tenant em um SaaS multi-tenant onde cada usuario registrado tem seu proprio dashboard isolado com produtos, lojas, pixels, reviews, gateways, etc.

## Escopo da Mudanca

### 1. Autenticacao (Registro + Login)
- Criar pagina `/register` com formulario de cadastro (nome, email, senha)
- Atualizar pagina `/login` (renomear de `/admin/login`)
- Apos login/registro, redirecionar para `/dashboard`
- Criar tabela `profiles` com `id`, `user_id`, `full_name`, `avatar_url`, `created_at`
- Trigger para auto-criar perfil no signup

### 2. Rotas
- `/admin/*` vira `/dashboard/*`
- `/admin/login` vira `/login`
- Nova rota `/register`
- Atualizar `AdminLayout` para usar `/dashboard` como base
- Atualizar todos os links internos de navegacao

### 3. Isolamento de Dados (Multi-Tenancy)
Adicionar coluna `user_id UUID NOT NULL DEFAULT auth.uid()` nas seguintes tabelas:

| Tabela | Tem user_id? |
|--------|-------------|
| products | Nao - adicionar |
| product_images | Nao - adicionar |
| product_variants | Nao - adicionar |
| variant_groups | Nao - adicionar |
| reviews | Nao - adicionar |
| review_products | Nao - adicionar |
| trust_badges | Nao - adicionar |
| stores | Nao - adicionar |
| store_products | Nao - adicionar |
| store_settings | Nao - adicionar |
| orders | Nao - adicionar |
| abandoned_carts | Nao - adicionar |
| shipping_options | Nao - adicionar |
| order_bumps | Nao - adicionar |
| order_bump_products | Nao - adicionar |
| gateway_settings | Nao - adicionar |
| tracking_pixels | Nao - adicionar |
| webhooks | Nao - adicionar |
| checkout_settings | Nao - adicionar |
| checkout_builder_config | Nao - adicionar |
| product_page_builder_config | Nao - adicionar |
| page_events | Nao - adicionar |
| visitor_sessions | Nao - adicionar |

### 4. Atualizar RLS Policies
Todas as tabelas acima terao suas policies atualizadas:
- **SELECT (autenticado)**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE/DELETE**: `auth.uid() = user_id`
- **SELECT (publico)** (produtos, lojas, reviews, etc.): manter leitura publica para vitrine

### 5. Atualizar Codigo Frontend
- Todas as queries de INSERT precisam incluir `user_id` (ou usar o default `auth.uid()`)
- Queries de SELECT no dashboard nao precisam filtrar manualmente (RLS cuida disso)
- Atualizar `AdminLayout.tsx`: trocar rotas `/admin` por `/dashboard`
- Atualizar `App.tsx`: novas rotas

### 6. Vitrine Publica
- A vitrine publica (`/product/:slug`, `/loja/:slug`, `/checkout/:slug`) continua funcionando normalmente
- Produtos e lojas continuam com SELECT publico
- Orders e abandoned_carts continuam com INSERT publico

## Detalhes Tecnicos

**Migracao SQL** (resumo):
- ~24 ALTER TABLE ADD COLUMN user_id
- DROP + CREATE de ~40 RLS policies
- CREATE TABLE profiles + trigger
- Habilitar signup no auth

**Arquivos a modificar**:
- `src/App.tsx` - rotas
- `src/pages/AdminLogin.tsx` -> `src/pages/Login.tsx` + `src/pages/Register.tsx`
- `src/components/admin/AdminLayout.tsx` - paths
- Todos os ~20 arquivos em `src/pages/admin/` - nenhuma mudanca de query necessaria (RLS filtra)
- Edge functions que fazem insert precisam passar user_id quando aplicavel

**Risco**: Dados existentes no banco nao terao `user_id` preenchido. A migracao pode atribuir os dados existentes ao primeiro usuario ou deixar NULL (precisando de tratamento).

