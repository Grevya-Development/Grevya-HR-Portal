import React from 'react';
import { useStore } from '../services/store';
import { PERFORMANCE_DATA } from '../data/mockData';
import StatCard from '../components/ui/StatCard';
import AIInsightCard from '../components/ai/AIInsightCard';
import { AI_INSIGHTS } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Users, TrendingUp, CheckCircle, Clock, Check, X } from 'lucide-react';

export default function ManagerDashboard() {
  const { employees, leaveRequests, approveLeave, rejectLeave } = useStore();
  const teamEmployees = employees.slice(0, 6);
  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending');
  const avgPerf = Math.round(teamEmployees.reduce((s, e) => s + e.performance, 0) / teamEmployees.length);
  const avgAtt = Math.round(teamEmployees.reduce((s, e) => s + e.attendance, 0) / teamEmployees.length);

  const radarData = [
    { subject: 'Performance', A: 88 },
    { subject: 'Attendance', A: 93 },
    { subject: 'Delivery', A: 85 },
    { subject: 'Collab', A: 90 },
    { subject: 'Growth', A: 78 },
  ];

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Team Size" value={teamEmployees.length} icon={<Users size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Team Performance" value={avgPerf} suffix="/100" change={3.2} icon={<TrendingUp size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
        <StatCard label="Attendance Rate" value={avgAtt} suffix="%" icon={<Clock size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Tasks Completed" value={42} change={12.5} icon={<CheckCircle size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Team performance chart */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Team Performance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="teamPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#teamPerf)" name="Team Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Team radar */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Team Strengths</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar name="Team" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Team members */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Team Members</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {teamEmployees.map(emp => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar">{emp.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }} className="truncate">{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                  <div className="progress" style={{ marginTop: 6 }}>
                    <div className="progress-bar progress-green" style={{ width: `${emp.performance}%` }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>{emp.performance}</div>
                  <span className={`badge ${emp.status === 'active' ? 'badge-green' : emp.status === 'on_leave' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: '0.6rem' }}>
                    {emp.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Pending Approvals</h3>
            <span className="badge badge-yellow">{pendingLeaves.length}</span>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
              <p>All caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingLeaves.slice(0, 4).map(req => (
                <div key={req.id} style={{
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className="avatar avatar-sm">{req.employeeAvatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{req.employeeName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.type} · {req.days} day{req.days > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 10, fontStyle: 'italic' }}>"{req.reason}"</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', gap: 4 }} onClick={() => approveLeave(req.id)}>
                      <Check size={12} /> Approve
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center', gap: 4 }} onClick={() => rejectLeave(req.id, 'Rejected by manager')}>
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights for managers */}
      <div className="card p-6">
        <div className="section-header">
          <h3>🤖 AI Team Insights</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {AI_INSIGHTS.slice(0, 4).map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}
