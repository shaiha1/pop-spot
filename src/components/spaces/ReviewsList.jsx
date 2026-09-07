import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

export default function ReviewsList({ spaceId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Review.filter({ space_id: spaceId }, '-created_date', 20)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [spaceId]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div>
      <h2 className="font-bold text-xl mb-4" style={{ borderBottom: '2px solid var(--brand-text)', paddingBottom: 'var(--brand-sp-3)' }}>
        ביקורות ({reviews.length})
      </h2>
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                   style={{ background: 'var(--brand-muted)', color: 'var(--brand-text)' }}>
                {(r.reviewer_name || '?')[0]}
              </div>
              <span className="font-semibold text-sm">{r.reviewer_name || 'אנונימי'}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14}
                        fill={i < r.rating ? 'var(--brand-warning)' : 'none'}
                        stroke={i < r.rating ? 'var(--brand-warning)' : 'var(--brand-border)'} />
                ))}
              </div>
            </div>
            {r.text && <p className="text-sm">{r.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
