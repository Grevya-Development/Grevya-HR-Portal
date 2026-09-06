import React, { useState, useMemo } from 'react';
import { useStore } from '../services/store';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EMPLOYEES } from '../data/mockData';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const HOLIDAYS = [
  { date: '2024-01-26', name: "Republic Day", type: "national" },
  { date: '2024-03-25', name: "Holi", type: "national" },
  { date: '2024-04-14', name: "Dr. Ambedkar Jayanti", type: "national" },
  { date: '2024-04-17', name: "Ram Navami", type: "national" },
  { date: '2024-08-15', name: "Independence Day", type: "national" },
  { date: '2024-10-02', name: "Gandhi Jayanti", type: "national" },
  { date: '2024-10-12', name: "Dussehra", type: "national" },
  { date: '2024-11-01', name: "Diwali", type: "national" },
  { date: '2024-12-25', name: "Christmas Day", type: "national" },
];

const BIRTHDAYS = [
  { date: '03-14', name: 'Kiran Patel',   avatar: 'KP' },
  { date: '07-01', name: 'Sneha Rao',     avatar: 'SR' },
  { date: '11-20', name: 'Ravi Nair',     avatar: 'RN' },
  { date: '01-10', name: 'Priya Sharma',  avatar: 'PS' },
  { date: '09-05', name: 'Arjun Mehta',   avatar: 'AM' },
  { date: '03-22', name: 'Divya Kumar',   avatar: 'DK' },
  { date: '12-01', name: 'Vikram Joshi',  avatar: 'VJ' },
  { date: '04-15', name: 'Ananya Singh',  avatar: 'AS' },
];

const TEAM_EVENTS = [
  { date: '2024-03-28', name: 'Q1 All Hands Meeting', type: 'meeting', color: '#3b82f6' },
  { date: '2024-04-05', name: 'Engineering Retrospective', type: 'meeting', color: '#3b82f6' },
  { date: '2024-04-12', name: 'HR Policy Training', type: 'training', color: '#8b5cf6' },
  { date: '2024-04-22', name: 'Sales Target Review', type: 'meeting', color: '#3b82f6' },
  { date: '2024-03-31', name: 'Q1 Performance Review Deadline', type: 'deadline', color: '#ef4444' },
];

export default function CalendarPage() {
  const { leaveRequests } = useStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const mmdd = (d: number) => `${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getEventsForDay = (d: number) => {
    const ds = dateStr(d);
    const mmd = mmdd(d);
    return {
      leaves: leaveRequests.filter(r => r.startDate <= ds && r.endDate >= ds),
      holidays: HOLIDAYS.filter(h => h.date === ds),
      birthdays: BIRTHDAYS.filter(b => b.date === mmd),
      events: TEAM_EVENTS.filter(e => e.date === ds),
    };
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const upcomingBirthdays = BIRTHDAYS.filter(b => {
    const [bMonth] = b.date.split('-').map(Number);
    return bMonth - 1 === month || bMonth - 1 === (month + 1) % 12;
  }).slice(0, 5);

  const monthLeaves = leaveRequests.filter(r => {
    const sm = new Date(r.startDate).getMonth();
    const em = new Date(r.endDate).getMonth();
    return sm === month || em === month;
  });

  const selectedEvents = selectedDate ? {
    leaves: leaveRequests.filter(r => r.startDate <= selectedDate && r.endDate >= selectedDate),
    holidays: HOLIDAYS.filter(h => h.date === selectedDate),
    birthdays: BIRTHDAYS.filter(b => b.date === selectedDate.slice(5)),
    events: TEAM_EVENTS.filter(e => e.date === selectedDate),
  } : null;

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Calendar grid */}
        <div className="card p-6">
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</h3>
            <button className="btn btn-secondary btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const ds = dateStr(d);
              const ev = getEventsForDay(d);
              const hasAnything = ev.leaves.length || ev.holidays.length || ev.birthdays.length || ev.events.length;
              const isToday = ds === today.toISOString().split('T')[0];
              const isSelected = ds === selectedDate;
              const isWeekend = new Date(year, month, d).getDay() === 0 || new Date(year, month, d).getDay() === 6;

              return (
                <div
                  key={d}
                  onClick={() => setSelectedDate(isSelected ? null : ds)}
                  style={{
                    minHeight: 72, borderRadius: 10, padding: '6px 8px',
                    cursor: 'pointer', transition: 'all 150ms',
                    background: isSelected ? 'var(--primary-subtle)' : isToday ? 'rgba(34,197,94,0.08)' : isWeekend ? 'var(--bg)' : 'transparent',
                    border: isSelected ? '1.5px solid var(--primary)' : isToday ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--border-light)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(34,197,94,0.08)' : isWeekend ? 'var(--bg)' : 'transparent'; }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: isToday ? 800 : 500,
                    background: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? 'white' : isWeekend ? 'var(--text-muted)' : 'var(--text-primary)',
                    marginBottom: 4,
                  }}>
                    {d}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ev.holidays.map(h => (
                      <div key={h.date} style={{ fontSize: '0.58rem', borderRadius: 3, padding: '1px 4px', background: '#fef9c3', color: '#b45309', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🏛 {h.name}
                      </div>
                    ))}
                    {ev.events.slice(0, 1).map(e => (
                      <div key={e.name} style={{ fontSize: '0.58rem', borderRadius: 3, padding: '1px 4px', background: `${e.color}18`, color: e.color, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📌 {e.name}
                      </div>
                    ))}
                    {ev.leaves.slice(0, 1).map(l => (
                      <div key={l.id} style={{ fontSize: '0.58rem', borderRadius: 3, padding: '1px 4px', background: l.status === 'approved' ? '#dcfce7' : '#fef9c3', color: l.status === 'approved' ? '#15803d' : '#b45309', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.employeeAvatar} {l.type}
                      </div>
                    ))}
                    {ev.birthdays.slice(0, 1).map(b => (
                      <div key={b.name} style={{ fontSize: '0.58rem', borderRadius: 3, padding: '1px 4px', background: '#f3e8ff', color: '#7c3aed', fontWeight: 600, lineHeight: 1.3 }}>
                        🎂 {b.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Legend */}
          <div className="card p-6">
            <h4 style={{ marginBottom: 12 }}>Legend</h4>
            {[
              { color: '#fef9c3', text: '#b45309', label: 'Public Holiday' },
              { color: '#3b82f618', text: '#3b82f6', label: 'Team Event / Meeting' },
              { color: '#dcfce7', text: '#15803d', label: 'Approved Leave' },
              { color: '#fef9c3', text: '#b45309', label: 'Pending Leave' },
              { color: '#f3e8ff', text: '#7c3aed', label: 'Birthday 🎂' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: `1px solid ${item.text}40`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Selected date detail */}
          {selectedDate && selectedEvents && (
            <div className="card p-6">
              <h4 style={{ marginBottom: 12 }}>
                {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              {!selectedEvents.holidays.length && !selectedEvents.events.length && !selectedEvents.leaves.length && !selectedEvents.birthdays.length && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No events</div>
              )}
              {selectedEvents.holidays.map(h => (
                <div key={h.date} style={{ padding: '8px 12px', borderRadius: 8, background: '#fef9c3', color: '#b45309', marginBottom: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                  🏛 {h.name}
                </div>
              ))}
              {selectedEvents.events.map(e => (
                <div key={e.name} style={{ padding: '8px 12px', borderRadius: 8, background: `${e.color}12`, color: e.color, marginBottom: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                  📌 {e.name}
                </div>
              ))}
              {selectedEvents.birthdays.map(b => (
                <div key={b.name} style={{ padding: '8px 12px', borderRadius: 8, background: '#f3e8ff', color: '#7c3aed', marginBottom: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                  🎂 {b.name}'s Birthday
                </div>
              ))}
              {selectedEvents.leaves.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div className="avatar avatar-sm">{l.employeeAvatar}</div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{l.employeeName}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{l.type} leave · {l.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming birthdays */}
          <div className="card p-6">
            <h4 style={{ marginBottom: 12 }}>🎂 Upcoming Birthdays</h4>
            {upcomingBirthdays.length === 0
              ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No birthdays this month</div>
              : upcomingBirthdays.map(b => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>{b.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {MONTHS[parseInt(b.date.split('-')[0]) - 1]} {b.date.split('-')[1]}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>🎂</span>
                </div>
              ))
            }
          </div>

          {/* Month leaves summary */}
          <div className="card p-6">
            <h4 style={{ marginBottom: 12 }}>📅 This Month's Leaves</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {monthLeaves.slice(0, 5).map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar avatar-sm">{l.employeeAvatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }} className="truncate">{l.employeeName}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.type} · {l.days}d</div>
                  </div>
                  <span className={`badge ${l.status === 'approved' ? 'badge-green' : l.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: '0.6rem' }}>
                    {l.status}
                  </span>
                </div>
              ))}
              {monthLeaves.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No leaves this month</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
