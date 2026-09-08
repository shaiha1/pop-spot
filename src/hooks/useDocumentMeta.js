import { useEffect } from 'react';

function setMetaTag(attr, key, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Sets the document title + meta description (+ optional OG tags and
 * robots directive) for the current route. This is a plain Vite SPA with
 * no per-route document head management, so without this every page
 * would keep showing index.html's static tags in the browser tab and to
 * any crawler that does execute JS.
 */
export function useDocumentMeta({ title, description, image, noindex } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    if (image) setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, noindex]);
}
