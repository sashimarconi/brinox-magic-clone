/**
 * xTracky UTM Preserver - Adiciona parâmetros da URL atual à URL de destino
 * @param {string} url - URL de destino para navegação
 * @returns {string} URL com parâmetros UTM anexados
 */
export function getUrlWithUtm(url) {
  // Verificação de ambiente browser (pula no SSR)
  if (typeof window === 'undefined') return url;

  const params = window.location.search;
  if (!params) return url;

  const separator = url.includes('?') ? '&' : '?';
  return url + separator + params.substring(1);
}

/**
 * Lê um parâmetro de tracking com fallback:
 * 1. URL atual (?utm_source=...)
 * 2. Cookie (xTracky/utmify salvam UTMs em cookies)
 * 3. localStorage / sessionStorage
 */
export function readTrackingParam(key) {
  if (typeof window === 'undefined') return null;

  // 1. URL
  try {
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = sp.get(key);
    if (fromUrl) return fromUrl;
  } catch {}

  // 2. Cookies
  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const c of cookies) {
      const [rawName, ...rest] = c.split('=');
      const name = (rawName || '').trim();
      const value = rest.join('=').trim();
      if (!name || !value) continue;
      if (
        name === key ||
        name === `xtracky_${key}` ||
        name === `_${key}` ||
        name.toLowerCase() === key.toLowerCase()
      ) {
        try { return decodeURIComponent(value); } catch { return value; }
      }
    }
  } catch {}

  // 3. Storage
  try {
    const ls = window.localStorage?.getItem(key) || window.localStorage?.getItem(`xtracky_${key}`);
    if (ls) return ls;
    const ss = window.sessionStorage?.getItem(key) || window.sessionStorage?.getItem(`xtracky_${key}`);
    if (ss) return ss;
  } catch {}

  return null;
}
