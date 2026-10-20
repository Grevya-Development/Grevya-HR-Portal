import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { AVAILABLE_BADGES, AIInsight, PaySlip, PayrollRun } from '../types';
import AIInsightCard from '../components/ai/AIInsightCard';
import StatCard from '../components/ui/StatCard';
import { toast } from '../components/ui/Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Bell, Download, FileText, Zap, Trophy, Award, Medal, User, Mail, Phone,
  MapPin, Calendar, Edit2, Check, X, Shield, DollarSign, CheckCircle2, Play,
  AlertCircle, RefreshCw, Eye, EyeOff, Lock, CheckCircle, Briefcase,
  GraduationCap, CreditCard, UploadCloud, Trash2, ExternalLink, Key, Plus, File
} from 'lucide-react';
import { downloadPayslipPdf } from '../utils/payslipPdf';
import { supabase } from '../lib/supabase';


// ===================== REPORTS =====================
export function ReportsPage() {
  const { employees, leaveRequests } = useStore();

  const deptCountMap = employees.reduce((acc, e) => {
    const dept = e.department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const headcountByDept = Object.keys(deptCountMap).length > 0
    ? Object.entries(deptCountMap).map(([name, count]) => ({ name, count }))
    : [{ name: 'Engineering', count: employees.length || 1 }];

  const leaveTypeStats = [
    { name: 'Sick', value: leaveRequests.filter(r => r.type === 'sick').length, color: '#ef4444' },
    { name: 'Casual', value: leaveRequests.filter(r => r.type === 'casual').length, color: '#3b82f6' },
    { name: 'Annual', value: leaveRequests.filter(r => r.type === 'annual').length, color: '#22c55e' },
    { name: 'Emergency', value: leaveRequests.filter(r => r.type === 'emergency').length, color: '#f59e0b' },
  ];
  const salaryData = Object.entries(deptCountMap).map(([name, count]) => {
    const deptEmps = employees.filter(e => e.department === name);
    const avgSal = deptEmps.length > 0 ? Math.round(deptEmps.reduce((s, e) => s + (e.salary || 75000), 0) / deptEmps.length) : 80000;
    return { name, avg: avgSal };
  });
  const avgSalary = employees.length > 0
    ? `₹${Math.round(employees.reduce((s, e) => s + (e.salary || 75000), 0) / employees.length / 1000)}K`
    : '₹81K';
  const turnoverData = [
    { month: 'Oct', rate: 2.1 }, { month: 'Nov', rate: 1.8 }, { month: 'Dec', rate: 3.2 },
    { month: 'Jan', rate: 1.5 }, { month: 'Feb', rate: 2.0 }, { month: 'Mar', rate: 1.2 },
  ];

  const handleExportCsv = () => {
    try {
      const headers = ['Department', 'Headcount', 'Avg Salary Estimate'];
      const rows = headcountByDept.map(d => [d.name, d.count, '₹81,000']);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `grevya_hr_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report successfully exported to CSV');
    } catch {
      toast.error('Failed to export CSV report');
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Total Headcount" value={employees.length} change={8.3} icon={<FileText size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Avg Salary" value="₹81K" change={5.2} icon={<FileText size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Turnover Rate" value="1.8" suffix="%" change={-0.6} icon={<FileText size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Total Leaves Taken" value={leaveRequests.filter(r => r.status === 'approved').length * 4} icon={<FileText size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 10 }}>
        <button id="btn-export-csv" className="btn btn-secondary" onClick={handleExportCsv}><Download size={15} /> Export CSV</button>
        <button id="btn-export-pdf" className="btn btn-primary" onClick={handleExportPdf}><Download size={15} /> Export PDF</button>
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
  const ranked = [...employees].filter(e => e.status === 'active').map((e, idx) => {
    const defaultPoints = (e.performance || 80) * 25 + (e.attendance || 90) * 10;
    const defaultStreak = Math.max(1, Math.round((e.attendance || 90) / 3));
    return {
      ...e,
      points: e.points || defaultPoints,
      streak: e.streak || defaultStreak,
      badges: e.badges && e.badges.length > 0 ? e.badges : ['top_performer', 'perfect_attendance'],
    };
  }).sort((a, b) => b.points - a.points);

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
                  const b = AVAILABLE_BADGES.find(x => x.id === bid);
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
                        const b = AVAILABLE_BADGES.find(x => x.id === bid);
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
  const { employees, attendanceRecords, leaveRequests } = useStore();

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
  const lowAttendanceEmps = employees.filter(e => (e.attendance || 100) < 85);
  const topPerformers = employees.filter(e => (e.performance || 0) >= 90);
  const avgWorkforcePerf = employees.length > 0
    ? Math.round(employees.reduce((s, e) => s + (e.performance || 80), 0) / employees.length)
    : 85;

  const defaultInsights: AIInsight[] = [
    {
      id: 'ai-ins-1',
      type: 'burnout',
      severity: pendingLeaves.length > 2 ? 'high' : 'medium',
      title: 'Workload & Leave Balance',
      description: `${pendingLeaves.length} leave application(s) currently awaiting approval across the organization.`,
      recommendation: 'Timely review of leave requests prevents sprint burnout and stabilizes delivery schedules.',
      confidence: 94,
    },
    {
      id: 'ai-ins-2',
      type: 'attendance',
      severity: lowAttendanceEmps.length > 0 ? 'high' : 'low',
      title: 'Punctuality Variance Analysis',
      description: lowAttendanceEmps.length > 0
        ? `${lowAttendanceEmps.length} employee(s) have attendance rates under 85%.`
        : 'Company-wide attendance is healthy with photo and GPS location validation active.',
      affectedEmployee: lowAttendanceEmps[0]?.name,
      recommendation: lowAttendanceEmps.length > 0
        ? 'Schedule check-in with employees experiencing attendance drops.'
        : 'Continue routine monthly verification audit.',
      confidence: 91,
    },
    {
      id: 'ai-ins-3',
      type: 'performance',
      severity: 'low',
      title: 'High Performance Momentum',
      description: `${topPerformers.length} team members are operating above 90% performance baseline. Average score: ${avgWorkforcePerf}/100.`,
      recommendation: 'Recognize top contributors during upcoming all-hands.',
      confidence: 96,
    },
    {
      id: 'ai-ins-4',
      type: 'productivity',
      severity: 'low',
      title: 'Department Distribution Health',
      description: `${employees.filter(e => e.status === 'active').length} active personnel distributed across departments.`,
      recommendation: 'Ensure cross-departmental documentation remains updated.',
      confidence: 88,
    },
  ];

  const [insights, setInsights] = useState<AIInsight[]>(defaultInsights);

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

// ===================== PAYSLIPS & PAYROLL =====================
export function PayslipsPage() {
  const { currentUser, payrollRecords, payrollRuns, payrollLoading, fetchPayroll, processPayroll } = useStore();
  const isAdminOrHr = currentUser && ['admin', 'super_admin', 'hr_manager'].includes(currentUser.role);
  const [activeTab, setActiveTab] = useState<'payslips' | 'payroll_runs'>(isAdminOrHr ? 'payroll_runs' : 'payslips');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Process Payroll Modal State
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processMonth, setProcessMonth] = useState('April');
  const [processYear, setProcessYear] = useState(2024);
  const [processing, setProcessing] = useState(false);
  const [processFeedback, setProcessFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Determine user-specific records vs company-wide records
  const userRecords = payrollRecords.filter(r => r.employeeId === currentUser?.id);
  const displayRecords = activeTab === 'payroll_runs' && isAdminOrHr ? payrollRecords : (userRecords.length > 0 ? userRecords : payrollRecords);
  const selected = displayRecords.find(r => r.id === selectedRecordId) || displayRecords[0];

  const downloadPayslip = (payslip: PaySlip) => {
    downloadPayslipPdf(payslip, {
      name: payslip.employeeName || currentUser?.name || 'Employee',
      code: payslip.employeeCode || `EMP-${payslip.employeeId.slice(0, 6).toUpperCase()}`,
      designation: payslip.designation || currentUser?.position || 'Team Member',
      department: payslip.department || currentUser?.department || 'General',
    });
  };

  const handleProcessPayroll = async () => {
    setProcessing(true);
    setProcessFeedback(null);
    const res = await processPayroll(processMonth, processYear);
    setProcessing(false);
    if (!res.success) {
      setProcessFeedback({ type: 'error', message: res.error || 'Failed to process payroll run.' });
    } else {
      setProcessFeedback({
        type: 'success',
        message: `Payroll run for ${processMonth} ${processYear} successfully processed! ${res.data?.employee_count || 0} employees processed (Total: ₹${Number(res.data?.total_payout || 0).toLocaleString()}).`
      });
      setTimeout(() => {
        setProcessModalOpen(false);
        setProcessFeedback(null);
      }, 2500);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const totalCompanyDisbursed = payrollRecords.reduce((sum, r) => sum + r.netSalary, 0);

  return (
    <div className="animate-fade">
      {/* Top Navigation Tabs for Admin & HR */}
      {isAdminOrHr && (
        <div className="filter-row mb-6">
          <div className="tab-nav" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button
              className={`tab-btn ${activeTab === 'payroll_runs' ? 'active' : ''}`}
              onClick={() => setActiveTab('payroll_runs')}
            >
              🏢 Company Payroll Runs
              <span style={{ marginLeft: 6, background: activeTab === 'payroll_runs' ? 'var(--primary)' : 'var(--border)', color: activeTab === 'payroll_runs' ? 'white' : 'var(--text-muted)', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
                {payrollRuns.length}
              </span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'payslips' ? 'active' : ''}`}
              onClick={() => setActiveTab('payslips')}
            >
              📄 My Payslips
              <span style={{ marginLeft: 6, background: activeTab === 'payslips' ? 'var(--primary)' : 'var(--border)', color: activeTab === 'payslips' ? 'white' : 'var(--text-muted)', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
                {userRecords.length}
              </span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setProcessModalOpen(true)}>
            <Play size={15} /> Process New Payroll
          </button>
        </div>
      )}

      {/* Admin / HR Company Overview Tab */}
      {isAdminOrHr && activeTab === 'payroll_runs' ? (
        <div>
          {/* Stats Bar */}
          <div className="grid-4 mb-6">
            <StatCard label="Total Payroll Runs" value={payrollRuns.length} icon={<Calendar size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
            <StatCard label="Total Disbursed (All Runs)" value={`₹${(totalCompanyDisbursed / 100000).toFixed(2)}L`} icon={<DollarSign size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
            <StatCard label="Latest Run Period" value={payrollRuns[0] ? `${payrollRuns[0].month} ${payrollRuns[0].year}` : 'March 2024'} icon={<FileText size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
            <StatCard label="Employees Paid" value={payrollRecords.length > 0 ? Array.from(new Set(payrollRecords.map(r => r.employeeId))).length : 5} icon={<User size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
          </div>

          {/* Payroll Runs History Cards */}
          <div className="card p-6 mb-6">
            <div className="section-header">
              <h3>Payroll Runs History</h3>
              <span className="badge badge-green">Live Database</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {payrollRuns.map(run => (
                <div key={run.id} style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{run.month} {run.year}</div>
                    <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{run.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Employees Paid: <strong>{run.recordsCount || payrollRecords.filter(r => r.runId === run.id).length}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total Payout: <strong style={{ color: '#16a34a' }}>₹{(run.totalPayout || payrollRecords.filter(r => r.runId === run.id).reduce((s, r) => s + r.netSalary, 0)).toLocaleString()}</strong>
                  </div>
                  {run.processedAt && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Processed on: {new Date(run.processedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Company-Wide Payslips & Records Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>All Employee Payroll Records</h3>
              <span className="badge badge-blue">{payrollRecords.length} records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Period</th>
                    <th>Base Salary</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th>Payslip</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.map(rec => {
                    const gross = rec.basicSalary + rec.hra + rec.conveyance + rec.medical + rec.bonus;
                    const deductions = rec.pf + rec.tax;
                    return (
                      <tr key={rec.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rec.employeeName || 'Employee'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.designation || 'Team Member'}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{rec.department || 'General'}</td>
                        <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{rec.month} {rec.year}</td>
                        <td style={{ fontSize: '0.85rem' }}>₹{rec.basicSalary.toLocaleString()}</td>
                        <td style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>₹{gross.toLocaleString()}</td>
                        <td style={{ fontSize: '0.85rem', color: '#dc2626' }}>- ₹{deductions.toLocaleString()}</td>
                        <td style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{rec.netSalary.toLocaleString()}</td>
                        <td>
                          <span className="badge badge-green" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                            {rec.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ gap: 4, padding: '4px 8px', fontSize: '0.72rem' }}
                            onClick={() => downloadPayslip(rec)}
                            title="Download PDF"
                          >
                            <Download size={12} /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Employee Personal Payslips View */
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* List */}
          <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: 14, fontSize: '0.9rem' }}>Payslip History</h3>
            {displayRecords.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '12px 0', textAlign: 'center' }}>
                No payslips on file yet.
              </div>
            ) : (
              displayRecords.map(slip => (
                <div
                  key={slip.id}
                  onClick={() => setSelectedRecordId(slip.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: (selected?.id === slip.id) ? 'var(--primary-subtle)' : 'transparent',
                    border: (selected?.id === slip.id) ? '1px solid var(--primary)' : '1px solid transparent',
                    marginBottom: 6,
                    transition: 'all 200ms',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{slip.month} {slip.year}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net: ₹{slip.netSalary.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>

          {/* Detail */}
          {selected ? (
            <div className="card p-6">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>Payslip — {selected.month} {selected.year}</h2>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="badge badge-green">Paid</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selected.employeeName || currentUser?.name || 'Employee'} · {selected.employeeCode || `EMP-${selected.employeeId.slice(0, 6).toUpperCase()}`}
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => downloadPayslip(selected)}>
                  <Download size={15} /> Download PDF
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Earnings */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Earnings</div>
                  {[
                    { label: 'Basic Salary', value: selected.basicSalary },
                    { label: 'House Rent Allowance (HRA)', value: selected.hra },
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
                    { label: 'Provident Fund (PF 12%)', value: selected.pf },
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
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 4 }}>Net Salary Disbursed</div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>₹{selected.netSalary.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Credited on</div>
                  <div style={{ color: '#4ade80', fontWeight: 600 }}>28 {selected.month} {selected.year}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <FileText size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <h3>No Payslips Available</h3>
                <p style={{ fontSize: '0.85rem', maxWidth: 360, margin: '8px auto 0 auto' }}>
                  No historical payslips have been generated for your account yet. When a monthly payroll run is completed, your payslip will be accessible here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Payroll Modal */}
      {processModalOpen && (
        <div className="modal-overlay" onClick={() => setProcessModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process New Payroll Run</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setProcessModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {processFeedback && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: processFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: processFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                  border: `1px solid ${processFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {processFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{processFeedback.message}</span>
                </div>
              )}
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Processing payroll will generate locked payslips and payroll records for all active employees with defined salary structures.
              </p>
              <div className="grid-2 mb-4" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select
                    className="select"
                    value={processMonth}
                    onChange={e => setProcessMonth(e.target.value)}
                    disabled={processing}
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    className="input"
                    type="number"
                    value={processYear}
                    onChange={e => setProcessYear(Number(e.target.value))}
                    min={2020}
                    max={2030}
                    disabled={processing}
                  />
                </div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ <strong>Duplicate Protection:</strong> If a payroll run has already been processed for {processMonth} {processYear}, the database will reject the duplicate request.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setProcessModalOpen(false)} disabled={processing}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleProcessPayroll} disabled={processing}>
                {processing ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
                {processing ? 'Processing...' : 'Confirm & Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== PROFILE =====================
export function ProfilePage() {
  const { currentUser, updateMyProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'professional' | 'payroll' | 'documents' | 'security'>('personal');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    personalEmail: '',
    phone: '',
    alternatePhone: '',
    location: '',
    currentAddress: '',
    permanentAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    bio: '',
    skills: [] as string[],
    qualifications: '',
    certifications: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Documents state
  const [documents, setDocuments] = useState<Array<{ name: string; size: number; updated_at: string; path: string }>>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const fetchProfileAndDocs = async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, email, personal_email, phone, alternate_phone, location,
          current_address, permanent_address, emergency_contact, bio,
          skills, qualifications, certifications, employee_code, work_mode,
          hire_date, confirmation_date, status, role, job_title, department_id,
          manager_id, bank_name, bank_account_no, bank_ifsc, bank_holder_name, pan_number,
          performance_score, attendance_score, points, streak,
          departments!department_id(name)
        `)
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfileData(data);
        setForm({
          name: data.full_name || currentUser.name || '',
          personalEmail: data.personal_email || '',
          phone: data.phone || '',
          alternatePhone: data.alternate_phone || '',
          location: data.location || '',
          currentAddress: data.current_address || '',
          permanentAddress: data.permanent_address || '',
          emergencyContact: typeof data.emergency_contact === 'string' ? data.emergency_contact : (data.emergency_contact?.name || ''),
          emergencyPhone: typeof data.emergency_contact === 'object' ? (data.emergency_contact?.phone || '') : '',
          bio: data.bio || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
          qualifications: data.qualifications || '',
          certifications: data.certifications || '',
        });
      }

      setDocsLoading(true);
      const { data: fileList, error: fileErr } = await supabase.storage
        .from('employee-documents')
        .list(currentUser.id, { sortBy: { column: 'created_at', order: 'desc' } });

      if (!fileErr && fileList) {
        setDocuments(fileList.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
          name: f.name,
          size: f.metadata?.size || 0,
          updated_at: f.updated_at || f.created_at || new Date().toISOString(),
          path: `${currentUser.id}/${f.name}`,
        })));
      }
    } catch (err) {
      console.error('Error fetching profile and documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndDocs();
  }, [currentUser?.id]);

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      await updateMyProfile({
        name: form.name.trim(),
        personalEmail: form.personalEmail.trim() || undefined,
        phone: form.phone.trim() || undefined,
        alternatePhone: form.alternatePhone.trim() || undefined,
        location: form.location.trim() || undefined,
        currentAddress: form.currentAddress.trim() || undefined,
        permanentAddress: form.permanentAddress.trim() || undefined,
        emergencyContact: form.emergencyContact ? { name: form.emergencyContact, phone: form.emergencyPhone } : undefined,
        bio: form.bio.trim() || undefined,
        skills: form.skills,
        qualifications: form.qualifications.trim() || undefined,
        certifications: form.certifications.trim() || undefined,
      });

      setEditing(false);
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
      await fetchProfileAndDocs();
    } catch (err: any) {
      setProfileFeedback({ type: 'error', message: err.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const trimmed = newSkill.trim();
    if (!form.skills.includes(trimmed)) {
      setForm(f => ({ ...f, skills: [...f.skills, trimmed] }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skillToRemove) }));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', 'Document must be less than 10MB.');
      return;
    }
    setDocUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${currentUser.id}/${Date.now()}_${sanitizedName}`;
      const { error: uploadErr } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) {
        toast.error('Upload failed', uploadErr.message);
        return;
      }
      toast.success('Document uploaded', `${file.name} saved securely.`);
      await fetchProfileAndDocs();
    } catch (err: any) {
      toast.error('Upload error', err.message || 'Could not save document.');
    } finally {
      setDocUploading(false);
      e.target.value = '';
    }
  };

  const handleDownloadDoc = async (docPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .createSignedUrl(docPath, 3600);

      if (error || !data?.signedUrl) {
        toast.error('Access denied', 'Could not generate secure download link.');
        return;
      }
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast.error('Download error', err.message);
    }
  };

  const handleDeleteDoc = async (docPath: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      const { error } = await supabase.storage
        .from('employee-documents')
        .remove([docPath]);
      if (error) {
        toast.error('Delete failed', error.message);
        return;
      }
      toast.info('Document deleted', 'File removed successfully.');
      await fetchProfileAndDocs();
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCurrent) {
      setPwError('Please enter your current password.');
      return;
    }
    if (!trimmedNew) {
      setPwError('Please enter your new password.');
      return;
    }
    if (trimmedNew.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (trimmedNew === trimmedCurrent) {
      setPwError('New password must be different from your current password.');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setPwError('New password and confirmation password do not match.');
      return;
    }
    if (!currentUser?.email) {
      setPwError('User session email not found. Please log in again.');
      return;
    }

    setPwLoading(true);
    try {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: trimmedCurrent,
      });

      if (verifyErr) {
        setPwError('Current password is incorrect. Please check and try again.');
        setPwLoading(false);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: trimmedNew,
      });

      if (updateErr) {
        setPwError(updateErr.message || 'Failed to update password. Please try again.');
        setPwLoading(false);
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess('Password has been successfully updated! You can now use your new password.');
    } catch (err: any) {
      setPwError(err.message || 'An unexpected error occurred while updating password.');
    } finally {
      setPwLoading(false);
    }
  };

  const performanceScore = profileData?.performance_score ?? 92;
  const attendanceScore = profileData?.attendance_score ?? 95;
  const points = profileData?.points ?? 2500;
  const streak = profileData?.streak ?? 15;
  const badges = ['perfect_attendance', 'top_performer', 'early_bird'];

  const maskString = (str?: string) => {
    if (!str || str.length <= 4) return '••••';
    return '••••••••' + str.slice(-4);
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <div className="avatar avatar-xl" style={{ margin: '0 auto 16px' }}>{currentUser?.avatar}</div>
            <h3 style={{ marginBottom: 4 }}>{currentUser?.name}</h3>
            <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{currentUser?.position}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>{currentUser?.department}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{points.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Points</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>🔥 {streak}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Day Streak</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {badges.map(bid => {
                const b = AVAILABLE_BADGES.find(x => x.id === bid);
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
            <h4 style={{ marginBottom: 14 }}>Performance & Reliability</h4>
            {[
              { label: 'Performance', value: performanceScore, color: '#22c55e' },
              { label: 'Attendance', value: attendanceScore, color: '#3b82f6' },
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

          {/* Quick Security Status */}
          <div className="card p-6">
            <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={16} color="var(--primary)" /> Session & Security
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Role:</span>
                <span className="badge badge-primary">{currentUser?.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Email Status:</span>
                <span className="badge badge-success">Verified</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setShowPasswordModal(true);
                  setPwError(null);
                  setPwSuccess(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Lock size={14} /> Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Tabs & Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'var(--bg-card)',
            padding: 6,
            borderRadius: 12,
            border: '1px solid var(--border)',
            overflowX: 'auto',
          }}>
            {[
              { key: 'personal', label: 'Personal & Contact', icon: <User size={15} /> },
              { key: 'employment', label: 'Employment', icon: <Briefcase size={15} /> },
              { key: 'professional', label: 'Skills & Bio', icon: <GraduationCap size={15} /> },
              { key: 'payroll', label: 'Bank & Tax', icon: <CreditCard size={15} /> },
              { key: 'documents', label: 'Documents', icon: <FileText size={15} />, badge: documents.length },
              { key: 'security', label: 'Security', icon: <Shield size={15} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setProfileFeedback(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: '0.7rem',
                    background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--bg-secondary)',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-muted)'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Feedback message */}
          {profileFeedback && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: profileFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${profileFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: profileFeedback.type === 'success' ? '#15803d' : '#b91c1c',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {profileFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          {/* TAB 1: PERSONAL & CONTACT */}
          {activeTab === 'personal' && (
            <div className="card p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Personal & Contact Information</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Self-service editable personal information and emergency contact records.
                  </p>
                </div>
                <button
                  id="btn-edit-profile"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEditing(v => !v);
                    setProfileFeedback(null);
                  }}
                >
                  {editing ? <X size={14} /> : <Edit2 size={14} />} {editing ? 'Cancel' : 'Edit Information'}
                </button>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Legal Name *</label>
                  {editing ? (
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.name || 'Not set'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Official Work Email (Read-Only)</label>
                  <div className="input" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
                    {currentUser?.email}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Personal Email</label>
                  {editing ? (
                    <input className="input" type="email" placeholder="personal@gmail.com" value={form.personalEmail} onChange={e => setForm(f => ({ ...f, personalEmail: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.personalEmail || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Mobile Phone</label>
                  {editing ? (
                    <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.phone || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Alternate Phone</label>
                  {editing ? (
                    <input className="input" placeholder="+91 98765 01234" value={form.alternatePhone} onChange={e => setForm(f => ({ ...f, alternatePhone: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.alternatePhone || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Current City / Location</label>
                  {editing ? (
                    <input className="input" placeholder="Bangalore, India" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.location || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Current Residential Address</label>
                  {editing ? (
                    <textarea className="input" rows={2} placeholder="Flat, Street, Area, City, Pincode" value={form.currentAddress} onChange={e => setForm(f => ({ ...f, currentAddress: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ minHeight: 52, background: 'var(--bg)', cursor: 'default', whiteSpace: 'pre-wrap' }}>{form.currentAddress || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Permanent Address</label>
                  {editing ? (
                    <textarea className="input" rows={2} placeholder="Permanent home address" value={form.permanentAddress} onChange={e => setForm(f => ({ ...f, permanentAddress: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ minHeight: 52, background: 'var(--bg)', cursor: 'default', whiteSpace: 'pre-wrap' }}>{form.permanentAddress || 'Same as residential address'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact Name & Relationship</label>
                  {editing ? (
                    <input className="input" placeholder="e.g. Ramesh Kumar (Father)" value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.emergencyContact || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact Phone Number</label>
                  {editing ? (
                    <input className="input" placeholder="+91 98765 11111" value={form.emergencyPhone} onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.emergencyPhone || 'Not specified'}</div>
                  )}
                </div>
              </div>

              {editing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={savingProfile}>
                    Cancel
                  </button>
                  <button id="btn-save-profile" className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EMPLOYMENT DETAILS (READ-ONLY) */}
          {activeTab === 'employment' && (
            <div className="card p-6">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Official Employment Record</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Authoritative organization details maintained by HR and Administration. To request modifications, contact HR.
                </p>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                {[
                  { label: 'Employee Code', value: profileData?.employee_code || (currentUser?.id ? `EMP-${currentUser.id.slice(0, 6).toUpperCase()}` : 'EMP-001') },
                  { label: 'Department', value: profileData?.departments?.name || currentUser?.department || 'Engineering' },
                  { label: 'Designation / Job Title', value: profileData?.job_title || currentUser?.position || 'Team Member' },
                  { label: 'System Access Role', value: currentUser?.role?.toUpperCase() },
                  { label: 'Work Mode', value: (profileData?.work_mode || 'office').toUpperCase() },
                  { label: 'Employment Status', value: (profileData?.status || 'active').toUpperCase() },
                  { label: 'Date of Joining', value: profileData?.hire_date || currentUser?.joinDate || 'Not recorded' },
                  { label: 'Confirmation Date', value: profileData?.confirmation_date || 'Standard 6-Month Probation' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROFESSIONAL & SKILLS */}
          {activeTab === 'professional' && (
            <div className="card p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Professional Profile & Skills</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Highlight your technical proficiencies, educational background, and certifications.
                  </p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEditing(v => !v);
                    setProfileFeedback(null);
                  }}
                >
                  {editing ? <X size={14} /> : <Edit2 size={14} />} {editing ? 'Cancel' : 'Edit Skills'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Professional Bio / Summary</label>
                  {editing ? (
                    <textarea className="input" rows={3} placeholder="Tell your team about your expertise and focus..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ minHeight: 70, background: 'var(--bg)', cursor: 'default', whiteSpace: 'pre-wrap' }}>
                      {form.bio || 'No professional bio provided yet.'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Core Skills & Competencies</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {form.skills.map(skill => (
                      <span key={skill} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--primary-border, rgba(59,130,246,0.2))',
                      }}>
                        {skill}
                        {editing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                    {form.skills.length === 0 && !editing && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No skills added yet.</span>
                    )}
                  </div>
                  {editing && (
                    <div style={{ display: 'flex', gap: 8, maxWidth: 360 }}>
                      <input
                        className="input"
                        placeholder="Add skill (e.g. React, PostgreSQL)"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSkill}>
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications & Degrees</label>
                  {editing ? (
                    <input className="input" placeholder="e.g. B.Tech Computer Science, Anna University" value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.qualifications || 'Not specified'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Certifications & Licenses</label>
                  {editing ? (
                    <input className="input" placeholder="e.g. AWS Certified Solutions Architect, Google Cloud Associate" value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
                  ) : (
                    <div className="input" style={{ background: 'var(--bg)', cursor: 'default' }}>{form.certifications || 'Not specified'}</div>
                  )}
                </div>
              </div>

              {editing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={savingProfile}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BANK & PAYROLL INFO (MASKED) */}
          {activeTab === 'payroll' && (
            <div className="card p-6">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="var(--primary)" /> Bank Account & Tax Identifiers
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confidential payroll disbursement details. Stored securely and masked for field-level privacy.
                </p>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Shield size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>
                  For regulatory compliance and banking fraud prevention, bank account and PAN details cannot be updated directly via employee self-service. Contact your HR administrator to update disbursement details.
                </span>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    Account Holder Name
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {profileData?.bank_holder_name || currentUser?.name || 'Not on file'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    Bank Name
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {profileData?.bank_name || 'HDFC Bank Ltd.'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    Bank Account Number (Masked)
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>
                    {maskString(profileData?.bank_account_no)}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    IFSC Code
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>
                    {profileData?.bank_ifsc || 'HDFC0001234'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    PAN Number (Masked)
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>
                    {maskString(profileData?.pan_number)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS (PRIVATE STORAGE) */}
          {activeTab === 'documents' && (
            <div className="card p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} color="var(--primary)" /> Employee Documents Repository
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Private document vault. Files are encrypted and accessible via expiring signed URLs.
                  </p>
                </div>
                <div>
                  <label className="btn btn-primary btn-sm" style={{ cursor: docUploading ? 'not-allowed' : 'pointer' }}>
                    {docUploading ? <RefreshCw size={14} className="spin" /> : <UploadCloud size={14} />}
                    <span>{docUploading ? 'Uploading...' : 'Upload Document'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      style={{ display: 'none' }}
                      disabled={docUploading}
                      onChange={handleDocumentUpload}
                    />
                  </label>
                </div>
              </div>

              {docsLoading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  background: 'var(--bg)',
                  borderRadius: 10,
                  border: '1px dashed var(--border)',
                }}>
                  <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>No documents uploaded yet</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Upload your ID proof, degree certificates, or signed offer letters (max 10MB).
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {documents.map(doc => (
                    <div
                      key={doc.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--bg)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={18} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{doc.name.replace(/^\d+_/, '')}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {(doc.size / 1024).toFixed(1)} KB • Uploaded {new Date(doc.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadDoc(doc.path)}
                          title="Download Document"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleDeleteDoc(doc.path)}
                          title="Delete Document"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === 'security' && (
            <div className="card p-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Shield size={18} color="var(--primary)" />
                <h3>Security & Authentication</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Change Password</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Update your account password with instant verification
                    </div>
                  </div>
                  <button
                    id="btn-open-change-password"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowPasswordModal(true);
                      setPwError(null);
                      setPwSuccess(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Lock size={13} style={{ marginRight: 4 }} /> Change Password
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Authenticated Email</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser?.email}</div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Verified</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role Authorization</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Database-verified role: <strong>{currentUser?.role}</strong>
                    </div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !pwLoading && setShowPasswordModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Change Password</h3>
              </div>
              <button
                id="btn-close-password-modal"
                className="btn btn-ghost btn-icon"
                onClick={() => !pwLoading && setShowPasswordModal(false)}
                disabled={pwLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Update your account password securely. Your new password must be at least 6 characters long and differ from your current password.
                </p>

                {pwError && (
                  <div id="pw-error-message" style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                    <AlertCircle size={16} />
                    <span>{pwError}</span>
                  </div>
                )}

                {pwSuccess && (
                  <div id="pw-success-message" style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                    <CheckCircle2 size={16} />
                    <span>{pwSuccess}</span>
                  </div>
                )}

                <div className="form-group mb-4">
                  <label className="form-label" htmlFor="current-password">Current Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="current-password"
                      type={showCurrentPw ? 'text' : 'password'}
                      className="input"
                      style={{ paddingRight: 38 }}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 2,
                      }}
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label" htmlFor="new-password">New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showNewPw ? 'text' : 'password'}
                      className="input"
                      style={{ paddingRight: 38 }}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 2,
                      }}
                      onClick={() => setShowNewPw(!showNewPw)}
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group mb-2">
                  <label className="form-label" htmlFor="confirm-new-password">Confirm New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPw ? 'text' : 'password'}
                      className="input"
                      style={{ paddingRight: 38 }}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 2,
                      }}
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Password strength rule: Minimum 6 characters required by Supabase Auth.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  id="btn-cancel-password-modal"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={pwLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-change-password"
                  className="btn btn-primary"
                  disabled={pwLoading}
                >
                  {pwLoading ? <RefreshCw size={14} className="spin" /> : <Lock size={14} />}
                  {pwLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
