// Vercel Edge Middleware — dynamic rendering for search-engine crawlers.
//
// This is a plain Vite SPA (no server-side rendering), so a crawler
// hitting /space/:slug directly would see an empty <div id="root"> until
// JS executes. Real browsers still get exactly that SPA, unchanged. But
// when the request is from a known crawler, this middleware instead
// returns a small self-contained static HTML page — real title,
// description, price, and images already in the markup, plus JSON-LD —
// so the listing is reliably indexable without depending on JS
// rendering. Same URL either way; this is Google's own documented
// "dynamic rendering" pattern for JS-heavy sites, not cloaking, since the
// content matches what a user would eventually see.
//
// Also serves /sitemap.xml dynamically from the live Supabase data.

export const config = {
  matcher: ['/space/:path*', '/sitemap.xml'],
};

const SUPABASE_URL = 'https://ropbspqfzxvegvketpon.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QdKgTgbZ_SYGm7xmWZmTHA_eUzgfPW_';

const BOT_UA = /googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|slurp|ia_archiver|applebot|discordbot|pinterest|semrushbot|ahrefsbot/i;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function supabaseSelect(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

async function renderSpaceSnapshot(slugOrId, origin) {
  let rows = await supabaseSelect(`spaces?select=*&slug=eq.${encodeURIComponent(slugOrId)}&status=eq.active`);
  if (!rows || rows.length === 0) {
    rows = await supabaseSelect(`spaces?select=*&id=eq.${encodeURIComponent(slugOrId)}&status=eq.active`);
  }
  const space = rows && rows[0];
  if (!space) return null;

  const url = `${origin}/space/${space.slug || space.id}`;
  const title = `${space.title} להשכרה לפי שעה ב${space.city} | PopSpot`;
  const description = (space.description || '').slice(0, 300) ||
    `${space.title} ב${space.city} — השכרה לפי שעה דרך PopSpot.`;
  const image = (space.images && space.images[0]) || '';
  const price = space.starting_price || 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: space.title,
    description,
    image: space.images || [],
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'ILS',
      availability: 'https://schema.org/InStock',
      url,
    },
    ...(space.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: space.avg_rating,
        reviewCount: space.review_count,
      },
    } : {}),
  };

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${escapeHtml(space.title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
<meta property="og:url" content="${escapeHtml(url)}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<h1>${escapeHtml(space.title)}</h1>
<p>${escapeHtml(space.city)}${space.address ? `, ${escapeHtml(space.address)}` : ''}</p>
<p>${escapeHtml(description)}</p>
${price ? `<p>החל מ-₪${escapeHtml(price)} לשעה</p>` : ''}
${(space.images || []).map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(space.title)}" />`).join('\n')}
${space.review_count > 0 ? `<p>דירוג: ${escapeHtml(space.avg_rating)}/5 (${escapeHtml(space.review_count)} ביקורות)</p>` : ''}
</body>
</html>`;
}

async function renderSitemap(origin) {
  const spaces = await supabaseSelect('spaces?select=slug,id,created_date&status=eq.active') || [];
  const staticUrls = ['', '/search', '/faq'];
  const urls = [
    ...staticUrls.map((p) => `<url><loc>${origin}${p}</loc></url>`),
    ...spaces.map((s) =>
      `<url><loc>${origin}/space/${s.slug || s.id}</loc><lastmod>${new Date(s.created_date).toISOString()}</lastmod></url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';

  if (url.pathname === '/sitemap.xml') {
    const xml = await renderSitemap(url.origin);
    return new Response(xml, {
      headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });
  }

  const spaceMatch = url.pathname.match(/^\/space\/([^/]+)\/?$/);
  if (spaceMatch && BOT_UA.test(ua)) {
    const html = await renderSpaceSnapshot(decodeURIComponent(spaceMatch[1]), url.origin);
    if (html) {
      return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' },
      });
    }
  }

  // Not a bot, or not a space page, or lookup failed: fall through to the
  // normal SPA (index.html via the existing vercel.json rewrite).
}
