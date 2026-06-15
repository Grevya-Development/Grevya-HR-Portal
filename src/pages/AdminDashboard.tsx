import StatCard from '../components/ui/StatCard';
import { useStore } from '../services/store';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Building2, Calendar, CheckCircle2, Clock, ShieldCheck, UserCog, Users } from 'lucide-react';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'];

export default function AdminDashboard() {
  const { employees, hrManagers, leaveRequests } = useStore();

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const departments = Array.from(new Set(employees.map(e => e.department)));
  const avgAttendance = Math.round(employees.reduce((sum, e) => sum + e.attendance, 0) / Math.max(employees.length, 1));
  const activeHrManagers = hrManagers.filter(h => h.status === 'active').length;

  const growth = [
    { month: 'Jan', employees: 34, hr: 3 },
    { month: 'Feb', employees: 39, hr: 3 },
    { month: 'Mar', employees: 43, hr: 4 },
    { month: 'Apr', employees: 47, hr: 4 },
    { month: 'May', employees: 51, hr: 5 },
    { month: 'Jun', employees: employees.length, hr: hrManagers.length },
  ];

  const departmentDistribution = departments.map(dept => ({
    name: dept,
    value: employees.filter(employee => employee.department === dept).length,
  }));

  const leaveStats = ['pending', 'approved', 'rejected'].map(status => ({
    status,
    count: leaveRequests.filter(request => request.status === status).length,
  }));

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Total Employees" value={employees.length} change={8.3} icon={<Users size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="HR Managers" value={hrManagers.length} change={activeHrManagers > 0 ? 4.2 : undefined} icon={<UserCog size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Active Employees" value={activeEmployees} icon={<CheckCircle2 size={20} />} iconBg="#f0fdf4" iconColor="#15803d" />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={<Calendar size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
      </div>

      <div className="grid-4 mb-6">
        <StatCard label="Departments" value={departments.length} icon={<Building2 size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
        <StatCard label="Attendance Overview" value={avgAttendance} suffix="%" icon={<Clock size={20} />} iconBg="#e0f2fe" iconColor="#0369a1" />
        <StatCard label="Active HR Managers" value={activeHrManagers} icon={<ShieldCheck size={20} />} iconBg="#ccfbf1" iconColor="#0f766e" />
        <StatCard label="Inactive Accounts" value={employees.filter(e => e.status === 'inactive').length + hrManagers.filter(h => h.status === 'inactive').length} icon={<Users size={20} />} iconBg="#f1f5f9" iconColor="#64748b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 20, marginBottom: 20 }}>
        <div className="card p-6">
          <div className="section-header">
            <h3>Employee Growth</h3>
            <span className="badge badge-green">Admin view</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="adminEmployees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="employees" stroke="#22c55e" strokeWidth={2} fill="url(#adminEmployees)" />
              <Area type="monotone" dataKey="hr" stroke="#3b82f6" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="section-header">
            <h3>Department Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={departmentDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {departmentDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card p-6">
          <div className="section-header">
            <h3>Leave Statistics</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leaveStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="section-header">
            <h3>Admin Control Center</h3>
            <span className="badge badge-blue">Local demo</span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              ['Manage HR Managers', 'Add, edit, delete and activate HR managers.'],
              ['Manage Employees', 'Control employee records and employment status.'],
              ['Approve Leave', 'Review pending requests across the organization.'],
              ['Monitor Attendance', 'Scan monthly attendance health by department.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ padding: 14, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
