// Central pricing utility
const GUEST_FEE_PERCENT = 0.05;
const HOST_FEE_PERCENT = 0.15;

export function calculateBookingPrice(hourlyPrice, hours) {
  const subtotal = hourlyPrice * hours;
  const guestFee = Math.round(subtotal * GUEST_FEE_PERCENT);
  const hostFee = Math.round(subtotal * HOST_FEE_PERCENT);
  const total = subtotal + guestFee;
  const hostPayout = subtotal - hostFee;
  const platformRevenue = guestFee + hostFee;

  return {
    subtotal,
    guestFee,
    hostFee,
    total,
    hostPayout,
    platformRevenue,
  };
}

export function formatPrice(amount) {
  return `₪${amount.toLocaleString('he-IL')}`;
}

export function calculateHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em - sh * 60 - sm) / 60;
}
