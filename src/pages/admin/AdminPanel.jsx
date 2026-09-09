import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/pricing';
import { BOOKING_STATUSES } from '@/lib/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function AdminPanel() {
  useDocumentMeta({ noindex: true });
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('spaces');
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (u.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(u);
      const [s, b, usr] = await Promise.all([
        base44.entities.Space.list('-created_date', 100),
        base44.entities.Booking.list('-created_date', 100),
        base44.entities.User.list('-created_date', 100).catch(() => []),
      ]);
      setSpaces(s);
      setBookings(b);
      setUsers(usr);
    }).catch(() => base44.auth.redirectToLogin(window.location.href))
      .finally(() => setLoading(false));
  }, []);

  const updateSpaceStatus = async (id, status) => {
    await base44.entities.Space.update(id, { status });
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const toggleHostVerified = async (id, current) => {
    await base44.entities.User.update(id, { is_verified_host: !current });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified_host: !current } : u));
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (id === user.id && newRole !== 'admin') {
      const confirmed = window.confirm('אתם עומדים להסיר מעצמכם הרשאות ניהול. להמשיך?');
      if (!confirmed) return;
    }
    await base44.entities.User.update(id, { role: newRole });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const tabs = [
    { id: 'spaces', label: `מקומות (${spaces.length})` },
    { id: 'bookings', label: `הזמנות (${bookings.length})` },
    { id: 'users', label: `משתמשים (${users.length})` },
  ];

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
           style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="pb-4 mb-6" style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>ניהול</span>
        <h1 className="font-bold text-3xl mt-1">פאנל ניהול</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor: 'var(--brand-border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex-1 text-center py-3 font-semibold border-b-4 transition-colors"
                  style={{
                    borderColor: tab === t.id ? 'var(--brand-accent)' : 'transparent',
                    color: tab === t.id ? 'var(--brand-primary)' : 'var(--brand-muted-foreground)',
                  }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Spaces Tab */}
      {tab === 'spaces' && (
        <div className="overflow-auto" style={{ borderTop: '3px solid var(--brand-text)' }}>
          <table className="w-full min-w-[600px]" style={{ background: 'var(--brand-surface)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>שם</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>עיר</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>סטטוס</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {spaces.map(s => (
                <tr key={s.id} className="hover:bg-background">
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{s.title}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{s.city}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <span className={s.status === 'active' ? 'if-badge-success' : 'if-badge-neutral'}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <div className="flex gap-2">
                      {s.status !== 'active' && (
                        <button onClick={() => updateSpaceStatus(s.id, 'active')}
                                className="text-xs font-semibold px-2 py-1"
                                style={{ background: 'var(--brand-success)', color: 'white', borderRadius: 'var(--brand-radius-sm)' }}>
                          אישור
                        </button>
                      )}
                      {s.status !== 'suspended' && (
                        <button onClick={() => updateSpaceStatus(s.id, 'suspended')}
                                className="text-xs font-semibold px-2 py-1"
                                style={{ background: 'var(--brand-destructive)', color: 'white', borderRadius: 'var(--brand-radius-sm)' }}>
                          השעיה
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        <div className="overflow-auto" style={{ borderTop: '3px solid var(--brand-text)' }}>
          <table className="w-full min-w-[600px]" style={{ background: 'var(--brand-surface)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>מקום</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>אורח</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>תאריך</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>סה"כ</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-background">
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{b.space_title}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{b.guest_name || b.guest_email}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{b.date}</td>
                  <td className="p-3 font-semibold" style={{ borderBottom: '1px solid var(--brand-border)' }}>{formatPrice(b.total || 0)}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <span className={b.status === 'accepted' ? 'if-badge-success' : b.status === 'pending' ? 'if-badge-warning' : 'if-badge-neutral'}>
                      {BOOKING_STATUSES[b.status]?.label || b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="overflow-auto" style={{ borderTop: '3px solid var(--brand-text)' }}>
          <table className="w-full min-w-[500px]" style={{ background: 'var(--brand-surface)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>שם</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>אימייל</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>תפקיד</th>
                <th className="text-right p-3 font-bold" style={{ background: 'var(--brand-muted)', borderBottom: '1px solid var(--brand-border)' }}>מארח מאומת</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-background">
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{u.full_name || '—'}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>{u.email}</td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <button onClick={() => toggleRole(u.id, u.role)}
                            className="text-xs font-semibold px-2 py-1"
                            style={{
                              background: u.role === 'admin' ? 'var(--brand-secondary)' : 'var(--brand-muted)',
                              color: u.role === 'admin' ? 'white' : 'var(--brand-text)',
                              borderRadius: 'var(--brand-radius-sm)',
                            }}>
                      {u.role === 'admin' ? '👑 admin' : 'user'}
                    </button>
                  </td>
                  <td className="p-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <button onClick={() => toggleHostVerified(u.id, u.is_verified_host)}
                            className="text-xs font-semibold px-2 py-1"
                            style={{
                              background: u.is_verified_host ? 'var(--brand-success)' : 'var(--brand-muted)',
                              color: u.is_verified_host ? 'white' : 'var(--brand-text)',
                              borderRadius: 'var(--brand-radius-sm)',
                            }}>
                      {u.is_verified_host ? '✓ מאומת' : 'סמן כמאומת'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
