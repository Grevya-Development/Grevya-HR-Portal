import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Department, Employee } from '../types';
import {
  Building2, Search, Plus, Edit2, Users, CheckCircle2, AlertCircle,
  X, ArrowRightLeft, UserCheck, Shield, ToggleLeft, ToggleRight,
  Briefcase, Filter, ChevronRight, Trash2, AlertTriangle
} from 'lucide-react';
import { toast } from '../components/ui/Toast';

export default function DepartmentsPage() {
  const {
    currentUser,
    departments,
    employees,
    departmentsLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    reassignDepartment,
    toggleDepartmentStatus,
  } = useStore();

  const isHRorAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'hr_manager';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [rosterDept, setRosterDept] = useState<Department | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [deleteDeptModal, setDeleteDeptModal] = useState<(Department & { employeeCount: number; assignedEmployees: Employee[] }) | null>(null);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    description: '',
    headId: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    description: '',
    headId: '',
    isActive: true,
  });
  const [reassignForm, setReassignForm] = useState({
    employeeId: '',
    targetDeptId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Eligible department heads (managers, admins, hr)
  const eligibleHeads = employees.filter(
    e => e.status === 'active' && ['manager', 'hr_manager', 'admin', 'super_admin'].includes(e.role || '')
  );

  // Derived employee counts per department
  const deptsWithCounts = departments.map(d => {
    const assignedEmps = employees.filter(e => e.departmentId === d.id || e.department?.toLowerCase() === d.name.toLowerCase());
    return {
      ...d,
      employeeCount: assignedEmps.length,
      assignedEmployees: assignedEmps,
    };
  });

  const filteredDepts = deptsWithCounts.filter(d => {
    if (statusFilter === 'active' && d.isActive === false) return false;
    if (statusFilter === 'inactive' && d.isActive !== false) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchCode = (d.code || '').toLowerCase().includes(q);
      const matchHead = (d.headName || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchHead) return false;
    }
    return true;
  });

  const totalEmployeesCount = employees.length;
  const activeDeptsCount = departments.filter(d => d.isActive !== false).length;
  const deptsWithHeadCount = departments.filter(d => Boolean(d.headId || d.headName)).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    const res = await createDepartment({
      name: createForm.name.trim(),
      code: createForm.code.trim() || undefined,
      description: createForm.description.trim() || undefined,
      headId: createForm.headId || null,
    });

    setSubmitting(false);
    if (!res.success) {
      setFormError(res.error || 'Failed to create department');
    } else {
      toast.success('Department created', `${createForm.name} has been added.`);
      setCreateForm({ name: '', code: '', description: '', headId: '' });
      setCreateModalOpen(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept || !editForm.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    const res = await updateDepartment(editDept.id, {
      name: editForm.name.trim(),
      code: editForm.code.trim() || undefined,
      description: editForm.description.trim() || undefined,
      headId: editForm.headId || null,
      isActive: editForm.isActive,
    });

    setSubmitting(false);
    if (!res.success) {
      setFormError(res.error || 'Failed to update department');
    } else {
      toast.success('Department updated', `${editForm.name} details saved.`);
      setEditDept(null);
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    const newStatus = dept.isActive === false ? true : false;
    const res = await toggleDepartmentStatus(dept.id, newStatus);
    if (!res.success) {
      toast.error('Action failed', res.error || 'Could not update department status');
    } else {
      toast.info('Status updated', `${dept.name} is now ${newStatus ? 'Active' : 'Inactive'}.`);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignForm.employeeId || !reassignForm.targetDeptId) {
      setFormError('Please select both an employee and a target department.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    const target = departments.find(d => d.id === reassignForm.targetDeptId);
    const emp = employees.find(e => e.id === reassignForm.employeeId);

    const res = await reassignDepartment(reassignForm.employeeId, reassignForm.targetDeptId);
    setSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to reassign department');
    } else {
      toast.success('Department reassigned', `${emp?.name || 'Employee'} reassigned to ${target?.name || 'Department'}.`);
      setReassignForm({ employeeId: '', targetDeptId: '' });
      setReassignModalOpen(false);
    }
  };

  const openEditModal = (d: Department) => {
    setEditDept(d);
    setEditForm({
      name: d.name,
      code: d.code || '',
      description: d.description || '',
      headId: d.headId || '',
      isActive: d.isActive !== false,
    });
    setFormError('');
  };

  const openDeleteModal = (dept: (Department & { employeeCount: number; assignedEmployees: Employee[] })) => {
    setDeleteDeptModal(dept);
    setDeleteConfirmChecked(false);
    setDeleteError('');
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDeptModal) return;
    setDeleteSubmitting(true);
    setDeleteError('');

    const res = await deleteDepartment(deleteDeptModal.id);
    setDeleteSubmitting(false);

    if (!res.success) {
      setDeleteError(res.error || 'Failed to delete department.');
    } else {
      toast.success('Department deleted', `${deleteDeptModal.name} has been removed.`);
      setDeleteDeptModal(null);
    }
  };

  const handleDeactivateFromDeleteModal = async () => {
    if (!deleteDeptModal) return;
    setDeleteSubmitting(true);
    setDeleteError('');

    const res = await toggleDepartmentStatus(deleteDeptModal.id, false);
    setDeleteSubmitting(false);

    if (!res.success) {
      setDeleteError(res.error || 'Failed to deactivate department.');
    } else {
      toast.info('Department deactivated', `${deleteDeptModal.name} is now inactive.`);
      setDeleteDeptModal(null);
    }
  };

  return (
    <div className="animate-fade">
      {/* Metrics Row */}
      <div className="grid-4 mb-6">
        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Departments</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{departments.length}</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Departments</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeDeptsCount}</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(168,85,247,0.12)', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Staff Assigned</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{totalEmployeesCount}</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Heads Assigned</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{deptsWithHeadCount} / {departments.length}</div>
          </div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="card p-4 mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
              <Search size={16} />
              <input
                className="input search-input"
                placeholder="Search departments by name, code, or head..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{ width: 140 }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {isHRorAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setReassignModalOpen(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowRightLeft size={15} />
                Reassign Employee
              </button>

              <button
                onClick={() => {
                  setCreateForm({ name: '', code: '', description: '', headId: '' });
                  setFormError('');
                  setCreateModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} />
                New Department
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredDepts.map(dept => {
          const isActive = dept.isActive !== false;
          return (
            <div
              key={dept.id}
              className="card p-5"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${isActive ? 'var(--primary)' : '#94a3b8'}`,
                opacity: isActive ? 1 : 0.75,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{dept.name}</h3>
                      {dept.code && (
                        <span className="badge badge-gray" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                          {dept.code}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, minHeight: 36 }}>
                      {dept.description || 'No description provided.'}
                    </p>
                  </div>
                  <span className={`badge ${isActive ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Department Head:</span>
                    <span style={{ fontWeight: 600 }}>{dept.headName || 'Not Assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Staff:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dept.employeeCount} employee(s)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setRosterDept(dept)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Users size={14} /> View Roster ({dept.employeeCount})
                </button>

                {isHRorAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleToggleStatus(dept)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title={isActive ? 'Deactivate Department' : 'Activate Department'}
                    >
                      {isActive ? <ToggleRight size={18} color="#16a34a" /> : <ToggleLeft size={18} color="#94a3b8" />}
                    </button>

                    <button
                      onClick={() => openEditModal(dept)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Edit Department"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => openDeleteModal(dept)}
                      className="btn btn-ghost btn-icon btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete Department"
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredDepts.length === 0 && !departmentsLoading && (
          <div className="card p-8 text-center" style={{ gridColumn: '1 / -1' }}>
            <Building2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No departments match your search</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try adjusting your search criteria or create a new department.</p>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ───────────────────────── */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Create Department</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
                    <AlertCircle size={15} /> {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input
                    className="input"
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Artificial Intelligence"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department Code (Short)</label>
                  <input
                    className="input"
                    value={createForm.code}
                    onChange={e => setCreateForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. AI"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department Head / Manager</label>
                  <select
                    className="select"
                    value={createForm.headId}
                    onChange={e => setCreateForm(f => ({ ...f, headId: e.target.value }))}
                  >
                    <option value="">None / Unassigned</option>
                    {eligibleHeads.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.position})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={createForm.description}
                    onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Responsibilities, scope, and objectives of this department..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !createForm.name.trim()}>
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ───────────────────────── */}
      {editDept && (
        <div className="modal-overlay" onClick={() => setEditDept(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Edit Department</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditDept(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
                    <AlertCircle size={15} /> {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input
                    className="input"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department Code</label>
                  <input
                    className="input"
                    value={editForm.code}
                    onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department Head / Manager</label>
                  <select
                    className="select"
                    value={editForm.headId}
                    onChange={e => setEditForm(f => ({ ...f, headId: e.target.value }))}
                  >
                    <option value="">None / Unassigned</option>
                    {eligibleHeads.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.position})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="isActiveDept"
                    checked={editForm.isActive}
                    onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="isActiveDept" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Active Department Status
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditDept(null)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !editForm.name.trim()}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ROSTER MODAL ───────────────────────── */}
      {rosterDept && (
        <div className="modal-overlay" onClick={() => setRosterDept(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{rosterDept.name} Roster</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {deptsWithCounts.find(d => d.id === rosterDept.id)?.employeeCount || 0} assigned employee(s)
                </span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setRosterDept(null)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(deptsWithCounts.find(d => d.id === rosterDept.id)?.assignedEmployees || []).map((emp: Employee) => (
                  <div
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg)',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{emp.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{emp.position || emp.role} · {emp.email}</div>
                      </div>
                    </div>
                    <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                      {emp.status}
                    </span>
                  </div>
                ))}

                {(deptsWithCounts.find(d => d.id === rosterDept.id)?.assignedEmployees || []).length === 0 && (
                  <div className="empty-state py-6 text-center">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employees currently assigned to this department.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRosterDept(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REASSIGN MODAL ───────────────────────── */}
      {reassignModalOpen && (
        <div className="modal-overlay" onClick={() => setReassignModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Reassign Employee Department</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setReassignModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleReassign}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
                    <AlertCircle size={15} /> {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select
                    className="select"
                    value={reassignForm.employeeId}
                    onChange={e => setReassignForm(f => ({ ...f, employeeId: e.target.value }))}
                    required
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} (Current: {emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Department *</label>
                  <select
                    className="select"
                    value={reassignForm.targetDeptId}
                    onChange={e => setReassignForm(f => ({ ...f, targetDeptId: e.target.value }))}
                    required
                  >
                    <option value="">Choose target department...</option>
                    {departments.filter(d => d.isActive !== false).map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReassignModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !reassignForm.employeeId || !reassignForm.targetDeptId}>
                  {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────── */}
      {deleteDeptModal && (
        <div className="modal-overlay" onClick={() => !deleteSubmitting && setDeleteDeptModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
                <AlertTriangle size={20} color="#dc2626" /> Delete Department: {deleteDeptModal.name}
              </h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => !deleteSubmitting && setDeleteDeptModal(null)}
                disabled={deleteSubmitting}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {deleteError && (
                <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
                  <AlertCircle size={15} /> {deleteError}
                </div>
              )}

              {/* Department Details Card */}
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department Code:</span>
                  <span style={{ fontWeight: 600 }}>{deleteDeptModal.code || 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department Head:</span>
                  <span style={{ fontWeight: 600 }}>{deleteDeptModal.headName || 'Not Assigned'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Staff:</span>
                  <span style={{ fontWeight: 700, color: deleteDeptModal.employeeCount > 0 ? '#ef4444' : '#16a34a' }}>
                    {deleteDeptModal.employeeCount} active employee(s)
                  </span>
                </div>
              </div>

              {/* Blocking Condition: Employees Assigned */}
              {deleteDeptModal.employeeCount > 0 ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold mb-1">Deletion Blocked: Active Staff Assigned</strong>
                      Under company data protection rules, departments with active employees cannot be deleted. You must first reassign all assigned staff to another department before deletion can proceed.
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-2.5 border border-red-100 dark:border-red-950/50">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Assigned Employees:</div>
                    <ul className="text-xs space-y-1">
                      {deleteDeptModal.assignedEmployees.map(emp => (
                        <li key={emp.id} className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                          <span>{emp.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{emp.position}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const deptToReassign = deleteDeptModal;
                        setDeleteDeptModal(null);
                        setReassignModalOpen(true);
                        if (deptToReassign.assignedEmployees[0]) {
                          setReassignForm({
                            employeeId: deptToReassign.assignedEmployees[0].id,
                            targetDeptId: '',
                          });
                        }
                      }}
                      className="flex-1 btn btn-sm btn-primary"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <ArrowRightLeft size={14} /> Reassign Staff First
                    </button>
                    <button
                      type="button"
                      onClick={handleDeactivateFromDeleteModal}
                      disabled={deleteSubmitting}
                      className="flex-1 btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Deactivate Instead
                    </button>
                  </div>
                </div>
              ) : (
                /* Unassigned Department: Safe to delete or archive */
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Permanent Deletion Check:</strong>
                        <p className="mt-1">
                          This department currently has 0 active employees. If this department has historical records in attendance, leave, or payroll, the database foreign keys will safely prevent hard deletion and recommend deactivation instead.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <input
                      type="checkbox"
                      checked={deleteConfirmChecked}
                      onChange={e => setDeleteConfirmChecked(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>
                      I understand that permanently deleting this department cannot be undone. If historical records exist, deactivation will be used to preserve company audit integrity.
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteDeptModal(null)}
                disabled={deleteSubmitting}
              >
                Cancel
              </button>
              {deleteDeptModal.employeeCount === 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDeactivateFromDeleteModal}
                    disabled={deleteSubmitting}
                  >
                    Deactivate (Safe)
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteDepartment}
                    disabled={deleteSubmitting || !deleteConfirmChecked}
                    style={{ background: '#dc2626', color: 'white' }}
                  >
                    {deleteSubmitting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
