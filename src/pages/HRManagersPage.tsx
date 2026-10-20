import React, { useState } from 'react';
import { Edit2, Plus, Search, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useStore } from '../services/store';
import { HRManager } from '../types';
import { toast } from '../components/ui/Toast';

const FALLBACK_DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Design', 'Finance', 'Marketing', 'Operations', 'Administration'];

const EMPTY_MANAGER: Omit<HRManager, 'id'> = {
  name: '',
  email: '',
  department: 'HR',
  status: 'active',
  avatar: '',
  joinDate: '',
  phone: '',
  location: '',
};

export default function HRManagersPage() {
  const {
    hrManagers,
    employees,
    departments,
    employeesLoading,
    employeesError,
    fetchEmployees,
    addHRManager,
    updateHRManager,
    deleteHRManager,
    toggleHRManagerStatus,
  } = useStore();

  const availableDepts = departments.length > 0
    ? Array.from(new Set(departments.map(d => d.name)))
    : FALLBACK_DEPARTMENTS;

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<HRManager | null>(null);
  const [form, setForm] = useState<Omit<HRManager, 'id'>>(EMPTY_MANAGER);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<HRManager | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = hrManagers.filter(manager =>
    `${manager.name} ${manager.email} ${manager.department}`.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    const defaultDept = availableDepts.includes('HR') ? 'HR' : (availableDepts[0] || 'HR');
    setForm({ ...EMPTY_MANAGER, department: defaultDept });
    setFormError('');
    setModal('add');
  };

  const openEdit = (manager: HRManager) => {
    setEditing(manager);
    setForm({ ...manager });
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
      const avatar = form.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
      if (modal === 'add') {
        await addHRManager({ ...form, avatar });
        toast.success('HR Manager added', `${form.name} can now manage assigned employees.`);
      } else if (editing) {
        await updateHRManager(editing.id, { ...form, avatar });
        toast.success('HR Manager updated', `${form.name}'s profile has been saved.`);
      }
      closeModal();
    } catch (err: any) {
      console.error('Error saving HR Manager:', err);
      setFormError(err.message || 'Operation failed. Please check inputs and permissions.');
      toast.error('Error', err.message || 'Failed to save HR Manager.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (manager: HRManager) => {
    setTogglingId(manager.id);
    try {
      await toggleHRManagerStatus(manager.id);
      toast.info('Status updated', `${manager.name} is now ${manager.status === 'active' ? 'inactive' : 'active'}.`);
    } catch (err: any) {
      toast.error('Status update failed', err.message || 'Could not update status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteHRManager(deleteConfirm.id);
      toast.info('HR Manager deactivated', `${deleteConfirm.name} has been marked inactive.`);
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error('Deactivation failed', err.message || 'Could not deactivate HR manager.');
    } finally {
      setDeleting(false);
    }
  };

  const statusColor = { active: 'badge-green', inactive: 'badge-gray' };

  return (
    <div className="animate-fade">
      {/* Error Banner */}
      {employeesError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{employeesError}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => fetchEmployees()}>Retry</button>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="filter-row">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={15} />
          <input
            className="input search-input"
            placeholder="Search HR managers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ height: 38 }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => fetchEmployees()}
            title="Refresh HR Managers"
            disabled={employeesLoading}
          >
            <RefreshCw size={15} style={{ animation: employeesLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} results</span>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add HR Manager</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {employeesLoading && hrManagers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
              <p>Loading HR Managers from Supabase database...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Assigned Employees</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(manager => {
                  const assignedCount = employees.filter(employee => employee.managerId === manager.id).length;
                  const isToggling = togglingId === manager.id;
                  return (
                    <tr key={manager.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{manager.avatar}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{manager.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Joined {manager.joinDate || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{manager.email}</td>
                      <td><span className="chip">{manager.department}</span></td>
                      <td style={{ fontWeight: 700 }}>{assignedCount}</td>
                      <td style={{ fontSize: '0.8rem' }}>{manager.location || '—'}</td>
                      <td>
                        <button
                          className={`badge ${statusColor[manager.status]}`}
                          onClick={() => handleToggleStatus(manager)}
                          disabled={isToggling}
                          title="Click to toggle status"
                          style={{ border: 'none', cursor: isToggling ? 'not-allowed' : 'pointer', fontSize: '0.7rem', opacity: isToggling ? 0.6 : 1 }}
                        >
                          {isToggling ? 'Saving...' : manager.status}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(manager)} title="Edit profile">
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setDeleteConfirm(manager)}
                            title="Deactivate HR Manager"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
              <h3>No HR managers found</h3>
              <p>Try a different search term or add a new HR manager.</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add HR Manager' : 'Edit HR Manager'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="alert alert-error" style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem' }}>
                  {formError}
                </div>
              )}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Divya Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="hr@grevya.com or name.grevya@gmail.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {availableDepts.map(department => <option key={department} value={department}>{department}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as HRManager['status'] }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Bangalore" />
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input className="input" type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.name.trim() || !form.email.trim()}>
                {submitting ? 'Saving...' : modal === 'add' ? 'Add HR Manager' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deactivate HR Manager</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                Are you sure you want to deactivate <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email})?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                This updates their status to <code>inactive</code> in the database without deleting historical attendance, performance, or leave records.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deactivating...' : 'Deactivate HR Manager'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

