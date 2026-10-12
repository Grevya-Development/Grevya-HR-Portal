import React, { useState } from 'react';
import { useStore } from '../services/store';
import { PERFORMANCE_DATA, DEPARTMENT_STATS, AI_INSIGHTS } from '../data/mockData';
import StatCard from '../components/ui/StatCard';
import AIInsightCard from '../components/ai/AIInsightCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Clock, Calendar, TrendingUp, CheckCircle2, AlertCircle, XCircle, UserCheck } from 'lucide-react';

export default function HRDashboard() {
  const { employees, leaveRequests, notifications } = useStore();
  const [insights, setInsights] = useState(AI_INSIGHTS);

  const active = employees.filter(e => e.status === 'active').length;
  const onLeave = employees.filter(e => e.status === 'on_leave').length;
  const pending = leaveRequests.filter(r => r.status === 'pending').length;
  const avgPerf = Math.round(employees.reduce((s, e) => s + e.performance, 0) / employees.length);
  const avgAtt = Math.round(employees.reduce((s, e) => s + e.attendance, 0) / employees.length);

  const pieData = [
    { name: 'Active', value: active, color: '#22c55e' },
    { name: 'On Leave', value: onLeave, color: '#f59e0b' },
    { name: 'Inactive', value: employees.filter(e => e.status === 'inactive').length, color: '#94a3b8' },
  ];

  const leaveTypeData = [
    { name: 'Sick', value: leaveRequests.filter(r => r.type === 'sick').length },
    { name: 'Casual', value: leaveRequests.filter(r => r.type === 'casual').length },
    { name: 'Annual', value: leaveRequests.filter(r => r.type === 'annual').length },
    { name: 'Emergency', value: leaveRequests.filter(r => r.type === 'emergency').length },
  ];

  const HEADCOUNT_TREND = [
    { month: 'Oct', count: 180 }, { month: 'Nov', count: 195 }, { month: 'Dec', count: 210 },
    { month: 'Jan', count: 225 }, { month: 'Feb', count: 240 }, { month: 'Mar', count: 247 },
  ];

  const BIRTHDAYS = [
    { date: '04-12', name: 'Arjun Mehta',   avatar: 'AM' },
    { date: '04-15', name: 'Ananya Singh',  avatar: 'AS' },
    { date: '04-18', name: 'Sneha Rao',     avatar: 'SR' },
  ];

  const recentLeaves = leaveRequests.slice(0, 5);

  return (
    <div className="animate-fade">
      {/* Stats */}
      <div className="grid-4 mb-6">
        <StatCard label="Total Employees" value={employees.length} change={8.3} icon={<Users size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Avg Attendance" value={avgAtt} suffix="%" change={2.1} icon={<Clock size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Pending Leaves" value={pending} icon={<Calendar size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Avg Performance" value={avgPerf} suffix="/100" change={4.8} icon={<TrendingUp size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Performance Chart */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Performance Trend</h3>
            <span className="badge badge-green">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="target" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#perf)" name="Score" />
              <Area type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} fill="url(#target)" strokeDasharray="4 4" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Status */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Employee Status</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
        {/* Department performance */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Dept. Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEPARTMENT_STATS} layout="vertical" barCategoryGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avgPerformance" fill="#22c55e" radius={[0, 4, 4, 0]} name="Avg Performance" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Headcount Trend */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Headcount Growth</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={HEADCOUNT_TREND}>
              <defs>
                <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#hc)" name="Headcount" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Birthdays */}
        <div className="card p-6">
          <div className="section-header">
            <h3>🎂 Upcoming Birthdays</h3>
            <span className="badge badge-purple">This Month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {BIRTHDAYS.map(b => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>{b.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.date}</div>
                </div>
                <span style={{ fontSize: '1.2rem' }}>🎁</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card p-6">
        <div className="section-header">
          <h3>🤖 AI Insights</h3>
          <span className="badge badge-purple">{insights.length} active</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {insights.map(insight => (
            <AIInsightCard
              key={insight.id}
              insight={insight}
              onDismiss={id => setInsights(prev => prev.filter(i => i.id !== id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
