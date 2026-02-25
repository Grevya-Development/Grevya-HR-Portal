import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

const departmentsList = ["Engineering", "Marketing", "Operations", "Finance"];
const rolesList = ["Software Engineer", "Marketing Manager", "Operations Lead", "Financial Analyst", "UX Designer", "DevOps Engineer"];

const users = [
  { name: "Lisa Park", email: "lisa.park@company.com", role: "Admin", active: true },
  { name: "James Wilson", email: "james.wilson@company.com", role: "Manager", active: true },
  { name: "Maria Garcia", email: "maria.garcia@company.com", role: "HR Manager", active: true },
  { name: "Sarah Chen", email: "sarah.chen@company.com", role: "Employee", active: true },
  { name: "David Kim", email: "david.kim@company.com", role: "Manager", active: true },
  { name: "Tom Mitchell", email: "tom.m@company.com", role: "Employee", active: false },
];

const leavePolicies = [
  { type: "Annual Leave", quota: 20, carryForward: true },
  { type: "Sick Leave", quota: 10, carryForward: false },
  { type: "Casual Leave", quota: 5, carryForward: false },
  { type: "Unpaid Leave", quota: 15, carryForward: false },
];

const notificationSettings = [
  { event: "New Hire", email: true, inApp: true },
  { event: "Leave Request", email: true, inApp: true },
  { event: "Leave Approved/Rejected", email: true, inApp: true },
  { event: "Payroll Run", email: false, inApp: true },
  { event: "Performance Review Due", email: true, inApp: true },
  { event: "Announcement Posted", email: false, inApp: true },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(notificationSettings);

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="company">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="departments">Departments & Roles</TabsTrigger>
          <TabsTrigger value="leave">Leave Policies</TabsTrigger>
          <TabsTrigger value="access">User Access</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">Co</div>
                <Button variant="outline" size="sm">Upload Logo</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Company Name</Label><Input defaultValue="Acme Corporation" /></div>
                <div><Label>Email</Label><Input defaultValue="hr@acmecorp.com" /></div>
                <div><Label>Address</Label><Input defaultValue="123 Business Ave, New York, NY 10001" /></div>
                <div><Label>Phone</Label><Input defaultValue="+1 555-0000" /></div>
                <div><Label>Timezone</Label>
                  <Select defaultValue="est"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">Eastern (EST)</SelectItem>
                      <SelectItem value="cst">Central (CST)</SelectItem>
                      <SelectItem value="pst">Pacific (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => toast.success("Company profile updated!")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Departments</CardTitle>
              <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {departmentsList.map(d => (
                  <div key={d} className="flex items-center justify-between p-3 border rounded-md">
                    <span>{d}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Job Roles</CardTitle>
              <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {rolesList.map(r => (
                  <Badge key={r} variant="secondary" className="gap-1 py-1.5 px-3">
                    {r}
                    <button className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Annual Quota (days)</TableHead>
                    <TableHead>Carry Forward</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leavePolicies.map(lp => (
                    <TableRow key={lp.type}>
                      <TableCell className="font-medium">{lp.type}</TableCell>
                      <TableCell>{lp.quota}</TableCell>
                      <TableCell><Switch defaultChecked={lp.carryForward} /></TableCell>
                      <TableCell><Button size="sm" variant="ghost"><Edit2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.email}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select defaultValue={u.role}>
                          <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Admin", "HR Manager", "Manager", "Employee"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Switch defaultChecked={u.active} onCheckedChange={() => toast.success("User status updated!")} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>In-App</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n, i) => (
                    <TableRow key={n.event}>
                      <TableCell className="font-medium">{n.event}</TableCell>
                      <TableCell>
                        <Switch checked={n.email} onCheckedChange={(v) => {
                          const updated = [...notifications];
                          updated[i] = { ...updated[i], email: v };
                          setNotifications(updated);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Switch checked={n.inApp} onCheckedChange={(v) => {
                          const updated = [...notifications];
                          updated[i] = { ...updated[i], inApp: v };
                          setNotifications(updated);
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="mt-4" onClick={() => toast.success("Notification settings saved!")}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
