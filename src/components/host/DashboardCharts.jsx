import React, { useMemo } from 'react';
import moment from 'moment';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatPrice } from '@/lib/pricing';

function buildMonthlyData(bookings) {
  const months = Array.from({ length: 6 }, (_, i) => moment().subtract(5 - i, 'months'));
  return months.map(m => {
    const label = m.format('MMM');
    const monthBookings = bookings.filter(b => moment(b.date || b.created_date).isSame(m, 'month'));
    const revenue = monthBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.host_payout || 0), 0);
    return { label, count: monthBookings.length, revenue };
  });
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="p-5" style={{ borderRadius: 'var(--brand-radius-lg)', background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', boxShadow: 'var(--brand-shadow-sm)' }}>
      <div className="mb-4">
        <span className="block text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>{subtitle}</span>
        <h3 className="font-heading font-bold text-xl mt-0.5" style={{ color: 'var(--brand-text)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, isRevenue }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2" style={{ background: 'var(--brand-secondary)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
      <div>{label}</div>
      <div>{isRevenue ? formatPrice(payload[0].value) : `${payload[0].value} הזמנות`}</div>
    </div>
  );
}

export default function DashboardCharts({ bookings }) {
  const data = useMemo(() => buildMonthlyData(bookings), [bookings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
      <ChartCard subtitle="ביצועים" title="הכנסות חודשיות">
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--brand-border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--brand-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip isRevenue />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={2.5}
                    fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard subtitle="פעילות" title="הזמנות לפי חודש">
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--brand-border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--brand-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--brand-muted)' }} />
              <Bar dataKey="count" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
