import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, LayoutDashboard, LogOut, Settings, Shield } from 'lucide-react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function Profile() {
  useDocumentMeta({ noindex: true });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
           style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
    </div>
  );

  if (!user) return null;

  const menuItems = [
    { label: 'לוח בקרה למארחים', path: '/host', icon: LayoutDashboard },
    { label: 'ההזמנות שלי', path: '/bookings', icon: Settings },
    { label: 'המועדפים שלי', path: '/favorites', icon: User },
  ];

  if (user.role === 'admin') {
    menuItems.push({ label: 'ניהול (אדמין)', path: '/admin', icon: Shield });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="pb-4 mb-6" style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>פרופיל</span>
        <h1 className="font-bold text-3xl mt-1">החשבון שלי</h1>
      </div>

      <div className="p-5 mb-6" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
               style={{ background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}>
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-xl">{user.full_name || 'משתמש'}</h2>
            <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
                  className="flex items-center gap-3 py-3 px-1 font-semibold transition-all"
                  style={{ borderBottom: '1px solid var(--brand-border)' }}>
              <Icon size={20} style={{ color: 'var(--brand-primary)' }} />
              {item.label}
            </Link>
          );
        })}
        <button onClick={handleLogout}
                className="flex items-center gap-3 py-3 px-1 font-semibold w-full"
                style={{ color: 'var(--brand-destructive)', borderBottom: '1px solid var(--brand-border)' }}>
          <LogOut size={20} />
          התנתקות
        </button>
      </div>
    </div>
  );
}
