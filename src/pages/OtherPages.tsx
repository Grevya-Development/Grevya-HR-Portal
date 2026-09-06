import React, { useState } from 'react';
import { useStore } from '../services/store';
import { DEPARTMENT_STATS, LEADERBOARD, AI_INSIGHTS, PAYSLIPS, BADGES } from '../data/mockData';
import AIInsightCard from '../components/ai/AIInsightCard';
import StatCard from '../components/ui/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Bell, Download, FileText, Zap, Trophy, Award, Medal, User, Mail, Phone, MapPin, Calendar, Edit2, Check, X, Shield } from 'lucide-react';

// ===================== REPORTS =====================
export function ReportsPage() {
  const { employees, leaveRequests } = useStore();

  const headcountByDept = DEPARTMENT_STATS.map(d => ({ name: d.name, count: d.employees }));
  const leaveTypeStats = [
    { name: 'Sick', value: leaveRequests.filter(r => r.type === 'sick').length, color: '#ef4444' },
    { name: 'Casual', value: leaveRequests.filter(r => r.type === 'casual').length, color: '#3b82f6' },
    { name: 'Annual', value: leaveRequests.filter(r => r.type === 'annual').length, color: '#22c55e' },
    { name: 'Emergency', value: leaveRequests.filter(r => r.type === 'emergency').length, color: '#f59e0b' },
  ];
  const salaryData = DEPARTMENT_STATS.map(d => ({ name: d.name, avg: 75000 + Math.random() * 30000 | 0 }));
  const turnoverData = [
    { month: 'Oct', rate: 2.1 }, { month: 'Nov', rate: 1.8 }, { month: 'Dec', rate: 3.2 },
    { month: 'Jan', rate: 1.5 }, { month: 'Feb', rate: 2.0 }, { month: 'Mar', rate: 1.2 },
  ];

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Total Headcount" value={employees.length} change={8.3} icon={<FileText size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Avg Salary" value="₹81K" change={5.2} icon={<FileText size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Turnover Rate" value="1.8" suffix="%" change={-0.6} icon={<FileText size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Total Leaves Taken" value={leaveRequests.filter(r => r.status === 'approved').length * 4} icon={<FileText size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 10 }}>
        <button className="btn btn-secondary"><Download size={15} /> Export CSV</button>
        <button className="btn btn-primary"><Download size={15} /> Export PDF</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Headcount by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={headcountByDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Headcount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Leave Type Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={leaveTypeStats} cx="50%" cy="50%" outerRadius={75} paddingAngle={4} dataKey="value">
                  {leaveTypeStats.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {leaveTypeStats.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Avg Salary by Dept (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salaryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={80} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={v => [`₹${Number(v).toLocaleString()}`, 'Avg Salary']} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Turnover Rate</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 5]} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} name="Turnover %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ===================== NOTIFICATIONS =====================
export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllRead } = useStore();
  const unread = notifications.filter(n => !n.read).length;

  const typeIcon: Record<string, React.ReactNode> = {
    info: <Bell size={16} color="#3b82f6" />,
    success: <Check size={16} color="#22c55e" />,
    warning: <Bell size={16} color="#f59e0b" />,
    error: <Bell size={16} color="#ef4444" />,
  };

  const typeBg: Record<string, string> = {
    info: '#dbeafe', success: '#dcfce7', warning: '#fef9c3', error: '#fee2e2',
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>{unread} unread</span>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => (
          <div
            key={n.id}
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              cursor: 'pointer',
              opacity: n.read ? 0.65 : 1,
              borderLeft: !n.read ? `3px solid ${n.type === 'error' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#22c55e' : '#3b82f6'}` : '3px solid transparent',
              transition: 'opacity 200ms',
            }}
            onClick={() => markNotificationRead(n.id)}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: typeBg[n.type] || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {typeIcon[n.type]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.title}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(n.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
            </div>
            {!n.read && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== LEADERBOARD =====================
export function LeaderboardPage() {
  const { employees } = useStore();
  const ranked = [...employees].filter(e => e.status === 'active').map(e => ({
    ...e,
    points: e.points || Math.floor(Math.random() * 1000) + 1500,
    streak: e.streak || Math.floor(Math.random() * 50) + 1,
    badges: e.badges || ['top_performer', 'perfect_attendance', 'early_bird'].slice(0, Math.floor(Math.random() * 3) + 1)
  })).sort((a, b) => b.points - a.points);

  const medalConfig = [
    { bg: 'linear-gradient(135deg, #fbbf24, #d97706)', label: '🥇 1st' },
    { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', label: '🥈 2nd' },
    { bg: 'linear-gradient(135deg, #cd7c3b, #a16207)', label: '🥉 3rd' },
  ];

  return (
    <div className="animate-fade">
      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 16, marginBottom: 28 }}>
        {[ranked[1], ranked[0], ranked[2]].map((emp, idx) => {
          const rank = idx === 0 ? 1 : idx === 1 ? 0 : 2;
          const cfg = medalConfig[rank];
          const isFirst = rank === 0;
          if (!emp) return <div key={idx} />;
          return (
            <div key={emp.id} className="card" style={{
              padding: '24px 20px',
              textAlign: 'center',
              background: isFirst ? 'linear-gradient(160deg, #1a4a28 0%, #0f2b18 100%)' : undefined,
              color: isFirst ? 'white' : undefined,
              transform: isFirst ? 'translateY(-8px)' : undefined,
              boxShadow: isFirst ? '0 20px 40px rgba(34,197,94,0.25)' : undefined,
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{['🥈', '🥇', '🥉'][idx]}</div>
              <div className="avatar avatar-lg" style={{ margin: '0 auto 12px', background: cfg.bg }}>{emp.avatar}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{emp.name}</div>
              <div style={{ fontSize: '0.7rem', color: isFirst ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginBottom: 12 }}>{emp.position}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isFirst ? '#4ade80' : 'var(--primary)' }}>{emp.points.toLocaleString()}</div>
              <div style={{ fontSize: '0.65rem', color: isFirst ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>points</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                {emp.badges.slice(0, 3).map(bid => {
                  const b = BADGES.find(x => x.id === bid);
                  return b ? <span key={bid} title={b.name} style={{ fontSize: '1rem' }}>{b.icon}</span> : null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full leaderboard */}
      <div className="card">
        <div style={{ padding: '20px 24px 0' }}>
          <h3>Full Rankings</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Points</th>
                <th>Streak</th>
                <th>Badges</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((emp, i) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3b' : 'var(--border)',
                      color: i < 3 ? 'white' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800,
                    }}>
                      {i + 1}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{emp.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip">{emp.department}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{emp.points.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔥 <span style={{ fontWeight: 600 }}>{emp.streak}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {emp.badges.slice(0, 4).map(bid => {
                        const b = BADGES.find(x => x.id === bid);
                        return b ? <span key={bid} title={b.name} style={{ fontSize: '1rem' }}>{b.icon}</span> : null;
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }}>
                        <div className="progress-bar progress-green" style={{ width: `${emp.performance}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{emp.performance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===================== AI INSIGHTS PAGE =====================
export function AIPage() {
  const [insights, setInsights] = useState(AI_INSIGHTS);

  const stats = {
    high: insights.filter(i => i.severity === 'high').length,
    medium: insights.filter(i => i.severity === 'medium').length,
    low: insights.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>High Severity</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{stats.high}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Medium Severity</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{stats.medium}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Low / Info</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{stats.low}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3>Active Insights</h3>
        <span className="badge badge-purple">{insights.length} total</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {insights.map(insight => (
          <AIInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={id => setInsights(prev => prev.filter(i => i.id !== id))}
          />
        ))}
        {insights.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <Zap size={32} />
              <h3>All clear!</h3>
              <p>No active insights. The AI is monitoring your team.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== PAYSLIPS =====================
export function PayslipsPage() {
  const [selected, setSelected] = useState(PAYSLIPS[0]);

  const downloadPayslip = (payslip: typeof PAYSLIPS[0]) => {
    const content = `Payslip for ${payslip.month} ${payslip.year}\n\nNet Salary: ₹${payslip.netSalary.toLocaleString()}\nBasic: ₹${payslip.basicSalary.toLocaleString()}\nHRA: ₹${payslip.hra.toLocaleString()}\nConveyance: ₹${payslip.conveyance.toLocaleString()}\nMedical: ₹${payslip.medical.toLocaleString()}\nBonus: ₹${payslip.bonus.toLocaleString()}\nPF: -₹${payslip.pf.toLocaleString()}\nTax: -₹${payslip.tax.toLocaleString()}`; // Simplified content
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${payslip.month}_${payslip.year}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* List */}
        <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: 14, fontSize: '0.9rem' }}>Payslip History</h3>
          {PAYSLIPS.map(slip => (
            <div
              key={slip.id}
              onClick={() => setSelected(slip)}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                background: selected.id === slip.id ? 'var(--primary-subtle)' : 'transparent',
                border: selected.id === slip.id ? '1px solid var(--primary)' : '1px solid transparent',
                marginBottom: 6,
                transition: 'all 200ms',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{slip.month} {slip.year}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net: ₹{slip.netSalary.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="card p-6">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>Payslip — {selected.month} {selected.year}</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <span className="badge badge-green">Paid</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kiran Patel · EMP001</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => downloadPayslip(selected)}><Download size={15} /> Download PDF</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Earnings */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Earnings</div>
              {[
                { label: 'Basic Salary', value: selected.basicSalary },
                { label: 'House Rent Allowance', value: selected.hra },
                { label: 'Conveyance', value: selected.conveyance },
                { label: 'Medical Allowance', value: selected.medical },
                { label: 'Performance Bonus', value: selected.bonus },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>₹{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, color: '#16a34a', fontSize: '0.95rem' }}>
                <span>Gross Earnings</span>
                <span>₹{(selected.basicSalary + selected.hra + selected.conveyance + selected.medical + selected.bonus).toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Deductions</div>
              {[
                { label: 'Provident Fund (12%)', value: selected.pf },
                { label: 'Income Tax (TDS)', value: selected.tax },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>- ₹{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>
                <span>Total Deductions</span>
                <span>- ₹{(selected.pf + selected.tax).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1a4a28 0%, #0f2b18 100%)',
            borderRadius: 14,
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 4 }}>Net Salary</div>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>₹{selected.netSalary.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Credited on</div>
              <div style={{ color: '#4ade80', fontWeight: 600 }}>31 {selected.month} {selected.year}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== PROFILE =====================
export function ProfilePage() {
  const { currentUser } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: currentUser?.name || '', email: currentUser?.email || '', phone: '+91 98765 43210', location: 'Bangalore' });

  const empData = { points: 2840, streak: 45, badges: ['perfect_attendance', 'top_performer', 'early_bird'], performance: 92, attendance: 97 };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        {/* Left card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <div className="avatar avatar-xl" style={{ margin: '0 auto 16px' }}>{currentUser?.avatar}</div>
            <h3 style={{ marginBottom: 4 }}>{currentUser?.name}</h3>
            <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{currentUser?.position}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>{currentUser?.department}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{empData.points.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Points</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>🔥 {empData.streak}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Day Streak</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {empData.badges.map(bid => {
                const b = BADGES.find(x => x.id === bid);
                return b ? (
                  <div key={bid} title={b.name} style={{ padding: '6px 10px', borderRadius: 20, background: `${b.color}18`, border: `1px solid ${b.color}30`, fontSize: '0.8rem' }}>
                    {b.icon}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="card p-6">
            <h4 style={{ marginBottom: 14 }}>Quick Stats</h4>
            {[
              { label: 'Performance', value: empData.performance, color: '#22c55e' },
              { label: 'Attendance', value: empData.attendance, color: '#3b82f6' },
            ].map(stat => (
              <div key={stat.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: stat.color }}>{stat.value}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${stat.value}%`, background: stat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Personal Information</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(v => !v)}>
                {editing ? <X size={14} /> : <Edit2 size={14} />} {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              {[
                { icon: <User size={16} />, label: 'Full Name', key: 'name' },
                { icon: <Mail size={16} />, label: 'Email', key: 'email' },
                { icon: <Phone size={16} />, label: 'Phone', key: 'phone' },
                { icon: <MapPin size={16} />, label: 'Location', key: 'location' },
              ].map(field => (
                <div key={field.key} className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {field.icon} {field.label}
                  </label>
                  {editing ? (
                    <input className="input" value={form[field.key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  ) : (
                    <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      {form[field.key as keyof typeof form]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => setEditing(false)}><Check size={14} /> Save Changes</button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 style={{ marginBottom: 16 }}>Employment Details</h3>
            <div className="grid-2" style={{ gap: 14 }}>
              {[
                { label: 'Employee ID', value: 'EMP001' },
                { label: 'Department', value: currentUser?.department },
                { label: 'Position', value: currentUser?.position },
                { label: 'Role', value: currentUser?.role === 'hr_manager' ? 'HR Manager' : currentUser?.role === 'manager' ? 'Manager' : 'Employee' },
                { label: 'Join Date', value: currentUser?.joinDate || '2022-03-15' },
                { label: 'Work Type', value: 'Hybrid' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Shield size={18} color="var(--primary)" />
              <h3>Security</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Change Password', desc: 'Update your account password' },
                { label: 'Two-Factor Authentication', desc: 'Add extra layer of security' },
                { label: 'Active Sessions', desc: 'Manage your login sessions' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm">Manage</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
