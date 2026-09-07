import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CalendarDays } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ACTIVITIES, BOOKING_STATUSES } from '@/lib/constants';
import { formatPrice } from '@/lib/pricing';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const all = await base44.entities.Booking.filter({ guest_id: u.id }, '-created_date', 50);
      setBookings(all);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    }).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status) => {
    const s = BOOKING_STATUSES[status];
    if (!s) return null;
    const colorMap = {
      success: 'var(--brand-success)',
      warning: 'var(--brand-warning)',
      destructive: 'var(--brand-destructive)',
      muted: 'var(--brand-muted-foreground)',
    };
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1"
            style={{ borderRight: `4px solid ${colorMap[s.color]}`, background: 'var(--brand-surface)', color: colorMap[s.color] }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="pb-4 mb-6" style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>הזמנות</span>
        <h1 className="font-bold text-3xl mt-1">ההזמנות שלי</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
               style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
        </div>
      ) : bookings.length === 0 ? (
        <section className="text-center py-12" style={{ borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)', background: 'var(--brand-background)' }}>
          <div className="w-16 h-16 mx-auto mb-4 grid place-items-center"
               style={{ border: '2px solid var(--brand-primary)', background: 'var(--brand-accent)' }}>
            <CalendarDays size={28} />
          </div>
          <h3 className="font-bold text-2xl mb-2">אין הזמנות עדיין</h3>
          <p style={{ color: 'var(--brand-muted-foreground)' }}>חפשו חלל והזמינו את החוויה הראשונה</p>
        </section>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <Link key={b.id} to={`/bookings/${b.id}`} className="block">
              <article className="flex gap-4 p-4 border transition-all hover:border-primary"
                       style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)' }}>
                {b.space_image && (
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden" style={{ borderRadius: 'var(--brand-radius-sm)' }}>
                    <Image src={b.space_image} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold truncate">{b.space_title}</h3>
                    {statusBadge(b.status)}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--brand-muted-foreground)' }}>
                    {ACTIVITIES[b.activity]?.emoji} {ACTIVITIES[b.activity]?.label}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
                    {b.date} · {b.start_time}–{b.end_time}
                  </p>
                  <p className="font-bold mt-1">{formatPrice(b.total)}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
