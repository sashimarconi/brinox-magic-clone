
## Plano: Adicionar página de Perfil ao painel

### O que será feito
Criar uma nova página "Meu Perfil" no dashboard onde o usuário pode visualizar e editar seus dados pessoais (nome, email, avatar). Também será adicionado um link na sidebar e no avatar do header.

### Estrutura

**1. Nova página `src/pages/admin/AdminProfile.tsx`**
- Busca dados do usuário via `supabase.auth.getUser()` e da tabela `profiles`
- Exibe: email (somente leitura), nome completo (editável), avatar (editável com URL)
- Exibe info do plano atual (via `usePlanLimits`)
- Exibe data de criação da conta
- Botão para salvar alterações no perfil (atualiza tabela `profiles`)
- Layout consistente com as outras páginas admin (Cards, inputs, labels)

**2. Rota no `src/App.tsx`**
- Adicionar `<Route path="profile" element={<AdminProfile />} />` dentro do grupo `/dashboard`

**3. Link na sidebar (`AdminLayout.tsx`)**
- Adicionar item "Meu Perfil" na seção "Configurações" com ícone `User`
- Tornar o avatar no header clicável, redirecionando para `/dashboard/profile`

### Detalhes técnicos
- Usa a tabela `profiles` existente (campos: `full_name`, `avatar_url`, `user_id`)
- RLS já configurada para que cada usuário veja/edite apenas seu próprio perfil
- Nenhuma migração de banco necessária
