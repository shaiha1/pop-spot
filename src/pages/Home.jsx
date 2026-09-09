import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, ChevronLeft } from 'lucide-react';
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

  return (
    <div dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden flex items-center justify-center"
      style={{ minHeight: '600px' }}>
        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop"
        alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(16,37,28,0.35) 0%, rgba(16,37,28,0.6) 100%)' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 text-center flex flex-col items-center">
          <span className="mb-4 px-4 py-1.5 font-bold uppercase tracking-widest rounded-full text-xs sm:text-sm whitespace-nowrap"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
            PopSpot · המקום שלך. בזמן שלך.
          </span>
          <h1 className="font-heading font-bold leading-tight mb-6"
          style={{ fontSize: 'clamp(38px,7vw,68px)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            מה תרצה להשכיר?
          </h1>
          <p className="mb-8 text-2xl" style={{ color: 'rgba(255,255,255,0.88)' }}>
            מצאו את המקום המדויק — לפי שעה, יום או כמה שתצטרכו
          </p>

          {/* Floating search bar */}
          <div className="w-full max-w-2xl flex flex-col sm:flex-row items-stretch gap-2 p-2"
          style={{ background: '#fff', borderRadius: '999px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <select
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="flex-1 font-body font-semibold bg-transparent"
              style={{ minHeight: 52, padding: '0 var(--brand-sp-4)', border: 'none', color: 'var(--brand-text)', fontSize: 16, borderRadius: '999px' }}>

              <option value="">📍 איפה?</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => handleSearch()} className="if-btn-primary flex items-center justify-center gap-2" style={{ minHeight: 52 }}>
              <Search size={18} className="relative z-10" />
              <span>חיפוש</span>
            </button>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section style={{ background: 'var(--brand-surface)' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="font-heading font-bold text-xl mb-4">קטגוריות פופולריות</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categoriesToShow.map((key) => {
              const cat = CATEGORIES[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSearch(key)}
                  className="flex flex-col items-center justify-center gap-2 p-4 font-semibold text-sm text-center transition-all hover:-translate-y-0.5"
                  style={{ border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-muted)', color: 'var(--brand-text)' }}>

                  <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                  {cat.label}
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
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-primary)' }}>מומלצים</span>
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
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-primary)' }}>קטגוריה</span>
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
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-primary)' }}>קטגוריה</span>
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
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-primary)' }}>קטגוריה</span>
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
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-primary)' }}>קטגוריה</span>
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
                <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-primary)' }}>קטגוריה</span>
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
