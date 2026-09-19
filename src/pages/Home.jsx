import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, ChevronLeft, SlidersHorizontal, MapPin, CalendarDays, Sparkles } from 'lucide-react';
import { CATEGORIES, PRIMARY_CATEGORIES, SECONDARY_CATEGORIES, CITIES } from '@/lib/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import SpaceCard from '@/components/spaces/SpaceCard';

export default function Home() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const navigate = useNavigate();

  useDocumentMeta({
    title: 'POPSPOT | השכרת מקומות לפי שעה',
    description: 'מצאו והזמינו מקומות פרטיים לפי שעה - בריכות, אירועים, סטודיו לצילום ועוד. Airbnb לפי שעות.',
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Space.filter({ status: 'active' }, '-created_date', 30).
    then(setSpaces).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  const handleSearch = (category) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (searchCity) params.set('city', searchCity);
    navigate(`/search?${params.toString()}`);
  };

  const categoriesToShow = [...PRIMARY_CATEGORIES, ...SECONDARY_CATEGORIES];

  // Real, crawlable links (not gated behind a bot-only snapshot) into the
  // city x category combinations that actually have listings today.
  const popularCombos = [];
  const seenCombos = new Set();
  for (const s of spaces) {
    if (!s.category || !s.city) continue;
    const key = `${s.category}|${s.city}`;
    if (seenCombos.has(key)) continue;
    seenCombos.add(key);
    popularCombos.push({ category: s.category, city: s.city });
  }

  const poolSpaces = spaces.filter((s) => s.category === 'pool');
  const studioSpaces = spaces.filter((s) => s.category === 'training_studio');
  const villaSpaces = spaces.filter((s) => s.category === 'villa');
  const eventSpaces = spaces.filter((s) => s.category === 'event_space');
  const photoSpaces = spaces.filter((s) => s.category === 'photography');

  const trendingSearches = [
    { label: 'סטודיו ליוגה בתל אביב', category: 'training_studio', city: 'תל אביב' },
    { label: 'וילה פרטית בהרצליה', category: 'villa', city: 'הרצליה' },
    { label: 'סטודיו צילום בנתניה', category: 'photography', city: 'נתניה' },
    { label: 'בריכת שחייה לשבת', category: 'pool', city: '' },
  ];

  return (
    <div dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16" style={{ background: 'var(--brand-primary)' }}>
        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop"
        alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'var(--brand-emerald-vibrant)', opacity: 0.25, filter: 'blur(90px)' }} />
        <div className="absolute -bottom-24 left-10 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'var(--brand-gold)', opacity: 0.15, filter: 'blur(90px)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-sm"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--brand-accent)', backdropFilter: 'blur(6px)' }}>
            <Sparkles size={14} style={{ color: 'var(--brand-gold)' }} />
            <span>פלטפורמת הפרימיום למקומות לפי שעה בישראל</span>
          </span>

          <h1 className="font-heading font-bold leading-tight mb-4"
          style={{ fontSize: 'clamp(36px,6vw,56px)', color: 'var(--brand-surface-cream)', letterSpacing: '-0.02em' }}>
            מה תרצו להשכיר היום?
          </h1>
          <p className="mb-8 text-lg font-light max-w-2xl" style={{ color: 'rgba(217,238,219,0.9)' }}>
            גלו והזמינו מקומות מעוצבים לפי שעה או ליום שלם — סטודיואים לצילום, מתחמי אימונים, וילות ומקומות בוטיק לאירועים.
          </p>

          {/* Floating Smart Search Capsule */}
          <div className="w-full max-w-4xl rounded-3xl sm:rounded-full p-2 flex flex-col md:flex-row items-stretch md:items-center gap-1 shadow-2xl"
          style={{ background: 'var(--brand-surface)' }}>
            <div className="flex-1 px-4 py-2 flex items-center gap-3 rounded-full transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F4F7EF', color: 'var(--brand-primary)' }}>
                <SlidersHorizontal size={18} />
              </div>
              <div className="flex flex-col min-w-0 text-right w-full">
                <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>מה הפעילות?</span>
                <select
                  onChange={(e) => handleSearch(e.target.value)}
                  defaultValue=""
                  className="font-semibold bg-transparent focus:outline-none w-full truncate"
                  style={{ color: 'var(--brand-text)', fontSize: 15 }}>
                  <option value="" disabled>סטודיו, אירוע, צילום...</option>
                  {categoriesToShow.map((key) => (
                    <option key={key} value={key}>{CATEGORIES[key].emoji} {CATEGORIES[key].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hidden md:block w-px h-8 my-auto" style={{ background: 'var(--brand-border)' }} />
            <div className="flex-1 px-4 py-2 flex items-center gap-3 rounded-full transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F4F7EF', color: 'var(--brand-primary)' }}>
                <MapPin size={18} />
              </div>
              <div className="flex flex-col min-w-0 text-right w-full">
                <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>איפה בארץ?</span>
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="font-semibold bg-transparent focus:outline-none w-full truncate"
                  style={{ color: 'var(--brand-text)', fontSize: 15 }}>
                  <option value="">תל אביב, הרצליה, שרון...</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="hidden md:block w-px h-8 my-auto" style={{ background: 'var(--brand-border)' }} />
            <div className="hidden md:flex flex-1 px-4 py-2 items-center gap-3 rounded-full">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F4F7EF', color: 'var(--brand-primary)' }}>
                <CalendarDays size={18} />
              </div>
              <div className="flex flex-col min-w-0 text-right">
                <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>מתי וכמה זמן?</span>
                <span className="font-semibold truncate" style={{ color: 'var(--brand-text)', fontSize: 15 }}>בחרו תאריך ושעות</span>
              </div>
            </div>
            <button onClick={() => handleSearch()} className="if-btn-primary flex items-center justify-center gap-2 shrink-0" style={{ minHeight: 52, borderRadius: 999 }}>
              <Search size={18} />
              <span>חיפוש</span>
            </button>
          </div>

          {/* Quick Trending Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-sm">
            <span className="text-xs opacity-80 ml-1" style={{ color: 'var(--brand-surface-cream)' }}>חיפושים פופולריים:</span>
            {trendingSearches.map((t) => (
              <Link
                key={t.label}
                to={`/search?${new URLSearchParams({ ...(t.category ? { category: t.category } : {}), ...(t.city ? { city: t.city } : {}) }).toString()}`}
                className="px-3 py-1 rounded-full transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--brand-surface-cream)' }}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="w-full py-4 shadow-sm" style={{ background: 'var(--brand-surface-cream)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categoriesToShow.map((key) => {
              const cat = CATEGORIES[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSearch(key)}
                  className="flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl shrink-0 font-semibold text-xs transition-all hover:-translate-y-0.5 shadow-sm"
                  style={{ background: 'var(--brand-surface)', color: 'var(--brand-muted-foreground)' }}>
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <span className="whitespace-nowrap">{cat.label}</span>
                </button>);
            })}
          </div>
        </div>
      </section>

      {/* Popular searches — real links into city x category combinations */}
      {popularCombos.length > 0 && (
        <section style={{ background: 'var(--brand-surface)', borderTop: '1px solid var(--brand-border)' }}>
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h2 className="font-heading font-bold text-lg mb-3">חיפושים פופולריים</h2>
            <nav className="flex flex-wrap gap-2">
              {popularCombos.map(({ category, city }) => (
                <Link
                  key={`${category}|${city}`}
                  to={`/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`}
                  className="text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--brand-muted)', color: 'var(--brand-text)' }}>
                  {CATEGORIES[category]?.label || category} ב{city}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      {/* Spaces Sections */}
      <div className="max-w-5xl mx-auto px-4 mt-10 space-y-14 mb-14">
        {spaces.length > 0 &&
        <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-emerald-vibrant)' }}>מומלצים</span>
                <h2 className="font-heading font-bold text-3xl">פופולרי עכשיו</h2>
              </div>
              <Link to="/search" className="if-btn-secondary text-sm flex items-center gap-1">
                כל המקומות
                <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {spaces.slice(0, 6).map((s) =>
            <SpaceCard key={s.id} space={s} user={user} />
            )}
            </div>
          </section>
        }

        {studioSpaces.length > 0 &&
        <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-emerald-vibrant)' }}>קטגוריה</span>
                <h2 className="font-heading font-bold text-3xl">🏋️ סטודיוים לאימון באזור שלכם</h2>
              </div>
              <Link to="/search?category=training_studio" className="if-btn-secondary text-sm flex items-center gap-1">
                הכל <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {studioSpaces.slice(0, 3).map((s) =>
            <SpaceCard key={s.id} space={s} user={user} />
            )}
            </div>
          </section>
        }

        {poolSpaces.length > 0 &&
        <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-emerald-vibrant)' }}>קטגוריה</span>
                <h2 className="font-heading font-bold text-3xl">🏊 בריכות לשיעורי שחייה ולסופ"ש</h2>
              </div>
              <Link to="/search?category=pool" className="if-btn-secondary text-sm flex items-center gap-1">
                הכל <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {poolSpaces.slice(0, 3).map((s) =>
            <SpaceCard key={s.id} space={s} user={user} />
            )}
            </div>
          </section>
        }

        {eventSpaces.length > 0 &&
        <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-emerald-vibrant)' }}>קטגוריה</span>
                <h2 className="font-heading font-bold text-3xl">🎉 מחפשים מקום לאירוע?</h2>
              </div>
              <Link to="/search?category=event_space" className="if-btn-secondary text-sm flex items-center gap-1">
                הכל <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {eventSpaces.slice(0, 3).map((s) =>
            <SpaceCard key={s.id} space={s} user={user} />
            )}
            </div>
          </section>
        }

        {villaSpaces.length > 0 &&
        <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-emerald-vibrant)' }}>קטגוריה</span>
                <h2 className="font-heading font-bold text-3xl">🏡 וילות ודירות לנופש קצר</h2>
              </div>
              <Link to="/search?category=villa" className="if-btn-secondary text-sm flex items-center gap-1">
                הכל <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {villaSpaces.slice(0, 3).map((s) =>
            <SpaceCard key={s.id} space={s} user={user} />
            )}
            </div>
          </section>
        }

        {photoSpaces.length > 0 &&
        <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-emerald-vibrant)' }}>קטגוריה</span>
                <h2 className="font-heading font-bold text-3xl">📸 מקומות מושלמים לצילום</h2>
              </div>
              <Link to="/search?category=photography" className="if-btn-secondary text-sm flex items-center gap-1">
                הכל <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {photoSpaces.slice(0, 3).map((s) =>
            <SpaceCard key={s.id} space={s} user={user} />
            )}
            </div>
          </section>
        }

        {loading &&
        <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
          </div>
        }

        {!loading && spaces.length === 0 &&
        <section className="text-center py-12 px-4"
        style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-muted)' }}>
            <div className="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-full"
          style={{ background: 'var(--brand-accent)' }}>
              <Search size={28} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h3 className="font-bold text-2xl mb-2">עדיין אין מקומות</h3>
            <p style={{ color: 'var(--brand-muted-foreground)' }}>מקומות חדשים יופיעו כאן בקרוב</p>
          </section>
        }
      </div>

      {/* Space Request CTA */}
      <section className="max-w-5xl mx-auto px-4 mb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-7"
             style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-accent)', border: '2px solid var(--brand-primary)' }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>לוח בקשות</span>
            <h2 className="font-heading font-bold text-2xl mt-1 mb-1">לא מצאתם מה שחיפשתם?</h2>
            <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
              פרסמו בקשה ובעלי מקומות יפנו אליכם ישירות בתוך האפליקציה
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link to="/requests/new" className="if-btn-primary whitespace-nowrap">
              פרסם בקשה
            </Link>
            <Link to="/requests" className="if-btn-secondary whitespace-nowrap">
              לוח בקשות
            </Link>
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="max-w-5xl mx-auto px-4 mb-14">
        <div className="grid sm:grid-cols-2 gap-6 items-center p-8"
        style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-secondary)', color: '#fff' }}>
          <div>
            <h2 className="font-heading font-bold text-3xl mb-3">יש לכם מקום שלא מנוצל כל הזמן?</h2>
            <p className="mb-5" style={{ color: 'rgba(255,255,255,0.85)' }}>הפכו אותו להכנסה עם PopSpot.</p>
            <Link to="/host/spaces/new" className="if-btn-primary inline-flex">
              <span>פרסום מקום</span>
            </Link>
          </div>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <li>💰 הכנסה נוספת</li>
            <li>📅 אתם שולטים בזמינות</li>
            <li>🎯 אתם בוחרים לאיזה שימושים</li>
            <li>💳 אתם קובעים מחיר לכל שימוש</li>
          </ul>
        </div>
      </section>
    </div>);

}
