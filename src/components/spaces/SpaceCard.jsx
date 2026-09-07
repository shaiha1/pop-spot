import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Zap, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { ACTIVITIES, CATEGORIES } from '@/lib/constants';

export default function SpaceCard({ space, user }) {
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.Favorite.filter({ user_id: user.id, space_id: space.id })
      .then(favs => {
        if (favs.length > 0) { setIsFav(true); setFavId(favs[0].id); }
      }).catch(() => {});
  }, [user, space.id]);

  const toggleFav = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (isFav && favId) {
      await base44.entities.Favorite.delete(favId);
      setIsFav(false); setFavId(null);
    } else {
      const fav = await base44.entities.Favorite.create({ user_id: user.id, space_id: space.id });
      setIsFav(true); setFavId(fav.id);
    }
  };

  const mainImage = space.images?.[0];
  const startingPrice = space.starting_price || (space.activity_pricing?.[0]?.hourly_price) || 0;
  const category = space.category && CATEGORIES[space.category];
  const useCases = (space.activities || []).slice(0, 3);

  return (
    <Link to={`/space/${space.id}`} className="block group" dir="rtl">
      <article className="overflow-hidden border transition-all duration-200 group-hover:shadow-lg"
               style={{ borderColor: 'var(--brand-border)', borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-surface)', boxShadow: 'var(--brand-shadow-sm)' }}>

        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {mainImage ? (
            <Image src={mainImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full" style={{ background: 'var(--brand-muted)' }} />
          )}

          {/* Top overlay row */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3">
            {space.instant_booking ? (
              <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full"
                    style={{ background: 'var(--brand-accent)', color: 'var(--brand-primary)' }}>
                <Zap size={11} fill="currentColor" /> הזמנה מיידית
              </span>
            ) : <span />}
            <button onClick={toggleFav}
                    className="w-9 h-9 flex items-center justify-center transition-transform active:scale-90 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 1px 4px rgba(0,0,0,.18)' }}>
              <Heart size={17} fill={isFav ? 'var(--brand-destructive)' : 'none'}
                     stroke={isFav ? 'var(--brand-destructive)' : 'var(--brand-text)'} />
            </button>
          </div>

          {/* Bottom price overlay */}
          {startingPrice > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between"
                 style={{ background: 'linear-gradient(to top, rgba(23,32,42,0.65) 0%, transparent 100%)' }}>
              <span className="font-heading font-bold text-white" style={{ fontSize: 18 }}>
                ₪{startingPrice}
                <span className="font-body font-normal text-sm opacity-80"> /שעה</span>
              </span>
              {space.avg_rating > 0 && (
                <span className="flex items-center gap-1 text-white text-sm font-semibold">
                  <Star size={13} fill="var(--brand-accent)" stroke="none" />
                  {space.avg_rating.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="text-right" style={{ padding: 'var(--brand-sp-3) var(--brand-sp-4) var(--brand-sp-4)' }}>
          {/* City + activity badge */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--brand-muted-foreground)' }}>
              {space.city}{space.area ? ` · ${space.area}` : ''}
            </p>
            {category && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--brand-muted)', color: 'var(--brand-text)' }}>
                {category.emoji} {category.label}
              </span>
            )}
          </div>

          <h3 className="font-heading font-bold mb-2 leading-tight" style={{ fontSize: 17, color: 'var(--brand-text)' }}>
            {space.title}
          </h3>

          {useCases.length > 0 && (
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--brand-muted-foreground)' }}>
              מתאים ל: {useCases.map(a => ACTIVITIES[a]?.label || a).join(' · ')}
            </p>
          )}

          <div className="flex items-center gap-3 justify-end">
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--brand-muted-foreground)' }}>
              <Users size={13} /> עד {space.max_guests} אנשים
            </span>
            {space.review_count > 0 && (
              <span className="text-xs font-semibold" style={{ color: 'var(--brand-muted-foreground)' }}>
                · {space.review_count} ביקורות
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
