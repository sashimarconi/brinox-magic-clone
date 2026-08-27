import { useEffect } from "react";

/**
 * Injeta HTML personalizado no <head> da página.
 * Suporta <script> (inline e src), <meta>, <link>, <style>.
 * Remove tudo ao desmontar / trocar de produto.
 */
export function useCustomHeadHtml(html?: string | null) {
  useEffect(() => {
    if (!html || !html.trim()) return;

    const container = document.createElement("template");
    container.innerHTML = html;

    const injected: Element[] = [];

    Array.from(container.content.childNodes).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;

      if (el.tagName === "SCRIPT") {
        const original = el as HTMLScriptElement;
        const script = document.createElement("script");
        Array.from(original.attributes).forEach((attr) =>
          script.setAttribute(attr.name, attr.value)
        );
        script.text = original.text;
        script.setAttribute("data-custom-head", "true");
        document.head.appendChild(script);
        injected.push(script);
      } else {
        const clone = el.cloneNode(true) as Element;
        clone.setAttribute("data-custom-head", "true");
        document.head.appendChild(clone);
        injected.push(clone);
      }
    });

    return () => {
      injected.forEach((el) => el.parentNode?.removeChild(el));
    };
  }, [html]);
}
