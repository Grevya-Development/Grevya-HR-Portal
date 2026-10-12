import React, { useState } from 'react';
import { useStore } from '../services/store';
import { ATTENDANCE_RECORDS } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import StatCard from '../components/ui/StatCard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKLY_DATA = [
  { day: 'Mon', present: 11, absent: 1, late: 0 },
  { day: 'Tue', present: 10, absent: 1, late: 1 },
  { day: 'Wed', present: 10, absent: 0, late: 2 },
  { day: 'Thu', present: 11, absent: 1, late: 0 },
  { day: 'Fri', present: 9, absent: 2, late: 1 },
];

const MONTHLY_TREND = [
  { month: 'Oct', rate: 91 }, { month: 'Nov', rate: 93 },
  { month: 'Dec', rate: 88 }, { month: 'Jan', rate: 94 },
  { month: 'Feb', rate: 92 }, { month: 'Mar', rate: 95 },
];

export default function AttendancePage() {
  const { employees, currentUser } = useStore();
  const [viewMonth] = useState(new Date());
  const [tab, setTab] = useState<'overview' | 'employee' | 'calendar'>('overview');

  // Build calendar for current month
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const statusCell = (day: number) => {
    const record = ATTENDANCE_RECORDS[day - 1];
    if (!record) return 'bg-transparent';
    return record.status;
  };

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    present: { bg: '#dcfce7', color: '#16a34a', label: 'Present' },
    absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' },
    late: { bg: '#fef9c3', color: '#b45309', label: 'Late' },
    holiday: { bg: '#f1f5f9', color: '#94a3b8', label: 'Holiday' },
    half_day: { bg: '#dbeafe', color: '#1d4ed8', label: 'Half Day' },
  };

  const todayAttendance = employees.slice(0, 8).map(e => ({
    ...e,
    checkIn: ['08:52', '09:05', '08:41', '09:18', '', '08:55', '09:02', '08:44'][employees.indexOf(e)] || '',
    checkOut: ['18:30', '', '17:45', '18:00', '', '19:10', '', '17:30'][employees.indexOf(e)] || '',
    todayStatus: [
      'present', 'present', 'present', 'late', 'absent', 'present', 'present', 'present'
    ][employees.indexOf(e)] || 'absent',
  }));

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Present Today" value="10" suffix="/12" change={null as any} icon={<CheckCircle2 size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Absent Today" value="1" icon={<XCircle size={20} />} iconBg="#fee2e2" iconColor="#dc2626" />
        <StatCard label="Late Today" value="1" icon={<AlertCircle size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Monthly Rate" value="95" suffix="%" change={3} icon={<TrendingUp size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
      </div>

      <div className="tab-nav">
        {[{ key: 'overview', label: 'Overview' }, { key: 'employee', label: "Today's Log" }, { key: 'calendar', label: 'My Calendar' }].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card p-6">
            <h3 style={{ marginBottom: 16 }}>Weekly Attendance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 style={{ marginBottom: 16 }}>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16 }}>Department Attendance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { dept: 'Engineering', rate: 93, color: '#22c55e' },
                { dept: 'Sales', rate: 97, color: '#3b82f6' },
                { dept: 'Design', rate: 91, color: '#8b5cf6' },
                { dept: 'Content', rate: 94, color: '#f59e0b' },
                { dept: 'HR', rate: 96, color: '#22c55e' },
                { dept: 'Finance', rate: 93, color: '#06b6d4' },
                { dept: 'Marketing', rate: 89, color: '#ec4899' },
                { dept: 'Operations', rate: 78, color: '#ef4444' },
              ].map(d => (
                <div key={d.dept} style={{ padding: '14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{d.dept}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: d.rate >= 90 ? '#16a34a' : d.rate >= 80 ? '#b45309' : '#dc2626', marginBottom: 8 }}>
                    {d.rate}%
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${d.rate}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'employee' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{emp.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {emp.checkIn || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {emp.checkOut || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {emp.checkIn && emp.checkOut ? '8.5h' : emp.checkIn ? 'ongoing' : '—'}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: statusConfig[emp.todayStatus]?.bg || '#f1f5f9',
                          color: statusConfig[emp.todayStatus]?.color || '#64748b',
                          fontSize: '0.7rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {emp.todayStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="card p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3>{MONTHS[month]} {year}</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(statusConfig).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: v.bg, border: `1.5px solid ${v.color}` }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '6px 0', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const record = ATTENDANCE_RECORDS[i];
              const status = record?.status || (day > new Date().getDate() ? null : 'present');
              const cfg = status ? statusConfig[status] : null;
              return (
                <div key={day} style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: cfg ? `${cfg.bg}` : 'transparent',
                  border: cfg ? `1px solid ${cfg.color}25` : '1px solid var(--border-light)',
                  cursor: cfg ? 'pointer' : 'default',
                  transition: 'all 200ms',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: cfg ? cfg.color : 'var(--text-muted)',
                  padding: 4,
                }}>
                  {day}
                  {cfg && record?.checkIn && (
                    <div style={{ fontSize: '0.55rem', marginTop: 2, opacity: 0.8, fontWeight: 400 }}>{record.checkIn}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
