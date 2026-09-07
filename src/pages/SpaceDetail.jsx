import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, Users, Heart, Zap, MapPin, ChevronLeft, ChevronRight, Clock, Shield } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ACTIVITIES, AMENITIES, CANCELLATION_POLICIES, DAYS_HE, CATEGORIES, PRICING_UNITS } from '@/lib/constants';
import { formatPrice } from '@/lib/pricing';
import BookingPanel from '@/components/booking/BookingPanel';
import ReviewsList from '@/components/spaces/ReviewsList';
import SpaceMap from '@/components/spaces/SpaceMap';

export default function SpaceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => {
    // Route param is normally a human-readable slug; fall back to a raw id
    // lookup for older links (e.g. a booking's stored space_id).
    async function resolveSpace() {
      const bySlug = await base44.entities.Space.filter({ slug });
      if (bySlug.length > 0) return bySlug[0];
      return base44.entities.Space.get(slug);
    }
    Promise.all([
      resolveSpace(),
      base44.auth.me().catch(() => null),
    ]).then(([s, u]) => {
      setSpace(s);
      setUser(u);
      if (u) {
        base44.entities.Favorite.filter({ user_id: u.id, space_id: s.id })
          .then(favs => {
            if (favs.length > 0) { setIsFav(true); setFavId(favs[0].id); }
          }).catch(() => {});
      }
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleFav = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (isFav && favId) {
      await base44.entities.Favorite.delete(favId);
      setIsFav(false);
      setFavId(null);
    } else {
      const fav = await base44.entities.Favorite.create({ user_id: user.id, space_id: space.id });
      setIsFav(true);
      setFavId(fav.id);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
           style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
    </div>
  );

  if (!space) return null;

  const images = space.images || [];
  const nextImage = () => setCurrentImage(i => (i + 1) % images.length);
  const prevImage = () => setCurrentImage(i => (i - 1 + images.length) % images.length);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative mb-6" style={{ aspectRatio: '16/8', borderRadius: 0, overflow: 'hidden' }}>
          <Image src={images[currentImage]} className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.9)' }}>
                <ChevronRight size={20} />
              </button>
              <button onClick={nextImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.9)' }}>
                <ChevronLeft size={20} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                          className="w-2 h-2 rounded-full"
                          style={{ background: i === currentImage ? 'white' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </div>
            </>
          )}
          <button onClick={toggleFav}
                  className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.9)' }}>
            <Heart size={20} fill={isFav ? 'var(--brand-destructive)' : 'none'} stroke={isFav ? 'var(--brand-destructive)' : 'var(--brand-text)'} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title */}
          <div style={{ borderBottom: '2px solid var(--brand-text)', paddingBottom: 'var(--brand-sp-4)' }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{space.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1" style={{ color: 'var(--brand-muted-foreground)' }}>
                <MapPin size={16} /> {space.city}{space.address ? `, ${space.address}` : ''}
              </span>
              {space.avg_rating > 0 && (
                <span className="flex items-center gap-1 font-semibold">
                  <Star size={16} fill="var(--brand-warning)" stroke="var(--brand-warning)" />
                  {space.avg_rating.toFixed(1)} ({space.review_count} ביקורות)
                </span>
              )}
              <span className="flex items-center gap-1" style={{ color: 'var(--brand-muted-foreground)' }}>
                <Users size={16} /> עד {space.max_guests} אנשים
              </span>
              {space.category && CATEGORIES[space.category] && (
                <span className="if-badge-neutral">{CATEGORIES[space.category].emoji} {CATEGORIES[space.category].label}</span>
              )}
              {space.instant_booking && (
                <span className="if-badge-success">
                  <Zap size={12} /> הזמנה מיידית
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-bold text-xl mb-3">על המקום</h2>
            <p style={{ color: 'var(--brand-text)', whiteSpace: 'pre-line' }}>{space.description}</p>
          </div>

          {/* Suited For */}
          {space.activities?.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-3">מתאים עבור</h2>
              <div className="flex flex-wrap gap-2">
                {space.activities.map(a => (
                  <span key={a} className="text-sm font-semibold px-3 py-2 rounded-full"
                        style={{ background: 'var(--brand-muted)', color: 'var(--brand-text)' }}>
                    {ACTIVITIES[a]?.emoji} {ACTIVITIES[a]?.label || a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing By Use */}
          {space.activity_pricing?.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-3">מחיר לפי שימוש</h2>
              <div className="space-y-2">
                {space.activity_pricing.map((ap, i) => {
                  const unit = PRICING_UNITS[ap.pricing_unit || 'hour'];
                  return (
                    <div key={i} className="flex items-center justify-between p-3"
                         style={{ borderBottom: '1px solid var(--brand-border)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{ACTIVITIES[ap.activity]?.emoji || '📍'}</span>
                        <div>
                          <p className="font-semibold">{ACTIVITIES[ap.activity]?.label || ap.activity}</p>
                          <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
                            מינימום {ap.min_hours} שעות · עד {ap.max_guests} אנשים
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">{formatPrice(ap.hourly_price)}<span className="text-sm font-normal" style={{ color: 'var(--brand-muted-foreground)' }}>{unit.suffix}</span></p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amenities */}
          {space.amenities?.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-3">מה יש במקום</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {space.amenities.map(a => {
                  const am = AMENITIES.find(x => x.id === a);
                  return am ? (
                    <div key={a} className="flex items-center gap-2 p-2"
                         style={{ borderBottom: '1px solid var(--brand-border)' }}>
                      <span>{am.emoji}</span>
                      <span className="text-sm">{am.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Map */}
          <SpaceMap space={space} />

          {/* Availability */}
          {space.availability_rules?.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-3">
                <Clock size={20} className="inline ml-2" />
                שעות פעילות
              </h2>
              <div className="space-y-1">
                {space.availability_rules.filter(r => r.enabled).map((r, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm"
                       style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <span className="font-semibold">{DAYS_HE[r.day] || r.day}</span>
                    <span>{r.start_time} - {r.end_time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {space.rules && (
            <div>
              <h2 className="font-bold text-xl mb-3">חוקי הבית</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{space.rules}</p>
            </div>
          )}

          {/* Cancellation */}
          <div>
            <h2 className="font-bold text-xl mb-3">
              <Shield size={20} className="inline ml-2" />
              מדיניות ביטול
            </h2>
            <p className="font-semibold">{CANCELLATION_POLICIES[space.cancellation_policy || 'moderate'].label}</p>
            <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
              {CANCELLATION_POLICIES[space.cancellation_policy || 'moderate'].description}
            </p>
          </div>

          {/* Reviews */}
          <ReviewsList spaceId={space.id} />
        </div>

        {/* Booking Panel - Desktop Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <BookingPanel space={space} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
