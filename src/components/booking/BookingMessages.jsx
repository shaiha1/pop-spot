import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send } from 'lucide-react';

export default function BookingMessages({ bookingId, user, recipientId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [bookingId]);

  const loadMessages = () => {
    base44.entities.Message.filter({ booking_id: bookingId }, 'created_date', 100)
      .then(setMessages)
      .catch(() => {});
  };

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    await base44.entities.Message.create({
      booking_id: bookingId,
      sender_id: user.id,
      sender_name: user.full_name || 'אנונימי',
      recipient_id: recipientId,
      text: text.trim(),
    });
    setText('');
    loadMessages();
    setSending(false);
  };

  return (
    <div className="p-5" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 'var(--brand-radius-md)' }}>
      <h3 className="font-bold text-lg mb-4" style={{ borderBottom: '2px solid var(--brand-text)', paddingBottom: 'var(--brand-sp-2)' }}>
        הודעות
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--brand-muted-foreground)' }}>
            אין הודעות עדיין
          </p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-start' : 'justify-end'}`}>
            <div className="max-w-[80%] p-3 text-sm"
                 style={{
                   background: m.sender_id === user?.id ? 'var(--brand-primary)' : 'var(--brand-muted)',
                   color: m.sender_id === user?.id ? 'var(--brand-on-primary)' : 'var(--brand-text)',
                   borderRadius: 'var(--brand-radius-md)',
                 }}>
              <p className="text-xs font-semibold mb-1 opacity-70">{m.sender_name}</p>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="כתבו הודעה..."
          className="if-field-input flex-1"
        />
        <button onClick={sendMessage} disabled={sending || !text.trim()}
                className="if-btn-primary flex-shrink-0">
          <Send size={18} className="relative z-10" />
        </button>
      </div>
    </div>
  );
}
