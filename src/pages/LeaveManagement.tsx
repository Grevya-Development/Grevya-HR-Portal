import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { leaveRequests, employees } from "@/data/sampleData";
import { CalendarDays, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

const statusBadge: Record<string, string> = {
  Pending: "bg-warning/10 text-warning border-warning/20",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const leaveBalances = employees.filter(e => e.status !== "Terminated").slice(0, 10).map(e => ({
  name: e.name,
  annual: { used: Math.floor(Math.random() * 10), total: 20 },
  sick: { used: Math.floor(Math.random() * 5), total: 10 },
  casual: { used: Math.floor(Math.random() * 3), total: 5 },
  unpaid: { used: Math.floor(Math.random() * 2), total: 5 },
}));

const onLeaveThisWeek = ["Aisha Patel", "Emily Thompson"];

export default function LeaveManagement() {
  const [requests, setRequests] = useState(leaveRequests);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showApply, setShowApply] = useState(false);

  const filtered = requests.filter(r => statusFilter === "all" || r.status === statusFilter);

  const handleAction = (id: string, action: "Approved" | "Rejected") => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    toast.success(`Leave ${action.toLowerCase()} successfully ✓`);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <Button className="gap-2" onClick={() => setShowApply(true)}>
          <Plus className="h-4 w-4" /> Apply for Leave
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Leave Requests</TabsTrigger>
              <TabsTrigger value="balances">Leave Balances</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4 mt-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell>{r.from}</TableCell>
                        <TableCell>{r.to}</TableCell>
                        <TableCell>{r.days}</TableCell>
                        <TableCell><Badge variant="outline" className={statusBadge[r.status]}>{r.status}</Badge></TableCell>
                        <TableCell>
                          {r.status === "Pending" && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => handleAction(r.id, "Approved")}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleAction(r.id, "Rejected")}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="balances" className="mt-4 space-y-4">
              {leaveBalances.map(lb => (
                <Card key={lb.name}>
                  <CardContent className="p-4">
                    <p className="font-medium mb-3">{lb.name}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {(["annual", "sick", "casual", "unpaid"] as const).map(type => (
                        <div key={type}>
                          <p className="text-xs text-muted-foreground capitalize mb-1">{type} ({lb[type].used}/{lb[type].total})</p>
                          <Progress value={(lb[type].used / lb[type].total) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Calendar Widget */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" />On Leave This Week</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {onLeaveThisWeek.map(name => (
              <div key={name} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  {name.split(" ").map(n => n[0]).join("")}
                </div>
                {name}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Apply for Leave Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Leave Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" /></div>
              <div><Label>End Date</Label><Input type="date" /></div>
            </div>
            <div><Label>Reason</Label><Textarea placeholder="Reason for leave..." /></div>
            <p className="text-sm text-muted-foreground">Available Annual Leave: 15 days</p>
            <Button className="w-full" onClick={() => { setShowApply(false); toast.success("Leave request submitted!"); }}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
