import React, { useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function SpaceMap({ space }) {
  const mapRef = useRef(null);

  // Build a Google Maps embed URL from coordinates or city/address
  const hasCoords = space.latitude && space.longitude;
  const query = hasCoords
    ? `${space.latitude},${space.longitude}`
    : encodeURIComponent([space.address, space.city, 'ישראל'].filter(Boolean).join(', '));

  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${space.latitude},${space.longitude}&z=14&output=embed`
    : `https://maps.google.com/maps?q=${query}&z=13&output=embed`;

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${space.latitude},${space.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="space-map-wrapper" style={{
      border: '1px solid var(--brand-border)',
      borderRadius: 'var(--brand-radius-md)',
      overflow: 'hidden',
      background: 'var(--brand-surface)',
      boxShadow: 'var(--brand-shadow-hairline)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
           style={{ borderBottom: '1px solid var(--brand-border)', background: 'var(--brand-surface)' }}>
        <div className="flex items-center gap-2">
          <MapPin size={20} style={{ color: 'var(--brand-primary)' }} />
          <div>
            <h3 className="font-heading font-bold text-base" style={{ color: 'var(--brand-text)' }}>המיקום</h3>
            <p className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>
              {space.city}{space.address ? `, ${space.address}` : ''}
            </p>
          </div>
        </div>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
           style={{
             border: '1px solid var(--brand-primary)',
             borderRadius: 'var(--brand-radius-md)',
             color: 'var(--brand-primary)',
             background: 'var(--brand-surface)',
           }}>
          <Navigation size={14} />
          ניווט
        </a>
      </div>

      {/* Map iframe */}
      <div style={{ position: 'relative', width: '100%', height: 320 }}>
        <iframe
          ref={mapRef}
          src={embedUrl}
          title="מפת מיקום"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
            filter: 'saturate(0.9) contrast(1.05)',
          }}
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  );
}
