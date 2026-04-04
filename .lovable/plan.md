

## Sistema de Temas para o Builder de Produto

### Conceito
Adicionar um seletor de "Temas" no topo do Product Builder, onde cada tema é um preset completo de configurações (cores, layout, textos, seções habilitadas). O tema atual (TikTok Shop) vira o primeiro preset, e novos temas podem ser adicionados facilmente.

### Implementação

**1. Criar arquivo de presets de temas** (`src/data/productThemes.ts`)
- Cada tema: `id`, `name`, `description`, `thumbnail` (emoji ou ícone), e um objeto `ProductBuilderConfig` completo
- Temas iniciais:
  - **TikTok Shop** (atual) — fundo claro, botão vermelho, layout mobile-first
  - **Shopify Classic** — visual clean, botão verde, bordas arredondadas suaves
  - **Dark Premium** — fundo escuro, botão dourado, visual luxo
  - **Minimal** — cores neutras, sem badges de conversão, foco no produto

**2. Atualizar `AdminProductBuilder.tsx`**
- Adicionar seção "Tema" no topo com cards visuais para cada tema
- Ao selecionar um tema, preencher todas as configs (appearance, texts, conversion, sections) com os valores do preset
- Mostrar confirmação antes de sobrescrever configs customizadas
- Após aplicar o tema, o usuário ainda pode personalizar livremente (o tema é só o ponto de partida)

**3. Atualizar `product_page_builder_config`**
- Adicionar campo `theme_id` ao JSON `config` salvo no banco para lembrar qual tema base foi usado (sem migration, é só um campo dentro do JSONB)

**4. Atualizar `ProductPage.tsx`**
- Nenhuma mudança necessária — o ProductPage já consome o `config` JSONB dinamicamente, então qualquer preset de tema funciona automaticamente

### Visual dos cards de tema
Cards com preview miniatura, nome e descrição curta. O tema ativo fica com borda destacada em cyan. Botão "Aplicar tema" com confirmação.

### Arquivos modificados
- `src/data/productThemes.ts` (novo)
- `src/pages/admin/AdminProductBuilder.tsx` (seletor de temas)

