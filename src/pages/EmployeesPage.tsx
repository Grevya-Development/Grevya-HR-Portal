import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { Employee } from '../types';
import {
  Search, Plus, Edit2, Trash2, X, ChevronUp, ChevronDown,
  KeyRound, Copy, Mail, RefreshCw, Eye, EyeOff, CheckCircle2,
  Check, UserCheck, ShieldAlert, UserPlus, Link2, Clock, Ban,
  CheckCircle, ExternalLink, Send
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { isPermittedGrevyaEmail, EMAIL_POLICY_MESSAGE } from '../utils/emailValidation';

const FALLBACK_DEPARTMENTS = ['All', 'Engineering', 'Sales', 'Design', 'Content', 'HR', 'Finance', 'Marketing', 'Operations', 'QA', 'Administration'];

const EMPTY_EMP: Omit<Employee, 'id'> = {
  name: '', email: '', department: 'Engineering', position: '', status: 'active',
  role: 'employee', joinDate: '', salary: 0, performance: 80, attendance: 90, avatar: '',
  managerId: '', phone: '', location: '', points: 0, badges: [], streak: 0,
  employeeCode: '', personalEmail: '', alternatePhone: '', currentAddress: '', permanentAddress: '',
  workMode: 'office', confirmationDate: '', skills: [], qualifications: '', certifications: '',
  bankName: '', bankAccountNo: '', bankIfsc: '', bankHolderName: '', panNumber: '',
};

/* Generate a deterministic-ish password from employee data */
function genPassword(emp: Employee) {
  const seed = emp.name.replace(/\s+/g, '').slice(0, 4).toLowerCase();
  const nums = String(emp.salary).slice(-3) || '123';
  return `Grevya@${seed}${nums}`;
}

interface CredInfo {
  emp: Employee;
  password: string;
}

export default function EmployeesPage() {
  const {
    currentUser,
    employees,
    departments,
    employeesLoading,
    employeesError,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    approveRegistration,
    rejectRegistration,
    onlineUserIds,
    invitations,
    invitationsLoading,
    fetchInvitations,
    inviteEmployee,
    resendInvitation,
    revokeInvitation,
  } = useStore();

  const isHR = currentUser?.role === 'hr_manager' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;

  const availableDepts = departments.length > 0
    ? ['All', ...Array.from(new Set(departments.map(d => d.name)))]
    : FALLBACK_DEPARTMENTS;

  const [activeTab, setActiveTab] = useState<'directory' | 'invitations'>('directory');
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortKey, setSortKey] = useState<keyof Employee>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee, 'id'>>(EMPTY_EMP);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Invite Employee state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    departmentId: '',
    jobTitle: '',
    managerId: '',
    role: 'employee' as 'employee' | 'manager',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccessLink, setInviteSuccessLink] = useState<{ name: string; email: string; link: string } | null>(null);

  // Invitations filter state
  const [inviteStatusFilter, setInviteStatusFilter] = useState<string>('all');
  const [inviteSearch, setInviteSearch] = useState('');

  // Initial load of invitations for HR
  useEffect(() => {
    if (isHR) {
      fetchInvitations();
    }
  }, [isHR, fetchInvitations]);

  // Credentials modal
  const [credInfo, setCredInfo] = useState<CredInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'email' | 'pass' | 'all' | 'link' | null>(null);

  const filtered = employees
    .filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase());
      const matchDept = dept === 'All' || e.department.toLowerCase() === dept.toLowerCase();
      const matchStatus = status === 'All' || e.status === status;
      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const openAdd = () => {
    const defaultDept = departments.length > 0 ? departments[0].name : 'Engineering';
    setForm({ ...EMPTY_EMP, department: defaultDept, role: 'employee', managerId: '' });
    setFormError('');
    setModal('add');
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ ...emp, role: emp.role || 'employee', managerId: emp.managerId || '' });
    setFormError('');
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
    setFormError('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Full Name and Email are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const avatar = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      if (modal === 'add') {
        await addEmployee({ ...form, avatar });
        toast.success('Employee added!', `${form.name} has been added.`);
      } else if (editing) {
        await updateEmployee(editing.id, { ...form, avatar });
        toast.success('Employee updated!', `${form.name}'s profile has been saved.`);
      }
      closeModal();
    } catch (err: any) {
      console.error('Error submitting employee form:', err);
      setFormError(err.message || 'Operation failed. Please check inputs and permissions.');
      toast.error('Error', err.message || 'Failed to save employee profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteConfirm);
      toast.info('Employee deactivated', 'The employee record has been marked inactive.');
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error('Deactivation failed', err.message || 'Could not update employee status.');
    } finally {
      setDeleting(false);
    }
  };

  const sort = (key: keyof Employee) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: keyof Employee }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const statusColor: Record<string, string> = {
    active: 'badge-green',
    inactive: 'badge-gray',
    on_leave: 'badge-yellow',
    pending: 'badge-blue',
    rejected: 'badge-red',
  };

  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string, name: string) => {
    setActionProcessingId(id);
    const res = await approveRegistration(id);
    setActionProcessingId(null);
    if (res.success) {
      toast.success('Registration Approved', `${name} is now active.`);
    } else {
      toast.error('Approval Failed', res.error || 'Could not approve registration.');
    }
  };

  const handleReject = async (id: string, name: string) => {
    setActionProcessingId(id);
    const res = await rejectRegistration(id);
    setActionProcessingId(null);
    if (res.success) {
      toast.info('Registration Rejected', `${name}'s registration has been rejected.`);
    } else {
      toast.error('Rejection Failed', res.error || 'Could not reject registration.');
    }
  };

  const pendingRegistrationsCount = employees.filter(e => e.status === 'pending').length;

  // ── Credentials helpers ──────────────────────────────────
  const openCreds = (emp: Employee) => {
    setCredInfo({ emp, password: genPassword(emp) });
    setShowPassword(false);
    setCopied(null);
  };

  const copyToClipboard = async (text: string, kind: 'email' | 'pass' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success('Copied!', `${kind === 'all' ? 'Credentials' : kind === 'email' ? 'Email' : 'Password'} copied to clipboard.`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback */
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const sendEmail = (info: CredInfo) => {
    const { emp, password } = info;
    const subject = encodeURIComponent(`Your Grevya HR Portal Access Credentials`);
    const body = encodeURIComponent(
      `Hi ${emp.name},\n\n` +
      `Welcome to Grevya HR Portal! 🎉\n\n` +
      `Here are your login credentials:\n\n` +
      `🌐 Portal URL: https://hr.grevya.com\n` +
      `📧 Email: ${emp.email}\n` +
      `🔑 Password: ${password}\n\n` +
      `Please log in and change your password at first sign-in.\n\n` +
      `If you have any issues accessing the portal, reach out to your HR team.\n\n` +
      `Best regards,\n` +
      `${currentUser?.name}\n` +
      `Grevya HR Team`
    );
    window.open(`mailto:${emp.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success('Email client opened!', `Credentials draft ready for ${emp.name}.`);
  };

  const regeneratePassword = (info: CredInfo) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    const rand = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCredInfo({ ...info, password: `Gr@${rand}` });
    setCopied(null);
    toast.info('Password regenerated', 'A new password has been generated.');
  };

  const handleOpenInvite = () => {
    setInviteForm({
      fullName: '',
      email: '',
      departmentId: departments[0]?.id || '',
      jobTitle: '',
      managerId: '',
      role: 'employee',
    });
    setInviteError('');
    setInviteSuccessLink(null);
    setInviteModalOpen(true);
  };

  const handleSendInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) {
      setInviteError('Candidate full name and email are required.');
      return;
    }
    if (!isPermittedGrevyaEmail(inviteForm.email)) {
      setInviteError(EMAIL_POLICY_MESSAGE);
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await inviteEmployee({
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        departmentId: inviteForm.departmentId || undefined,
        jobTitle: inviteForm.jobTitle || 'Team Member',
        managerId: inviteForm.managerId || undefined,
        role: inviteForm.role,
      });

      if (!res.success) {
        setInviteError(res.error || 'Failed to create employee invitation.');
        toast.error('Invitation Failed', res.error || 'Could not send invitation.');
      } else {
        const link = `${window.location.origin}/accept-invitation?token=${res.token}`;
        setInviteSuccessLink({
          name: inviteForm.fullName,
          email: inviteForm.email,
          link,
        });
        toast.success('Invitation Created', `Invitation link generated for ${inviteForm.fullName}`);
      }
    } catch (err: any) {
      setInviteError(err.message || 'An unexpected error occurred.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (invitationId: string, candidateName: string, candidateEmail: string) => {
    try {
      const res = await resendInvitation(invitationId);
      if (res.success && res.token) {
        const link = `${window.location.origin}/accept-invitation?token=${res.token}`;
        navigator.clipboard.writeText(link);
        toast.success('Invitation Renewed', `Fresh invite link generated and copied to clipboard for ${candidateName}.`);
        setInviteSuccessLink({
          name: candidateName,
          email: candidateEmail,
          link,
        });
        setInviteModalOpen(true);
      } else {
        toast.error('Resend Failed', res.error || 'Could not resend invitation.');
      }
    } catch (err: any) {
      toast.error('Resend Error', err.message || 'Failed to resend invitation.');
    }
  };

  const handleRevokeInvite = async (invitationId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${candidateName}? The link will immediately be invalidated.`)) return;
    try {
      const res = await revokeInvitation(invitationId);
      if (res.success) {
        toast.info('Invitation Revoked', `Invitation for ${candidateName} was revoked.`);
      } else {
        toast.error('Revoke Failed', res.error || 'Could not revoke invitation.');
      }
    } catch (err: any) {
      toast.error('Revoke Error', err.message || 'Failed to revoke invitation.');
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    const matchSearch = inv.fullName.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      inv.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      (inv.jobTitle && inv.jobTitle.toLowerCase().includes(inviteSearch.toLowerCase()));
    const matchStatus = inviteStatusFilter === 'all' || inv.status === inviteStatusFilter;
    return matchSearch && matchStatus;
  });

  const pendingInvitesCount = invitations.filter(i => i.status === 'pending' || i.status === 'sent').length;

  const inviteStatusBadge: Record<string, string> = {
    pending: 'badge-yellow',
    sent: 'badge-yellow',
    accepted: 'badge-green',
    expired: 'badge-gray',
    revoked: 'badge-red',
  };

  const sendInvitationEmail = (info: { name: string; email: string; link: string }) => {
    const subject = encodeURIComponent(`Welcome to Grevya - Complete Your Onboarding`);
    const body = encodeURIComponent(
      `Hi ${info.name},\n\n` +
      `Welcome to the Grevya HR Portal! 🎉\n\n` +
      `You have been invited to set up your account and join the team. Please complete your profile and set your secure password by clicking the onboarding link below:\n\n` +
      `${info.link}\n\n` +
      `This invitation link is unique to you and will expire in 7 days.\n\n` +
      `If you have any questions or require assistance, please feel free to reach out to the HR team.\n\n` +
      `Best regards,\n` +
      `${currentUser?.name || 'Grevya HR'}\n` +
      `Grevya HR Team`
    );
    window.open(`mailto:${info.email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="animate-fade">
      {/* Error Banner */}
      {employeesError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>
          <span>{employeesError}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => fetchEmployees()}>Retry</button>
        </div>
      )}

      {/* Top Header & Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'directory' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('directory')}
            style={{ borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>Employee Directory</span>
            <span style={{
              background: activeTab === 'directory' ? 'rgba(255,255,255,0.25)' : 'var(--border)',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: '0.72rem',
              color: activeTab === 'directory' ? '#fff' : 'var(--text-muted)'
            }}>
              {employees.length}
            </span>
          </button>
          {isHR && (
            <button
              className={`btn btn-sm ${activeTab === 'invitations' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setActiveTab('invitations');
                fetchInvitations();
              }}
              style={{ borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Invitations & Onboarding</span>
              {pendingInvitesCount > 0 ? (
                <span style={{
                  background: activeTab === 'invitations' ? 'rgba(255,255,255,0.25)' : '#3b82f6',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {pendingInvitesCount}
                </span>
              ) : (
                <span style={{
                  background: 'var(--border)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem'
                }}>
                  {invitations.length}
                </span>
              )}
            </button>
          )}
        </div>

        {isHR && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={handleOpenInvite}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
            >
              <UserPlus size={16} />
              <span>Invite New Employee</span>
            </button>
            <button className="btn btn-secondary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} />
              <span>Direct Add</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Pending Registrations Notice */}
          {pendingRegistrationsCount > 0 && status !== 'pending' && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 8,
              padding: '10px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontSize: '0.85rem' }}>
                <ShieldAlert size={16} />
                <span><strong>{pendingRegistrationsCount}</strong> new account registration(s) pending approval.</span>
              </div>
              <button
                onClick={() => setStatus('pending')}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Review Pending
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="filter-row">
            <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
              <Search size={15} />
              <input className="input search-input" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38 }} />
            </div>
            <select className="select" value={dept} onChange={e => setDept(e.target.value)} style={{ height: 38, width: 160 }}>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ height: 38, width: 160 }}>
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending ({pendingRegistrationsCount})</option>
              <option value="rejected">Rejected</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => fetchEmployees()}
                title="Refresh employees"
                disabled={employeesLoading}
              >
                <RefreshCw size={15} style={{ animation: employeesLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} results</span>
            </div>
          </div>

          {/* Directory Table */}
          <div className="card">
            <div className="table-wrap">
              {employeesLoading && employees.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
                  <p>Loading employees from Supabase database...</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => sort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Name <SortIcon k="name" /></span>
                      </th>
                      <th>Contact</th>
                      <th onClick={() => sort('department')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Dept <SortIcon k="department" /></span>
                      </th>
                      <th>Position</th>
                      <th onClick={() => sort('performance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Performance <SortIcon k="performance" /></span>
                      </th>
                      <th onClick={() => sort('attendance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Attendance <SortIcon k="attendance" /></span>
                      </th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(emp => {
                      const isOnline = onlineUserIds.includes(emp.id) ||
                        (Boolean(emp.lastSeenAt) && (Date.now() - new Date(emp.lastSeenAt!).getTime() < 10 * 60 * 1000));
                      const isPending = emp.status === 'pending';
                      const isProcessing = actionProcessingId === emp.id;

                      return (
                        <tr key={emp.id} style={{ background: isPending ? 'rgba(59, 130, 246, 0.04)' : undefined }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ position: 'relative' }}>
                                <div className="avatar">{emp.avatar}</div>
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: isOnline ? '#22c55e' : '#94a3b8',
                                    border: '2px solid var(--bg-card)',
                                    boxShadow: isOnline ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
                                  }}
                                  title={isOnline ? 'Online' : 'Offline'}
                                />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span>{emp.name}</span>
                                  {isOnline && (
                                    <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 500 }}>● online</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.location || 'Location not set'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{emp.email}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.phone || 'Phone not set'}</div>
                          </td>
                          <td><span className="chip">{emp.department}</span></td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 500 }}>{emp.position || 'Employee'}</div>
                            {emp.role && (
                              <span className={`badge ${
                                emp.role === 'super_admin' ? 'badge-purple' :
                                emp.role === 'admin' ? 'badge-blue' :
                                emp.role === 'hr_manager' ? 'badge-yellow' :
                                emp.role === 'manager' ? 'badge-blue' :
                                'badge-gray'
                              }`} style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: 3 }}>
                                Role: {emp.role.replace('_', ' ')}
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress" style={{ width: 60 }}>
                                <div className="progress-bar progress-green" style={{ width: `${emp.performance}%` }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{emp.performance}%</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress" style={{ width: 60 }}>
                                <div className={`progress-bar ${emp.attendance >= 90 ? 'progress-green' : emp.attendance >= 75 ? 'progress-amber' : 'progress-red'}`} style={{ width: `${emp.attendance}%` }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{emp.attendance}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${statusColor[emp.status] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                              {emp.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            {isPending && isHR ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleApprove(emp.id, emp.name)}
                                  disabled={isProcessing}
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}
                                  title="Approve Registration"
                                >
                                  <Check size={13} /> {isProcessing ? '...' : 'Approve'}
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleReject(emp.id, emp.name)}
                                  disabled={isProcessing}
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}
                                  title="Reject Registration"
                                >
                                  <X size={13} /> Reject
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(emp)} title="Edit">
                                  <Edit2 size={14} />
                                </button>
                                {isHR && (
                                  <button
                                    className="btn btn-ghost btn-icon btn-sm"
                                    onClick={() => openCreds(emp)}
                                    title="Share Credentials"
                                    style={{ color: '#8b5cf6' }}
                                  >
                                    <KeyRound size={14} />
                                  </button>
                                )}
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(emp.id)} title="Deactivate" style={{ color: '#dc2626' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {filtered.length === 0 && !employeesLoading && (
                <div className="empty-state">
                  <Search size={32} />
                  <h3>No employees found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── INVITATIONS & ONBOARDING VIEW ──────────────── */
        <div>
          {/* Invitations Filter Row */}
          <div className="filter-row">
            <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
              <Search size={15} />
              <input
                className="input search-input"
                placeholder="Search candidates by name or email..."
                value={inviteSearch}
                onChange={e => setInviteSearch(e.target.value)}
                style={{ height: 38 }}
              />
            </div>
            <select
              className="select"
              value={inviteStatusFilter}
              onChange={e => setInviteStatusFilter(e.target.value)}
              style={{ height: 38, width: 170 }}
            >
              <option value="all">All Invitation Status</option>
              <option value="pending">Pending ({pendingInvitesCount})</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => fetchInvitations()}
                title="Refresh invitations"
                disabled={invitationsLoading}
              >
                <RefreshCw size={15} style={{ animation: invitationsLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredInvitations.length} invitation(s)</span>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="card">
            <div className="table-wrap">
              {invitationsLoading && invitations.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
                  <p>Loading invitations from Supabase...</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Pre-assigned Role & Dept</th>
                      <th>Invited By</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map(inv => {
                      const isExpired = new Date(inv.tokenExpiresAt).getTime() < Date.now();
                      const isPending = (inv.status === 'pending' || inv.status === 'sent') && !isExpired;
                      const inviter = employees.find(e => e.id === inv.invitedBy)?.name || 'HR Team';

                      return (
                        <tr key={inv.id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.email}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={`badge ${inv.role === 'manager' ? 'badge-blue' : 'badge-gray'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                                  {inv.role}
                                </span>
                                <span style={{ fontSize: '0.825rem', fontWeight: 500 }}>{inv.jobTitle || 'Team Member'}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {inv.departmentName || 'No Department Assigned'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{inviter}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>
                              {new Date(inv.tokenExpiresAt).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: isExpired ? '#dc2626' : 'var(--text-muted)' }}>
                              {isExpired ? 'Expired' : 'Valid'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${inviteStatusBadge[inv.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {isPending && (
                                <>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleResendInvite(inv.id, inv.fullName, inv.email)}
                                    title="Regenerate and share link"
                                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <Link2 size={13} /> Share Link
                                  </button>
                                  <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => handleRevokeInvite(inv.id, inv.fullName)}
                                    title="Revoke Invitation"
                                    style={{ color: '#dc2626', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <Ban size={13} /> Revoke
                                  </button>
                                </>
                              )}
                              {(inv.status === 'expired' || inv.status === 'revoked') && (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleResendInvite(inv.id, inv.fullName, inv.email)}
                                  title="Re-issue fresh invitation"
                                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <RefreshCw size={13} /> Re-Invite
                                </button>
                              )}
                              {inv.status === 'accepted' && (
                                <span style={{ color: '#16a34a', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                                  <CheckCircle size={14} /> Joined {inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString() : ''}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {filteredInvitations.length === 0 && !invitationsLoading && (
                <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <UserPlus size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No Invitations Found</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 360, margin: '4px auto 16px' }}>
                    Invite new employees with pre-assigned roles and departments to allow them to onboard securely.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleOpenInvite}>
                    <UserPlus size={14} /> Invite New Employee
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Employee Modal ────────────────────── */}
      {inviteModalOpen && (
        <div className="modal-overlay" onClick={() => !inviteLoading && setInviteModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={18} color="#6366f1" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    {inviteSuccessLink ? 'Invitation Link Generated' : 'Invite New Employee'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {inviteSuccessLink ? 'Send this secure onboarding link to the employee' : 'Pre-assign role, department, and generate secure onboarding token'}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setInviteModalOpen(false)} disabled={inviteLoading}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {inviteError && (
                <div className="alert alert-error" style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: '0.825rem' }}>
                  {inviteError}
                </div>
              )}

              {inviteSuccessLink ? (
                <div>
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                      <CheckCircle2 size={18} /> Invitation Ready!
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      An invitation record has been generated in Supabase for <strong>{inviteSuccessLink.name}</strong> ({inviteSuccessLink.email}).
                    </p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Onboarding Access Link</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="input"
                        readOnly
                        value={inviteSuccessLink.link}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteSuccessLink.link);
                          setCopied('link');
                          toast.success('Link copied', 'Invitation link copied to clipboard.');
                          setTimeout(() => setCopied(null), 2000);
                        }}
                        style={{ flexShrink: 0, color: copied === 'link' ? '#16a34a' : undefined }}
                      >
                        {copied === 'link' ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      ⏳ This single-use link expires in 7 days and allows the employee to set their own password securely.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => sendInvitationEmail(inviteSuccessLink)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
                    >
                      <Mail size={15} /> Send via Email Client
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setInviteModalOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendInvite}>
                  <div className="grid-2" style={{ gap: 14 }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Full Name *</label>
                      <input
                        className="input"
                        placeholder="e.g. Ramesh Kumar"
                        value={inviteForm.fullName}
                        onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))}
                        disabled={inviteLoading}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Email Address *</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="e.g. ramesh@grevya.com or ramesh.grevya@gmail.com"
                        value={inviteForm.email}
                        onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                        disabled={inviteLoading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        className="select"
                        value={inviteForm.role}
                        onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as any }))}
                        disabled={inviteLoading}
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="select"
                        value={inviteForm.departmentId}
                        onChange={e => setInviteForm(f => ({ ...f, departmentId: e.target.value }))}
                        disabled={inviteLoading}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Job Title / Designation</label>
                      <input
                        className="input"
                        placeholder="e.g. Frontend Engineer"
                        value={inviteForm.jobTitle}
                        onChange={e => setInviteForm(f => ({ ...f, jobTitle: e.target.value }))}
                        disabled={inviteLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reporting Manager</label>
                      <select
                        className="select"
                        value={inviteForm.managerId}
                        onChange={e => setInviteForm(f => ({ ...f, managerId: e.target.value }))}
                        disabled={inviteLoading}
                      >
                        <option value="">Select Manager (Optional)</option>
                        {employees
                          .filter(e => e.status === 'active' && (e.role === 'manager' || e.role === 'hr_manager' || e.role === 'admin' || e.role === 'super_admin'))
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🔒 The employee will be invited to create their account and establish their own secure password. No plain-text passwords will be sent over email.
                  </div>

                  <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setInviteModalOpen(false)} disabled={inviteLoading}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={inviteLoading || !inviteForm.fullName.trim() || !inviteForm.email.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
                    >
                      {inviteLoading ? (
                        <>
                          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          <span>Generating Token...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Generate Invitation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ─────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add New Employee' : 'Edit Employee'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={closeModal} disabled={submitting}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="alert alert-error" style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: '0.825rem' }}>
                  {formError}
                </div>
              )}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kiran Patel" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="kiran@grevya.com" disabled={submitting || modal === 'edit'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} disabled={submitting}>
                    {availableDepts.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title / Position</label>
                  <input className="input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Backend Developer" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">System Access Role</label>
                  <select
                    className="select"
                    value={form.role || 'employee'}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                    disabled={submitting || (editing?.id === currentUser?.id) || (editing?.role === 'super_admin' && !isSuperAdmin)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    {(isAdmin || isSuperAdmin) && <option value="hr_manager">HR Manager</option>}
                    {(isAdmin || isSuperAdmin) && <option value="admin">Admin</option>}
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                  {editing?.id === currentUser?.id && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Self-role modification is restricted.
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Reporting Manager</label>
                  <select
                    className="select"
                    value={form.managerId || ''}
                    onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="">None / Direct Report</option>
                    {employees
                      .filter(e => e.id !== editing?.id && e.status === 'active' && (e.role === 'manager' || e.role === 'hr_manager' || e.role === 'admin' || e.role === 'super_admin'))
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.position || m.role})</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Bangalore" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input className="input" type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary (₹)</label>
                  <input className="input" type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} placeholder="85000" disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} disabled={submitting}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Performance (0-100)</label>
                  <input className="input" type="number" min={0} max={100} value={form.performance} onChange={e => setForm(f => ({ ...f, performance: Number(e.target.value) }))} disabled={submitting} />
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Extended Employment & Work Mode
                  </h4>
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Code</label>
                  <input className="input" placeholder="EMP-001" value={form.employeeCode || ''} onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Mode</label>
                  <select className="select" value={form.workMode || 'office'} onChange={e => setForm(f => ({ ...f, workMode: e.target.value as any }))} disabled={submitting}>
                    <option value="office">On-Site (Office)</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmation Date</label>
                  <input className="input" type="date" value={form.confirmationDate || ''} onChange={e => setForm(f => ({ ...f, confirmationDate: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Personal Email</label>
                  <input className="input" type="email" placeholder="personal@gmail.com" value={form.personalEmail || ''} onChange={e => setForm(f => ({ ...f, personalEmail: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Alternate Phone</label>
                  <input className="input" placeholder="+91 98765 00000" value={form.alternatePhone || ''} onChange={e => setForm(f => ({ ...f, alternatePhone: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Current Residential Address</label>
                  <input className="input" placeholder="Flat, Street, Area, City" value={form.currentAddress || ''} onChange={e => setForm(f => ({ ...f, currentAddress: e.target.value }))} disabled={submitting} />
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Professional Background & Skills
                  </h4>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Skills (comma separated)</label>
                  <input
                    className="input"
                    placeholder="React, TypeScript, PostgreSQL, Docker"
                    value={Array.isArray(form.skills) ? form.skills.join(', ') : ''}
                    onChange={e => setForm(f => ({ ...f, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <input className="input" placeholder="B.Tech Computer Science" value={form.qualifications || ''} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label className="form-label">Certifications</label>
                  <input className="input" placeholder="AWS Certified, Scrum Master" value={form.certifications || ''} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} disabled={submitting} />
                </div>

                {(isAdmin || isHR) && (
                  <>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Payroll & Bank Details (Restricted HR/Admin)
                      </h4>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank Name</label>
                      <input className="input" placeholder="HDFC Bank" value={form.bankName || ''} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} disabled={submitting} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Holder Name</label>
                      <input className="input" placeholder="Full name as on passbook" value={form.bankHolderName || ''} onChange={e => setForm(f => ({ ...f, bankHolderName: e.target.value }))} disabled={submitting} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank Account Number</label>
                      <input className="input" placeholder="50100234567890" value={form.bankAccountNo || ''} onChange={e => setForm(f => ({ ...f, bankAccountNo: e.target.value }))} disabled={submitting} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">IFSC Code</label>
                      <input className="input" placeholder="HDFC0001234" value={form.bankIfsc || ''} onChange={e => setForm(f => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))} disabled={submitting} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number</label>
                      <input className="input" placeholder="ABCDE1234F" value={form.panNumber || ''} onChange={e => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))} disabled={submitting} />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.name.trim() || !form.email.trim()}>
                {submitting ? 'Saving...' : (modal === 'add' ? 'Add Employee' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate confirm ─────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deactivate Employee</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to deactivate this employee? The employee record will be marked as inactive in Supabase, preserving historical attendance and leave logs.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deactivating...' : 'Deactivate Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credentials Modal (HR only) ────────────────── */}
      {credInfo && isHR && (
        <div className="modal-overlay" onClick={() => setCredInfo(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={16} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Share Credentials</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For {credInfo.emp.name}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setCredInfo(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {/* Employee info strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
                <div className="avatar">{credInfo.emp.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{credInfo.emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{credInfo.emp.position} · {credInfo.emp.department}</div>
                </div>
                <span className={`badge ${statusColor[credInfo.emp.status]}`} style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                  {credInfo.emp.status.replace('_', ' ')}
                </span>
              </div>

              {/* Portal URL */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Portal URL</div>
                <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                  https://hr.grevya.com
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Login Email</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {credInfo.emp.email}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(credInfo.emp.email, 'email')}
                    style={{ flexShrink: 0, color: copied === 'email' ? '#22c55e' : undefined, borderColor: copied === 'email' ? '#22c55e' : undefined }}
                  >
                    {copied === 'email' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Temporary Password</div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => regeneratePassword(credInfo)}>
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace', letterSpacing: showPassword ? '0' : '0.2em' }}>
                    {showPassword ? credInfo.password : '•'.repeat(credInfo.password.length)}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPassword(v => !v)} style={{ flexShrink: 0 }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(credInfo.password, 'pass')}
                    style={{ flexShrink: 0, color: copied === 'pass' ? '#22c55e' : undefined, borderColor: copied === 'pass' ? '#22c55e' : undefined }}
                  >
                    {copied === 'pass' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Security note */}
              <div className="alert alert-warning" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                ⚠️ Send credentials only through a secure channel. Ask the employee to change their password after first login.
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => copyToClipboard(`Email: ${credInfo.emp.email}\nPassword: ${credInfo.password}\nPortal: https://hr.grevya.com`, 'all')}
                style={{ color: copied === 'all' ? '#22c55e' : undefined, borderColor: copied === 'all' ? '#22c55e' : undefined }}
              >
                {copied === 'all' ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
              </button>
              <button className="btn btn-primary" onClick={() => sendEmail(credInfo)} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Mail size={14} /> Send via Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
