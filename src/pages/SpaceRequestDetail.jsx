import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44, supabase } from '@/api/base44Client';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { MapPin, Users, Calendar, Banknote, ArrowRight, CheckCircle, Phone, Mail, Pencil, X } from 'lucide-react';

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins || 1} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
};

const inputCls = "w-full px-3 py-2 border rounded-lg text-sm";
const inputStyle = { borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', minHeight: 40 };

const CATEGORY_OPTIONS = [
  ...Object.entries(CATEGORIES).filter(([, v]) => !v.hidden).map(([k, v]) => ({
    value: k, label: `${v.emoji} ${v.label}`,
  })),
  { value: 'other', label: '✏️ אחר' },
];

export default function SpaceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [req, setReq] = useState(null);
  const [responses, setResponses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hostSpaces, setHostSpaces] = useState([]);

  const [replyMsg, setReplyMsg] = useState('');
  const [replySpaceId, setReplySpaceId] = useState('');
  const [sending, setSending] = useState(false);
  const [alreadyReplied, setAlreadyReplied] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useDocumentMeta({ noindex: true });

  useEffect(() => {
    const load = async () => {
      try {
        const [r, u] = await Promise.all([
          base44.entities.SpaceRequest.get(id),
          base44.auth.me().catch(() => null),
        ]);
        setReq(r);
        setUser(u);
        initEditForm(r);

        const { data: resps } = await supabase
          .from('space_request_responses')
          .select('*')
          .eq('request_id', id)
          .order('created_date', { ascending: true });
        setResponses(resps || []);

        if (u) {
          const mine = (resps || []).find(res => res.responder_id === u.id);
          if (mine) setAlreadyReplied(true);

          const spaces = await base44.entities.Space.filter({ host_id: u.id, status: 'active' }).catch(() => []);
          setHostSpaces(spaces);
        }
      } catch {
        navigate('/requests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const initEditForm = (r) => {
    setEditForm({
      title: r.title || '',
      category: r.category || (r.other_category ? 'other' : ''),
      other_category: r.other_category || '',
      city: r.city || '',
      date: r.date || '',
      start_time: r.start_time || '',
      end_time: r.end_time || '',
      guests_count: r.guests_count || '',
      budget_per_hour: r.budget_per_hour || '',
      description: r.description || '',
      contact_phone: r.contact_phone || '',
      contact_email: r.contact_email || '',
    });
  };

  const setEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    try {
      const updated = await base44.entities.SpaceRequest.update(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        category: editForm.category === 'other' ? null : (editForm.category || null),
        other_category: editForm.category === 'other' ? (editForm.other_category.trim() || null) : null,
        city: editForm.city || null,
        date: editForm.date || null,
        start_time: editForm.start_time || null,
        end_time: editForm.end_time || null,
        guests_count: editForm.guests_count ? parseInt(editForm.guests_count) : null,
        budget_per_hour: editForm.budget_per_hour ? parseFloat(editForm.budget_per_hour) : null,
        contact_phone: editForm.contact_phone.trim() || null,
        contact_email: editForm.contact_email.trim() || null,
      });
      setReq(updated);
      setEditing(false);
      toast({ title: 'הבקשה עודכנה בהצלחה' });
    } catch {
      toast({ title: 'שגיאה בשמירה', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('האם לבטל את הבקשה?')) return;
    await base44.entities.SpaceRequest.update(id, { status: 'cancelled' });
    toast({ title: 'הבקשה בוטלה' });
    navigate('/my-requests');
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMsg.trim()) return;
    setSending(true);
    try {
      const linked = hostSpaces.find(s => s.id === replySpaceId);
      const { data: newResp, error } = await supabase
        .from('space_request_responses')
        .insert({
          request_id: id,
          responder_id: user.id,
          responder_name: user.full_name || user.email?.split('@')[0] || 'בעל מקום',
          space_id: replySpaceId || null,
          space_title: linked?.title || null,
          space_image: linked?.images?.[0] || null,
          message: replyMsg.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      setResponses(prev => [...prev, newResp]);
      setAlreadyReplied(true);
      setReplyMsg('');
      setReplySpaceId('');
      toast({ title: 'תגובתך נשלחה!', description: 'הלקוח יוכל לראות את ההצעה שלך.' });
    } catch {
      toast({ title: 'שגיאה בשליחה', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand-primary)' }} />
      </div>
    );
  }

  if (!req) return null;

  const cat = req.category ? CATEGORIES[req.category] : null;
  const categoryLabel = cat ? `${cat.emoji} ${cat.label}` : req.other_category || null;
  const isOwner = user?.id === req.requester_id;
  const isClosed = req.status !== 'open';
  const hasReplied = alreadyReplied;
  const hasContactInfo = req.contact_phone || req.contact_email;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <Link to="/requests" className="inline-flex items-center gap-1 text-sm mb-6"
            style={{ color: 'var(--brand-muted-foreground)' }}>
        <ArrowRight size={14} /> חזרה ללוח הבקשות
      </Link>

      {/* ── Request card / Edit form ── */}
      <section className="p-6 mb-6 border"
               style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)' }}>

        {editing ? (
          /* ── EDIT FORM ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg">עריכת הבקשה</h2>
              <button onClick={() => { setEditing(false); initEditForm(req); }}
                      className="p-1 rounded-full hover:bg-gray-100">
                <X size={18} style={{ color: 'var(--brand-muted-foreground)' }} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">כותרת<span className="text-red-500 mr-1">*</span></label>
              <input className={inputCls} style={inputStyle} value={editForm.title} maxLength={120}
                     onChange={e => setEdit('title', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">קטגוריה</label>
                <select className={inputCls} style={inputStyle} value={editForm.category}
                        onChange={e => setEdit('category', e.target.value)}>
                  <option value="">ללא קטגוריה</option>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {editForm.category === 'other' && (
                  <input className={inputCls + ' mt-1'} style={inputStyle} placeholder="תארו את סוג המקום..."
                         value={editForm.other_category} onChange={e => setEdit('other_category', e.target.value)} />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">עיר</label>
                <select className={inputCls} style={inputStyle} value={editForm.city}
                        onChange={e => setEdit('city', e.target.value)}>
                  <option value="">כל הערים</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">תאריך</label>
                <input type="date" className={inputCls} style={inputStyle} value={editForm.date}
                       onChange={e => setEdit('date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">מספר אנשים</label>
                <input type="number" className={inputCls} style={inputStyle} min={1} value={editForm.guests_count}
                       onChange={e => setEdit('guests_count', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">שעת התחלה</label>
                <input type="time" className={inputCls} style={inputStyle} value={editForm.start_time}
                       onChange={e => setEdit('start_time', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">שעת סיום</label>
                <input type="time" className={inputCls} style={inputStyle} value={editForm.end_time}
                       onChange={e => setEdit('end_time', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">תקציב לשעה (₪)</label>
              <input type="number" className={inputCls} style={inputStyle} min={0} value={editForm.budget_per_hour}
                     onChange={e => setEdit('budget_per_hour', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">פרטים נוספים</label>
              <textarea className={inputCls} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                        rows={3} value={editForm.description}
                        onChange={e => setEdit('description', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><Phone size={12} /> טלפון</label>
                <input type="tel" className={inputCls} style={inputStyle} placeholder="05X-XXXXXXX"
                       value={editForm.contact_phone} onChange={e => setEdit('contact_phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><Mail size={12} /> מייל</label>
                <input type="email" className={inputCls} style={inputStyle} placeholder="you@example.com"
                       value={editForm.contact_email} onChange={e => setEdit('contact_email', e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSaveEdit} disabled={saving || !editForm.title.trim()}
                      className="flex-1 py-2.5 font-bold rounded-full"
                      style={{ background: 'var(--brand-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button onClick={() => { setEditing(false); initEditForm(req); }}
                      className="px-4 py-2.5 font-semibold rounded-full border"
                      style={{ borderColor: 'var(--brand-border)' }}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                {categoryLabel && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                        style={{ background: 'var(--brand-accent)', color: 'var(--brand-primary)' }}>
                    {categoryLabel}
                  </span>
                )}
                <h1 className="font-bold text-2xl leading-tight">{req.title}</h1>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap`}
                    style={{
                      background: isClosed ? 'var(--brand-muted)' : '#dcfce7',
                      color: isClosed ? 'var(--brand-muted-foreground)' : '#166534',
                    }}>
                {isClosed ? (req.status === 'cancelled' ? 'בוטלה' : 'טופלה') : 'פתוחה'}
              </span>
            </div>

            {req.description && (
              <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--brand-muted-foreground)' }}>
                {req.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--brand-muted-foreground)' }}>
              {req.city && <span className="flex items-center gap-1"><MapPin size={14} />{req.city}</span>}
              {req.date && <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(req.date)}</span>}
              {req.start_time && req.end_time && <span>🕐 {req.start_time}–{req.end_time}</span>}
              {req.guests_count && <span className="flex items-center gap-1"><Users size={14} />{req.guests_count} אנשים</span>}
              {req.budget_per_hour && <span className="flex items-center gap-1"><Banknote size={14} />עד ₪{req.budget_per_hour}/שעה</span>}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4"
                 style={{ borderTop: '1px solid var(--brand-border)' }}>
              <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>
                {req.requester_name || 'משתמש'} · {timeAgo(req.created_date)}
              </span>
              <div className="flex items-center gap-2">
                {isOwner && !isClosed && (
                  <>
                    <button onClick={() => setEditing(true)}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border"
                            style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}>
                      <Pencil size={12} /> עריכה
                    </button>
                    <button onClick={handleCancel}
                            className="text-xs px-3 py-1.5 rounded-full border font-semibold"
                            style={{ borderColor: 'var(--brand-destructive)', color: 'var(--brand-destructive)' }}>
                      ביטול בקשה
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Responses ── */}
      <section>
        <h2 className="font-bold text-lg mb-4">
          {responses.length === 0
            ? 'עדיין אין תגובות'
            : `${responses.length} ${responses.length === 1 ? 'תגובה' : 'תגובות'} מבעלי מקומות`}
        </h2>

        {responses.length > 0 && (isOwner || user) && (
          <div className="space-y-3 mb-6">
            {responses.map(res => (
              <div key={res.id} className="p-4 border"
                   style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{res.responder_name || 'בעל מקום'}</span>
                  <span className="text-xs" style={{ color: 'var(--brand-muted-foreground)' }}>
                    {timeAgo(res.created_date)}
                  </span>
                </div>
                <p className="text-sm mb-3">{res.message}</p>

                {res.space_title && (
                  <div className="flex items-center gap-2 p-2 rounded mb-3"
                       style={{ background: 'var(--brand-accent)' }}>
                    {res.space_image && (
                      <img src={res.space_image} alt={res.space_title}
                           className="w-10 h-10 object-cover rounded flex-shrink-0" />
                    )}
                    <p className="text-xs font-semibold flex-1 truncate">{res.space_title}</p>
                    {res.space_id && (
                      <Link to={`/space/${res.space_id}`}
                            className="text-xs font-semibold whitespace-nowrap px-2 py-1 rounded"
                            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
                        צפה במקום
                      </Link>
                    )}
                  </div>
                )}

                {/* Contact info — shown to responders once they've replied */}
                {isOwner && hasContactInfo && (
                  <div className="flex flex-wrap gap-3 pt-2 mt-2"
                       style={{ borderTop: '1px dashed var(--brand-border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>פרטי קשר:</span>
                    {req.contact_phone && (
                      <a href={`tel:${req.contact_phone}`}
                         className="flex items-center gap-1 text-xs font-semibold"
                         style={{ color: 'var(--brand-primary)' }}>
                        <Phone size={11} /> {req.contact_phone}
                      </a>
                    )}
                    {req.contact_email && (
                      <a href={`mailto:${req.contact_email}`}
                         className="flex items-center gap-1 text-xs font-semibold"
                         style={{ color: 'var(--brand-primary)' }}>
                        <Mail size={11} /> {req.contact_email}
                      </a>
                    )}
                  </div>
                )}

                {/* Contact info for the responder (after they replied) */}
                {!isOwner && res.responder_id === user?.id && hasContactInfo && (
                  <div className="flex flex-wrap gap-3 pt-2 mt-2 rounded-lg p-2"
                       style={{ background: '#dcfce7', borderTop: '1px dashed #86efac' }}>
                    <span className="text-xs font-bold w-full" style={{ color: '#166534' }}>
                      📞 פרטי קשר של המבקש (גלויים רק לך):
                    </span>
                    {req.contact_phone && (
                      <a href={`tel:${req.contact_phone}`}
                         className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#166534' }}>
                        <Phone size={11} /> {req.contact_phone}
                      </a>
                    )}
                    {req.contact_email && (
                      <a href={`mailto:${req.contact_email}`}
                         className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#166534' }}>
                        <Mail size={11} /> {req.contact_email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Host reply form */}
        {!isOwner && !isClosed && user && !hasReplied && (
          <form onSubmit={handleReply} className="p-5 border"
                style={{ borderColor: 'var(--brand-primary)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)', borderWidth: 2 }}>
            <h3 className="font-bold text-base mb-3">יש לכם מקום מתאים? השיבו לבקשה</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--brand-muted-foreground)' }}>
              אם המבקש השאיר פרטי קשר, הם יוצגו לכם אחרי השליחה
            </p>

            {hostSpaces.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">שייכו מקום (אופציונלי)</label>
                <select className="w-full px-3 py-2.5 border rounded-lg text-sm"
                        style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', minHeight: 44 }}
                        value={replySpaceId} onChange={e => setReplySpaceId(e.target.value)}>
                  <option value="">ללא קישור למקום</option>
                  {hostSpaces.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">הודעתכם<span className="text-red-500 mr-1">*</span></label>
              <textarea className="w-full px-3 py-2.5 border rounded-lg text-sm"
                        style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', resize: 'vertical', minHeight: 90 }}
                        placeholder="שלום! יש לי מקום שמתאים בדיוק למה שחיפשתם..."
                        rows={3} required value={replyMsg}
                        onChange={e => setReplyMsg(e.target.value)} />
            </div>

            <button type="submit" disabled={sending || !replyMsg.trim()}
                    className="w-full py-3 font-bold rounded-full transition-opacity"
                    style={{ background: 'var(--brand-primary)', color: '#fff', opacity: sending || !replyMsg.trim() ? 0.6 : 1 }}>
              {sending ? 'שולח...' : 'שלח תגובה'}
            </button>
          </form>
        )}

        {hasReplied && !isOwner && (
          <div className="flex items-center gap-2 p-4 rounded-lg" style={{ background: '#dcfce7', color: '#166534' }}>
            <CheckCircle size={18} />
            <div>
              <p className="text-sm font-semibold">שלחת תגובה לבקשה זו</p>
              {hasContactInfo && (
                <div className="flex flex-wrap gap-3 mt-1">
                  {req.contact_phone && (
                    <a href={`tel:${req.contact_phone}`} className="flex items-center gap-1 text-xs font-semibold">
                      <Phone size={11} /> {req.contact_phone}
                    </a>
                  )}
                  {req.contact_email && (
                    <a href={`mailto:${req.contact_email}`} className="flex items-center gap-1 text-xs font-semibold">
                      <Mail size={11} /> {req.contact_email}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!user && !isClosed && (
          <div className="text-center py-8 border"
               style={{ borderColor: 'var(--brand-border)', borderRadius: 'var(--brand-radius-sm)' }}>
            <p className="mb-3 font-semibold">התחברו כדי להגיב לבקשה</p>
            <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="px-6 py-2.5 font-bold rounded-full"
                    style={{ background: 'var(--brand-primary)', color: '#fff' }}>
              התחברות
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
