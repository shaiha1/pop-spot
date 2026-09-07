import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ACTIVITIES, PRICING_UNITS } from '@/lib/constants';
import { formatPrice, calculateBookingPrice, calculateHours } from '@/lib/pricing';
import { useToast } from '@/components/ui/use-toast';

export default function BookingPanel({ space, user }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activity, setActivity] = useState(space.activity_pricing?.[0]?.activity || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedPricing = space.activity_pricing?.find(p => p.activity === activity);
  const hourlyPrice = selectedPricing?.hourly_price || 0;
  const minHours = selectedPricing?.min_hours || 1;
  const hours = startTime && endTime ? calculateHours(startTime, endTime) : 0;
  const pricing = hours > 0 ? calculateBookingPrice(hourlyPrice, hours) : null;
  const isValid = activity && date && startTime && endTime && hours >= minHours && guests > 0;

  const handleBook = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!isValid) return;
    setSubmitting(true);

    // Check overlapping bookings for this space on this date
    const existing = await base44.entities.Booking.filter({
      space_id: space.id,
      date,
      status: 'accepted',
    }).catch(() => []);

    const hasOverlap = existing.some(b => {
      return startTime < b.end_time && endTime > b.start_time;
    });

    if (hasOverlap) {
      toast({ title: 'שעות תפוסות', description: 'השעות שנבחרו כבר תפוסות, נסה שעות אחרות', variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const booking = await base44.entities.Booking.create({
      space_id: space.id,
      space_title: space.title,
      space_image: space.images?.[0] || '',
      host_id: space.host_id || space.created_by_id,
      guest_id: user.id,
      guest_name: user.full_name || '',
      guest_email: user.email || '',
      activity,
      date,
      start_time: startTime,
      end_time: endTime,
      hours,
      guests_count: guests,
      hourly_price: hourlyPrice,
      subtotal: pricing.subtotal,
      total: pricing.total,
      host_payout: pricing.total,
      status: space.instant_booking ? 'accepted' : 'pending',
      payment_status: 'unpaid',
    });

    setSubmitting(false);
    setShowConfirmation(true);

    setTimeout(() => {
      navigate(`/bookings/${booking.id}`);
    }, 2000);
  };

  if (showConfirmation) {
    return (
      <div className="p-6 text-center" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-success)', color: 'white' }}>
          ✓
        </div>
        <h3 className="font-bold text-xl mb-2">ההזמנה נשלחה!</h3>
        <p style={{ color: 'var(--brand-muted-foreground)' }}>
          {space.instant_booking ? 'ההזמנה אושרה מיידית' : 'ממתין לאישור המארח'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
      <h3 className="font-bold text-xl mb-4">הזמנת המקום</h3>

      {/* Activity */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">סוג פעילות</label>
        <select value={activity} onChange={e => setActivity(e.target.value)} className="if-field-input">
          <option value="">בחרו פעילות</option>
          {space.activity_pricing?.map(ap => (
            <option key={ap.activity} value={ap.activity}>
              {ACTIVITIES[ap.activity]?.emoji} {ACTIVITIES[ap.activity]?.label || ap.activity} - {formatPrice(ap.hourly_price)}{PRICING_UNITS[ap.pricing_unit || 'hour']?.suffix}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">תאריך</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
               min={new Date().toISOString().split('T')[0]}
               className="if-field-input" />
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">שעת התחלה</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                 className="if-field-input" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">שעת סיום</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                 className="if-field-input" />
        </div>
      </div>

      {hours > 0 && hours < minHours && (
        <p className="text-sm mb-3" style={{ color: 'var(--brand-destructive)' }}>
          מינימום הזמנה: {minHours} שעות
        </p>
      )}

      {/* Guests */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">מספר אורחים</label>
        <input type="number" value={guests} onChange={e => setGuests(Number(e.target.value))}
               min={1} max={selectedPricing?.max_guests || space.max_guests || 50}
               className="if-field-input" />
      </div>

      {/* Price Summary */}
      {pricing && hours >= minHours && (
        <div className="mb-4 py-3" style={{ borderTop: '1px solid var(--brand-border)', borderBottom: '1px solid var(--brand-border)' }}>
          <div className="flex justify-between font-bold text-lg">
            <span>{formatPrice(hourlyPrice)} × {hours} שעות</span>
            <span>{formatPrice(pricing.total)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={!isValid || submitting}
        className="if-btn-primary w-full flex items-center justify-center"
      >
        <span>{submitting ? 'שולח...' : space.instant_booking ? 'הזמנה מיידית' : 'שליחת בקשת הזמנה'}</span>
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--brand-muted-foreground)' }}>
        PopSpot הוא פלטפורמת פרסום בלבד — התשלום מתבצע ישירות מול בעל המקום, תאמו את הפרטים בהודעות לאחר אישור ההזמנה
      </p>
    </div>
  );
}
