import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart } from 'lucide-react';
import SpaceCard from '@/components/spaces/SpaceCard';

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const favs = await base44.entities.Favorite.filter({ user_id: u.id });
      if (favs.length > 0) {
        const allSpaces = await base44.entities.Space.list('-created_date', 200);
        const favIds = new Set(favs.map(f => f.space_id));
        setSpaces(allSpaces.filter(s => favIds.has(s.id)));
      }
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-end justify-between gap-4 pb-4 mb-6"
           style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>מועדפים</span>
          <h1 className="font-bold text-3xl mt-1">המקומות ששמרתם</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
               style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
        </div>
      ) : spaces.length === 0 ? (
        <section className="text-center py-12" style={{ borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)', background: 'var(--brand-background)' }}>
          <div className="w-16 h-16 mx-auto mb-4 grid place-items-center"
               style={{ border: '2px solid var(--brand-primary)', background: 'var(--brand-accent)' }}>
            <Heart size={28} />
          </div>
          <h3 className="font-bold text-2xl mb-2">עדיין אין מועדפים</h3>
          <p style={{ color: 'var(--brand-muted-foreground)' }}>לחצו על הלב כדי לשמור מקומות שאהבתם</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {spaces.map(s => <SpaceCard key={s.id} space={s} user={user} />)}
        </div>
      )}
    </div>
  );
}
