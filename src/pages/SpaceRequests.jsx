import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PlusCircle, MapPin, Users, Calendar, Banknote, ChevronLeft } from 'lucide-react';

export default function SpaceRequests() {
  useDocumentMeta({
    title: 'לוח בקשות מקומות | POPSPOT',
    description: 'בעלי מקומות — ראו מה מחפשים הלקוחות ופנו אליהם ישירות.',
  });

  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.SpaceRequest.filter({ status: 'open' }, '-created_date', 60)
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterCity && r.city !== filterCity) return false;
    return true;
  });

  const formatDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return dt.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 mb-6"
           style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--brand-primary)' }}>לוח בקשות</span>
          <h1 className="font-bold text-3xl mt-1">מה מחפשים הלקוחות?</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
            בעלי מקומות — צרו קשר עם מי שמחפש בדיוק את מה שיש לכם
          </p>
        </div>
        <button
          onClick={() => user ? navigate('/requests/new') : base44.auth.redirectToLogin('/requests/new')}
          className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-full whitespace-nowrap"
          style={{ background: 'var(--brand-primary)', color: '#fff', minHeight: 44 }}>
          <PlusCircle size={16} />
          פרסם בקשה
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-full border font-medium"
          style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', minHeight: 40 }}>
          <option value="">כל הקטגוריות</option>
          {Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>

        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="px-3 py-2 text-sm rounded-full border font-medium"
          style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', minHeight: 40 }}>
          <option value="">כל הערים</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {(filterCategory || filterCity) && (
          <button
            onClick={() => { setFilterCategory(''); setFilterCity(''); }}
            className="px-3 py-2 text-sm rounded-full border font-medium"
            style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', color: 'var(--brand-muted-foreground)', minHeight: 40 }}>
            נקה סינון ✕
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
               style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-bold text-xl mb-2">
            {requests.length === 0 ? 'אין בקשות פתוחות כרגע' : 'לא נמצאו בקשות תואמות'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--brand-muted-foreground)' }}>
            {requests.length === 0
              ? 'היו הראשונים לפרסם בקשה למקום'
              : 'נסו לשנות את הסינון'}
          </p>
          <button
            onClick={() => user ? navigate('/requests/new') : base44.auth.redirectToLogin('/requests/new')}
            className="px-6 py-3 font-semibold rounded-full"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
            פרסם בקשה
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const cat = CATEGORIES[req.category];
            const catLabel = cat ? `${cat.emoji} ${cat.label}` : req.other_category || null;
            return (
              <Link key={req.id} to={`/requests/${req.id}`} className="block group">
                <article className="p-5 border transition-all group-hover:shadow-md"
                         style={{
                           borderColor: 'var(--brand-border)',
                           background: 'var(--brand-surface)',
                           borderRadius: 'var(--brand-radius-sm)',
                         }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Category badge */}
                      {catLabel && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                              style={{ background: 'var(--brand-accent)', color: 'var(--brand-primary)' }}>
                          {catLabel}
                        </span>
                      )}

                      <h2 className="font-bold text-lg leading-tight group-hover:underline">{req.title}</h2>
                      {req.description && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--brand-muted-foreground)' }}>
                          {req.description}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
                        {req.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} /> {req.city}
                          </span>
                        )}
                        {req.date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={13} /> {formatDate(req.date)}
                          </span>
                        )}
                        {req.guests_count && (
                          <span className="flex items-center gap-1">
                            <Users size={13} /> {req.guests_count} אנשים
                          </span>
                        )}
                        {req.budget_per_hour && (
                          <span className="flex items-center gap-1">
                            <Banknote size={13} /> עד ₪{req.budget_per_hour}/שעה
                          </span>
                        )}
                        {req.start_time && req.end_time && (
                          <span className="flex items-center gap-1">
                            🕐 {req.start_time}–{req.end_time}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>
                        {req.requester_name || 'משתמש'}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold"
                            style={{ color: 'var(--brand-primary)' }}>
                        הגב <ChevronLeft size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
