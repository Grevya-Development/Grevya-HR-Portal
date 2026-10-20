import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { LeaveRequest, Resignation } from '../types';
import {
  Search, Plus, Check, X, Calendar, AlertCircle, RefreshCw,
  UserMinus, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { calculateLeaveDays, checkLeaveOverlap } from '../utils/leaveCalculations';

const TYPE_COLORS: Record<string, string> = {
  sick: 'badge-red',
  casual: 'badge-blue',
  annual: 'badge-green',
  emergency: 'badge-yellow',
  maternity: 'badge-purple',
  paternity: 'badge-purple',
  compensatory: 'badge-blue',
  unpaid: 'badge-gray',
  optional_holiday: 'badge-purple',
};

const TYPE_CARD_COLORS: Record<string, string> = {
  annual: '#22c55e',
  sick: '#ef4444',
  casual: '#3b82f6',
  emergency: '#f59e0b',
  maternity: '#8b5cf6',
  paternity: '#8b5cf6',
  optional_holiday: '#8b5cf6',
};

export const formatLeaveType = (type: string): string => {
  if (!type) return '';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function LeavePage() {
  const {
    currentUser,
    leaveRequests,
    leaveTypes,
    leaveBalances,
    holidays,
    leavesLoading,
    leavesError,
    fetchLeaves,
    approveLeave,
    rejectLeave,
    applyLeave,
    resignations,
    resignationsLoading,
    fetchResignations,
    submitResignation,
    decideResignation,
  } = useStore();

  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'resignations'>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  const [actionModal, setActionModal] = useState<{ req: LeaveRequest; type: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

  // Resignation workflow states
  const [resignationModal, setResignationModal] = useState(false);
  const [resignationReason, setResignationReason] = useState('');
  const [desiredLastDate, setDesiredLastDate] = useState('');
  const [resignationSubmitting, setResignationSubmitting] = useState(false);
  const [resignationError, setResignationError] = useState('');
  const [decideModal, setDecideModal] = useState<{ req: Resignation; action: 'approved' | 'rejected' } | null>(null);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(30);
  const [decisionComments, setDecisionComments] = useState('');
  const [decisionProcessing, setDecisionProcessing] = useState(false);

  useEffect(() => {
    fetchResignations();
  }, [fetchResignations]);

  const availableTypes = leaveTypes.length > 0
    ? leaveTypes.map(t => t.name.toLowerCase())
    : ['casual', 'sick', 'annual', 'emergency', 'optional_holiday'];

  const [form, setForm] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  // Admin, HR, and Manager can view team leaves and have approval controls
  const canManageLeaves = userRole === 'admin' || userRole === 'super_admin' || userRole === 'hr' || userRole === 'hr_manager' || userRole === 'manager';

  // Helper to match leave requests to the current user
  const isOwnLeave = (r: LeaveRequest) => {
    const currentId = currentUser?.id;
    const currentName = currentUser?.name?.trim().toLowerCase();

    const empObjId = (r as any).employee?.id;
    const empObjName = (r as any).employee?.name?.trim()?.toLowerCase();
    const reqEmpId = r.employeeId || empObjId;
    const reqEmpName = (r.employeeName?.trim() || empObjName || '').toLowerCase();

    if (currentId && (reqEmpId === currentId || empObjId === currentId)) return true;
    if (currentName && (reqEmpName === currentName || empObjName === currentName)) return true;

    return false;
  };

  // Leaves visible to the current user based on role:
  // - Employees see their own leaves
  // - Managers, HR, and Admins see leaves within their permitted scope (filtered by RLS)
  const leaves = isEmployee ? (leaveRequests || []).filter(isOwnLeave) : (leaveRequests || []);

  const userLeaves = (leaveRequests || []).filter(isOwnLeave);

  // Dynamic tab badge counts
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

  const currentYear = new Date().getFullYear();

  // Leave balance cards configuration
  const displayTypes = leaveTypes.length > 0
    ? leaveTypes.filter(t => ['annual', 'sick', 'casual', 'optional_holiday'].includes(t.name.toLowerCase()))
    : [
        { id: '1', name: 'annual', annualQuota: 18 },
        { id: '2', name: 'sick', annualQuota: 12 },
        { id: '3', name: 'casual', annualQuota: 12 },
        { id: '4', name: 'optional_holiday', annualQuota: 2 },
      ];

  const getRemainingDaysForType = (type: string): number => {
    const key = type.toLowerCase();
    const matchedType = leaveTypes.find(t => t.name.toLowerCase() === key);
    const balanceEntry = leaveBalances.find(b =>
      b.employeeId === currentUser?.id &&
      matchedType && b.leaveTypeId === matchedType.id &&
      b.year === currentYear
    );

    const totalAllowance = balanceEntry ? balanceEntry.total : (matchedType ? matchedType.annualQuota : 0);
    const usedDays = balanceEntry
      ? balanceEntry.used
      : userLeaves
          .filter(l => {
            const reqYear = l.startDate ? new Date(l.startDate).getFullYear() : currentYear;
            return l.type.toLowerCase() === key && l.status === 'approved' && reqYear === currentYear;
          })
          .reduce((sum, l) => sum + l.days, 0);

    return Math.max(0, totalAllowance - usedDays);
  };

  const leaveBalanceCards = displayTypes.map(lt => {
    const key = lt.name.toLowerCase();
    const balanceEntry = leaveBalances.find(b =>
      b.employeeId === currentUser?.id &&
      b.leaveTypeId === lt.id &&
      b.year === currentYear
    );

    const total = balanceEntry ? balanceEntry.total : (lt.annualQuota ?? 0);
    const used = balanceEntry
      ? balanceEntry.used
      : userLeaves
          .filter(l => {
            const reqYear = l.startDate ? new Date(l.startDate).getFullYear() : currentYear;
            return l.type.toLowerCase() === key && l.status === 'approved' && reqYear === currentYear;
          })
          .reduce((sum, l) => sum + l.days, 0);

    const remaining = Math.max(0, total - used);
    const progressWidth = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
    const color = TYPE_CARD_COLORS[key] || '#3b82f6';

    return {
      type: formatLeaveType(lt.name),
      total,
      used,
      remaining,
      color,
      progressWidth,
    };
  });

  // Calculate requested duration using actual business days & holidays
  const requestedDays = form.startDate && form.endDate
    ? calculateLeaveDays(form.startDate, form.endDate, holidays)
    : 0;
  const leaveTypeName = formatLeaveType(form.type);
  const remainingDaysForSelectedType = getRemainingDaysForType(form.type);
  const isInsufficientBalance = requestedDays > 0 && requestedDays > remainingDaysForSelectedType;

  // Overlap detection
  const overlapCheck = form.startDate && form.endDate
    ? checkLeaveOverlap(form.startDate, form.endDate, userLeaves)
    : { hasOverlap: false };

  const handleOpenModal = () => {
    const defaultType = availableTypes[0] || 'casual';
    setForm({ type: defaultType, startDate: '', endDate: '', reason: '' });
    setModalError('');
    setReasonError(false);
    setModal(true);
  };

  const handleApply = async () => {
    if (!form.reason.trim()) {
      setReasonError(true);
      toast.error('Reason required', 'Please provide a reason for your leave.');
      return;
    }
    setReasonError(false);
    setModalError('');

    if (!form.startDate || !form.endDate) return;

    if (form.endDate < form.startDate) {
      setModalError('End date must be greater than or equal to start date.');
      toast.error('Invalid dates', 'End date must be after or equal to start date.');
      return;
    }

    if (requestedDays <= 0) {
      setModalError('The selected range contains 0 working days (weekends or public holidays).');
      toast.error('Zero working days', 'Please select at least one working day.');
      return;
    }

    if (isInsufficientBalance) {
      setModalError(`Insufficient leave balance! You have only ${remainingDaysForSelectedType} day(s) remaining for ${leaveTypeName} Leave.`);
      toast.error('Insufficient leave balance', `You have only ${remainingDaysForSelectedType} day(s) remaining.`);
      return;
    }

    if (overlapCheck.hasOverlap && overlapCheck.conflictingRequest) {
      const conf = overlapCheck.conflictingRequest;
      setModalError(`Date conflict: You already have a ${conf.status} ${conf.type} leave request from ${conf.startDate} to ${conf.endDate}.`);
      toast.error('Date conflict', 'This request overlaps with an existing leave request.');
      return;
    }

    setSubmitting(true);
    try {
      await applyLeave({
        employeeId: currentUser?.id || '',
        employeeName: currentUser?.name || 'Employee',
        employeeAvatar: currentUser?.avatar || 'EM',
        department: currentUser?.department || 'General',
        type: form.type as any,
        startDate: form.startDate,
        endDate: form.endDate,
        days: requestedDays,
        reason: form.reason.trim(),
      });
      setModal(false);
      setForm({ type: availableTypes[0] || 'casual', startDate: '', endDate: '', reason: '' });
      if (tab === 'approved' || tab === 'rejected') {
        setTab('all');
      }
      toast.success('Leave request submitted!', `${requestedDays} working day(s) sent for approval.`);
    } catch (err: any) {
      console.error('Error applying for leave:', err);
      setModalError(err.message || 'Failed to submit leave request.');
      toast.error('Submission failed', err.message || 'Could not submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal || !canManageLeaves) return;
    const { req, type } = actionModal;
    setActionProcessing(true);
    try {
      if (type === 'approve') {
        await approveLeave(req.id, comment);
        toast.success('Leave approved', `${req.employeeName}'s ${formatLeaveType(req.type)} leave (${req.days}d) has been approved.`);
      } else {
        await rejectLeave(req.id, comment);
        toast.info('Leave rejected', `${req.employeeName}'s request has been declined.`);
      }
      setActionModal(null);
      setComment('');
    } catch (err: any) {
      console.error('Error handling leave action:', err);
      toast.error('Action failed', err.message || 'Could not update leave request status.');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resignationReason.trim()) {
      setResignationError('Reason for resignation is required.');
      return;
    }
    setResignationSubmitting(true);
    setResignationError('');
    const res = await submitResignation(resignationReason.trim(), desiredLastDate || undefined);
    setResignationSubmitting(false);
    if (!res.success) {
      setResignationError(res.error || 'Failed to submit resignation request.');
      toast.error('Submission Failed', res.error || 'Could not submit resignation.');
    } else {
      toast.success('Resignation Submitted', 'Your formal resignation request has been recorded and submitted to HR.');
      setResignationModal(false);
      setResignationReason('');
      setDesiredLastDate('');
    }
  };

  const handleDecideResignation = async () => {
    if (!decideModal) return;
    setDecisionProcessing(true);
    const res = await decideResignation(
      decideModal.req.id,
      decideModal.action,
      noticePeriodDays,
      decisionComments
    );
    setDecisionProcessing(false);
    if (!res.success) {
      toast.error('Action Failed', res.error || 'Failed to process resignation.');
    } else {
      toast.success(
        decideModal.action === 'approved' ? 'Resignation Approved' : 'Resignation Rejected',
        `Resignation request has been ${decideModal.action}.`
      );
      setDecideModal(null);
      setDecisionComments('');
    }
  };

  const pendingResignationsCount = resignations.filter(r => r.status === 'pending').length;

  const filteredResignations = (isEmployee
    ? resignations.filter(r => r.employeeId === currentUser?.id)
    : resignations
  ).filter(r =>
    !search ||
    (r.employeeName && r.employeeName.toLowerCase().includes(search.toLowerCase())) ||
    r.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {/* Error banner */}
      {leavesError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{leavesError}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => fetchLeaves()}>Retry</button>
        </div>
      )}

      {/* Leave balance cards (for employees) */}
      {isEmployee && (
        <div className="grid-3 mb-6">
          {leaveBalanceCards.map(lb => (
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => fetchLeaves()}
            title="Refresh leaves"
            disabled={leavesLoading}
          >
            <RefreshCw size={15} style={{ animation: leavesLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          {tab === 'resignations' ? (
            <button
              className="btn btn-primary"
              onClick={() => { setResignationModal(true); setResignationError(''); }}
              style={{ background: '#dc2626', borderColor: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserMinus size={16} /> Submit Resignation
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleOpenModal}>
              <Plus size={16} /> Apply for Leave
            </button>
          )}
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
        <button
          className={`tab-btn ${tab === 'resignations' ? 'active' : ''}`}
          onClick={() => setTab('resignations')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>Resignation & Exit</span>
          {pendingResignationsCount > 0 && (
            <span className="badge badge-yellow" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              {pendingResignationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      {tab === 'resignations' ? (
        <div className="card">
          <div className="table-wrap">
            {resignationsLoading && resignations.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
                <p>Loading resignation filings from Supabase...</p>
              </div>
            ) : filteredResignations.length === 0 ? (
              <div className="empty-state">
                <UserMinus size={32} />
                <h3>No resignation filings found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                  No active or historical resignation requests recorded.
                </p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Submitted On</th>
                    <th>Desired Last Date</th>
                    <th>Notice Period</th>
                    <th>Calculated Last Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {canManageLeaves && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredResignations.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{r.employeeAvatar || 'EM'}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.employeeName || 'Employee'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.department || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{r.submissionDate}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.desiredLastDate || 'Not specified'}</td>
                      <td style={{ fontSize: '0.8rem' }}><strong>{r.noticePeriodDays} days</strong></td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600, color: r.calculatedLastDate ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {r.calculatedLastDate || 'Pending review'}
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: 220 }} className="truncate" title={r.reason}>
                        {r.reason}
                      </td>
                      <td>
                        <span className={`badge ${
                          r.status === 'approved' ? 'badge-green' :
                          r.status === 'rejected' ? 'badge-red' :
                          'badge-yellow'
                        }`}>
                          {r.status}
                        </span>
                        {r.comments && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>"{r.comments}"</div>
                        )}
                      </td>
                      {canManageLeaves && (
                        <td>
                          {r.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setDecideModal({ req: r, action: 'approved' });
                                  setNoticePeriodDays(r.noticePeriodDays || 30);
                                  setDecisionComments('');
                                }}
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              >
                                Review & Decide
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
        <div className="table-wrap">
          {leavesLoading && leaves.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
              <p>Loading leave requests from database...</p>
            </div>
          ) : (
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
                {filtered.map(req => {
                  const isSelf = req.employeeId === currentUser?.id;
                  const canActOnThis = canManageLeaves && (!isSelf || userRole === 'super_admin');

                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{req.employeeAvatar || 'EM'}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{req.employeeName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.department || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${TYPE_COLORS[req.type] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{formatLeaveType(req.type)}</span></td>
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
                        {req.approvedBy && req.status === 'approved' && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>By: {req.approvedBy}</div>
                        )}
                      </td>
                      {canManageLeaves && (
                        <td>
                          {req.status === 'pending' && (
                            canActOnThis ? (
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
                            ) : (
                              <span className="badge badge-gray" title="Self-approval is prohibited" style={{ fontSize: '0.65rem' }}>
                                Self Request
                              </span>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {filtered.length === 0 && !leavesLoading && (
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
      )}

      {/* Apply Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {modalError && (
                <div className="alert alert-error" style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem' }}>
                  {modalError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {availableTypes.map(t => <option key={t} value={t}>{formatLeaveType(t)}</option>)}
                  </select>
                </div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input className="input" type="date" value={form.startDate} onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); setModalError(''); }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input className="input" type="date" value={form.endDate} onChange={e => { setForm(f => ({ ...f, endDate: e.target.value })); setModalError(''); }} min={form.startDate} />
                  </div>
                </div>
                {form.startDate && form.endDate && requestedDays > 0 && (
                  <div className="alert alert-info" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} />
                      <span>Duration: <strong>{requestedDays} working day(s)</strong></span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      Remaining: <strong>{remainingDaysForSelectedType} day(s)</strong>
                    </span>
                  </div>
                )}
                {form.startDate && form.endDate && requestedDays === 0 && (
                  <div className="alert alert-warning" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>The selected date range contains 0 working days (dates fall on weekends or public holidays).</span>
                  </div>
                )}
                {isInsufficientBalance && (
                  <div className="alert alert-error" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>Insufficient leave balance! You have only {remainingDaysForSelectedType} day(s) remaining for {leaveTypeName} Leave.</span>
                  </div>
                )}
                {overlapCheck.hasOverlap && overlapCheck.conflictingRequest && (
                  <div className="alert alert-error" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>Date Conflict: You already have a {overlapCheck.conflictingRequest.status} {overlapCheck.conflictingRequest.type} request from {overlapCheck.conflictingRequest.startDate} to {overlapCheck.conflictingRequest.endDate}.</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea
                    className="textarea"
                    value={form.reason}
                    onChange={e => { setForm(f => ({ ...f, reason: e.target.value })); setReasonError(false); setModalError(''); }}
                    placeholder="Brief reason for leave..."
                    rows={3}
                    style={reasonError ? { borderColor: '#ef4444' } : {}}
                  />
                  {reasonError && <p className="form-error">Reason is required</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)} disabled={submitting}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleApply}
                disabled={submitting || !form.startDate || !form.endDate || !form.reason.trim() || isInsufficientBalance || requestedDays <= 0 || overlapCheck.hasOverlap}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
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
                  {formatLeaveType(actionModal.req.type)} leave · {actionModal.req.days} day(s) · {actionModal.req.startDate} to {actionModal.req.endDate}
                </div>
                {actionModal.req.reason && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                    "{actionModal.req.reason}"
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{actionModal.type === 'approve' ? 'Approval Note (optional)' : 'Rejection Reason *'}</label>
                <textarea
                  className="textarea"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={actionModal.type === 'approve' ? 'Add an optional note...' : 'Explain why this leave request is being declined...'}
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActionModal(null)} disabled={actionProcessing}>Cancel</button>
              <button
                className={`btn ${actionModal.type === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleAction}
                disabled={actionProcessing || (actionModal.type === 'reject' && !comment.trim())}
              >
                {actionProcessing
                  ? (actionModal.type === 'approve' ? 'Approving...' : 'Rejecting...')
                  : (actionModal.type === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Submission Modal */}
      {resignationModal && (
        <div className="modal-overlay" onClick={() => setResignationModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Submit Formal Resignation</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setResignationModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {resignationError && (
                <div className="alert alert-error mb-4" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  <span>{resignationError}</span>
                </div>
              )}
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 16,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 2 }}>Formal Exit Notice</div>
                Submitting this request will formally notify HR and begin the exit transition. Standard company notice period is 30–90 days.
              </div>

              <form onSubmit={handleSubmitResignation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <input className="input" value={`${currentUser?.name} (${currentUser?.department})`} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Desired Last Working Date (Optional)</label>
                  <input
                    type="date"
                    value={desiredLastDate}
                    onChange={e => setDesiredLastDate(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Resignation *</label>
                  <textarea
                    required
                    placeholder="Please specify reasons (e.g. higher studies, career growth, relocation)..."
                    value={resignationReason}
                    onChange={e => setResignationReason(e.target.value)}
                    className="input"
                    style={{ minHeight: 90, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button type="button" onClick={() => setResignationModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resignationSubmitting}
                    className="btn btn-danger"
                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  >
                    {resignationSubmitting ? 'Submitting...' : 'Submit Notice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Decision Modal for HR */}
      {decideModal && (
        <div className="modal-overlay" onClick={() => setDecideModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Review Resignation Request</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDecideModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 8, fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{decideModal.req.employeeName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>{decideModal.req.department} • Submitted: {decideModal.req.submissionDate}</div>
                <div style={{ fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--bg-card)', padding: '8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  "{decideModal.req.reason}"
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Period (Days)</label>
                <select
                  value={noticePeriodDays}
                  onChange={e => setNoticePeriodDays(Number(e.target.value))}
                  className="input"
                >
                  <option value={30}>30 Days (Standard Notice)</option>
                  <option value={60}>60 Days (Manager / Lead Notice)</option>
                  <option value={90}>90 Days (Executive Notice)</option>
                </select>
              </div>

              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated Last Working Date:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16a34a' }}>
                  {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + noticePeriodDays);
                    return d.toISOString().split('T')[0];
                  })()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">HR Decision Comments</label>
                <textarea
                  placeholder="Exit interview scheduled, asset handover notes, etc..."
                  value={decisionComments}
                  onChange={e => setDecisionComments(e.target.value)}
                  className="input"
                  style={{ minHeight: 70 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setDecideModal(null)}
                  className="btn btn-secondary"
                  disabled={decisionProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setDecisionProcessing(true);
                    const res = await decideResignation(
                      decideModal.req.id,
                      'rejected',
                      noticePeriodDays,
                      decisionComments
                    );
                    setDecisionProcessing(false);
                    if (!res.success) {
                      toast.error('Action Failed', res.error || 'Failed to reject resignation.');
                    } else {
                      toast.info('Resignation Rejected', 'Resignation request has been rejected.');
                      setDecideModal(null);
                      setDecisionComments('');
                    }
                  }}
                  disabled={decisionProcessing}
                  className="btn btn-danger"
                  style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setDecisionProcessing(true);
                    const res = await decideResignation(
                      decideModal.req.id,
                      'approved',
                      noticePeriodDays,
                      decisionComments
                    );
                    setDecisionProcessing(false);
                    if (!res.success) {
                      toast.error('Action Failed', res.error || 'Failed to approve resignation.');
                    } else {
                      toast.success('Resignation Approved', 'Resignation request has been approved.');
                      setDecideModal(null);
                      setDecisionComments('');
                    }
                  }}
                  disabled={decisionProcessing}
                  className="btn btn-primary"
                  style={{ background: '#16a34a', borderColor: '#15803d' }}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

