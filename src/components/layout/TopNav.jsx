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
  { path: '/favorites', label: 'מועדפים' },
  { path: '/bookings', label: 'הזמנות' }];


  return (
    <nav className="hidden md:flex items-center w-full min-h-[72px] px-8"
    dir="rtl"
    style={{
      background: 'linear-gradient(90deg, #EEF2EA 0%, #F4F7EF 50%, #EEF2EA 100%)',
      borderBottom: '1px solid #DCE4D6',
      fontFamily: 'var(--brand-font-body)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <Link to="/" className="font-heading font-bold ms-auto text-5xl"
      style={{ color: '#1A3329', letterSpacing: '-0.02em' }}>
        POPSPOT
      </Link>

      <div className="flex items-center gap-1 ms-auto">
        {navLinks.map((link) => {
          const isActive = link.path !== '/' && location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center min-h-[44px] px-4 font-semibold text-sm transition-all rounded-full"
              style={{
                background: isActive ? 'rgba(27,122,77,0.10)' : 'transparent',
                color: isActive ? '#1B7A4D' : '#2A3B32',
                borderBottom: isActive ? '2px solid #1B7A4D' : '2px solid transparent',
                borderRadius: isActive ? '12px' : '999px'
              }}>
              {link.label}
            </Link>);
        })}
        <Link to="/host" className="flex items-center min-h-[44px] px-4 font-semibold text-sm transition-all rounded-full"
        style={{ color: '#2A3B32', borderBottom: '2px solid transparent' }}>
          פרסמו מקום
        </Link>
      </div>

      <div className="ms-2">
        {user ?
        <Link to="/profile"
        className="flex items-center gap-2 px-3 font-semibold text-sm transition-all rounded-full"
        style={{ minHeight: 44, background: '#1B7A4D', color: '#fff' }}>
            <span className="w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs"
          style={{ background: '#fff', color: '#1B7A4D' }}>
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
