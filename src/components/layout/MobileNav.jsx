import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, CalendarDays, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'בית', icon: Home },
  { path: '/search', label: 'חיפוש', icon: Search },
  { path: '/favorites', label: 'מועדפים', icon: Heart },
  { path: '/bookings', label: 'הזמנות', icon: CalendarDays },
  { path: '/profile', label: 'פרופיל', icon: User },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden"
         style={{ borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center py-2 px-3 min-w-0"
              style={{
                color: isActive ? 'var(--brand-primary)' : 'var(--brand-muted-foreground)',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-xs mt-0.5 font-semibold truncate">{item.label}</span>
              {isActive && (
                <div className="w-5 h-0.5 mt-0.5 rounded-full" style={{ background: 'var(--brand-accent)' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
