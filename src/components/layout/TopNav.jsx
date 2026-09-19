import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function TopNav() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const navLinks = [
  { path: '/search', label: 'חיפוש' },
  { path: '/requests', label: 'לוח בקשות' },
  { path: '/favorites', label: 'מועדפים' },
  { path: '/bookings', label: 'הזמנות' }];


  return (
    <nav className="hidden md:flex items-center w-full min-h-[80px] px-8"
    dir="rtl"
    style={{
      background: 'rgba(252,249,248,0.92)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      fontFamily: 'var(--brand-font-body)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <Link to="/" className="flex items-center gap-2 ms-auto">
        <span className="font-heading font-bold text-2xl tracking-wider transition-colors"
        style={{ color: 'var(--brand-primary)' }}>
          POPSPOT
        </span>
        <span className="w-2 h-2 rounded-full inline-block mb-1" style={{ background: 'var(--brand-emerald-vibrant)' }} />
        <span className="mr-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
        style={{ background: 'var(--brand-gold-bg)', color: 'var(--brand-warning)', border: '1px solid rgba(212,175,55,0.3)' }}>
          ישראל
        </span>
      </Link>

      <div className="flex items-center gap-1 ms-auto p-1 rounded-full" style={{ background: 'rgba(240,237,236,0.6)' }}>
        {navLinks.map((link) => {
          const isActive = link.path !== '/' && location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center min-h-[40px] px-4 font-semibold text-sm rounded-full transition-all"
              style={{
                background: isActive ? '#F4F7EF' : 'transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--brand-muted-foreground)',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.02)' : 'none'
              }}>
              {link.label}
            </Link>);
        })}
      </div>

      <div className="flex items-center gap-2 ms-2">
        <Link to="/host" className="hidden lg:inline-flex items-center px-4 py-2.5 rounded-full font-semibold text-sm transition-all"
        style={{ color: 'var(--brand-primary)', background: '#F4F7EF' }}>
          הפכו למארחים
        </Link>
        {user ?
        <Link to="/profile"
        className="flex items-center gap-2 px-3 font-semibold text-sm transition-all rounded-full"
        style={{ minHeight: 44, background: 'var(--brand-primary)', color: '#fff' }}>
            <span className="w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs"
          style={{ background: '#fff', color: 'var(--brand-primary)' }}>
              {(user.full_name || user.email || '?')[0].toUpperCase()}
            </span>
            {user.full_name?.split(' ')[0] || 'פרופיל'}
          </Link> :

        <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
        className="if-btn-primary">
            <span>התחברות</span>
          </button>
        }
      </div>
    </nav>);

}
