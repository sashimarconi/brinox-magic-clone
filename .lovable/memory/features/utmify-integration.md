---
name: Utmify Integration
description: Integração com Utmify (API server-side de pedidos + pixel TikTok client-side) com suporte a MÚLTIPLAS contas/negócios por usuário, isoladas por user_id
type: feature
---
- Tabela `utmify_settings`: `name` (rótulo do negócio), api_token, platform_name, active, tiktok_pixel_id — **múltiplas linhas por user_id permitidas** (não há mais unique em user_id).
- Edge function `send-utmify-order` busca TODAS as integrações ativas do usuário e envia o pedido para cada uma (loop). Disparado em PIX gerado (waiting_payment) e PIX pago (paid).
- Hook `useUtmifyPixel(userId)` injeta TODOS os pixels TikTok ativos do dono da loja (loop por linhas com `tiktok_pixel_id` preenchido). Usado em ProductPage, CheckoutPage, ThankYouRedirect, StorePage e DomainStorefront.
- UI em `/dashboard/pixels` → card Utmify abre lista de integrações (criar / editar / ativar / remover). Botão "Testar conexão" envia pedido dummy.
- UTMs salvos em `orders.utm_params` (jsonb) e enviados em `trackingParameters` ao Utmify.
- Card Utmify no grid mostra badge "Conectado" quando há pelo menos uma integração ativa.
