import React, { useState } from 'react';
import { useStore } from '../services/store';
import StatCard from '../components/ui/StatCard';
import {
  Users, CheckSquare, Plus, Clock, AlertTriangle, Calendar,
  Filter, CheckCircle, Search, UserCheck, Check, X, ArrowUpRight
} from 'lucide-react';
import { Task } from '../types';

export default function TeamLeadDashboard() {
  const {
    currentUser,
    employees,
    tasks,
    tasksLoading,
    createTask,
    updateTaskStatus,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    githubPrUrl: '',
    githubIssueUrl: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter team members in the same department or assigned to this manager
  const teamMembers = employees.filter(e => {
    if (e.managerId && currentUser?.id && e.managerId === currentUser.id) return true;
    if (currentUser?.department && e.department.toLowerCase() === currentUser.department.toLowerCase()) return true;
    return true; // default include for dev/lead view
  });

  const teamTasks = tasks;

  const filteredTasks = teamTasks.filter(t => {
    if (filterMember !== 'all' && t.assigneeId !== filterMember) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const activeCount = teamTasks.filter(t => t.status === 'in_progress').length;
  const completedCount = teamTasks.filter(t => t.status === 'completed').length;
  const blockedCount = teamTasks.filter(t => t.status === 'blocked').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = teamTasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const res = await createTask({
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      assigneeId: taskForm.assigneeId || undefined,
      priority: taskForm.priority,
      status: 'todo',
      dueDate: taskForm.dueDate || undefined,
      githubPrUrl: taskForm.githubPrUrl.trim() || undefined,
      githubIssueUrl: taskForm.githubIssueUrl.trim() || undefined,
    });

    setFormSubmitting(false);
    if (!res.success) {
      setFormError(res.error || 'Failed to create task.');
    } else {
      setFormSuccess('Task created successfully and assigned!');
      setTaskForm({
        title: '',
        description: '',
        assigneeId: '',
        priority: 'medium',
        dueDate: '',
        githubPrUrl: '',
        githubIssueUrl: '',
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    }
  };

  const priorityBadge: Record<string, string> = {
    urgent: 'badge-red',
    high: 'badge-yellow',
    medium: 'badge-blue',
    low: 'badge-gray',
  };

  return (
    <div className="animate-fade">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 4 }}>
              Team Lead Workspace • {currentUser?.department || 'Engineering'}
            </div>
            <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
              Team Overview: Lead {currentUser?.name}
            </h2>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                👥 {teamMembers.length} Direct Team Members
              </span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                ⚡ {activeCount} Tasks In Progress
              </span>
            </div>
          </div>
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ background: '#4f46e5', borderColor: '#4338ca', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> Assign New Task
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-4 mb-6">
        <StatCard
          label="Team Members"
          value={teamMembers.length}
          icon={<Users size={20} />}
          iconBg="#e0e7ff"
          iconColor="#4338ca"
        />
        <StatCard
          label="Active Tasks"
          value={activeCount}
          icon={<Clock size={20} />}
          iconBg="#dbeafe"
          iconColor="#1d4ed8"
        />
        <StatCard
          label="Completed Tasks"
          value={completedCount}
          icon={<CheckCircle size={20} />}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <StatCard
          label="Overdue / Blocked"
          value={overdueCount + blockedCount}
          icon={<AlertTriangle size={20} />}
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Main Column: Team Tasks Management */}
        <div className="card p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Team Task Board</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                Track and manage deliverables assigned across your team
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          {/* Filter options */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Member:</span>
              <select
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
                className="input"
                style={{ height: 32, fontSize: '0.8rem', padding: '2px 8px' }}
              >
                <option value="all">All Members</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input"
                style={{ height: 32, fontSize: '0.8rem', padding: '2px 8px' }}
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {tasksLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading team tasks...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No tasks found matching criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.map(t => {
                const isOverdue = t.status !== 'completed' && t.dueDate && t.dueDate < todayStr;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">
                          {t.title}
                        </span>
                        <span className={`badge ${priorityBadge[t.priority] || 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {t.priority}
                        </span>
                        {isOverdue && (
                          <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                            Overdue
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>Assignee: <strong>{t.assignee?.name || 'Unassigned'}</strong></span>
                        {t.dueDate && <span>Due: {t.dueDate}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={t.status}
                        onChange={e => updateTaskStatus(t.id, e.target.value as Task['status'])}
                        className="input"
                        style={{ height: 28, fontSize: '0.75rem', padding: '2px 6px' }}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Team Roster & Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Team Member Overview */}
          <div className="card p-6">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="var(--primary)" />
              Direct Team ({teamMembers.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {teamMembers.slice(0, 6).map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {member.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.position}</div>
                    </div>
                  </div>
                  <span className={`badge ${member.status === 'active' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.65rem' }}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Standups & Sprint Milestones */}
          <div className="card p-6">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#4f46e5" />
              Team Milestones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sprint 42 Code Freeze</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Friday, 5:00 PM • All PRs merged</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Architecture Review</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Thursday, 2:00 PM • Video Call</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
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
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Assign New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error mb-4" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="alert alert-success mb-4" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user authentication tests"
                  value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Provide task scope and criteria..."
                  value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  className="input"
                  style={{ minHeight: 70, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}
                    className="input"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub PR URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={taskForm.githubPrUrl}
                    onChange={e => setTaskForm(f => ({ ...f, githubPrUrl: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4338ca' }}
                >
                  {formSubmitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
