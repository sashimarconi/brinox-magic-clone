---
name: Utmify Integration
description: Integração com Utmify (API server-side de pedidos + pixel TikTok client-side), isolada por user_id
type: feature
---
- Tabela `utmify_settings`: api_token, platform_name, active, tiktok_pixel_id (unique por user_id)
- Edge function `send-utmify-order` envia pedidos para API Utmify (POST https://api.utmify.com.br/api-credentials/orders)
- Disparo automático: PIX gerado → status waiting_payment, PIX pago → status paid
- Chamado de dentro de `create-pix-payment` e `payment-webhook`
- Dados isolados: cada usuário configura sua própria credencial API e seu próprio pixel TikTok da Utmify
- Platform name configurável (campo "platform" dos pedidos na Utmify)
- UI em /dashboard/pixels → aba "Integrações" → card Utmify (token, platform, ID pixel TikTok, ativo)
- Captura de UTMs (src, sck, utm_source, utm_campaign, utm_medium, utm_content, utm_term) na URL do checkout
- UTMs salvos em `orders.utm_params` (jsonb) e enviados em `trackingParameters` ao Utmify
- **Pixel TikTok client-side**: hook `useUtmifyPixel(userId)` injeta script `https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js` definindo `window.tikTokPixelId` antes do load. Carregado em ProductPage, CheckoutPage, ThankYouRedirect, StorePage e DomainStorefront usando o user_id do dono da loja (multi-tenant safe).
