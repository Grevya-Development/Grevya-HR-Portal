import React, { useState } from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useStore } from '../services/store';
import { HRManager } from '../types';
import { toast } from '../components/ui/Toast';

const DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Design', 'Content', 'Finance', 'Marketing', 'Operations'];

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
  const { hrManagers, employees, addHRManager, updateHRManager, deleteHRManager, toggleHRManagerStatus } = useStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<HRManager | null>(null);
  const [form, setForm] = useState<Omit<HRManager, 'id'>>(EMPTY_MANAGER);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = hrManagers.filter(manager =>
    `${manager.name} ${manager.email} ${manager.department}`.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setForm(EMPTY_MANAGER);
    setModal('add');
  };

  const openEdit = (manager: HRManager) => {
    setEditing(manager);
    setForm({ ...manager });
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    const avatar = form.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    if (modal === 'add') {
      await addHRManager({ ...form, avatar });
      toast.success('HR Manager added', `${form.name} can now manage assigned employees.`);
    } else if (editing) {
      await updateHRManager(editing.id, { ...form, avatar });
      toast.success('HR Manager updated', `${form.name}'s profile has been saved.`);
    }
    closeModal();
  };

  const statusColor = { active: 'badge-green', inactive: 'badge-gray' };

  return (
    <div className="animate-fade">
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
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} results</span>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add HR Manager</button>
      </div>

      <div className="card">
        <div className="table-wrap">
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
                    <td style={{ fontSize: '0.8rem' }}>{manager.location}</td>
                    <td>
                      <button
                        className={`badge ${statusColor[manager.status]}`}
                        onClick={async () => {
                          await toggleHRManagerStatus(manager.id);
                          toast.info('Status updated', `${manager.name} is now ${manager.status === 'active' ? 'inactive' : 'active'}.`);
                        }}
                        style={{ border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        {manager.status}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(manager)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(manager.id)} title="Delete" style={{ color: '#dc2626' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={32} />
              <h3>No HR managers found</h3>
              <p>Try a different search term.</p>
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
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Divya Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="hr@grevya.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {DEPARTMENTS.map(department => <option key={department}>{department}</option>)}
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
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name || !form.email}>
                {modal === 'add' ? 'Add HR Manager' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>Deleting this HR manager will reassign their employees to the first available HR manager.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  await deleteHRManager(deleteConfirm);
                  toast.error('HR Manager deleted', 'Assigned employees were reassigned automatically.');
                  setDeleteConfirm(null);
                }}
              >
                Delete HR Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
