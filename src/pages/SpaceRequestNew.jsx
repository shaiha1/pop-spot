import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const FIELD = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-semibold mb-1">
      {label}{required && <span className="text-red-500 mr-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs mt-1" style={{ color: 'var(--brand-muted-foreground)' }}>{hint}</p>}
  </div>
);

const inputCls = "w-full px-3 py-2.5 border rounded-lg text-sm";
const inputStyle = { borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', minHeight: 44 };

export default function SpaceRequestNew() {
  useDocumentMeta({ noindex: true });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: '',
    city: '',
    date: '',
    start_time: '',
    end_time: '',
    guests_count: '',
    budget_per_hour: '',
    description: '',
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin('/requests/new');
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const req = await base44.entities.SpaceRequest.create({
        requester_id: user.id,
        requester_name: user.full_name || user.email?.split('@')[0] || 'אנונימי',
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        city: form.city || null,
        date: form.date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        guests_count: form.guests_count ? parseInt(form.guests_count) : null,
        budget_per_hour: form.budget_per_hour ? parseFloat(form.budget_per_hour) : null,
        status: 'open',
      });
      toast({ title: 'הבקשה פורסמה!', description: 'בעלי מקומות יוכלו לראות אותה ולפנות אליך.' });
      navigate(`/requests/${req.id}`);
    } catch (err) {
      toast({ title: 'שגיאה', description: 'לא ניתן לפרסם את הבקשה כרגע.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8" dir="rtl">
      <div className="pb-4 mb-6" style={{ borderBottom: '2px solid var(--brand-text)' }}>
        <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--brand-primary)' }}>בקשה חדשה</span>
        <h1 className="font-bold text-3xl mt-1">מה אתם מחפשים?</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
          תארו את המקום שאתם צריכים ובעלי נכסים יפנו אליכם
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FIELD label="כותרת הבקשה" required hint="לדוגמה: מחפש בריכה פרטית לסופ&quot;ש עם 10 חברים">
          <input
            className={inputCls}
            style={inputStyle}
            placeholder="מחפש..."
            value={form.title}
            maxLength={120}
            required
            onChange={e => set('title', e.target.value)}
          />
        </FIELD>

        <div className="grid grid-cols-2 gap-4">
          <FIELD label="סוג מקום">
            <select
              className={inputCls}
              style={inputStyle}
              value={form.category}
              onChange={e => set('category', e.target.value)}>
              <option value="">בחרו קטגוריה</option>
              {Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </FIELD>

          <FIELD label="עיר">
            <select
              className={inputCls}
              style={inputStyle}
              value={form.city}
              onChange={e => set('city', e.target.value)}>
              <option value="">כל הערים</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FIELD>
        </div>

        <FIELD label="תאריך">
          <input
            type="date"
            className={inputCls}
            style={inputStyle}
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => set('date', e.target.value)}
          />
        </FIELD>

        <div className="grid grid-cols-2 gap-4">
          <FIELD label="שעת התחלה">
            <input
              type="time"
              className={inputCls}
              style={inputStyle}
              value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
            />
          </FIELD>
          <FIELD label="שעת סיום">
            <input
              type="time"
              className={inputCls}
              style={inputStyle}
              value={form.end_time}
              onChange={e => set('end_time', e.target.value)}
            />
          </FIELD>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FIELD label="מספר משתתפים">
            <input
              type="number"
              className={inputCls}
              style={inputStyle}
              placeholder="למשל: 8"
              min={1}
              max={500}
              value={form.guests_count}
              onChange={e => set('guests_count', e.target.value)}
            />
          </FIELD>

          <FIELD label="תקציב לשעה (₪)" hint="אופציונלי">
            <input
              type="number"
              className={inputCls}
              style={inputStyle}
              placeholder="עד ₪..."
              min={0}
              value={form.budget_per_hour}
              onChange={e => set('budget_per_hour', e.target.value)}
            />
          </FIELD>
        </div>

        <FIELD label="פרטים נוספים" hint="כל מידע שיעזור לבעל המקום להבין את הצורך שלכם">
          <textarea
            className={inputCls}
            style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            placeholder="ספרו לנו עוד — אוכל, עיצוב, פרטיות, נגישות..."
            rows={4}
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </FIELD>

        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="w-full py-3 font-bold rounded-full text-base transition-opacity"
          style={{
            background: 'var(--brand-primary)',
            color: '#fff',
            opacity: saving || !form.title.trim() ? 0.6 : 1,
          }}>
          {saving ? 'מפרסם...' : 'פרסם בקשה'}
        </button>
      </form>
    </div>
  );
}
