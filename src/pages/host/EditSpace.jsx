import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { Image } from '@/components/ui/image';
import { Upload, X, Trash2 } from 'lucide-react';

export default function EditSpace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Space.get(id)
      .then(setForm)
      .catch(() => navigate('/host'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateForm('images', [...(form.images || []), file_url]);
      } catch (err) {
        toast({ title: 'העלאת התמונה נכשלה', description: err.message, variant: 'destructive' });
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const minPrice = (form.activity_pricing || []).reduce((min, p) => Math.min(min, p.hourly_price || 0), Infinity);
    try {
      await base44.entities.Space.update(id, {
        ...form,
        starting_price: minPrice === Infinity ? 0 : minPrice,
      });
      toast({ title: 'השינויים נשמרו' });
    } catch (err) {
      toast({ title: 'השמירה נכשלה', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Space.delete(id);
      toast({ title: 'המקום נמחק' });
      navigate('/host');
    } catch (err) {
      toast({ title: 'המחיקה נכשלה', description: err.message, variant: 'destructive' });
    }
  };

  if (loading || !form) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin"
           style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="pb-4 mb-6" style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>עריכה</span>
        <h1 className="font-bold text-3xl mt-1">{form.title}</h1>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-semibold mb-1">שם</label>
          <input type="text" value={form.title || ''} onChange={e => updateForm('title', e.target.value)} className="if-field-input" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">עיר</label>
          <select value={form.city || ''} onChange={e => updateForm('city', e.target.value)} className="if-field-input">
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">קטגוריה</label>
          <select value={form.category || ''} onChange={e => updateForm('category', e.target.value)} className="if-field-input">
            <option value="">בחרו קטגוריה</option>
            {Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">תיאור</label>
          <textarea value={form.description || ''} onChange={e => updateForm('description', e.target.value)}
                    rows={4} className="if-field-input" style={{ minHeight: 'auto', padding: 'var(--brand-sp-3)' }} />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold mb-2">תמונות</label>
          <div className="grid grid-cols-3 gap-2">
            {(form.images || []).map((img, i) => (
              <div key={i} className="relative" style={{ aspectRatio: '4/3' }}>
                <Image src={img} className="w-full h-full object-cover" />
                <button onClick={() => updateForm('images', form.images.filter((_, j) => j !== i))}
                        className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed"
                   style={{ aspectRatio: '4/3', borderColor: 'var(--brand-border)' }}>
              <Upload size={20} style={{ color: 'var(--brand-muted-foreground)' }} />
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">מקסימום אורחים</label>
            <input type="number" value={form.max_guests || ''} onChange={e => updateForm('max_guests', Number(e.target.value))} className="if-field-input" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">מינימום שעות</label>
            <input type="number" value={form.min_booking_hours || ''} onChange={e => updateForm('min_booking_hours', Number(e.target.value))} className="if-field-input" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold mb-1">סטטוס</label>
          <select value={form.status || 'draft'} onChange={e => updateForm('status', e.target.value)} className="if-field-input">
            <option value="draft">טיוטה</option>
            <option value="active">פעיל</option>
            <option value="suspended">מושעה</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <button onClick={handleSave} disabled={saving} className="if-btn-primary flex-1">
            <span>{saving ? 'שומר...' : 'שמירה'}</span>
          </button>
          <button onClick={handleDelete} className="if-btn-danger flex items-center gap-2">
            <Trash2 size={18} /> מחיקה
          </button>
        </div>
      </div>
    </div>
  );
}
