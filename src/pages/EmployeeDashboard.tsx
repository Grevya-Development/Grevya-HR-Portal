import React, { useState } from 'react';
import { useStore } from '../services/store';
import { PERFORMANCE_DATA, PAYSLIPS, BADGES } from '../data/mockData';
import StatCard from '../components/ui/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Clock, Calendar, TrendingUp, Star, Flame, Award, ChevronRight, Download } from 'lucide-react';

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

export default function EmployeeDashboard() {
  const { currentUser, leaveRequests } = useStore();
  const myLeaves = leaveRequests.filter(r => r.employeeId === 'e1');

  // Mock current user employee data
  const empData = {
    points: 2840,
    streak: 45,
    attendance: 97,
    performance: 92,
    leavesUsed: 8,
    leavesTotal: 24,
    badges: ['perfect_attendance', 'top_performer', 'early_bird'],
  };

  const nextBadge = { name: 'Streak Master', progress: 50, target: 90, icon: '🔥' };

  const weekAttendance = [
    { day: 'Mon', status: 'present', time: '08:52' },
    { day: 'Tue', status: 'present', time: '09:01' },
    { day: 'Wed', status: 'late', time: '09:32' },
    { day: 'Thu', status: 'present', time: '08:48' },
    { day: 'Fri', status: 'present', time: '08:55' },
  ];

  const statusColor: Record<string, string> = {
    present: '#22c55e',
    late: '#f59e0b',
    absent: '#ef4444',
    holiday: '#94a3b8',
  };

  return (
    <div className="animate-fade">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a4a28 0%, #0f2b18 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,197,94,0.07)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(34,197,94,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 6 }}>Good morning 👋</div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>{currentUser?.name}</h2>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={14} color="#fbbf24" />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{empData.streak}-day streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} color="#4ade80" />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{empData.points.toLocaleString()} points</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: 4 }}>Your rank</div>
            <div style={{ color: '#4ade80', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>#3</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>of 12 employees</div>
          </div>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard label="Attendance Rate" value={empData.attendance} suffix="%" change={1.5} icon={<Clock size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Performance Score" value={empData.performance} suffix="/100" change={3.2} icon={<TrendingUp size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
        <StatCard label="Leaves Remaining" value={empData.leavesTotal - empData.leavesUsed} icon={<Calendar size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Points Earned" value={empData.points.toLocaleString()} icon={<Star size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Performance chart */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>My Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="myPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="url(#myPerf)" name="Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly attendance */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>This Week</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weekAttendance.map(day => (
              <div key={day.day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{day.day}</div>
                <div style={{
                  flex: 1, height: 32, borderRadius: 8,
                  background: `${statusColor[day.status]}18`,
                  border: `1px solid ${statusColor[day.status]}30`,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 12,
                  gap: 8,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[day.status] }} />
                  <span style={{ fontSize: '0.75rem', color: statusColor[day.status], fontWeight: 600, textTransform: 'capitalize' }}>
                    {day.status}
                  </span>
                </div>
                <div style={{ width: 44, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {day.time || '--'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Badges */}
        <div className="card p-6">
          <div className="section-header">
            <h3>My Badges</h3>
            <span className="badge badge-purple">{empData.badges.length} earned</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {empData.badges.map(bid => {
              const badge = BADGES.find(b => b.id === bid);
              if (!badge) return null;
              return (
                <div key={bid} style={{
                  padding: '14px 10px',
                  borderRadius: 12,
                  background: `${badge.color}12`,
                  border: `1px solid ${badge.color}25`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{badge.icon}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: badge.color, lineHeight: 1.3 }}>{badge.name}</div>
                </div>
              );
            })}
          </div>

          {/* Next badge progress */}
          <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{nextBadge.icon} {nextBadge.name}</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Next achievement</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>
                {empData.streak}/{nextBadge.target}
              </span>
            </div>
            <div className="progress">
              <div className="progress-bar progress-amber" style={{ width: `${(empData.streak / nextBadge.target) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Recent payslips */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Recent Payslips</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PAYSLIPS.map(slip => (
              <div key={slip.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg)',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{slip.month} {slip.year}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net: ₹{slip.netSalary.toLocaleString()}</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => downloadPayslip(slip)}>
                  <Download size={12} /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My leave requests */}
      <div className="card p-6">
        <div className="section-header">
          <h3>My Leave Requests</h3>
          <span className="badge badge-blue">{myLeaves.length} total</span>
        </div>
        {myLeaves.length === 0 ? (
          <div className="empty-state">
            <Calendar size={32} />
            <p>No leave requests yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map(req => (
                  <tr key={req.id}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{req.type}</td>
                    <td>{req.startDate}</td>
                    <td>{req.endDate}</td>
                    <td>{req.days}</td>
                    <td>{req.appliedOn}</td>
                    <td>
                      <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
