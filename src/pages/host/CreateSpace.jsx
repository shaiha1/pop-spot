import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { ACTIVITIES, CATEGORIES, AMENITIES, CITIES, PRICING_UNITS, DEFAULT_AVAILABILITY, CANCELLATION_POLICIES, DAYS_HE } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const STEPS = [
  { id: 'category', title: 'קטגוריה', subtitle: 'מה תרצו להשכיר?' },
  { id: 'activities', title: 'שימושים', subtitle: 'למה המקום מתאים?' },
  { id: 'location', title: 'מיקום', subtitle: '?איפה המקום' },
  { id: 'photos', title: 'תמונות', subtitle: 'הוסיפו תמונות' },
  { id: 'amenities', title: 'מתקנים', subtitle: '?מה יש במקום' },
  { id: 'capacity', title: 'קיבולת', subtitle: 'כמות אורחים ופרטים' },
  { id: 'pricing', title: 'תמחור', subtitle: 'הגדירו מחיר לכל פעילות' },
  { id: 'availability', title: 'זמינות', subtitle: 'שעות פעילות' },
  { id: 'rules', title: 'חוקים', subtitle: 'חוקי הבית וביטולים' },
  { id: 'preview', title: 'פרסום', subtitle: 'סקירה ופרסום' },
];

export default function CreateSpace() {
  useDocumentMeta({ noindex: true });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    activities: [],
    city: '',
    address: '',
    images: [],
    amenities: [],
    max_guests: 10,
    min_booking_hours: 2,
    instant_booking: false,
    activity_pricing: [],
    availability_rules: DEFAULT_AVAILABILITY,
    rules: '',
    cancellation_policy: 'moderate',
  });

  useEffect(() => {
    base44.auth.me().then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleArrayItem = (key, item) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter(x => x !== item)
        : [...prev[key], item],
    }));
  };

  const updateActivityPricing = (activity, field, value) => {
    setForm(prev => {
      const existing = prev.activity_pricing.find(p => p.activity === activity);
      if (existing) {
        return {
          ...prev,
          activity_pricing: prev.activity_pricing.map(p =>
            p.activity === activity ? { ...p, [field]: value } : p
          ),
        };
      }
      return {
        ...prev,
        activity_pricing: [...prev.activity_pricing, { activity, hourly_price: 0, pricing_unit: 'hour', min_hours: 2, max_guests: form.max_guests, [field]: value }],
      };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateForm('images', [...form.images, file_url]);
      } catch (err) {
        toast({ title: 'העלאת התמונה נכשלה', description: err.message, variant: 'destructive' });
      }
    }
  };

  const removeImage = (idx) => {
    updateForm('images', form.images.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    setSaving(true);
    const minPrice = form.activity_pricing.reduce((min, p) => Math.min(min, p.hourly_price || 0), Infinity);
    const slug = form.title.replace(/\s+/g, '-').toLowerCase();

    try {
      await base44.entities.Space.create({
        ...form,
        slug,
        host_id: user.id,
        host_name: user.full_name || '',
        starting_price: minPrice === Infinity ? 0 : minPrice,
        status: 'active',
      });

      toast({ title: 'המקום פורסם בהצלחה!' });
      navigate('/host');
    } catch (err) {
      toast({ title: 'הפרסום נכשל', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    switch (STEPS[step].id) {
      case 'category': return !!form.category;
      case 'activities': return form.activities.length > 0;
      case 'location': return !!form.city && !!form.title;
      case 'pricing': return form.activity_pricing.length > 0 && form.activity_pricing.every(p => p.hourly_price > 0);
      default: return true;
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 h-1"
               style={{ background: i <= step ? 'var(--brand-primary)' : 'var(--brand-muted)', borderRadius: 'var(--brand-radius-sm)' }} />
        ))}
      </div>

      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>
          שלב {step + 1} מתוך {STEPS.length}
        </span>
        <h1 className="font-bold text-3xl mt-1">{currentStep.subtitle}</h1>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep.id === 'category' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => (
              <button key={k} onClick={() => updateForm('category', k)}
                      className="p-4 text-center font-semibold border transition-all flex flex-col items-center gap-2"
                      style={{
                        borderColor: form.category === k ? 'var(--brand-primary)' : 'var(--brand-border)',
                        background: form.category === k ? 'var(--brand-primary)' : 'var(--brand-surface)',
                        color: form.category === k ? 'var(--brand-on-primary)' : 'var(--brand-text)',
                        borderRadius: 'var(--brand-radius-md)',
                      }}>
                <span style={{ fontSize: 24 }}>{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>
        )}

        {currentStep.id === 'activities' && (
          <div className="grid grid-cols-2 gap-3">
            {(CATEGORIES[form.category]?.activities || []).map(k => {
              const v = ACTIVITIES[k];
              if (!v) return null;
              return (
                <button key={k} onClick={() => toggleArrayItem('activities', k)}
                        className="flex items-center gap-3 p-4 border text-right font-semibold transition-all"
                        style={{
                          borderColor: form.activities.includes(k) ? 'var(--brand-primary)' : 'var(--brand-border)',
                          background: form.activities.includes(k) ? 'var(--brand-primary)' : 'var(--brand-surface)',
                          color: form.activities.includes(k) ? 'var(--brand-on-primary)' : 'var(--brand-text)',
                          borderRadius: 'var(--brand-radius-md)',
                        }}>
                  <span className="text-xl">{v.emoji}</span>
                  {v.label}
                </button>
              );
            })}
            {!form.category && (
              <p style={{ color: 'var(--brand-muted-foreground)' }}>בחרו קטגוריה בשלב הקודם</p>
            )}
          </div>
        )}

        {currentStep.id === 'location' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">שם המקום</label>
              <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)}
                     placeholder="למשל: וילה פרטית עם בריכה בהרצליה"
                     className="if-field-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">עיר</label>
              <select value={form.city} onChange={e => updateForm('city', e.target.value)} className="if-field-input">
                <option value="">בחרו עיר</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">כתובת</label>
              <input type="text" value={form.address} onChange={e => updateForm('address', e.target.value)}
                     placeholder="רחוב, מספר" className="if-field-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">תיאור</label>
              <textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
                        rows={4} placeholder="תארו את המקום..."
                        className="if-field-input" style={{ minHeight: 'auto', padding: 'var(--brand-sp-3)' }} />
            </div>
          </div>
        )}

        {currentStep.id === 'photos' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative" style={{ aspectRatio: '4/3' }}>
                  <Image src={img} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)}
                          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed"
                     style={{ aspectRatio: '4/3', borderColor: 'var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
                <Upload size={24} style={{ color: 'var(--brand-muted-foreground)' }} />
                <span className="text-sm mt-1" style={{ color: 'var(--brand-muted-foreground)' }}>העלאת תמונה</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {currentStep.id === 'amenities' && (
          <div className="grid grid-cols-2 gap-3">
            {AMENITIES.map(a => (
              <button key={a.id} onClick={() => toggleArrayItem('amenities', a.id)}
                      className="flex items-center gap-2 p-3 border text-right font-semibold transition-all text-sm"
                      style={{
                        borderColor: form.amenities.includes(a.id) ? 'var(--brand-primary)' : 'var(--brand-border)',
                        background: form.amenities.includes(a.id) ? 'var(--brand-primary)' : 'var(--brand-surface)',
                        color: form.amenities.includes(a.id) ? 'var(--brand-on-primary)' : 'var(--brand-text)',
                        borderRadius: 'var(--brand-radius-md)',
                      }}>
                <span>{a.emoji}</span>
                {a.label}
              </button>
            ))}
          </div>
        )}

        {currentStep.id === 'capacity' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">מספר אורחים מקסימלי</label>
              <input type="number" value={form.max_guests} onChange={e => updateForm('max_guests', Number(e.target.value))}
                     min={1} className="if-field-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">מינימום שעות הזמנה</label>
              <input type="number" value={form.min_booking_hours} onChange={e => updateForm('min_booking_hours', Number(e.target.value))}
                     min={1} className="if-field-input" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3"
                   style={{ border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)', background: 'var(--brand-surface)' }}>
              <input type="checkbox" checked={form.instant_booking}
                     onChange={e => updateForm('instant_booking', e.target.checked)} />
              <div>
                <p className="font-semibold">הזמנה מיידית</p>
                <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>הזמנות יאושרו אוטומטית ללא אישור ידני</p>
              </div>
            </label>
          </div>
        )}

        {currentStep.id === 'pricing' && (
          <div className="space-y-4">
            {form.activities.map(act => {
              const existing = form.activity_pricing.find(p => p.activity === act) || {};
              return (
                <div key={act} className="p-4 border" style={{ borderColor: 'var(--brand-border)', borderRadius: 'var(--brand-radius-md)', background: 'var(--brand-surface)' }}>
                  <p className="font-bold mb-3">{ACTIVITIES[act]?.emoji} {ACTIVITIES[act]?.label}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">מחיר (₪)</label>
                      <input type="number" value={existing.hourly_price || ''} min={0}
                             onChange={e => updateActivityPricing(act, 'hourly_price', Number(e.target.value))}
                             className="if-field-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">יחידת תמחור</label>
                      <select value={existing.pricing_unit || 'hour'}
                              onChange={e => updateActivityPricing(act, 'pricing_unit', e.target.value)}
                              className="if-field-input">
                        {Object.entries(PRICING_UNITS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">מינימום שעות</label>
                      <input type="number" value={existing.min_hours || 2} min={1}
                             onChange={e => updateActivityPricing(act, 'min_hours', Number(e.target.value))}
                             className="if-field-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">מקסימום אנשים</label>
                      <input type="number" value={existing.max_guests || form.max_guests} min={1}
                             onChange={e => updateActivityPricing(act, 'max_guests', Number(e.target.value))}
                             className="if-field-input" />
                    </div>
                  </div>
                </div>
              );
            })}
            {form.activities.length === 0 && (
              <p style={{ color: 'var(--brand-muted-foreground)' }}>חזרו לשלב הפעילויות ובחרו לפחות פעילות אחת</p>
            )}
          </div>
        )}

        {currentStep.id === 'availability' && (
          <div className="space-y-2">
            {form.availability_rules.map((rule, i) => (
              <div key={rule.day} className="flex items-center gap-3 py-2"
                   style={{ borderBottom: '1px solid var(--brand-border)' }}>
                <label className="flex items-center gap-2 w-24">
                  <input type="checkbox" checked={rule.enabled}
                         onChange={e => {
                           const rules = [...form.availability_rules];
                           rules[i] = { ...rules[i], enabled: e.target.checked };
                           updateForm('availability_rules', rules);
                         }} />
                  <span className="font-semibold text-sm">{DAYS_HE[rule.day]}</span>
                </label>
                {rule.enabled && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={rule.start_time}
                           onChange={e => {
                             const rules = [...form.availability_rules];
                             rules[i] = { ...rules[i], start_time: e.target.value };
                             updateForm('availability_rules', rules);
                           }}
                           className="if-field-input" style={{ minHeight: 36 }} />
                    <span>–</span>
                    <input type="time" value={rule.end_time}
                           onChange={e => {
                             const rules = [...form.availability_rules];
                             rules[i] = { ...rules[i], end_time: e.target.value };
                             updateForm('availability_rules', rules);
                           }}
                           className="if-field-input" style={{ minHeight: 36 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {currentStep.id === 'rules' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">חוקי הבית</label>
              <textarea value={form.rules} onChange={e => updateForm('rules', e.target.value)}
                        rows={4} placeholder="למשל: לא להביא חיות, שקט עד 22:00..."
                        className="if-field-input" style={{ minHeight: 'auto', padding: 'var(--brand-sp-3)' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">מדיניות ביטול</label>
              {Object.entries(CANCELLATION_POLICIES).map(([k, v]) => (
                <label key={k} className="flex items-center gap-3 p-3 cursor-pointer mb-2 border"
                       style={{
                         borderColor: form.cancellation_policy === k ? 'var(--brand-primary)' : 'var(--brand-border)',
                         borderRadius: 'var(--brand-radius-md)',
                         background: 'var(--brand-surface)',
                       }}>
                  <input type="radio" name="cancel" checked={form.cancellation_policy === k}
                         onChange={() => updateForm('cancellation_policy', k)} />
                  <div>
                    <p className="font-semibold">{v.label}</p>
                    <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>{v.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep.id === 'preview' && (
          <div className="space-y-4">
            <div className="p-4" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
              <h3 className="font-bold text-xl mb-2">{form.title || 'ללא שם'}</h3>
              <p className="text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>{form.city}</p>
              {form.category && CATEGORIES[form.category] && (
                <p className="text-sm mt-1 font-semibold">{CATEGORIES[form.category].emoji} {CATEGORIES[form.category].label}</p>
              )}
              <p className="text-sm mt-2">{form.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.activities.map(a => (
                  <span key={a} className="if-badge-neutral text-xs">{ACTIVITIES[a]?.emoji} {ACTIVITIES[a]?.label}</span>
                ))}
              </div>
              <div className="mt-3">
                {form.activity_pricing.map(p => (
                  <p key={p.activity} className="text-sm">
                    {ACTIVITIES[p.activity]?.label}: ₪{p.hourly_price} {PRICING_UNITS[p.pricing_unit || 'hour']?.suffix}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="if-btn-secondary flex items-center gap-2">
            <ChevronRight size={18} />
            הקודם
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                  className="if-btn-primary flex items-center gap-2">
            <span>הבא</span>
            <ChevronLeft size={18} className="relative z-10" />
          </button>
        ) : (
          <button onClick={handlePublish} disabled={saving}
                  className="if-btn-primary">
            <span>{saving ? 'מפרסם...' : 'פרסום המקום'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
