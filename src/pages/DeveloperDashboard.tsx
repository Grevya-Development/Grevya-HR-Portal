import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import StatCard from '../components/ui/StatCard';
import {
  Clock, CheckSquare, Square, Calendar, GitBranch, GitPullRequest,
  CheckCircle, AlertCircle, ArrowUpRight, Flame, Star, Coffee,
  ExternalLink, Filter, Search, Tag, UserCheck
} from 'lucide-react';
import { Task } from '../types';
import AttendanceVerificationModal from '../components/AttendanceVerificationModal';

export default function DeveloperDashboard() {
  const {
    currentUser,
    tasks,
    tasksLoading,
    updateTaskStatus,
    todayAttendance,
    fetchTodayAttendance,
    clockIn,
    lunchOut,
    lunchIn,
    clockOut,
  } = useStore();

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [clockMsg, setClockMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter tasks assigned to current user, or department tasks
  const myTasks = tasks.filter(t => {
    const isMine = t.assigneeId === currentUser?.id ||
      (currentUser?.name && t.assignee?.name?.toLowerCase() === currentUser.name.toLowerCase());
    return isMine;
  });

  // Display user's tasks or fallback to all relevant development tasks if none assigned yet
  const displayPool = myTasks.length > 0 ? myTasks : tasks;

  const filteredTasks = displayPool.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const completedCount = displayPool.filter(t => t.status === 'completed').length;
  const inProgressCount = displayPool.filter(t => t.status === 'in_progress').length;
  const todoCount = displayPool.filter(t => t.status === 'todo').length;

  const handleToggleTask = async (task: Task) => {
    setUpdatingTaskId(task.id);
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    await updateTaskStatus(task.id, newStatus);
    setUpdatingTaskId(null);
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
    setClockActionLoading(true);
    setClockMsg(null);
    let res;
    if (verificationAction === 'check_in') {
      res = await clockIn('office', undefined, data.latitude, data.longitude, data.photoUrl, data.accuracy, data.exceptionReason);
    } else {
      res = await clockOut(undefined, data.photoUrl, data.latitude, data.longitude, data.accuracy, data.exceptionReason);
    }
    setClockActionLoading(false);
    if (!res.success) {
      setClockMsg({ type: 'error', text: res.error || `Failed to ${verificationAction === 'check_in' ? 'clock in' : 'clock out'}` });
      return { success: false, error: res.error };
    } else {
      setClockMsg({ type: 'success', text: `${verificationAction === 'check_in' ? 'Clocked in' : 'Clocked out'} successfully with photo & GPS verification!` });
      return { success: true };
    }
  };

  const handleLunch = async (action: 'out' | 'in') => {
    setClockActionLoading(true);
    setClockMsg(null);
    const res = action === 'out' ? await lunchOut() : await lunchIn();
    setClockActionLoading(false);
    if (!res.success) {
      setClockMsg({ type: 'error', text: res.error || `Failed to record lunch ${action}` });
    } else {
      setClockMsg({ type: 'success', text: `Lunch ${action} recorded!` });
    }
  };

  const priorityBadgeClass: Record<string, string> = {
    urgent: 'badge-red',
    high: 'badge-yellow',
    medium: 'badge-blue',
    low: 'badge-gray',
  };

  const statusBadgeClass: Record<string, string> = {
    completed: 'badge-green',
    in_progress: 'badge-blue',
    todo: 'badge-gray',
    blocked: 'badge-red',
  };

  return (
    <div className="animate-fade">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #092e1e 0%, #064e3b 50%, #042f2e 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(52,211,153,0.1)' }} />
        <div style={{ position: 'absolute', right: 90, bottom: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(16,185,129,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Developer Workspace</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: '#6ee7b7' }}>{currentUser?.department || 'Engineering'}</span>
            </div>
            <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
              Welcome back, {currentUser?.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={15} color="#fbbf24" />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>Active Sprint: Sprint 42</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={15} color="#34d399" />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>{completedCount} Tasks Done</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              ● Online & Ready
            </span>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid-4 mb-6">
        <StatCard
          label="Assigned Tasks"
          value={displayPool.length}
          icon={<CheckSquare size={20} />}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Clock size={20} />}
          iconBg="#dbeafe"
          iconColor="#1d4ed8"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          suffix={`/${displayPool.length}`}
          icon={<CheckCircle size={20} />}
          iconBg="#fef9c3"
          iconColor="#b45309"
        />
        <StatCard
          label="Attendance Status"
          value={todayAttendance?.clockIn ? 'Clocked In' : 'Not Clocked In'}
          icon={<UserCheck size={20} />}
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Main Column: Interactive Task Board */}
        <div className="card p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>My Assigned Tasks</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                Check off tasks to automatically sync progress to Supabase
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 30, paddingRight: 10, height: 32, fontSize: '0.8rem', width: 140 }}
                />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            {(['all', 'todo', 'in_progress', 'completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: filterStatus === st ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: filterStatus === st ? 'var(--primary-subtle)' : 'transparent',
                  color: filterStatus === st ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}

            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 8 }}>Priority:</span>
            {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(pr => (
              <button
                key={pr}
                onClick={() => setFilterPriority(pr)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: filterPriority === pr ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: filterPriority === pr ? 'var(--primary-subtle)' : 'transparent',
                  color: filterPriority === pr ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {pr}
              </button>
            ))}
          </div>

          {/* Task List */}
          {tasksLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading live tasks from Supabase...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No tasks found matching your filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isUpdating = updatingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: isCompleted ? 'rgba(0,0,0,0.02)' : 'var(--bg-card)',
                      opacity: isCompleted ? 0.75 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <button
                      onClick={() => handleToggleTask(task)}
                      disabled={isUpdating}
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: isUpdating ? 'wait' : 'pointer',
                        color: isCompleted ? 'var(--primary)' : 'var(--text-muted)',
                        padding: 0,
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          {task.title}
                        </span>
                        <span className={`badge ${priorityBadgeClass[task.priority] || 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {task.priority}
                        </span>
                        <span className={`badge ${statusBadgeClass[task.status] || 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      {task.description && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {task.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.dueDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> Due: {task.dueDate}
                          </span>
                        )}
                        {task.githubPrUrl && (
                          <a
                            href={task.githubPrUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', textDecoration: 'none' }}
                          >
                            <GitPullRequest size={12} /> View PR <ExternalLink size={10} />
                          </a>
                        )}
                        {task.githubIssueUrl && (
                          <a
                            href={task.githubIssueUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6366f1', textDecoration: 'none' }}
                          >
                            <GitBranch size={12} /> Issue <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Attendance Widget & GitHub Integration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Daily Attendance Clock Widget */}
          <div className="card p-6">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--primary)" />
              Daily Attendance Clock
            </h3>

            {clockMsg && (
              <div
                className={`alert ${clockMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}
                style={{ marginBottom: 12, padding: '8px 12px', fontSize: '0.8rem' }}
              >
                <span>{clockMsg.text}</span>
              </div>
            )}

            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              padding: '14px',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Today's Status</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: todayAttendance?.clockIn ? 'var(--primary)' : 'var(--text-muted)' }}>
                {todayAttendance?.clockIn ? (
                  todayAttendance.clockOut ? 'Shift Completed' : 'Clocked In'
                ) : 'Not Checked In'}
              </div>
              {todayAttendance?.clockIn && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  In: {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {todayAttendance.clockOut && (
                    <span> • Out: {new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <button
                onClick={handleClockIn}
                disabled={clockActionLoading || Boolean(todayAttendance?.clockIn)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '8px 12px', justifyContent: 'center' }}
              >
                Clock In
              </button>
              <button
                onClick={handleClockOut}
                disabled={clockActionLoading || !todayAttendance?.clockIn || Boolean(todayAttendance?.clockOut)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 12px', justifyContent: 'center' }}
              >
                Clock Out
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => handleLunch('out')}
                disabled={clockActionLoading || !todayAttendance?.clockIn || Boolean(todayAttendance?.lunchStart)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}
              >
                <Coffee size={12} /> Lunch Out
              </button>
              <button
                onClick={() => handleLunch('in')}
                disabled={clockActionLoading || !todayAttendance?.lunchStart || Boolean(todayAttendance?.lunchEnd)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}
              >
                <Coffee size={12} /> Lunch In
              </button>
            </div>
          </div>

          {/* GitHub Integration Widget */}
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitBranch size={16} color="#6366f1" />
                GitHub Integration
              </h3>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Active Sync</span>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              padding: '14px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>grevya-org / hr-portal</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Linked branch: <code style={{ background: 'var(--border)', padding: '2px 4px', borderRadius: 4 }}>main</code>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Repository Status</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Pull Requests Linked</span>
                <span style={{ fontWeight: 600 }}>{displayPool.filter(t => t.githubPrUrl).length} active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>CI/CD Pipeline</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>Passing (Vercel)</span>
              </div>
            </div>
          </div>

          {/* Today's Meetings & Standups */}
          <div className="card p-6">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#eab308" />
              Today's Schedule
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                <div style={{ width: 6, height: 32, borderRadius: 3, background: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Daily Engineering Standup</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>10:00 AM – 10:20 AM • Google Meet</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                <div style={{ width: 6, height: 32, borderRadius: 3, background: '#6366f1', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sprint Planning & PR Review</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>03:00 PM – 04:00 PM • Conf Room A</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AttendanceVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        action={verificationAction}
        workMode="office"
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
