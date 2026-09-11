import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44, supabase } from '@/api/base44Client';
import { CATEGORIES } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { MapPin, Users, Calendar, Banknote, ArrowRight, CheckCircle } from 'lucide-react';

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

        // Load responses
        const { data: resps } = await supabase
          .from('space_request_responses')
          .select('*')
          .eq('request_id', id)
          .order('created_date', { ascending: true });
        setResponses(resps || []);

        if (u) {
          // Check if current user already responded
          const mine = (resps || []).find(res => res.responder_id === u.id);
          if (mine) setAlreadyReplied(true);

          // Load user's spaces so they can optionally link one
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

  const cat = CATEGORIES[req.category];
  const isOwner = user?.id === req.requester_id;
  const isClosed = req.status !== 'open';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      {/* Back */}
      <Link to="/requests" className="inline-flex items-center gap-1 text-sm mb-6"
            style={{ color: 'var(--brand-muted-foreground)' }}>
        <ArrowRight size={14} /> חזרה ללוח הבקשות
      </Link>

      {/* Request card */}
      <section className="p-6 mb-6 border"
               style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)' }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {cat && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                    style={{ background: 'var(--brand-accent)', color: 'var(--brand-primary)' }}>
                {cat.emoji} {cat.label}
              </span>
            )}
            <h1 className="font-bold text-2xl leading-tight">{req.title}</h1>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${isClosed ? 'opacity-60' : ''}`}
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
            פורסם על ידי {req.requester_name || 'משתמש'} · {timeAgo(req.created_date)}
          </span>
          {isOwner && !isClosed && (
            <button
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 rounded-full border font-semibold"
              style={{ borderColor: 'var(--brand-destructive)', color: 'var(--brand-destructive)' }}>
              ביטול בקשה
            </button>
          )}
        </div>
      </section>

      {/* Responses */}
      <section>
        <h2 className="font-bold text-lg mb-4">
          {responses.length === 0
            ? 'עדיין אין תגובות'
            : `${responses.length} ${responses.length === 1 ? 'תגובה' : 'תגובות'} מבעלי מקומות`}
        </h2>

        {(isOwner || user) && responses.length > 0 && (
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
                  <div className="flex items-center gap-2 p-2 rounded"
                       style={{ background: 'var(--brand-accent)' }}>
                    {res.space_image && (
                      <img src={res.space_image} alt={res.space_title}
                           className="w-10 h-10 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{res.space_title}</p>
                    </div>
                    {res.space_id && (
                      <Link to={`/space/${res.space_id}`}
                            className="text-xs font-semibold whitespace-nowrap px-2 py-1 rounded"
                            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
                        צפה במקום
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Host reply form */}
        {!isOwner && !isClosed && user && !alreadyReplied && (
          <form onSubmit={handleReply}
                className="p-5 border"
                style={{ borderColor: 'var(--brand-primary)', background: 'var(--brand-surface)', borderRadius: 'var(--brand-radius-sm)', borderWidth: 2 }}>
            <h3 className="font-bold text-base mb-3">יש לכם מקום מתאים? השיבו לבקשה</h3>

            {hostSpaces.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1">שייכו מקום (אופציונלי)</label>
                <select
                  className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', minHeight: 44 }}
                  value={replySpaceId}
                  onChange={e => setReplySpaceId(e.target.value)}>
                  <option value="">ללא קישור למקום</option>
                  {hostSpaces.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">הודעתכם<span className="text-red-500 mr-1">*</span></label>
              <textarea
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
                style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)', resize: 'vertical', minHeight: 90 }}
                placeholder="שלום! יש לי מקום שמתאים בדיוק למה שחיפשתם..."
                rows={3}
                required
                value={replyMsg}
                onChange={e => setReplyMsg(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={sending || !replyMsg.trim()}
              className="w-full py-3 font-bold rounded-full transition-opacity"
              style={{
                background: 'var(--brand-primary)',
                color: '#fff',
                opacity: sending || !replyMsg.trim() ? 0.6 : 1,
              }}>
              {sending ? 'שולח...' : 'שלח תגובה'}
            </button>
          </form>
        )}

        {alreadyReplied && !isOwner && (
          <div className="flex items-center gap-2 p-4 rounded-lg"
               style={{ background: '#dcfce7', color: '#166534' }}>
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">שלחת תגובה לבקשה זו</span>
          </div>
        )}

        {!user && !isClosed && (
          <div className="text-center py-8 border"
               style={{ borderColor: 'var(--brand-border)', borderRadius: 'var(--brand-radius-sm)' }}>
            <p className="mb-3 font-semibold">התחברו כדי להגיב לבקשה</p>
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
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
