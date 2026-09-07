import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { ACTIVITIES, BOOKING_STATUSES } from '@/lib/constants';
import { formatPrice } from '@/lib/pricing';
import { useToast } from '@/components/ui/use-toast';
import { Star } from 'lucide-react';
import BookingMessages from '@/components/booking/BookingMessages';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.get(id),
      base44.auth.me(),
    ]).then(async ([b, u]) => {
      setBooking(b);
      setUser(u);
      if (u && b.status === 'completed') {
        const existing = await base44.entities.Review.filter({ booking_id: id, reviewer_id: u.id }).catch(() => []);
        if (existing.length > 0) setHasReviewed(true);
      }
    }).catch(() => navigate('/bookings'))
      .finally(() => setLoading(false));
  }, [id]);

  const cancelBooking = async () => {
    await base44.entities.Booking.update(id, { status: 'cancelled' });
    setBooking(prev => ({ ...prev, status: 'cancelled' }));
    toast({ title: 'ההזמנה בוטלה' });
  };

  const submitReview = async () => {
    // Prevent a duplicate review for the same booking.
    const existing = await base44.entities.Review.filter({ booking_id: id, reviewer_id: user.id }).catch(() => []);
    if (existing.length > 0) {
      setHasReviewed(true);
      setShowReview(false);
      return;
    }

    await base44.entities.Review.create({
      space_id: booking.space_id,
      booking_id: id,
      reviewer_id: user.id,
      reviewer_name: user.full_name || 'אנונימי',
      host_id: booking.host_id,
      rating,
      text: reviewText,
    });
    // Update space avg_rating and review_count
    try {
      const allReviews = await base44.entities.Review.filter({ space_id: booking.space_id });
      const total = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avg = allReviews.length > 0 ? total / allReviews.length : 0;
      await base44.entities.Space.update(booking.space_id, {
        avg_rating: Math.round(avg * 10) / 10,
        review_count: allReviews.length,
      });
    } catch (e) { /* rating update is best-effort */ }
    setHasReviewed(true);
    setShowReview(false);
    toast({ title: 'תודה על הביקורת!' });
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
           style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
    </div>
  );

  if (!booking) return null;

  const status = BOOKING_STATUSES[booking.status];
  const isGuest = user?.id === booking.guest_id;
  const isHost = user?.id === booking.host_id;
  const canCancel = isGuest && ['pending', 'accepted'].includes(booking.status);
  const canReview = isGuest && booking.status === 'completed' && !hasReviewed;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/bookings" className="text-sm font-semibold mb-4 inline-block" style={{ color: 'var(--brand-primary)' }}>
        ← חזרה להזמנות
      </Link>

      <div className="p-5" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
        {booking.space_image && (
          <div className="w-full h-48 mb-4 overflow-hidden" style={{ borderRadius: 0 }}>
            <Image src={booking.space_image} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <Link to={`/space/${booking.space_id}`} className="font-bold text-xl hover:underline">
              {booking.space_title}
            </Link>
            <p className="text-sm mt-1" style={{ color: 'var(--brand-muted-foreground)' }}>
              {ACTIVITIES[booking.activity]?.emoji} {ACTIVITIES[booking.activity]?.label}
            </p>
          </div>
          {status && (
            <span className="text-xs font-semibold px-3 py-1"
                  style={{
                    borderRight: `4px solid ${booking.status === 'accepted' ? 'var(--brand-success)' : booking.status === 'pending' ? 'var(--brand-warning)' : 'var(--brand-destructive)'}`,
                    background: 'var(--brand-surface)',
                    color: booking.status === 'accepted' ? 'var(--brand-success)' : booking.status === 'pending' ? 'var(--brand-warning)' : 'var(--brand-destructive)'
                  }}>
              {status.label}
            </span>
          )}
        </div>

        <div className="space-y-2 py-3" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--brand-muted-foreground)' }}>תאריך</span>
            <span className="font-semibold">{booking.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--brand-muted-foreground)' }}>שעות</span>
            <span className="font-semibold">{booking.start_time} - {booking.end_time} ({booking.hours} שעות)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--brand-muted-foreground)' }}>אורחים</span>
            <span className="font-semibold">{booking.guests_count}</span>
          </div>
        </div>

        <div className="space-y-2 py-3" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <div className="flex justify-between text-sm">
            <span>מחיר מקום</span>
            <span>{formatPrice(booking.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
            <span>עמלת שירות</span>
            <span>{formatPrice(booking.guest_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2" style={{ borderTop: '1px solid var(--brand-border)' }}>
            <span>סה"כ</span>
            <span>{formatPrice(booking.total)}</span>
          </div>
        </div>

        {canCancel && (
          <button onClick={cancelBooking} className="if-btn-danger w-full mt-4">
            ביטול הזמנה
          </button>
        )}

        {canReview && !showReview && (
          <button onClick={() => setShowReview(true)} className="if-btn-secondary w-full mt-4">
            כתיבת ביקורת
          </button>
        )}

        {showReview && (
          <div className="mt-4 p-4" style={{ background: 'var(--brand-background)', borderRadius: 'var(--brand-radius-md)' }}>
            <h3 className="font-bold mb-1">דירוג החוויה</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--brand-muted-foreground)' }}>בחרו כמה כוכבים מגיע למקום</p>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform active:scale-90">
                  <Star size={32} fill={s <= (hoverRating || rating) ? 'var(--brand-warning)' : 'none'}
                        stroke={s <= (hoverRating || rating) ? 'var(--brand-warning)' : 'var(--brand-border)'} />
                </button>
              ))}
              <span className="mr-2 font-bold text-lg" style={{ color: 'var(--brand-text)' }}>
                {rating}/5
              </span>
            </div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                      placeholder="ספרו לאורחים אחרים על החוויה שלכם..."
                      className="if-field-input mb-3" rows={3}
                      style={{ minHeight: 'auto', padding: 'var(--brand-sp-3)' }} />
            <button onClick={submitReview} className="if-btn-primary w-full">
              <span>פרסום ביקורת</span>
            </button>
          </div>
        )}

        {hasReviewed && booking.status === 'completed' && (
          <div className="mt-4 p-4 text-center" style={{ background: 'var(--brand-background)', borderRadius: 'var(--brand-radius-md)', borderRight: '4px solid var(--brand-success)' }}>
            <p className="font-semibold" style={{ color: 'var(--brand-success)' }}>✓ תודה רבה על הביקורת!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--brand-muted-foreground)' }}>הביקורת שלך מופיעה בעמוד המתחם</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="mt-6">
        <BookingMessages bookingId={id} user={user} recipientId={isGuest ? booking.host_id : booking.guest_id} />
      </div>
    </div>
  );
}
