import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, CITIES } from '@/lib/constants';
import SpaceCard from '@/components/spaces/SpaceCard';

export default function SearchPage() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const [city, setCity] = useState(params.get('city') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [query, setQuery] = useState(params.get('q') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [minGuests, setMinGuests] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    doSearch();
  }, [city, category]);

  const doSearch = async () => {
    setLoading(true);
    const filter = { status: 'active' };
    if (city) filter.city = city;
    if (category) filter.category = category;
    const results = await base44.entities.Space.filter(filter, '-created_date', 50).catch(() => []);

    let filtered = results;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q)
      );
    }
    if (maxPrice) {
      filtered = filtered.filter(s => (s.starting_price || 0) <= Number(maxPrice));
    }
    if (minGuests) {
      filtered = filtered.filter(s => (s.max_guests || 0) >= Number(minGuests));
    }

    setSpaces(filtered);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch();
  };

  const clearFilters = () => {
    setCity('');
    setCategory('');
    setQuery('');
    setMaxPrice('');
    setMinGuests('');
  };

  const activeFilterCount = [city, category, query, maxPrice, minGuests].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--brand-muted-foreground)' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חיפוש חללים..."
            className="if-field-input pr-10"
          />
        </div>
        <button type="submit" className="if-btn-primary">
          <span>חיפוש</span>
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="if-btn-secondary relative flex items-center gap-2"
        >
          <SlidersHorizontal size={18} />
          סינון
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center"
                  style={{ background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 border" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-md)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">סינון</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm font-semibold flex items-center gap-1"
                      style={{ color: 'var(--brand-primary)' }}>
                <X size={14} /> ניקוי
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">עיר</label>
              <select value={city} onChange={e => setCity(e.target.value)} className="if-field-input">
                <option value="">הכל</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">קטגוריה</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="if-field-input">
                <option value="">הכל</option>
                {Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">מחיר מקסימלי</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                     placeholder="₪" className="if-field-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">מספר אנשים</label>
              <input type="number" value={minGuests} onChange={e => setMinGuests(e.target.value)}
                     placeholder="לפחות" className="if-field-input" />
            </div>
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setCategory('')}
          className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full"
          style={{
            background: !category ? 'var(--brand-primary)' : 'var(--brand-surface)',
            color: !category ? 'var(--brand-on-primary)' : 'var(--brand-text)',
            border: `1px solid ${!category ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
          }}
        >
          הכל
        </button>
        {Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setCategory(k)}
            className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full"
            style={{
              background: category === k ? 'var(--brand-primary)' : 'var(--brand-surface)',
              color: category === k ? 'var(--brand-on-primary)' : 'var(--brand-text)',
              border: `1px solid ${category === k ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
            }}
          >
            {v.emoji} {v.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
          {loading ? 'מחפש...' : `${spaces.length} תוצאות`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
               style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
        </div>
      ) : spaces.length === 0 ? (
        <section className="text-center py-12 px-4"
                 style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-muted)' }}>
          <h3 className="font-bold text-2xl mb-2">לא נמצאו תוצאות</h3>
          <p style={{ color: 'var(--brand-muted-foreground)' }}>נסו לשנות את הסינון או לחפש מונח אחר</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {spaces.map(s => <SpaceCard key={s.id} space={s} user={user} />)}
        </div>
      )}
    </div>
  );
}
