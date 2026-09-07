import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Home } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import DashboardCharts from '@/components/host/DashboardCharts';

export default function HostDashboard() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [s, b] = await Promise.all([
        base44.entities.Space.filter({ host_id: u.id }, '-created_date', 50).catch(() => []),
        base44.entities.Booking.filter({ host_id: u.id }, '-created_date', 50).catch(() => []),
      ]);
      setSpaces(s);
      setBookings(b);
    }).catch(() => base44.auth.redirectToLogin(window.location.href))
      .finally(() => setLoading(false));
  }, []);

  const totalEarnings = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.host_payout || 0), 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');

  const handleBookingUpdate = (id, status) => {
    setBookings(prev => prev.map(x => x.id === id ? { ...x, status } : x));
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
           style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pb-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>מארחים</span>
          <h1 className="font-heading font-bold text-4xl mt-1" style={{ color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>לוח הבקרה</h1>
          <p className="mt-1" style={{ color: 'var(--brand-muted-foreground)' }}>{spaces.length} מקומות · {bookings.length} הזמנות</p>
        </div>
        <Link to="/host/spaces/new" className="if-btn-primary flex items-center gap-2">
          <Plus size={18} className="relative z-10" />
          <span>מקום חדש</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5" style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', boxShadow: 'var(--brand-shadow-sm)' }}>
          <span className="font-semibold text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>מקומות פעילים</span>
          <strong className="block text-4xl font-bold mt-2 font-heading" style={{ color: 'var(--brand-text)' }}>{spaces.filter(s => s.status === 'active').length}</strong>
        </div>
        <div className="p-5" style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', boxShadow: 'var(--brand-shadow-sm)' }}>
          <span className="font-semibold text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>הזמנות ממתינות</span>
          <strong className="block text-4xl font-bold mt-2 font-heading" style={{ color: 'var(--brand-warning)' }}>{pendingBookings.length}</strong>
        </div>
        <div className="p-5" style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-secondary)', border: '1px solid var(--brand-secondary)', boxShadow: 'var(--brand-shadow-sm)' }}>
          <span className="font-semibold text-sm" style={{ color: 'var(--brand-accent)' }}>הכנסות כוללות</span>
          <strong className="block text-4xl font-bold mt-2 font-heading" style={{ color: '#fff' }}>{formatPrice(totalEarnings)}</strong>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts bookings={bookings} />

      {/* Pending Bookings */}
      {pendingBookings.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading font-bold text-xl mb-3" style={{ color: 'var(--brand-text)' }}>
            הזמנות ממתינות לאישור
          </h2>
          <div className="space-y-3">
            {pendingBookings.map(b => (
              <HostBookingRow key={b.id} booking={b} onUpdate={handleBookingUpdate} />
            ))}
          </div>
        </section>
      )}

      {/* Accepted Bookings */}
      {acceptedBookings.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading font-bold text-xl mb-3" style={{ color: 'var(--brand-text)' }}>
            הזמנות מאושרות
          </h2>
          <div className="space-y-3">
            {acceptedBookings.map(b => (
              <HostBookingRow key={b.id} booking={b} onUpdate={handleBookingUpdate} />
            ))}
          </div>
        </section>
      )}

      {/* Spaces */}
      <section>
        <h2 className="font-heading font-bold text-xl mb-3" style={{ color: 'var(--brand-text)' }}>המקומות שלי</h2>
        {spaces.length === 0 ? (
          <div className="text-center py-10 px-4" style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-muted)' }}>
            <div className="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-full" style={{ background: 'var(--brand-accent)' }}>
              <Home size={28} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h3 className="font-bold text-xl mb-2">עדיין אין מקומות</h3>
            <p className="mb-4" style={{ color: 'var(--brand-muted-foreground)' }}>צרו את המקום הראשון שלכם ותתחילו להרוויח</p>
            <Link to="/host/spaces/new" className="if-btn-primary inline-flex">
              <span>צור מקום חדש</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {spaces.map(s => (
              <Link key={s.id} to={`/host/spaces/${s.id}/edit`}
                    className="flex items-center justify-between gap-4 py-3 px-4 transition-all"
                    style={{ borderRadius: 'var(--brand-radius-md)', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>{s.city}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.status === 'active' ? 'if-badge-success' : 'if-badge-neutral'}`}>
                  {s.status === 'active' ? 'פעיל' : s.status === 'draft' ? 'טיוטה' : s.status === 'pending_review' ? 'ממתין לאישור' : s.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HostBookingRow({ booking, onUpdate }) {
  const [processing, setProcessing] = useState(false);

  const handleAction = async (status) => {
    setProcessing(true);
    await base44.entities.Booking.update(booking.id, { status });
    onUpdate(booking.id, status);
    setProcessing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4" style={{ borderRadius: 'var(--brand-radius-md)', border: '1px solid var(--brand-border)', background: 'var(--brand-surface)' }}>
      <div>
        <p className="font-semibold">{booking.guest_name || 'אורח'}</p>
        <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
          {booking.space_title} · {booking.date} · {booking.start_time}–{booking.end_time}
        </p>
        <p className="text-sm font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>{formatPrice(booking.total)}</p>
      </div>
      <div className="flex gap-2">
        {booking.status === 'pending' && (
          <>
            <button onClick={() => handleAction('accepted')} disabled={processing}
                    className="if-btn-primary text-sm" style={{ minHeight: 36 }}>
              <span>אישור</span>
            </button>
            <button onClick={() => handleAction('rejected')} disabled={processing}
                    className="if-btn-danger text-sm" style={{ minHeight: 36 }}>
              דחייה
            </button>
          </>
        )}
        {booking.status === 'accepted' && (
          <button onClick={() => handleAction('completed')} disabled={processing}
                  className="if-btn-secondary text-sm" style={{ minHeight: 36 }}>
            סיום הזמנה
          </button>
        )}
      </div>
    </div>
  );
}
