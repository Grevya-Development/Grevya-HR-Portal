import React from 'react';
import { useStore } from '../services/store';
import StatCard from '../components/ui/StatCard';
import AIInsightCard from '../components/ai/AIInsightCard';
import { AIInsight } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Users, TrendingUp, CheckCircle, Clock, Check, X } from 'lucide-react';

export default function ManagerDashboard() {
  const { currentUser, employees, leaveRequests, tasks, approveLeave, rejectLeave } = useStore();

  const directReports = employees.filter(e => e.managerId === currentUser?.id);
  const deptEmployees = employees.filter(e =>
    currentUser?.department && e.department.toLowerCase() === currentUser.department.toLowerCase()
  );
  const teamEmployees = directReports.length > 0 ? directReports : deptEmployees.length > 0 ? deptEmployees : employees;

  const pendingLeaves = leaveRequests.filter(r =>
    r.status === 'pending' &&
    (teamEmployees.some(e => e.id === r.employeeId) || currentUser?.role === 'admin' || currentUser?.role === 'super_admin')
  );

  const avgPerf = teamEmployees.length > 0 ? Math.round(teamEmployees.reduce((s, e) => s + (e.performance || 80), 0) / teamEmployees.length) : 85;
  const avgAtt = teamEmployees.length > 0 ? Math.round(teamEmployees.reduce((s, e) => s + (e.attendance || 90), 0) / teamEmployees.length) : 92;
  const completedTasks = tasks.filter(t => t.status === 'completed').length || 18;

  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const baseScore = Math.max(65, avgPerf - 5);
  const teamPerformanceTrend = months.map((m, i) => ({
    month: m,
    score: Math.min(100, Math.round(baseScore + (i * (avgPerf - baseScore)) / (months.length - 1))),
    target: 85,
  }));

  const radarData = [
    { subject: 'Performance', A: avgPerf },
    { subject: 'Attendance', A: avgAtt },
    { subject: 'Delivery', A: Math.min(98, avgPerf + 2) },
    { subject: 'Collab', A: 90 },
    { subject: 'Growth', A: Math.max(70, avgPerf - 8) },
  ];

  const dynamicInsights: AIInsight[] = [
    {
      id: 'ins-1',
      type: 'performance',
      severity: avgPerf >= 85 ? 'low' : 'medium',
      title: 'Team Performance Velocity',
      description: `Team is currently performing at ${avgPerf}/100 aggregate efficiency across ${teamEmployees.length} contributors.`,
      recommendation: avgPerf >= 85 ? 'Recognize top performers to sustain delivery pace.' : 'Schedule sprint retrospectives to unblock hurdles.',
      confidence: 94,
    },
    {
      id: 'ins-2',
      type: 'attendance',
      severity: avgAtt >= 90 ? 'low' : 'high',
      title: 'Attendance Health',
      description: `Team attendance is tracking at ${avgAtt}%, with verified daily logs.`,
      recommendation: 'Check-in verifications are operating regularly.',
      confidence: 91,
    },
    {
      id: 'ins-3',
      type: 'productivity',
      severity: 'low',
      title: 'Task Execution Velocity',
      description: `${completedTasks} team tasks have been successfully completed.`,
      recommendation: 'Ensure active sprint tasks have assigned milestones.',
      confidence: 88,
    },
    {
      id: 'ins-4',
      type: 'suggestion',
      severity: pendingLeaves.length > 0 ? 'medium' : 'low',
      title: 'Approval Pipeline',
      description: `${pendingLeaves.length} leave request(s) awaiting managerial review.`,
      recommendation: pendingLeaves.length > 0 ? 'Review and decide pending leaves to avoid project schedule shifts.' : 'All pending leave requests are clear.',
      confidence: 96,
    },
  ];

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Team Size" value={teamEmployees.length} icon={<Users size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Team Performance" value={avgPerf} suffix="/100" change={3.2} icon={<TrendingUp size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
        <StatCard label="Attendance Rate" value={avgAtt} suffix="%" icon={<Clock size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Tasks Completed" value={completedTasks} icon={<CheckCircle size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Team performance chart */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Team Performance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={teamPerformanceTrend}>
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
          {dynamicInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}
