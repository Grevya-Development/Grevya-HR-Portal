import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, CalendarDays, BarChart3, Plus, FileText, CheckCircle, DollarSign } from "lucide-react";
import { currentUser, recentActivity, upcomingEvents, departmentHeadcount, employeeStatusBreakdown, employees, jobPostings, leaveRequests, reviewCycles } from "@/data/sampleData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";

const statCards = [
  { label: "Total Employees", value: employees.filter(e => e.status !== "Terminated").length, icon: Users, color: "text-primary" },
  { label: "Open Positions", value: jobPostings.filter(j => j.status === "Open").length, icon: Briefcase, color: "text-chart-4" },
  { label: "Pending Leave Requests", value: leaveRequests.filter(l => l.status === "Pending").length, icon: CalendarDays, color: "text-warning" },
  { label: "Upcoming Reviews", value: reviewCycles.filter(r => r.status === "Ongoing").length, icon: BarChart3, color: "text-success" },
];

const quickActions = [
  { label: "Add Employee", icon: Plus, path: "/employees" },
  { label: "Post Job", icon: FileText, path: "/recruitment" },
  { label: "Approve Leaves", icon: CheckCircle, path: "/leave" },
  { label: "Run Payroll", icon: DollarSign, path: "/payroll" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="rounded-lg bg-primary p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold">Good morning, {currentUser.name} 👋</h1>
        <p className="mt-1 text-primary-foreground/80">Here's what's happening today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-muted p-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((a) => (
          <Button key={a.label} variant="outline" className="gap-2" onClick={() => navigate(a.path)}>
            <a.icon className="h-4 w-4" /> {a.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Headcount Chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Headcount by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentHeadcount}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Donut */}
        <Card>
          <CardHeader><CardTitle className="text-base">Employee Status</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={employeeStatusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {employeeStatusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {employeeStatusBreakdown.map((e) => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.fill }} />
                  {e.name} ({e.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p>{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span>{e.text}</span>
                <Badge variant="secondary" className="text-xs">{e.date}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
