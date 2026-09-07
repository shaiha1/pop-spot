import React from 'react';
import { Link } from 'react-router-dom';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function SiteFooter() {
  return (
    <>
      {/* CTA Band */}
      <footer className="hidden md:grid"
              dir="rtl"
              style={{
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 'var(--brand-sp-6)',
                margin: 'var(--brand-sp-6) var(--brand-sp-5)',
                padding: 'var(--brand-sp-6) var(--brand-sp-5)',
                borderRadius: 'var(--brand-radius-lg)',
                background: 'var(--brand-secondary)',
                color: 'var(--brand-on-primary)',
                fontFamily: 'var(--brand-font-body)',
              }}>
        <div className="text-right">
          <span style={{ color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 13 }}>
            רוצים להרוויח מהנכס שלכם?
          </span>
          <h2 className="font-heading font-bold mt-2"
              style={{ fontSize: 'clamp(26px,3vw,38px)', lineHeight: 1.08, letterSpacing: '-0.025em', maxWidth: 600 }}>
            פרסמו את המקום שלכם והתחילו להרוויח כבר היום.
          </h2>
        </div>
        <Link to="/host/spaces/new"
              className="if-btn-primary flex items-center gap-2 flex-shrink-0"
              style={{ minHeight: 52, display: 'inline-flex' }}>
          <span>פרסמו מקום</span>
        </Link>
      </footer>

      {/* Utility footer */}
      <footer className="hidden md:flex justify-between items-center"
              dir="rtl"
              style={{
                padding: 'var(--brand-sp-3) var(--brand-sp-5)',
                borderTop: '1px solid var(--brand-border)',
                background: 'var(--brand-surface)',
                color: 'var(--brand-muted-foreground)',
                fontFamily: 'var(--brand-font-body)',
                fontSize: 14,
              }}>
        <span>© 2026 POPSPOT · השכרת מקומות לפי שעה בישראל</span>
        <nav className="flex gap-5">
          {['פרטיות', 'תנאי שימוש'].map(t => (
            <a key={t} href="#" style={{ color: 'var(--brand-muted-foreground)', minHeight: 44, display: 'flex', alignItems: 'center' }}
               onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-primary)'}
               onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted-foreground)'}>
              {t}
            </a>
          ))}
          <a href="mailto:info@popspot.co.il"
             style={{ color: 'var(--brand-muted-foreground)', minHeight: 44, display: 'flex', alignItems: 'center' }}
             onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-primary)'}
             onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted-foreground)'}>
            צור קשר · מייל
          </a>
          <a href="https://wa.me/972559733667"
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-1.5"
             style={{ color: 'var(--brand-muted-foreground)', minHeight: 44 }}
             onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-primary)'}
             onMouseLeave={e => e.currentTarget.style.color = 'var(--brand-muted-foreground)'}>
            <WhatsAppIcon className="w-4 h-4" />
            צור קשר · ווטסאפ
          </a>
        </nav>
      </footer>
    </>
  );
}
