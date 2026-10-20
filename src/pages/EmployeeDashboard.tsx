import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { AVAILABLE_BADGES, PaySlip, AttendanceRecord } from '../types';
import StatCard from '../components/ui/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Clock, Calendar, TrendingUp, Star, Flame, Award, ChevronRight, Download, LogIn, LogOut, CheckCircle2, ShieldCheck, Coffee } from 'lucide-react';
import { downloadPayslipPdf } from '../utils/payslipPdf';
import AttendanceVerificationModal from '../components/AttendanceVerificationModal';

export default function EmployeeDashboard() {
  const {
    currentUser,
    employees,
    attendanceRecords,
    leaveRequests,
    todayAttendance,
    fetchTodayAttendance,
    clockIn,
    clockOut,
    lunchIn,
    lunchOut,
    payrollRecords,
    payrollLoading,
  } = useStore();

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'check_in' | 'check_out'>('check_in');
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const currentEmp = employees.find(e => e.id === currentUser?.id || (currentUser?.email && e.email === currentUser.email));

  const myLeaves = leaveRequests.filter(
    r =>
      r.employeeId === currentUser?.id ||
      (currentEmp?.id && r.employeeId === currentEmp.id) ||
      (currentUser?.name && r.employeeName.toLowerCase() === currentUser.name.toLowerCase())
  );

  const leavesUsed = myLeaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0);
  const leavesTotal = 34; // 18 Annual + 10 Sick + 6 Casual

  const nextBadge = { name: 'Attendance Star', icon: '⭐', target: 30 };

  const empData = {
    points: currentEmp?.points || 0,
    streak: currentEmp?.streak || 0,
    attendance: currentEmp?.attendance ?? 100,
    performance: currentEmp?.performance ?? 100,
    leavesUsed,
    leavesTotal,
    badges: currentEmp?.badges && currentEmp.badges.length > 0 ? currentEmp.badges : [],
  };

  const sortedEmployees = [...employees].sort((a, b) => (b.points || 0) - (a.points || 0));
  const myRankIndex = sortedEmployees.findIndex(e => e.id === currentUser?.id || (currentUser?.email && e.email === currentUser.email));
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : 1;

  // Calculate weekly attendance from live records
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const daysName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekAttendance = daysName.map((day, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    const record = (attendanceRecords || []).find(
      (a: AttendanceRecord) => (a.employeeId === currentUser?.id || a.employeeId === currentEmp?.id) && (a.workDate === dateStr || a.date === dateStr)
    );
    if (record) {
      return { day, status: record.status || 'present', time: record.checkIn ? record.checkIn.slice(0, 5) : record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--' };
    }
    if (d > now) {
      return { day, status: 'holiday', time: '--' };
    }
    return { day, status: 'not_marked', time: '--' };
  });

  // Dynamic performance trend leading up to user's score
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const baseScore = Math.max(60, empData.performance - 6);
  const performanceData = months.map((m, i) => ({
    month: m,
    score: Math.min(100, Math.round(baseScore + (i * (empData.performance - baseScore)) / (months.length - 1))),
  }));

  const statusColor: Record<string, string> = {
    present: '#22c55e',
    late: '#f59e0b',
    absent: '#ef4444',
    holiday: '#94a3b8',
    not_marked: '#64748b',
  };

  const isClockedIn = Boolean(todayAttendance?.clockIn);
  const isClockedOut = Boolean(todayAttendance?.clockOut);

  const handleOpenPunch = (action: 'check_in' | 'check_out') => {
    setVerificationAction(action);
    setVerificationModalOpen(true);
  };

  const handleVerificationSuccess = async (data: {
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    exceptionReason?: string;
  }) => {
    setPunchLoading(true);
    setPunchMsg(null);
    let res;
    if (verificationAction === 'check_in') {
      res = await clockIn('office', undefined, data.latitude, data.longitude, data.photoUrl, data.accuracy, data.exceptionReason);
    } else {
      res = await clockOut(undefined, data.photoUrl, data.latitude, data.longitude, data.accuracy, data.exceptionReason);
    }
    setPunchLoading(false);
    if (!res.success) {
      setPunchMsg({ type: 'error', text: res.error || `Clock-${verificationAction === 'check_in' ? 'in' : 'out'} failed` });
      return { success: false, error: res.error };
    } else {
      const punchTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      setPunchMsg({
        type: 'success',
        text: verificationAction === 'check_in'
          ? `Clocked in successfully at ${punchTime} with verified photo & GPS.`
          : `Workday completed and clocked out successfully at ${punchTime}.`,
      });
      return { success: true };
    }
  };

  return (
    <div className="animate-fade">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a4a28 0%, #0f2b18 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,197,94,0.07)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(34,197,94,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 6 }}>Good day 👋</div>
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
            <div style={{ color: '#4ade80', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>#{myRank}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>of {employees.length || 1} employees</div>
          </div>
        </div>
      </div>

      {/* Attendance Quick Punch Desk Card */}
      <div className="card p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: isClockedOut ? 'rgba(100,116,139,0.1)' : isClockedIn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isClockedOut ? '#64748b' : isClockedIn ? '#16a34a' : '#ef4444',
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Today's Attendance</span>
                <span className={`badge ${isClockedOut ? 'badge-gray' : isClockedIn ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.72rem' }}>
                  {isClockedOut ? 'Workday Completed' : isClockedIn ? 'Clocked In (Active)' : 'Not Clocked In'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {isClockedIn ? `In at ${todayAttendance?.clockIn ? new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}` : 'Start your workday with verified photo and location'}
                {isClockedOut && ` · Out at ${todayAttendance?.clockOut ? new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} (${todayAttendance?.totalHours} hrs)`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isClockedIn ? (
              <button
                onClick={() => handleOpenPunch('check_in')}
                className="btn btn-primary"
                disabled={punchLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogIn size={15} />
                Clock In (Photo & GPS)
              </button>
            ) : !isClockedOut ? (
              <button
                onClick={() => handleOpenPunch('check_out')}
                className="btn btn-danger"
                disabled={punchLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={15} />
                Clock Out
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> Workday Finished
              </div>
            )}
          </div>
        </div>

        {punchMsg && (
          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: '0.8rem',
            background: punchMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: punchMsg.type === 'success' ? '#15803d' : '#dc2626',
            border: `1px solid ${punchMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          }}>
            {punchMsg.text}
          </div>
        )}
      </div>

      <AttendanceVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        action={verificationAction}
        onSuccess={handleVerificationSuccess}
      />

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
            <AreaChart data={performanceData}>
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
              const badge = AVAILABLE_BADGES.find(b => b.id === bid);
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
            {payrollLoading ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px 0' }}>
                Loading payslips...
              </div>
            ) : payrollRecords.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px 0' }}>
                No payslips available yet.
              </div>
            ) : (
              payrollRecords.slice(0, 3).map((slip: any) => (
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
                  <button className="btn btn-ghost btn-sm" style={{ gap: 4 }} onClick={() => downloadPayslipPdf(slip, {
                    name: slip.employeeName || currentUser?.name || 'Employee',
                    code: slip.employeeCode || 'EMP',
                    designation: slip.designation || currentUser?.position || 'Staff',
                    department: slip.department || currentUser?.department || 'General',
                  })}>
                    <Download size={12} /> PDF
                  </button>
                </div>
              ))
            )}
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
