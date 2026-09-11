import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44, supabase } from '@/api/base44Client';
import { CATEGORIES } from '@/lib/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PlusCircle, MapPin, Calendar, Users, MessageSquare } from 'lucide-react';

const STATUS_LABELS = {
  open: { label: 'פתוחה', bg: '#dcfce7', color: '#166534' },
  fulfilled: { label: 'טופלה', bg: '#dbeafe', color: '#1e40af' },
  cancelled: { label: 'בוטלה', bg: 'var(--brand-muted)', color: 'var(--brand-muted-foreground)' },
};

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
};

export default function MyRequests() {
  useDocumentMeta({ noindex: true });
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [responseCounts, setResponseCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const reqs = await base44.entities.SpaceRequest.filter({ requester_id: u.id }, '-created_date', 50);
      setRequests(reqs);

      if (reqs.length) {
        const ids = reqs.map(r => r.id);
        const { data } = await supabase
          .from('space_request_responses')
          .select('request_id')
          .in('request_id', ids);
        const counts = {};
        (data || []).forEach(r => {
          counts[r.request_id] = (counts[r.request_id] || 0) + 1;
        });
        setResponseCounts(counts);
      }
    }).catch(() => {
      base44.auth.redirectToLogin('/my-requests');
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-6"
           style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--brand-primary)' }}>הבקשות שלי</span>
          <h1 className="font-bold text-3xl mt-1">הבקשות שפרסמתי</h1>
        </div>
        <button
          onClick={() => navigate('/requests/new')}
          className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-full whitespace-nowrap"
          style={{ background: 'var(--brand-primary)', color: '#fff', minHeight: 44 }}>
          <PlusCircle size={16} />
          בקשה חדשה
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
               style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-bold text-xl mb-2">עדיין לא פרסמת בקשה</h3>
          <p className="mb-6" style={{ color: 'var(--brand-muted-foreground)' }}>
            תארו מה אתם מחפשים ובעלי מקומות יפנו אליכם
          </p>
          <button
            onClick={() => navigate('/requests/new')}
            className="px-6 py-3 font-semibold rounded-full"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
            פרסם את הבקשה הראשונה שלי
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cat = CATEGORIES[req.category];
            const s = STATUS_LABELS[req.status] || STATUS_LABELS.open;
            const count = responseCounts[req.id] || 0;
            return (
              <Link key={req.id} to={`/requests/${req.id}`} className="block group">
                <article className="p-5 border transition-all group-hover:shadow-md"
                         style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {cat && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--brand-accent)', color: 'var(--brand-primary)' }}>
                            {cat.emoji} {cat.label}
                          </span>
                        )}
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <h2 className="font-bold text-base leading-tight group-hover:underline">{req.title}</h2>

                      <div className="flex flex-wrap gap-3 mt-2 text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
                        {req.city && <span className="flex items-center gap-1"><MapPin size={12} />{req.city}</span>}
                        {req.date && <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(req.date)}</span>}
                        {req.guests_count && <span className="flex items-center gap-1"><Users size={12} />{req.guests_count} אנשים</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="flex items-center gap-1 text-sm font-semibold"
                            style={{ color: count > 0 ? 'var(--brand-primary)' : 'var(--brand-muted-foreground)' }}>
                        <MessageSquare size={14} />
                        {count > 0 ? `${count} תגובות` : 'אין תגובות'}
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
