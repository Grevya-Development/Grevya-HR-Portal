import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Users, ChevronDown, ChevronRight, Building2, Edit2, X, Check, AlertCircle, AlertTriangle, Shield, ArrowRight } from 'lucide-react';
import { Employee, UserRole } from '../types';
import { toast } from '../components/ui/Toast';

export type OrgNode = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  level: number;
  employee?: Employee;
  children?: OrgNode[];
};

export function wouldCreateReportingCycle(
  employeeId: string,
  candidateManagerId: string | null | undefined,
  allEmployees: Employee[]
): boolean {
  if (!candidateManagerId) return false;
  if (employeeId === candidateManagerId) return true;

  let currentId: string | undefined = candidateManagerId;
  const visited = new Set<string>([employeeId]);

  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    const mgr = allEmployees.find(e => e.id === currentId);
    currentId = mgr?.managerId;
  }
  return false;
}

export function buildDynamicOrgTree(employees: Employee[]): OrgNode {
  if (employees.length === 0) {
    return {
      id: 'root',
      name: 'Grevya Leadership',
      position: 'Executive Office',
      department: 'Executive',
      avatar: 'GL',
      level: 0,
      children: [],
    };
  }

  // 1. Identify root: super_admin or admin or first active employee with no manager
  const rootEmp = employees.find(e => e.role === 'super_admin')
    || employees.find(e => e.role === 'admin' && !e.managerId)
    || employees.find(e => !e.managerId)
    || employees[0];

  const visited = new Set<string>();

  function buildSubtree(emp: Employee, level: number): OrgNode {
    visited.add(emp.id);
    const directReports = employees.filter(e => e.managerId === emp.id && !visited.has(e.id));
    return {
      id: emp.id,
      name: emp.name,
      position: emp.position || 'Team Member',
      department: emp.department || 'General',
      avatar: emp.avatar || emp.name.slice(0, 2).toUpperCase(),
      level,
      employee: emp,
      children: directReports.map(r => buildSubtree(r, level + 1)),
    };
  }

  const rootNode = buildSubtree(rootEmp, 0);

  // Any unassigned employees not yet in tree: place under root at level 1
  const unassigned = employees.filter(e => !visited.has(e.id));
  if (unassigned.length > 0) {
    rootNode.children = [
      ...(rootNode.children || []),
      ...unassigned.map(e => buildSubtree(e, 1)),
    ];
  }

  return rootNode;
}

const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; shadow: string }> = {
  0: { bg: 'linear-gradient(135deg, #0f2b18, #1a4a28)', border: '#22c55e', text: '#4ade80', shadow: '0 8px 32px rgba(34,197,94,0.3)' },
  1: { bg: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', border: '#3b82f6', text: '#60a5fa', shadow: '0 4px 16px rgba(59,130,246,0.2)' },
  2: { bg: 'var(--bg-card)', border: 'var(--border)', text: 'var(--text-secondary)', shadow: 'var(--shadow-sm)' },
};

function OrgCard({
  node,
  isLast,
  isHRorAdmin,
  onSelectEmployee,
}: {
  node: OrgNode;
  isLast: boolean;
  isHRorAdmin: boolean;
  onSelectEmployee: (emp: Employee) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const c = LEVEL_COLORS[Math.min(node.level, 2)];
  const isRoot = node.level === 0;
  const isMid = node.level === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Card */}
      <div
        style={{
          background: c.bg,
          border: `1.5px solid ${c.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          boxShadow: c.shadow,
          minWidth: isRoot ? 210 : isMid ? 175 : 150,
          maxWidth: isRoot ? 240 : 200,
          textAlign: 'center',
          position: 'relative',
          cursor: isHRorAdmin && node.employee ? 'pointer' : hasChildren ? 'pointer' : 'default',
          transition: 'all 200ms',
          userSelect: 'none',
        }}
        onClick={() => {
          if (isHRorAdmin && node.employee) {
            onSelectEmployee(node.employee);
          } else if (hasChildren) {
            setExpanded(v => !v);
          }
        }}
      >
        {isHRorAdmin && node.employee && (
          <div
            title="Edit Position & Hierarchy"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isRoot || isMid ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Edit2 size={12} />
          </div>
        )}

        <div
          className="avatar"
          style={{
            margin: '0 auto 10px',
            width: isRoot ? 52 : isMid ? 40 : 34,
            height: isRoot ? 52 : isMid ? 40 : 34,
            fontSize: isRoot ? '1.1rem' : isMid ? '0.875rem' : '0.75rem',
            borderRadius: isRoot ? 14 : 10,
            background: isRoot
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : isMid
              ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
              : 'linear-gradient(135deg, #6ee7b7, #22c55e)',
          }}
        >
          {node.avatar}
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: isRoot ? '0.9rem' : '0.82rem',
            color: isRoot || isMid ? 'white' : 'var(--text-primary)',
            marginBottom: 2,
            lineHeight: 1.3,
          }}
        >
          {node.name}
        </div>

        <div
          style={{
            fontSize: '0.72rem',
            color: isRoot ? '#4ade80' : isMid ? '#93c5fd' : 'var(--text-muted)',
            lineHeight: 1.3,
            fontWeight: 500,
          }}
        >
          {node.position}
        </div>

        <div
          style={{
            fontSize: '0.68rem',
            color: isRoot ? '#86efac' : isMid ? '#bfdbfe' : 'var(--text-secondary)',
            marginTop: 4,
            opacity: 0.85,
          }}
        >
          {node.department}
        </div>

        {hasChildren && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(v => !v);
            }}
            title={`${node.children!.length} direct reports (click to ${expanded ? 'collapse' : 'expand'})`}
            style={{
              position: 'absolute',
              bottom: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              height: 22,
              padding: '0 8px',
              borderRadius: 11,
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--primary)',
              zIndex: 2,
              boxShadow: 'var(--shadow-sm)',
              fontSize: '0.65rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>{node.children!.length}</span>
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </div>
        )}
      </div>

      {/* Connector + children */}
      {hasChildren && expanded && (
        <>
          {/* Vertical line down */}
          <div style={{ width: 2, height: 28, background: 'var(--border)', marginTop: 12 }} />
          {/* Horizontal bar */}
          {node.children!.length > 1 && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `calc(100% - 80px)`,
                  height: 2,
                  background: 'var(--border)',
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingTop: 0 }}>
            {node.children!.map((child, idx) => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 20, background: 'var(--border)' }} />
                <OrgCard
                  node={child}
                  isLast={idx === node.children!.length - 1}
                  isHRorAdmin={isHRorAdmin}
                  onSelectEmployee={onSelectEmployee}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { currentUser, employees, departments, updateOrgPosition } = useStore();

  const isHRorAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'hr_manager';
  const isSuperAdminOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // Selected employee for editing
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const deptCounts = departments.map(d => {
    const dEmps = employees.filter(e => e.department.toLowerCase() === d.name.toLowerCase() || e.departmentId === d.id);
    const avgPerf = dEmps.length > 0 ? Math.round(dEmps.reduce((acc, e) => acc + (e.performance || 80), 0) / dEmps.length) : 85;
    return {
      name: d.name,
      count: dEmps.length,
      avg: avgPerf,
    };
  }).filter(d => d.count > 0);

  const dynamicTree = buildDynamicOrgTree(employees);

  const deptColors: Record<string, string> = {
    Engineering: '#3b82f6', Sales: '#22c55e', Design: '#8b5cf6',
    Content: '#f59e0b', HR: '#ec4899', Finance: '#06b6d4',
    Marketing: '#f97316', Operations: '#94a3b8', Administration: '#10b981',
    Developer: '#6366f1',
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setEditJobTitle(emp.position || '');
    setEditDepartmentId(emp.departmentId || '');
    setEditManagerId(emp.managerId || '');
    setEditRole((emp.role as UserRole) || 'employee');
    setErrorMsg('');
  };

  const handleCloseEdit = () => {
    if (submitting) return;
    setSelectedEmp(null);
    setErrorMsg('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    // 1. Validate self-reporting
    if (editManagerId && editManagerId === selectedEmp.id) {
      setErrorMsg('Self-reporting blocked: An employee cannot be their own reporting manager.');
      return;
    }

    // 2. Validate reporting cycle
    if (editManagerId && wouldCreateReportingCycle(selectedEmp.id, editManagerId, employees)) {
      setErrorMsg('Circular hierarchy blocked: This assignment creates a circular reporting loop.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const updates: {
      jobTitle?: string;
      departmentId?: string | null;
      managerId?: string | null;
      role?: UserRole;
    } = {
      jobTitle: editJobTitle.trim() || undefined,
      departmentId: editDepartmentId || null,
      managerId: editManagerId || null,
    };

    if (isSuperAdminOrAdmin && editRole !== selectedEmp.role) {
      updates.role = editRole;
    }

    const res = await updateOrgPosition(selectedEmp.id, updates);
    setSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update organizational position.');
    } else {
      toast.success('Organization updated', `${selectedEmp.name}'s position and reporting line saved to database.`);
      setSelectedEmp(null);
    }
  };

  // Eligible managers excluding self and anyone who would create a circular reference
  const eligibleManagers = selectedEmp
    ? employees.filter(e => e.id !== selectedEmp.id && !wouldCreateReportingCycle(selectedEmp.id, e.id, employees))
    : [];

  return (
    <div className="animate-fade">
      {/* Header Info Banner for HR/Admin */}
      {isHRorAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={18} color="#3b82f6" />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <strong>Interactive Organizational Management:</strong> Click any employee card to edit their designation, department, or reporting manager.
            </div>
          </div>
          <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
            HR / Admin Mode Active
          </span>
        </div>
      )}

      {/* Dept summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {deptCounts.map(d => (
          <div
            key={d.name}
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderLeft: `3px solid ${deptColors[d.name] || '#94a3b8'}`,
            }}
          >
            <Building2 size={16} color={deptColors[d.name] || '#94a3b8'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{d.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {d.count} member{d.count !== 1 ? 's' : ''} · {d.avg}% perf
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Org tree */}
      <div className="card" style={{ padding: '40px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 900 }}>
          <OrgCard
            node={dynamicTree}
            isLast={true}
            isHRorAdmin={Boolean(isHRorAdmin)}
            onSelectEmployee={handleOpenEdit}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'Executive (C-Level / Root)', color: '#22c55e' },
          { label: 'Manager / Direct Report', color: '#3b82f6' },
          { label: 'Individual Contributor', color: 'var(--border)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── EDIT ORGANIZATIONAL POSITION MODAL ───────────────────────── */}
      {selectedEmp && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', color: 'white', fontWeight: 700 }}>
                  {selectedEmp.avatar || selectedEmp.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Edit Position: {selectedEmp.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedEmp.email}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseEdit} disabled={submitting}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {errorMsg && (
                  <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
                    <AlertCircle size={15} /> {errorMsg}
                  </div>
                )}

                {/* Concept Distinction Notice */}
                <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Architecture Note:</strong> Job Title (Designation) describes an employee's professional role. Department groups teams. Reporting Manager defines hierarchy. Application Role controls software permissions.
                </div>

                {/* 1. Designation / Job Title */}
                <div className="form-group">
                  <label className="form-label">
                    Designation / Job Title *
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>(Public title on org chart)</span>
                  </label>
                  <input
                    className="input"
                    value={editJobTitle}
                    onChange={e => setEditJobTitle(e.target.value)}
                    placeholder="e.g. Lead Frontend Engineer"
                    required
                  />
                </div>

                {/* 2. Department */}
                <div className="form-group">
                  <label className="form-label">Assigned Department *</label>
                  <select
                    className="select"
                    value={editDepartmentId}
                    onChange={e => setEditDepartmentId(e.target.value)}
                    required
                  >
                    <option value="">Select Department...</option>
                    {departments.filter(d => d.isActive !== false).map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `(${dept.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Reporting Manager */}
                <div className="form-group">
                  <label className="form-label">
                    Reporting Manager
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>(Defines position in hierarchy tree)</span>
                  </label>
                  <select
                    className="select"
                    value={editManagerId}
                    onChange={e => setEditManagerId(e.target.value)}
                  >
                    <option value="">None (Top-Level Executive / Direct to Board)</option>
                    {eligibleManagers.map(mgr => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.name} — {mgr.position} ({mgr.department})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Note: Self-reporting and circular reporting relationships are strictly blocked by validation.
                  </p>
                </div>

                {/* 4. Application Role (Admin Only) */}
                {isSuperAdminOrAdmin ? (
                  <div className="form-group">
                    <label className="form-label">
                      Application Permission Role
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>(Controls system security rights)</span>
                    </label>
                    <select
                      className="select"
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as UserRole)}
                    >
                      <option value="employee">Employee (Standard access)</option>
                      <option value="manager">Manager (Team oversight)</option>
                      <option value="hr_manager">HR Manager (Full HRMS access)</option>
                      <option value="admin">Administrator (Platform admin)</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin (Unrestricted)</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Application Role:</span>
                    <span className="badge badge-gray font-mono">{selectedEmp.role}</span>
                  </div>
                )}

                {/* Change Review Summary */}
                <div style={{ padding: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Review Changes Before Saving:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
                    {editJobTitle !== selectedEmp.position && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Title:</span>
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{selectedEmp.position || 'None'}</span>
                        <ArrowRight size={12} />
                        <strong style={{ color: 'var(--primary)' }}>{editJobTitle}</strong>
                      </div>
                    )}
                    {editDepartmentId !== (selectedEmp.departmentId || '') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Department:</span>
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{selectedEmp.department || 'None'}</span>
                        <ArrowRight size={12} />
                        <strong style={{ color: 'var(--primary)' }}>
                          {departments.find(d => d.id === editDepartmentId)?.name || 'None'}
                        </strong>
                      </div>
                    )}
                    {editManagerId !== (selectedEmp.managerId || '') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Manager:</span>
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                          {employees.find(e => e.id === selectedEmp.managerId)?.name || 'None'}
                        </span>
                        <ArrowRight size={12} />
                        <strong style={{ color: 'var(--primary)' }}>
                          {employees.find(e => e.id === editManagerId)?.name || 'None (Top-Level)'}
                        </strong>
                      </div>
                    )}
                    {isSuperAdminOrAdmin && editRole !== selectedEmp.role && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Role:</span>
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{selectedEmp.role}</span>
                        <ArrowRight size={12} />
                        <strong style={{ color: '#dc2626' }}>{editRole}</strong>
                      </div>
                    )}
                    {editJobTitle === selectedEmp.position &&
                     editDepartmentId === (selectedEmp.departmentId || '') &&
                     editManagerId === (selectedEmp.managerId || '') &&
                     editRole === selectedEmp.role && (
                      <div style={{ color: 'var(--text-muted)' }}>No modifications made yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving to Database...' : 'Save Organizational Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
