// Central pricing utility.
//
// PopSpot is a listing platform only — payment happens directly between
// guest and host, arranged via the in-app messaging feature. There is no
// platform commission, so the "total" here is just the host's own price;
// it exists purely as a shared estimate both sides see before booking.

export function calculateBookingPrice(hourlyPrice, hours) {
  const subtotal = hourlyPrice * hours;
  return {
    subtotal,
    total: subtotal,
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
