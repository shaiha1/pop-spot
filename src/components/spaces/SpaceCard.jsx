import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Zap, MapPin } from 'lucide-react';
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
    <Link to={`/space/${space.slug || space.id}`} className="block group" dir="rtl">
      <article className="overflow-hidden transition-all duration-300 flex flex-col"
               style={{ borderRadius: '1rem', background: 'var(--brand-surface)', boxShadow: 'var(--brand-shadow-sm)' }}>

        {/* Image */}
        <div className="relative overflow-hidden bg-surface-container" style={{ aspectRatio: '16/10' }}>
          {mainImage ? (
            <Image src={mainImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full" style={{ background: 'var(--brand-muted)' }} />
          )}

          <button onClick={toggleFav}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center transition-transform active:scale-90 rounded-full backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }}>
            <Heart size={17} fill={isFav ? 'var(--brand-destructive)' : 'none'}
                   stroke={isFav ? 'var(--brand-destructive)' : 'var(--brand-muted-foreground)'} />
          </button>

          {space.instant_booking && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
                    style={{ background: 'var(--brand-accent)', color: 'var(--brand-emerald-deep)' }}>
                <Zap size={12} fill="currentColor" /> אישור מיידי
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 justify-between p-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--brand-muted-foreground)' }}>
              <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--brand-primary)' }}>
                <MapPin size={14} /> {space.city}{space.area ? ` · ${space.area}` : ''}
              </span>
              {space.avg_rating > 0 && (
                <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--brand-text)' }}>
                  <Star size={14} fill="var(--brand-rating-star)" stroke="none" />
                  {space.avg_rating.toFixed(2)}
                  {space.review_count > 0 && <span style={{ color: 'var(--brand-muted-foreground)' }}>({space.review_count})</span>}
                </span>
              )}
            </div>

            <h3 className="font-heading font-semibold mb-1 leading-tight line-clamp-1" style={{ fontSize: 17, color: 'var(--brand-text)' }}>
              {space.title}
            </h3>

            <p className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>
              מתאים ל: עד {space.max_guests} אנשים
              {useCases.length > 0 && ` · ${useCases.map(a => ACTIVITIES[a]?.label || a).join(', ')}`}
              {category ? ` (${category.emoji} ${category.label})` : ''}
            </p>
          </div>

          {startingPrice > 0 && (
            <div className="mt-3 pt-2 -mx-4 -mb-4 px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--brand-surface-cream)' }}>
              <div className="flex items-baseline gap-1">
                <span className="font-heading font-bold" style={{ fontSize: 18, color: 'var(--brand-primary)' }}>₪{startingPrice}</span>
                <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>/ שעה</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--brand-emerald-vibrant)' }}>פרטים והזמנה</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
