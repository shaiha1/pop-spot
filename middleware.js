// Vercel Edge Middleware.
//
// This is a plain Vite SPA (no server-side rendering), so any route serves
// an empty <div id="root"> until client JS executes. This middleware closes
// that gap in three ways:
//
// 1. Crawler snapshots (dynamic rendering): known bots requesting /, /search,
//    /faq, or /space/:slug get a self-contained static HTML snapshot (real
//    title/description/price/images + JSON-LD where relevant) instead of the
//    empty shell. Real users always get the unchanged SPA. Per an SEO audit
//    of this pattern: this is a legitimate stopgap (content parity, not
//    cloaking) but not a permanent substitute for real SSR -- see the
//    internal <Link> additions on the Home page for a UA-agnostic
//    complement to this.
// 2. Server-side noindex: private/authenticated routes get a real
//    X-Robots-Tag response header, not just a client-side JS-injected meta
//    tag that a non-JS crawler would never see.
// 3. Real 404 status for unrecognized paths, instead of a 200 soft-404.
//
// Also serves /sitemap.xml dynamically from live Supabase data, including
// city x category combinations that actually have listings.

import { CATEGORIES, CITIES } from './src/lib/constants.js';
import { getSearchLandingCopy, FAQ_ITEMS } from './src/lib/seoContent.js';

export const config = {
  matcher: ['/((?!assets/).*)'],
};

const SUPABASE_URL = 'https://ropbspqfzxvegvketpon.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QdKgTgbZ_SYGm7xmWZmTHA_eUzgfPW_';

const BOT_UA = /googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|slurp|ia_archiver|applebot|discordbot|pinterest|semrushbot|ahrefsbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|ccbot|bytespider/i;

const PRIVATE_PATH_PREFIXES = [
  '/login', '/register', '/forgot-password', '/reset-password',
  '/favorites', '/bookings', '/profile', '/host', '/admin',
];

const KNOWN_STATIC_ROUTES = new Set(['/', '/search', '/faq']);
const KNOWN_DYNAMIC_ROUTE = /^\/space\/[^/]+\/?$/;

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

function htmlShell({ title, description, canonical, ogImage, jsonLd, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ''}
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
${canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}" />` : ''}
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
${bodyHtml}
</body>
</html>`;
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
  const amenities = (space.amenities || []).join(', ');
  const longDescription = [
    space.description,
    space.rules ? `חוקי הבית: ${space.rules}` : '',
    amenities ? `מתקנים: ${amenities}` : '',
  ].filter(Boolean).join(' ');
  const description = (longDescription || `${space.title} ב${space.city} — השכרה לפי שעה דרך PopSpot.`).slice(0, 500);
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

  const bodyHtml = `<h1>${escapeHtml(space.title)}</h1>
<p>${escapeHtml(space.city)}${space.address ? `, ${escapeHtml(space.address)}` : ''}</p>
<p>${escapeHtml(description)}</p>
${price ? `<p>החל מ-₪${escapeHtml(price)} לשעה</p>` : ''}
${(space.images || []).map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(space.title)}" />`).join('\n')}
${space.review_count > 0 ? `<p>דירוג: ${escapeHtml(space.avg_rating)}/5 (${escapeHtml(space.review_count)} ביקורות)</p>` : ''}`;

  return htmlShell({ title, description, canonical: url, ogImage: image, jsonLd, bodyHtml });
}

async function renderHomeSnapshot(origin) {
  const spaces = await supabaseSelect('spaces?select=title,slug,id,city,category,starting_price&status=eq.active&order=created_date.desc&limit=20') || [];
  const title = 'POPSPOT | השכרת מקומות לפי שעה';
  const description = 'מצאו והזמינו מקומות פרטיים לפי שעה - בריכות, אירועים, סטודיו לצילום ועוד. Airbnb לפי שעות.';

  const byCombo = new Map();
  for (const s of spaces) {
    if (s.category && s.city) byCombo.set(`${s.category}|${s.city}`, true);
  }
  const comboLinks = [...byCombo.keys()].slice(0, 15).map((key) => {
    const [category, city] = key.split('|');
    const label = CATEGORIES[category]?.label || category;
    const href = `${origin}/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)} ב${escapeHtml(city)}</a></li>`;
  }).join('\n');

  const listingLinks = spaces.map((s) =>
    `<li><a href="${origin}/space/${escapeHtml(s.slug || s.id)}">${escapeHtml(s.title)}</a> — ${escapeHtml(s.city)}${s.starting_price ? `, החל מ-₪${escapeHtml(s.starting_price)} לשעה` : ''}</li>`
  ).join('\n');

  const bodyHtml = `<h1>מה תרצה להשכיר?</h1>
<p>מצאו את המקום המדויק — לפי שעה, יום או כמה שתצטרכו</p>
<h2>מקומות פופולריים</h2>
<ul>${listingLinks}</ul>
<h2>חיפוש לפי עיר וקטגוריה</h2>
<ul>${comboLinks}</ul>`;

  return htmlShell({ title, description, canonical: origin + '/', bodyHtml });
}

async function renderSearchSnapshot(url) {
  const category = url.searchParams.get('category') || '';
  const city = url.searchParams.get('city') || '';
  const copy = getSearchLandingCopy({ category, city });

  const filters = ['status=eq.active'];
  if (category) filters.push(`category=eq.${encodeURIComponent(category)}`);
  if (city) filters.push(`city=eq.${encodeURIComponent(city)}`);
  const spaces = await supabaseSelect(`spaces?select=title,slug,id,city,starting_price&${filters.join('&')}&limit=30`) || [];

  const listingLinks = spaces.map((s) =>
    `<li><a href="${url.origin}/space/${escapeHtml(s.slug || s.id)}">${escapeHtml(s.title)}</a> — ${escapeHtml(s.city)}${s.starting_price ? `, החל מ-₪${escapeHtml(s.starting_price)} לשעה` : ''}</li>`
  ).join('\n');

  const bodyHtml = `<h1>${escapeHtml(copy.title.replace(' | PopSpot', ''))}</h1>
<p>${escapeHtml(copy.intro)}</p>
${spaces.length > 0
    ? `<p>${spaces.length} תוצאות</p><ul>${listingLinks}</ul>`
    : `<p>לא נמצאו תוצאות מדויקות. נסו לשנות את הסינון או לחפש מונח אחר.</p>`}`;

  // Canonical points at the exact filtered URL (not the bare /search) so
  // each city/category combination is treated as its own page, not a
  // duplicate of the unfiltered results.
  return htmlShell({ title: copy.title, description: copy.intro, canonical: url.href, bodyHtml });
}

function renderFaqSnapshot(origin) {
  const bodyHtml = `<h1>שאלות נפוצות</h1>
${FAQ_ITEMS.map((item) => `<h2>${escapeHtml(item.q)}</h2><p>${escapeHtml(item.a)}</p>`).join('\n')}`;
  return htmlShell({
    title: 'שאלות נפוצות | PopSpot',
    description: 'איך עובדת הזמנה ב-PopSpot, איך מתבצע התשלום, איך מפרסמים מקום להשכרה ועוד שאלות נפוצות.',
    canonical: origin + '/faq',
    bodyHtml,
  });
}

async function renderSitemap(origin) {
  const spaces = await supabaseSelect('spaces?select=slug,id,city,category,created_date&status=eq.active') || [];
  const staticUrls = ['', '/search', '/faq'];

  const byCombo = new Map();
  for (const s of spaces) {
    if (s.category && s.city) byCombo.set(`${s.category}|${s.city}`, true);
  }
  const comboUrls = [...byCombo.keys()].map((key) => {
    const [category, city] = key.split('|');
    return `/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
  });

  const urls = [
    ...staticUrls.map((p) => `<url><loc>${origin}${p}</loc></url>`),
    ...comboUrls.map((p) => `<url><loc>${origin}${p}</loc></url>`),
    ...spaces.map((s) =>
      `<url><loc>${origin}/space/${s.slug || s.id}</loc><lastmod>${new Date(s.created_date).toISOString()}</lastmod></url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

function withHeaders(response, extra) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

// fetch(request) inside middleware does NOT bypass this same middleware --
// it re-enters the same routing/middleware pipeline. Without a marker,
// fetching the underlying page to modify its headers/status causes the
// middleware to run again on the identical request, forever. This header
// is stripped of meaning to real clients (nothing else sets or reads it)
// and only exists so the second, self-triggered pass can recognize itself
// and fall through immediately instead of repeating the same logic.
const PASSTHROUGH_HEADER = 'x-mw-passthrough';

async function fetchOrigin(request) {
  const headers = new Headers(request.headers);
  headers.set(PASSTHROUGH_HEADER, '1');
  return fetch(new Request(request.url, { headers, method: request.method }));
}

export default async function middleware(request) {
  if (request.headers.get(PASSTHROUGH_HEADER)) return;

  const url = new URL(request.url);
  const path = url.pathname;

  // Static public files (robots.txt, vite.svg, favicon, etc.) pass through
  // completely untouched -- sitemap.xml is the one file-like path that
  // gets dynamic handling, below.
  if (path !== '/sitemap.xml' && /\.[a-zA-Z0-9]+$/.test(path)) return;

  const ua = request.headers.get('user-agent') || '';
  const isBot = BOT_UA.test(ua);

  if (path === '/sitemap.xml') {
    const xml = await renderSitemap(url.origin);
    return new Response(xml, {
      headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });
  }

  const spaceMatch = path.match(/^\/space\/([^/]+)\/?$/);
  if (isBot) {
    let html = null;
    if (spaceMatch) html = await renderSpaceSnapshot(decodeURIComponent(spaceMatch[1]), url.origin);
    else if (path === '/') html = await renderHomeSnapshot(url.origin);
    else if (path === '/search') html = await renderSearchSnapshot(url);
    else if (path === '/faq') html = renderFaqSnapshot(url.origin);

    if (html) {
      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=600',
          'vary': 'User-Agent',
        },
      });
    }
  }

  // Private/authenticated routes: real server-side noindex, not just a
  // client-side meta tag a non-JS crawler would never see.
  const isPrivate = PRIVATE_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
  if (isPrivate) {
    const res = await fetchOrigin(request);
    return withHeaders(res, { 'X-Robots-Tag': 'noindex, nofollow' });
  }

  // Unrecognized path: real 404 status (crawlers should not index it), but
  // keep serving the SPA body so real users still see the in-app
  // PageNotFound page rather than a bare blank 404.
  const isKnownStatic = KNOWN_STATIC_ROUTES.has(path);
  const isKnownDynamic = KNOWN_DYNAMIC_ROUTE.test(path);
  if (!isKnownStatic && !isKnownDynamic) {
    const res = await fetchOrigin(request);
    const headers = new Headers(res.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(res.body, { status: 404, headers });
  }

  // Everything else (known public routes for non-bot requests): unchanged.
}
