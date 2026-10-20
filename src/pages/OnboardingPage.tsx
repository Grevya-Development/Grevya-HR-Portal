import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import {
  CheckCircle2, Circle, Clock, Users, Laptop, FileText,
  MessageSquare, Plus, ChevronDown, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { OnboardingTaskItem } from '../types';

const ASSIGNEE_COLORS: Record<string, string> = {
  HR: '#3b82f6', IT: '#22c55e', Manager: '#8b5cf6', Employee: '#f59e0b',
};

const PHASE_ICONS: Record<string, React.ReactNode> = {
  HR: <Users size={13} />, IT: <Laptop size={13} />, Manager: <MessageSquare size={13} />, Employee: <FileText size={13} />,
};

export default function OnboardingPage() {
  const {
    currentUser,
    employees,
    onboardingTasks,
    onboardingLoading,
    fetchOnboardingTasks,
    toggleOnboardingTask,
    createOnboardingTask,
  } = useStore();

  const isHR = currentUser?.role === 'hr_manager' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // Find employees that have tasks or recent employees
  const onboardingEmployees = employees.slice(0, 5);
  const [selectedId, setSelectedId] = useState<string>(() => onboardingEmployees[0]?.id || '');
  const [expanded, setExpanded] = useState<string[]>(['HR', 'IT', 'Manager', 'Employee']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newDueDay, setNewDueDay] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOnboardingTasks();
  }, [fetchOnboardingTasks]);

  useEffect(() => {
    if (!selectedId && onboardingEmployees.length > 0) {
      setSelectedId(onboardingEmployees[0].id);
    }
  }, [onboardingEmployees, selectedId]);

  const selectedEmployee = onboardingEmployees.find(e => e.id === selectedId) || onboardingEmployees[0];

  // Get tasks for the selected employee, including employee-specific and template tasks
  const currentTasks = onboardingTasks.filter(t => !t.employeeId || t.employeeId === selectedEmployee?.id);

  // Group tasks into phases based on label keyword or default
  const getPhase = (task: OnboardingTaskItem): 'HR' | 'IT' | 'Manager' | 'Employee' => {
    const l = task.taskLabel.toLowerCase();
    if (l.includes('slack') || l.includes('workstation') || l.includes('email') || l.includes('tool') || l.includes('security')) return 'IT';
    if (l.includes('team') || l.includes('1:1') || l.includes('goal') || l.includes('manager')) return 'Manager';
    if (l.includes('proof') || l.includes('id') || l.includes('training')) return 'Employee';
    return 'HR';
  };

  const completedCount = currentTasks.filter(t => t.done).length;
  const progress = currentTasks.length > 0 ? Math.round((completedCount / currentTasks.length) * 100) : 100;

  const handleToggle = async (task: OnboardingTaskItem) => {
    const newDone = !task.done;
    const res = await toggleOnboardingTask(task.id, newDone);
    if (!res.success) {
      toast.error('Update failed', res.error || 'Could not update task');
    } else {
      if (newDone) {
        toast.success('Task Completed!', task.taskLabel);
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskLabel.trim()) return;
    setSubmitting(true);
    const res = await createOnboardingTask({
      taskLabel: newTaskLabel.trim(),
      dueDay: newDueDay,
      employeeId: selectedEmployee?.id,
    });
    setSubmitting(false);
    if (!res.success) {
      toast.error('Creation failed', res.error || 'Could not create onboarding task');
    } else {
      toast.success('Onboarding Task Added', newTaskLabel.trim());
      setNewTaskLabel('');
      setNewDueDay(1);
      setIsModalOpen(false);
    }
  };

  const phases = ['HR', 'IT', 'Manager', 'Employee'] as const;

  return (
    <div className="animate-fade">
      {/* Summary Stats */}
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Active Onboardings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>
            {onboardingEmployees.length}
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Current Completion
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>
            {progress}%
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Pending Tasks (Live DB)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
            {currentTasks.filter(t => !t.done).length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Employee Roster List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {onboardingEmployees.map(emp => {
            const isSelected = emp.id === selectedId;
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedId(emp.id)}
                className="card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  transition: 'all 200ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="avatar avatar-sm">{emp.avatar}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }} className="truncate">{emp.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Dept: {emp.department} • Joined: {emp.joinDate || 'Recent'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Checklist Detail */}
        {selectedEmployee && (
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar avatar-lg">{selectedEmployee.avatar}</div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{selectedEmployee.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedEmployee.position} · {selectedEmployee.department}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Email: {selectedEmployee.email} • Joined: {selectedEmployee.joinDate}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14 }}>
                {isHR && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: progress >= 80 ? '#22c55e' : '#f59e0b' }}>
                    {progress}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>complete</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress" style={{ height: 10, marginBottom: 24 }}>
              <div className="progress-bar progress-green" style={{ width: `${progress}%` }} />
            </div>

            {onboardingLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Syncing checklist with Supabase...</span>
              </div>
            ) : currentTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p>No onboarding tasks configured yet.</p>
              </div>
            ) : (
              phases.map(phase => {
                const phaseTasks = currentTasks.filter(t => getPhase(t) === phase);
                if (phaseTasks.length === 0) return null;
                const isExpanded = expanded.includes(phase);
                const doneCount = phaseTasks.filter(t => t.done).length;

                return (
                  <div key={phase} style={{ marginBottom: 14 }}>
                    <button
                      onClick={() => setExpanded(prev =>
                        prev.includes(phase) ? prev.filter(x => x !== phase) : [...prev, phase]
                      )}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 8,
                        background: `${ASSIGNEE_COLORS[phase]}12`,
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ color: ASSIGNEE_COLORS[phase] }}>{PHASE_ICONS[phase]}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: ASSIGNEE_COLORS[phase], flex: 1, textAlign: 'left' }}>
                        {phase} Milestones
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {doneCount}/{phaseTasks.length}
                      </span>
                      {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                    </button>

                    {isExpanded && (
                      <div style={{ marginTop: 6, paddingLeft: 10 }}>
                        {phaseTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleToggle(task)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 14px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: task.done ? 'rgba(0,0,0,0.02)' : 'var(--bg-card)',
                              opacity: task.done ? 0.65 : 1,
                              marginBottom: 4,
                              border: '1px solid var(--border)',
                              transition: 'all 150ms ease',
                            }}
                          >
                            <div style={{ color: task.done ? '#22c55e' : 'var(--text-muted)' }}>
                              {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                textDecoration: task.done ? 'line-through' : 'none',
                                color: task.done ? 'var(--text-muted)' : 'var(--text-primary)'
                              }}>
                                {task.taskLabel}
                              </div>
                              {task.notes && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {task.notes}
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} /> Day {task.dueDay}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Add Onboarding Milestone</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Task Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule IT Security Walkthrough"
                  value={newTaskLabel}
                  onChange={e => setNewTaskLabel(e.target.value)}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Day (Day of onboarding)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={newDueDay}
                  onChange={e => setNewDueDay(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
