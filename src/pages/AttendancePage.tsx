import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../services/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp,
  Coffee, LogOut, LogIn, RefreshCw, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, UserCheck, ShieldAlert, Laptop, Building2,
  Camera, MapPin, Navigation, ExternalLink, ShieldCheck, AlertTriangle,
  Download, Search, Filter, Users, User, ArrowRight
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { AttendanceRecord, Employee } from '../types';
import { supabase } from '../lib/supabase';
import AttendanceVerificationModal from '../components/AttendanceVerificationModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function AttendancePhotoThumbnail({ photoPath, label = 'Photo' }: { photoPath?: string; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photoPath) return;
    if (photoPath.startsWith('http') || photoPath.startsWith('data:')) {
      setUrl(photoPath);
      return;
    }
    setLoading(true);
    supabase.storage.from('attendance-photos').createSignedUrl(photoPath, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) {
          setUrl(data.signedUrl);
        }
        setLoading(false);
      });
  }, [photoPath]);

  if (!photoPath) return null;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {loading ? (
        <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          ...
        </div>
      ) : url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={`View ${label} (opens full size)`}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 34, height: 34, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', display: 'block' }}
        >
          <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </a>
      ) : (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
      )}
    </div>
  );
}

export interface DailyAttendanceRow {
  employee: Employee;
  record?: AttendanceRecord;
  status: 'working' | 'lunch_break' | 'completed' | 'not_clocked_in' | 'absent' | 'on_leave' | 'holiday' | 'scheduled';
  statusLabel: string;
  clockInTime: string;
  clockOutTime: string;
  lunchTimeStr: string;
  totalHoursStr: string;
  hasException: boolean;
  exceptionReason?: string;
  isMissingPunch: boolean;
  leaveType?: string;
  holidayName?: string;
}

export default function AttendancePage() {
  const {
    currentUser,
    employees,
    departments,
    attendanceRecords,
    attendanceLoading,
    attendanceError,
    todayAttendance,
    workPolicy,
    leaveRequests,
    holidays,
    fetchAttendance,
    fetchTodayAttendance,
    fetchWorkPolicy,
    fetchEmployees,
    fetchDepartments,
    fetchLeaves,
    fetchHolidays,
    clockIn,
    lunchOut,
    lunchIn,
    clockOut,
  } = useStore();

  const isHRorAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'hr_manager';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [tab, setTab] = useState<'monitoring' | 'overview' | 'my_punch' | 'calendar'>(() => isHRorAdmin ? 'monitoring' : 'my_punch');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Quick Punch Form State
  const [workMode, setWorkMode] = useState<'office' | 'remote' | 'hybrid'>('office');
  const [punchNotes, setPunchNotes] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Date in India-local time YYYY-MM-DD
  const getTodayKolkataStr = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  };

  const todayStr = getTodayKolkataStr();

  // Filters for Daily Monitoring
  const [logDate, setLogDate] = useState<string>(todayStr);
  const [logSearch, setLogSearch] = useState('');
  const [logDept, setLogDept] = useState('all');
  const [logManager, setLogManager] = useState('all');
  const [logStatus, setLogStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Digital clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ensure all necessary data is loaded
  useEffect(() => {
    fetchTodayAttendance();
    fetchWorkPolicy();
    fetchAttendance();
    fetchEmployees();
    fetchDepartments();
    fetchLeaves();
    fetchHolidays();
  }, [fetchTodayAttendance, fetchWorkPolicy, fetchAttendance, fetchEmployees, fetchDepartments, fetchLeaves, fetchHolidays]);

  // Format timestamp helper in India-local time
  const formatTimeStr = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '—';
    }
  };

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'check_in' | 'check_out'>('check_in');

  const handleClockIn = () => {
    setVerificationAction('check_in');
    setVerificationModalOpen(true);
  };

  const handleClockOut = () => {
    setVerificationAction('check_out');
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
    setFeedback(null);
    let res;
    if (verificationAction === 'check_in') {
      res = await clockIn(workMode, punchNotes, data.latitude, data.longitude, data.photoUrl, data.accuracy, data.exceptionReason);
    } else {
      res = await clockOut(punchNotes, data.photoUrl, data.latitude, data.longitude, data.accuracy, data.exceptionReason);
    }
    setPunchLoading(false);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || `${verificationAction === 'check_in' ? 'Clock-in' : 'Clock-out'} failed` });
      return { success: false, error: res.error };
    } else {
      const punchTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const msg = verificationAction === 'check_in'
        ? (data.exceptionReason ? `Clock-in recorded with exception request at ${punchTime}. Awaiting HR review.` : `Clock-in successful at ${punchTime}! Live photo & GPS verified. Have a productive workday.`)
        : (data.exceptionReason ? `Clock-out recorded with exception request at ${punchTime}.` : `Clock-out successful at ${punchTime}! Workday completed and verified.`);
      setFeedback({ type: 'success', message: msg });
      setPunchNotes('');
      return { success: true };
    }
  };

  const handleLunchOut = async () => {
    setPunchLoading(true);
    setFeedback(null);
    const res = await lunchOut();
    setPunchLoading(false);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Lunch break start failed' });
    } else {
      setFeedback({ type: 'success', message: 'Lunch break started. Enjoy your meal!' });
    }
  };

  const handleLunchIn = async () => {
    setPunchLoading(true);
    setFeedback(null);
    const res = await lunchIn();
    setPunchLoading(false);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Lunch break end failed' });
    } else {
      setFeedback({ type: 'success', message: 'Welcome back! Lunch break ended.' });
    }
  };

  // Determine current user punch state
  const isClockedIn = Boolean(todayAttendance?.clockIn);
  const isClockedOut = Boolean(todayAttendance?.clockOut);
  const isOnLunch = Boolean(todayAttendance?.lunchStart && !todayAttendance?.lunchEnd);
  const hasFinishedLunch = Boolean(todayAttendance?.lunchStart && todayAttendance?.lunchEnd);

  // -------------------------------------------------------------
  // RECONCILED DAILY ATTENDANCE COMPUTATION FOR SELECTED DATE
  // -------------------------------------------------------------
  const {
    dailyRoster,
    summaryCounts,
  } = useMemo(() => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    const selectedDate = logDate;

    // Check holiday / weekend for selected date
    const matchedHoliday = holidays.find(h => h.date === selectedDate && !h.isOptional);
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isCompanyNonWorkingDay = Boolean(matchedHoliday) || isWeekend;

    // Current time in Kolkata minutes for absence deadline check
    const nowKolkata = new Date();
    const kolkataTimeStr = nowKolkata.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
    const [curH, curM] = kolkataTimeStr.split(':').map(Number);
    const currentMinutes = curH * 60 + (curM || 0);

    // Configured policy start time & absence deadline
    // Default office start is 09:30 AM (570 mins). Absence cutoff is 13:00 (780 mins / 1:00 PM)
    const [startH, startM] = (workPolicy?.startTime || '09:30').split(':').map(Number);
    const officeStartMinutes = (startH || 9) * 60 + (startM || 30);
    const graceMinutes = workPolicy?.graceMinutes ?? 15;
    const absentCutoffMinutes = officeStartMinutes + 210; // 3.5 hours after start time

    const isToday = selectedDate === todayStr;
    const isPast = selectedDate < todayStr;
    const isFuture = selectedDate > todayStr;

    // Filter attendance records for selectedDate
    const dateAttendanceRecords = attendanceRecords.filter(r => r.workDate === selectedDate || r.date === selectedDate);

    // Build reconciled employee rows
    const roster: DailyAttendanceRow[] = activeEmployees.map(emp => {
      const rec = dateAttendanceRecords.find(r => r.employeeId === emp.id);

      // Check approved leave for this employee covering selectedDate
      const activeLeave = leaveRequests.find(r =>
        r.employeeId === emp.id &&
        r.status === 'approved' &&
        selectedDate >= r.startDate &&
        selectedDate <= r.endDate
      );

      let status: DailyAttendanceRow['status'] = 'not_clocked_in';
      let statusLabel = 'Not Clocked In';
      let hasException = false;
      let exceptionReason = rec?.exceptionReason || undefined;
      let isMissingPunch = false;

      if (rec && rec.clockIn) {
        if (rec.clockOut) {
          status = 'completed';
          statusLabel = 'Clocked Out';
        } else if (rec.lunchStart && !rec.lunchEnd) {
          status = 'lunch_break';
          statusLabel = 'On Lunch Break';
        } else {
          status = 'working';
          statusLabel = 'Currently Working';
        }

        if (rec.verificationStatus === 'exception' || Boolean(rec.exceptionReason)) {
          hasException = true;
        }

        // Flag missing punch if clocked in on past day without clock-out
        if (!rec.clockOut && isPast) {
          isMissingPunch = true;
          hasException = true;
        }
      } else {
        // No clock-in record
        if (activeLeave) {
          status = 'on_leave';
          statusLabel = `On Leave (${activeLeave.type})`;
        } else if (isCompanyNonWorkingDay) {
          status = 'holiday';
          statusLabel = matchedHoliday ? `Holiday (${matchedHoliday.name})` : 'Weekend (Off)';
        } else if (isFuture) {
          status = 'scheduled';
          statusLabel = 'Scheduled Shift';
        } else if (isPast) {
          status = 'absent';
          statusLabel = 'Absent';
        } else {
          // Is today
          if (currentMinutes < absentCutoffMinutes) {
            status = 'not_clocked_in';
            statusLabel = 'Not Clocked In';
          } else {
            status = 'absent';
            statusLabel = 'Absent (Cutoff Passed)';
          }
        }
      }

      // Format lunch times
      let lunchTimeStr = '—';
      if (rec?.lunchStart) {
        lunchTimeStr = `${formatTimeStr(rec.lunchStart)} - ${rec.lunchEnd ? formatTimeStr(rec.lunchEnd) : 'Ongoing'}`;
      }

      // Format total hours
      let totalHoursStr = '—';
      if (rec?.clockIn && rec?.clockOut) {
        totalHoursStr = `${rec.totalHours || 0} hrs`;
      } else if (rec?.clockIn) {
        totalHoursStr = 'In Progress';
      }

      return {
        employee: emp,
        record: rec,
        status,
        statusLabel,
        clockInTime: rec?.clockIn ? formatTimeStr(rec.clockIn) : (rec?.checkIn || '—'),
        clockOutTime: rec?.clockOut ? formatTimeStr(rec.clockOut) : (rec?.checkOut || '—'),
        lunchTimeStr,
        totalHoursStr,
        hasException,
        exceptionReason,
        isMissingPunch,
        leaveType: activeLeave?.type,
        holidayName: matchedHoliday?.name,
      };
    });

    // Compute reconciled summary counts
    const totalActive = activeEmployees.length;
    const onLeave = roster.filter(r => r.status === 'on_leave').length;
    const onHoliday = roster.filter(r => r.status === 'holiday').length;
    const expectedToWork = Math.max(0, totalActive - onLeave - onHoliday);

    const clockedIn = roster.filter(r => ['working', 'lunch_break', 'completed'].includes(r.status)).length;
    const currentlyWorking = roster.filter(r => r.status === 'working').length;
    const onLunch = roster.filter(r => r.status === 'lunch_break').length;
    const completed = roster.filter(r => r.status === 'completed').length;
    const notClockedIn = roster.filter(r => r.status === 'not_clocked_in').length;
    const absent = roster.filter(r => r.status === 'absent').length;
    const exceptions = roster.filter(r => r.hasException).length;

    return {
      dailyRoster: roster,
      summaryCounts: {
        totalActive,
        expectedToWork,
        clockedIn,
        currentlyWorking,
        onLunch,
        completed,
        notClockedIn,
        absent,
        onLeave,
        onHoliday,
        exceptions,
      },
    };
  }, [employees, logDate, attendanceRecords, leaveRequests, holidays, workPolicy, todayStr]);

  // Filter the daily roster based on user inputs
  const filteredRoster = useMemo(() => {
    return dailyRoster.filter(row => {
      // Dept filter
      if (logDept !== 'all') {
        const rowDept = row.employee.department?.toLowerCase();
        if (rowDept !== logDept.toLowerCase() && row.employee.departmentId !== logDept) {
          return false;
        }
      }

      // Manager filter
      if (logManager !== 'all') {
        if (row.employee.managerId !== logManager) {
          return false;
        }
      }

      // Status filter
      if (logStatus !== 'all') {
        if (logStatus === 'exceptions_only') {
          if (!row.hasException) return false;
        } else if (row.status !== logStatus) {
          return false;
        }
      }

      // Text search
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        const nameMatch = row.employee.name.toLowerCase().includes(q);
        const codeMatch = (row.employee.employeeCode || row.employee.id).toLowerCase().includes(q);
        const emailMatch = row.employee.email.toLowerCase().includes(q);
        const posMatch = (row.employee.position || '').toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !emailMatch && !posMatch) {
          return false;
        }
      }

      return true;
    });
  }, [dailyRoster, logDept, logManager, logStatus, logSearch]);

  // Paginated roster
  const paginatedRoster = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRoster.slice(start, start + pageSize);
  }, [filteredRoster, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRoster.length / pageSize));

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [logDate, logDept, logManager, logStatus, logSearch]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Employee Name',
      'Employee Code',
      'Email',
      'Department',
      'Designation',
      'Reporting Manager',
      'Date',
      'Attendance Status',
      'Clock In Time',
      'Lunch Break',
      'Clock Out Time',
      'Total Working Hours',
      'Verification Status',
      'Exception Reason'
    ];

    const rows = filteredRoster.map(r => {
      const mgr = employees.find(m => m.id === r.employee.managerId);
      return [
        `"${r.employee.name.replace(/"/g, '""')}"`,
        `"${r.employee.employeeCode || r.employee.id.slice(0, 8)}"`,
        `"${r.employee.email}"`,
        `"${r.employee.department}"`,
        `"${r.employee.position}"`,
        `"${mgr ? mgr.name.replace(/"/g, '""') : 'None'}"`,
        `"${logDate}"`,
        `"${r.statusLabel}"`,
        `"${r.clockInTime}"`,
        `"${r.lunchTimeStr}"`,
        `"${r.clockOutTime}"`,
        `"${r.totalHoursStr}"`,
        `"${r.hasException ? 'Exception Flagged' : r.record ? 'Verified' : 'Unpunched'}"`,
        `"${(r.exceptionReason || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grevya_Daily_Attendance_${logDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status configuration mapping
  const statusBadgeConfig: Record<DailyAttendanceRow['status'], { bg: string; color: string; label: string }> = {
    working: { bg: '#dcfce7', color: '#16a34a', label: 'Currently Working' },
    lunch_break: { bg: '#fef9c3', color: '#b45309', label: 'On Lunch Break' },
    completed: { bg: '#f1f5f9', color: '#475569', label: 'Clocked Out' },
    not_clocked_in: { bg: '#ffedd5', color: '#ea580c', label: 'Not Clocked In' },
    absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' },
    on_leave: { bg: '#e0e7ff', color: '#4338ca', label: 'On Leave' },
    holiday: { bg: '#f1f5f9', color: '#64748b', label: 'Holiday / Off' },
    scheduled: { bg: '#f8fafc', color: '#94a3b8', label: 'Scheduled' },
  };

  // Department attendance calculation from real data
  const deptAttendance = departments.map(d => {
    const deptRecords = attendanceRecords.filter(r => r.department?.toLowerCase() === d.name.toLowerCase());
    const p = deptRecords.filter(r => ['present', 'late', 'wfh', 'half_day'].includes(r.status)).length;
    const rate = deptRecords.length > 0 ? Math.round((p / deptRecords.length) * 100) : 0;
    return { dept: d.name, rate, color: rate >= 90 ? '#22c55e' : rate >= 80 ? '#3b82f6' : '#f59e0b' };
  });

  // Calendar builder for selected month
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  return (
    <div className="animate-fade">
      {/* ── TOP HEADER & PERSONAL QUICK PUNCH DESK ───────────────────────── */}
      <div className="card p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isClockedIn && !isClockedOut ? '#22c55e' : '#94a3b8' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Attendance & Punch Desk
              </h2>
              <span className="badge badge-gray" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {currentDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} IST
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
              {' · '}
              Shift Schedule: {workPolicy ? `${workPolicy.startTime?.slice(0, 5) || '09:30'} - ${workPolicy.endTime?.slice(0, 5) || '18:30'} (Grace ${workPolicy.graceMinutes || 15}m)` : '09:30 - 18:30 IST (Grace 15m)'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                fetchTodayAttendance();
                fetchAttendance();
                fetchEmployees();
                fetchLeaves();
                fetchHolidays();
              }}
              className="btn btn-secondary btn-sm"
              title="Refresh attendance records"
              disabled={attendanceLoading}
            >
              <RefreshCw size={14} className={attendanceLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: feedback.type === 'success' ? '#15803d' : '#dc2626',
              border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Punch State Card */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Left Info: Status & Times */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span
                  className="badge"
                  style={{
                    background: isClockedOut
                      ? '#f1f5f9'
                      : isOnLunch
                      ? '#fef9c3'
                      : isClockedIn
                      ? '#dcfce7'
                      : '#fee2e2',
                    color: isClockedOut
                      ? '#475569'
                      : isOnLunch
                      ? '#b45309'
                      : isClockedIn
                      ? '#16a34a'
                      : '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {isClockedOut
                    ? 'Workday Completed'
                    : isOnLunch
                    ? 'On Lunch Break'
                    : isClockedIn
                    ? 'Working Active'
                    : 'Not Clocked In'}
                </span>
                {todayAttendance?.workMode && (
                  <span className="badge badge-gray" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {todayAttendance.workMode === 'remote' ? <Laptop size={12} style={{ marginRight: 4 }} /> : <Building2 size={12} style={{ marginRight: 4 }} />}
                    {todayAttendance.workMode}
                  </span>
                )}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check In</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatTimeStr(todayAttendance?.clockIn)}</div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lunch Break</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {todayAttendance?.lunchStart
                  ? `${formatTimeStr(todayAttendance.lunchStart)} - ${todayAttendance.lunchEnd ? formatTimeStr(todayAttendance.lunchEnd) : 'Ongoing'}`
                  : '—'}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check Out</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatTimeStr(todayAttendance?.clockOut)}</div>
            </div>

            {isClockedOut && (
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Hours</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#16a34a' }}>
                  {todayAttendance?.totalHours} hrs {todayAttendance?.overtimeHours ? `(+${todayAttendance.overtimeHours} OT)` : ''}
                </div>
              </div>
            )}

            {/* Live Verification Badges */}
            {(todayAttendance?.checkInPhotoUrl || todayAttendance?.latitude || todayAttendance?.verificationStatus === 'exception') && (
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                {todayAttendance.checkInPhotoUrl && (
                  <AttendancePhotoThumbnail photoPath={todayAttendance.checkInPhotoUrl} label="Check-In Photo" />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verification</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {todayAttendance.verificationStatus === 'exception' ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={11} /> Exception
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={11} /> Verified Live
                      </span>
                    )}
                    {todayAttendance.latitude && todayAttendance.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${todayAttendance.latitude},${todayAttendance.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge badge-gray"
                        style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        title="View GPS location on map"
                      >
                        <MapPin size={11} /> {todayAttendance.checkInAccuracy ? `±${todayAttendance.checkInAccuracy}m` : 'GPS'}
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {!isClockedIn ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    className="select"
                    value={workMode}
                    onChange={(e: any) => setWorkMode(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px 10px', height: 'auto', minWidth: 100 }}
                    disabled={punchLoading}
                  >
                    <option value="office">Office</option>
                    <option value="remote">Remote (WFH)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <button
                  onClick={handleClockIn}
                  className="btn btn-primary"
                  disabled={punchLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <LogIn size={15} />
                  {punchLoading ? 'Recording...' : 'Clock In'}
                </button>
              </>
            ) : !isClockedOut ? (
              <>
                {isOnLunch ? (
                  <button
                    onClick={handleLunchIn}
                    className="btn btn-primary"
                    disabled={punchLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563eb' }}
                  >
                    <CheckCircle2 size={15} />
                    {punchLoading ? 'Updating...' : 'End Lunch Break'}
                  </button>
                ) : (
                  <button
                    onClick={handleLunchOut}
                    className="btn btn-secondary"
                    disabled={punchLoading || hasFinishedLunch}
                    title={hasFinishedLunch ? 'Lunch break already logged' : 'Start Lunch'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Coffee size={15} style={{ color: '#b45309' }} />
                    {punchLoading ? 'Updating...' : hasFinishedLunch ? 'Lunch Completed' : 'Lunch Break'}
                  </button>
                )}

                <button
                  onClick={handleClockOut}
                  className="btn btn-danger"
                  disabled={punchLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <LogOut size={15} />
                  {punchLoading ? 'Closing...' : 'Clock Out'}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} />
                Shift Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ───────────────────────── */}
      <div className="tab-nav mb-6">
        {isHRorAdmin && (
          <button
            className={`tab-btn ${tab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setTab('monitoring')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Users size={15} />
            Daily Attendance Monitoring
            {summaryCounts.exceptions > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 10 }}>
                {summaryCounts.exceptions}
              </span>
            )}
          </button>
        )}
        <button
          className={`tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          Analytics & Trends
        </button>
        <button
          className={`tab-btn ${tab === 'my_punch' ? 'active' : ''}`}
          onClick={() => setTab('my_punch')}
        >
          My Attendance History
        </button>
        <button
          className={`tab-btn ${tab === 'calendar' ? 'active' : ''}`}
          onClick={() => setTab('calendar')}
        >
          Company Calendar
        </button>
      </div>

      {/* ── TAB: DAILY ATTENDANCE MONITORING (HR/ADMIN) ───────────────────────── */}
      {tab === 'monitoring' && isHRorAdmin && (
        <div className="space-y-6">
          {/* Top Control Bar: Date Selector & Export */}
          <div className="card p-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Attendance Date:</span>
                <input
                  type="date"
                  className="input"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                />
              </div>

              {logDate === todayStr ? (
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  Live Today ({new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setLogDate(todayStr)}
                  className="btn btn-secondary btn-xs"
                >
                  Return to Today
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Export complete daily attendance report to CSV"
            >
              <Download size={14} />
              Export CSV Report
            </button>
          </div>

          {/* 10 Live Reconciled Summary Count Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="card p-4" style={{ borderLeft: '3px solid #6366f1' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Expected to Work</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#4f46e5' }}>
                {summaryCounts.expectedToWork}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>/ {summaryCounts.totalActive} active</span>
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #16a34a' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Clocked In</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#16a34a' }}>
                {summaryCounts.clockedIn}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Currently Working</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                {summaryCounts.currentlyWorking}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>On Lunch Break</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#b45309' }}>
                {summaryCounts.onLunch}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #64748b' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Workday Completed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#475569' }}>
                {summaryCounts.completed}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #ea580c' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Not Clocked In</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#ea580c' }}>
                {summaryCounts.notClockedIn}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #dc2626' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Absent</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#dc2626' }}>
                {summaryCounts.absent}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>On Approved Leave</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#7c3aed' }}>
                {summaryCounts.onLeave}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #94a3b8' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Holiday / Weekend</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#64748b' }}>
                {summaryCounts.onHoliday}
              </div>
            </div>

            <div className="card p-4" style={{ borderLeft: '3px solid #e11d48' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Exceptions for Review</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#e11d48' }}>
                {summaryCounts.exceptions}
              </div>
            </div>
          </div>

          {/* Reconciled Attendance Table */}
          <div className="card">
            {/* Filter Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search name, code, email..."
                    className="input"
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    style={{ width: 220, paddingLeft: 30, fontSize: '0.82rem' }}
                  />
                </div>

                {/* Department Filter */}
                <select
                  className="select"
                  value={logDept}
                  onChange={e => setLogDept(e.target.value)}
                  style={{ width: 'auto', fontSize: '0.82rem' }}
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                {/* Manager Filter */}
                <select
                  className="select"
                  value={logManager}
                  onChange={e => setLogManager(e.target.value)}
                  style={{ width: 'auto', fontSize: '0.82rem' }}
                >
                  <option value="all">All Managers</option>
                  {employees.filter(e => ['manager', 'admin', 'super_admin', 'hr_manager'].includes(e.role || '')).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  className="select"
                  value={logStatus}
                  onChange={e => setLogStatus(e.target.value)}
                  style={{ width: 'auto', fontSize: '0.82rem' }}
                >
                  <option value="all">All Attendance States</option>
                  <option value="working">Currently Working</option>
                  <option value="lunch_break">On Lunch Break</option>
                  <option value="completed">Clocked Out</option>
                  <option value="not_clocked_in">Not Clocked In</option>
                  <option value="absent">Absent</option>
                  <option value="on_leave">On Approved Leave</option>
                  <option value="holiday">Holiday / Weekend</option>
                  <option value="exceptions_only">Exceptions Only</option>
                </select>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredRoster.length}</strong> employee(s) for <strong>{logDate}</strong>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee & ID</th>
                    <th>Dept & Title</th>
                    <th>Manager</th>
                    <th>Clock In</th>
                    <th>Current Status</th>
                    <th>Lunch Break</th>
                    <th>Clock Out</th>
                    <th>Total Hours</th>
                    <th>Verification</th>
                    <th>Exceptions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoster.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        No employees match the selected criteria for this date.
                      </td>
                    </tr>
                  ) : (
                    paginatedRoster.map(row => {
                      const cfg = statusBadgeConfig[row.status] || { bg: '#f1f5f9', color: '#64748b', label: row.status };
                      const mgr = employees.find(m => m.id === row.employee.managerId);

                      return (
                        <tr
                          key={row.employee.id}
                          onClick={() => row.record && setSelectedRecord(row.record)}
                          style={{ cursor: row.record ? 'pointer' : 'default' }}
                        >
                          {/* 1. Employee Name & ID */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar avatar-sm">{row.employee.avatar || row.employee.name.slice(0, 2).toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{row.employee.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {row.employee.employeeCode || row.employee.id.slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Dept & Title */}
                          <td>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{row.employee.department}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.employee.position}</div>
                          </td>

                          {/* 3. Manager */}
                          <td style={{ fontSize: '0.8rem', color: mgr ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {mgr ? mgr.name : '—'}
                          </td>

                          {/* 4. Clock In */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                              <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                              {row.clockInTime}
                            </div>
                          </td>

                          {/* 5. Current Status */}
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              {row.status === 'working' && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block', marginRight: 5 }} />
                              )}
                              {row.statusLabel}
                            </span>
                          </td>

                          {/* 6. Lunch Times */}
                          <td style={{ fontSize: '0.8rem', color: row.lunchTimeStr !== '—' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {row.lunchTimeStr}
                          </td>

                          {/* 7. Clock Out */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                              <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                              {row.clockOutTime}
                            </div>
                          </td>

                          {/* 8. Total Hours */}
                          <td style={{ fontSize: '0.85rem', fontWeight: 600, color: row.totalHoursStr !== '—' && row.totalHoursStr !== '0.0 hrs' ? '#16a34a' : 'inherit' }}>
                            {row.totalHoursStr}
                          </td>

                          {/* 9. Verification Details */}
                          <td>
                            {row.record ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {row.record.checkInPhotoUrl && (
                                  <AttendancePhotoThumbnail photoPath={row.record.checkInPhotoUrl} label={`${row.employee.name} Check-In`} />
                                )}
                                {row.record.checkOutPhotoUrl && (
                                  <AttendancePhotoThumbnail photoPath={row.record.checkOutPhotoUrl} label={`${row.employee.name} Check-Out`} />
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {row.record.verificationStatus === 'exception' ? (
                                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                      Exception
                                    </span>
                                  ) : (
                                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                      Verified
                                    </span>
                                  )}
                                  {row.record.latitude && row.record.longitude && (
                                    <a
                                      href={`https://www.google.com/maps?q=${row.record.latitude},${row.record.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{ fontSize: '0.65rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
                                    >
                                      <MapPin size={9} />
                                      {row.record.checkInAccuracy ? `±${row.record.checkInAccuracy}m` : 'GPS'}
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>

                          {/* 10. Exceptions / Missing Punch */}
                          <td>
                            {row.isMissingPunch ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <AlertCircle size={10} /> Missing Punch-Out
                              </span>
                            ) : row.hasException ? (
                              <span
                                className="badge badge-warning"
                                title={row.exceptionReason}
                                style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                              >
                                <AlertTriangle size={10} /> Exception Review
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages} ({filteredRoster.length} total records)
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn btn-xs ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: OVERVIEW & TRENDS ───────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card p-6">
            <h3 style={{ marginBottom: 16 }}>Weekly Attendance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(dayName => {
                  const dayRecords = attendanceRecords.filter(r => {
                    const dateVal = r.workDate || r.date;
                    if (!dateVal) return false;
                    const d = new Date(dateVal);
                    return DAYS[d.getDay()] === dayName;
                  });
                  const p = dayRecords.filter(r => ['present', 'wfh', 'half_day'].includes(r.status)).length;
                  const l = dayRecords.filter(r => r.status === 'late').length;
                  const a = dayRecords.filter(r => r.status === 'absent').length;
                  return { day: dayName, present: p, absent: a, late: l };
                })}
                barGap={4}
              >
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
              <LineChart data={[
                { month: 'Oct', rate: 91 }, { month: 'Nov', rate: 93 },
                { month: 'Dec', rate: 88 }, { month: 'Jan', rate: 94 },
                { month: 'Feb', rate: 92 }, { month: 'Mar', rate: 95 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16 }}>Department Attendance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {deptAttendance.map(d => (
                <div key={d.dept} style={{ padding: '14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{d.dept}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: d.rate >= 90 ? '#16a34a' : d.rate >= 80 ? '#b45309' : '#dc2626', marginBottom: 8 }}>
                    {d.rate}%
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${d.rate}%`, background: d.color, height: '100%', borderRadius: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MY ATTENDANCE HISTORY ───────────────────────── */}
      {tab === 'my_punch' && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Your Punch Log & Verification Records</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Records: {attendanceRecords.filter(r => r.employeeId === currentUser?.id).length}
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Work Mode</th>
                  <th>Clock In</th>
                  <th>Lunch Break</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.filter(r => r.employeeId === currentUser?.id).length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                      No personal attendance history found.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords
                    .filter(r => r.employeeId === currentUser?.id)
                    .map(rec => (
                      <tr key={rec.id} onClick={() => setSelectedRecord(rec)} style={{ cursor: 'pointer' }}>
                        <td>{rec.workDate || rec.date}</td>
                        <td style={{ textTransform: 'capitalize' }}>{rec.workMode || 'office'}</td>
                        <td>{rec.checkIn || formatTimeStr(rec.clockIn)}</td>
                        <td>{rec.lunchStart ? `${formatTimeStr(rec.lunchStart)} - ${rec.lunchEnd ? formatTimeStr(rec.lunchEnd) : 'Ongoing'}` : '—'}</td>
                        <td>{rec.checkOut || formatTimeStr(rec.clockOut)}</td>
                        <td>{rec.totalHours ? `${rec.totalHours}h` : '0.0h'}</td>
                        <td>
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{rec.status}</span>
                        </td>
                        <td>
                          {rec.checkInPhotoUrl ? (
                            <AttendancePhotoThumbnail photoPath={rec.checkInPhotoUrl} label="Punch Photo" />
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard</span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: CALENDAR ───────────────────────── */}
      {tab === 'calendar' && (
        <div className="card p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0 }}>{MONTHS[calMonth]} {calYear}</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCalendarMonth(new Date())}
                  style={{ fontSize: '0.75rem' }}
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAYS.map(d => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  padding: '8px 0',
                  textTransform: 'uppercase'
                }}
              >
                {d}
              </div>
            ))}

            {/* Empty offset days */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 70 }} />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = attendanceRecords.find(r => (r.employeeId === currentUser?.id) && (r.workDate === dateStr || r.date === dateStr));
              const holiday = holidays.find(h => h.date === dateStr);

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 70,
                    borderRadius: 8,
                    background: record ? 'rgba(34,197,94,0.08)' : holiday ? 'rgba(59,130,246,0.08)' : 'var(--bg)',
                    border: '1px solid var(--border)',
                    padding: 6,
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{day}</div>
                  {holiday && (
                    <div style={{ fontSize: '0.65rem', color: '#2563eb', marginTop: 4 }}>
                      {holiday.name}
                    </div>
                  )}
                  {record && (
                    <div style={{ fontSize: '0.65rem', color: '#16a34a', marginTop: 4 }}>
                      {record.checkIn || 'Punched'} ({record.totalHours || 0}h)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RECORD INSPECTION MODAL ───────────────────────── */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="card p-6"
            style={{ maxWidth: 460, width: '90%', background: 'var(--bg-card)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Attendance Record Details</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Employee:</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.employeeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.workDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                  {selectedRecord.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Work Mode:</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedRecord.workMode || 'Office'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Clock In:</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.checkIn || formatTimeStr(selectedRecord.clockIn)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lunch Start:</span>
                <span style={{ fontWeight: 600 }}>{formatTimeStr(selectedRecord.lunchStart)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lunch End:</span>
                <span style={{ fontWeight: 600 }}>{formatTimeStr(selectedRecord.lunchEnd)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Clock Out:</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.checkOut || formatTimeStr(selectedRecord.clockOut)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Working Hours:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{selectedRecord.totalHours} hrs</span>
              </div>

              {/* Verification Audit Panel */}
              <div style={{ marginTop: 10, padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                  Verification Audit
                </span>

                {selectedRecord.verificationStatus === 'exception' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="badge badge-warning" style={{ alignSelf: 'flex-start', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> Attendance Exception
                    </span>
                    {selectedRecord.exceptionReason && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Reason:</strong> {selectedRecord.exceptionReason}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {selectedRecord.checkInPhotoUrl ? (
                        <AttendancePhotoThumbnail photoPath={selectedRecord.checkInPhotoUrl} label="Check-In Photo" />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No check-in photo</span>
                      )}

                      {selectedRecord.checkOutPhotoUrl ? (
                        <AttendancePhotoThumbnail photoPath={selectedRecord.checkOutPhotoUrl} label="Check-Out Photo" />
                      ) : null}
                    </div>

                    {selectedRecord.latitude && selectedRecord.longitude ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <span>GPS: {selectedRecord.latitude}°, {selectedRecord.longitude}° {selectedRecord.checkInAccuracy ? `(±${selectedRecord.checkInAccuracy}m)` : ''}</span>
                        <a
                          href={`https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-xs"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <MapPin size={11} /> Open Map <ExternalLink size={9} />
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No GPS data captured</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Photo & GPS Verification Modal */}
      <AttendanceVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        action={verificationAction}
        workMode={workMode}
        notes={punchNotes}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
