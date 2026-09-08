import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/lib/seoContent';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function FAQ() {
  useDocumentMeta({
    title: 'שאלות נפוצות | PopSpot',
    description: 'איך עובדת הזמנה ב-PopSpot, איך מתבצע התשלום, איך מפרסמים מקום להשכרה ועוד שאלות נפוצות.',
  });
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="pb-4 mb-6" style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>עזרה</span>
        <h1 className="font-bold text-3xl mt-1">שאלות נפוצות</h1>
      </div>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} style={{ border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)', background: 'var(--brand-surface)' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-right font-bold"
              >
                {item.q}
                <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease', flexShrink: 0 }} />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
