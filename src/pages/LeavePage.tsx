import React, { useState } from 'react';
import { useStore } from '../services/store';
import { LeaveRequest } from '../types';
import { Search, Plus, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { toast } from '../components/ui/Toast';

const LEAVE_TYPES = ['sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency'] as const;

export default function LeavePage() {
  const { currentUser, leaveRequests, approveLeave, rejectLeave, applyLeave } = useStore();
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  const [actionModal, setActionModal] = useState<{ req: LeaveRequest; type: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({
    type: 'casual' as typeof LEAVE_TYPES[number],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  // Admin, HR, and Manager can view all leaves and have approval controls
  const canManageLeaves = userRole === 'admin' || userRole === 'hr' || userRole === 'hr_manager' || userRole === 'manager';
  const isHRorAdmin = canManageLeaves;
  const isHRorManager = canManageLeaves;

  // Helper to match leave requests to the current user
  const isOwnLeave = (r: LeaveRequest) => {
    const currentId = currentUser?.id;
    const currentName = currentUser?.name?.trim().toLowerCase();

    const empObjId = (r as any).employee?.id;
    const empObjName = (r as any).employee?.name?.trim()?.toLowerCase();
    const reqEmpId = r.employeeId || empObjId;
    const reqEmpName = (r.employeeName?.trim() || empObjName || '').toLowerCase();

    // Match by leave.employee.id === currentUser.id or leave.employeeId === currentUser.id
    if (currentId && (reqEmpId === currentId || empObjId === currentId)) return true;

    // Match by leave.employee.name === currentUser.name or leave.employeeName === currentUser.name
    if (currentName && (reqEmpName === currentName || empObjName === currentName)) return true;

    // Support demo Kiran Patel cross-matching ('u3' in demo auth, 'e1' in employee records)
    const isKiranUser = currentName === 'kiran patel' || currentId === 'u3' || currentId === 'e1';
    if (isKiranUser && (reqEmpId === 'e1' || reqEmpId === 'u3' || empObjId === 'e1' || empObjId === 'u3' || reqEmpName === 'kiran patel')) {
      return true;
    }

    // Fallback if employee currentUser is missing id/name
    if (!currentId && !currentName && (reqEmpId === 'e1' || reqEmpId === 'u3' || reqEmpName === 'kiran patel')) {
      return true;
    }

    return false;
  };

  // Role-based filtering for leave requests:
  // - If user.role === 'employee': Show only leaves where leave.employee.id === currentUser.id or leave.employee.name === currentUser.name
  // - If user.role === 'admin' || user.role === 'hr' || user.role === 'manager': Show ALL leave requests from all employees, including newly submitted pending requests
  const leaves = isEmployee ? (leaveRequests || []).filter(isOwnLeave) : (leaveRequests || []);

  // Dynamic tab badge counts reflecting only the role-filtered leaves
  const counts = {
    all: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const filtered = leaves
    .filter(r => tab === 'all' || r.status === tab)
    .filter(r =>
      !search ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase())
    );

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return 0;
    return Math.max(1, Math.ceil(diff / 86400000) + 1);
  };

  // Leave allowances configuration
  const LEAVE_ALLOWANCES = [
    { type: 'Annual', total: 18, color: '#22c55e' },
    { type: 'Sick', total: 10, color: '#ef4444' },
    { type: 'Casual', total: 6, color: '#3b82f6' },
  ];

  const DEFAULT_ALLOWANCES: Record<string, number> = {
    annual: 18,
    sick: 10,
    casual: 6,
    maternity: 90,
    paternity: 15,
    emergency: 5,
  };

  // Dynamic leave balance based on current user's approved leave requests
  const userLeaves = isEmployee ? leaves : (leaveRequests || []).filter(isOwnLeave);

  const getRemainingDaysForType = (type: string): number => {
    const key = type.toLowerCase();
    const config = LEAVE_ALLOWANCES.find(a => a.type.toLowerCase() === key);
    const totalAllowance = config ? config.total : (DEFAULT_ALLOWANCES[key] ?? 10);
    const usedDays = userLeaves
      .filter(l => l.type.toLowerCase() === key && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0);
    // Requirement 4: Cap display counts so 'days remaining' never drops below 0
    return Math.max(0, totalAllowance - usedDays);
  };

  const leaveBalance = LEAVE_ALLOWANCES.map(({ type, total, color }) => {
    const usedDays = userLeaves
      .filter(l => l.type.toLowerCase() === type.toLowerCase() && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0);

    // Requirement 4: Cap display counts in top cards so 'days remaining' never drops below 0
    const remainingDays = Math.max(0, total - usedDays);
    const progressWidth = total > 0 ? Math.min(100, Math.max(0, (usedDays / total) * 100)) : 0;

    return {
      type,
      total,
      used: usedDays,
      remaining: remainingDays,
      color,
      progressWidth,
    };
  });

  // Calculate requested duration and validation against remaining balance
  const requestedDays = form.startDate && form.endDate ? calcDays(form.startDate, form.endDate) : 0;
  const leaveTypeName = form.type.charAt(0).toUpperCase() + form.type.slice(1);
  const remainingDaysForSelectedType = getRemainingDaysForType(form.type);
  const isInsufficientBalance = requestedDays > 0 && requestedDays > remainingDaysForSelectedType;

  const handleApply = async () => {
    if (!form.reason) {
      setReasonError(true);
      toast.error('Reason required', 'Please provide a reason for your leave.');
      return;
    }
    setReasonError(false);
    if (!form.startDate || !form.endDate) return;

    const days = calcDays(form.startDate, form.endDate);
    if (days <= 0) {
      toast.error('Invalid dates', 'End date must be after or equal to start date.');
      return;
    }

    // Requirement 3: Prevent submission if requestedDays > remainingDays
    if (days > remainingDaysForSelectedType) {
      toast.error(
        'Insufficient leave balance',
        `Insufficient leave balance! You have only ${remainingDaysForSelectedType} day(s) remaining for ${leaveTypeName} Leave.`
      );
      return;
    }

    await applyLeave({
      employeeId: currentUser?.id || 'e1',
      employeeName: currentUser?.name || 'Kiran Patel',
      employeeAvatar: currentUser?.avatar || 'KP',
      department: currentUser?.department || 'Engineering',
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
    });
    setModal(false);
    setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
    if (tab === 'approved' || tab === 'rejected') {
      setTab('all');
    }
    toast.success('Leave request submitted!', `${days} day(s) of ${form.type} leave sent for approval.`);
  };

  const handleAction = async () => {
    if (!actionModal || !canManageLeaves) return;
    const { req, type } = actionModal;
    if (type === 'approve') {
      await approveLeave(req.id, comment);
      toast.success(`Leave approved`, `${req.employeeName}'s ${req.type} leave (${req.days}d) approved.`);
    } else {
      await rejectLeave(req.id, comment);
      toast.error(`Leave rejected`, `${req.employeeName}'s request has been declined.`);
    }
    setActionModal(null);
    setComment('');
  };

  const typeColor: Record<string, string> = {
    sick: 'badge-red', casual: 'badge-blue', annual: 'badge-green',
    maternity: 'badge-purple', paternity: 'badge-purple', emergency: 'badge-yellow',
  };

  return (
    <div className="animate-fade">
      {/* Leave balance (for employees) */}
      {isEmployee && (
        <div className="grid-3 mb-6">
          {leaveBalance.map(lb => (
            <div key={lb.type} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lb.type} Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{lb.remaining}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days remaining</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lb.used}/{lb.total} used</div>
                </div>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${lb.progressWidth}%`, background: lb.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="filter-row">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={15} />
          <input className="input search-input" placeholder="Search leaves..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38 }} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(t => {
          const label = t.charAt(0).toUpperCase() + t.slice(1);
          return (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {label} ({counts[t]})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied On</th>
                <th>Status</th>
                {canManageLeaves && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm">{req.employeeAvatar || 'KP'}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{req.employeeName || 'Kiran Patel'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.department || 'Engineering'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${typeColor[req.type] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{req.type}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{req.startDate} → {req.endDate}</td>
                  <td style={{ fontWeight: 600 }}>{req.days}d</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>
                    <span className="truncate" style={{ display: 'block' }}>{req.reason}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.appliedOn}</td>
                  <td>
                    <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                      {req.status}
                    </span>
                    {req.comments && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>"{req.comments}"</div>
                    )}
                  </td>
                  {canManageLeaves && (
                    <td>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            title="Approve Leave"
                            onClick={() => setActionModal({ req, type: 'approve' })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Reject Leave"
                            onClick={() => setActionModal({ req, type: 'reject' })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Calendar size={32} />
              <h3>No leave requests found</h3>
              {isEmployee && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                  You don't have any {tab !== 'all' ? `${tab} ` : ''}leave requests.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} min={form.startDate} />
                  </div>
                </div>
                {form.startDate && form.endDate && requestedDays > 0 && (
                  <div className="alert alert-info" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} />
                      <span>Duration: <strong>{requestedDays} day(s)</strong></span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      Remaining balance: <strong>{remainingDaysForSelectedType} day(s)</strong>
                    </span>
                  </div>
                )}
                {isInsufficientBalance && (
                  <div className="alert alert-error" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>Insufficient leave balance! You have only {remainingDaysForSelectedType} day(s) remaining for {leaveTypeName} Leave.</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea className="textarea" value={form.reason} onChange={e => { setForm(f => ({ ...f, reason: e.target.value })); setReasonError(false); }} placeholder="Brief reason for leave..." rows={3} style={reasonError ? { borderColor: '#ef4444' } : {}} />
                  {reasonError && <p className="form-error">Reason is required</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply} disabled={!form.startDate || !form.endDate || !form.reason || isInsufficientBalance}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {canManageLeaves && actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionModal.type === 'approve' ? '✅ Approve Leave' : '❌ Reject Leave'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setActionModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{actionModal.req.employeeName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {actionModal.req.type} leave · {actionModal.req.days} day(s) · {actionModal.req.startDate} to {actionModal.req.endDate}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note..." rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn ${actionModal.type === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleAction}
              >
                {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
