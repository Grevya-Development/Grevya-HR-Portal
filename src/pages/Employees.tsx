import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { employees, Employee } from "@/data/sampleData";
import { Search, Grid3X3, List, Plus, Mail, Phone, MapPin, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  "On Leave": "bg-warning/10 text-warning border-warning/20",
  Remote: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Terminated: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Employees() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const filtered = employees.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.jobTitle.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter !== "all" && e.department !== deptFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const departments = [...new Set(employees.map(e => e.department))];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Employee Directory</h1>
        <Button className="gap-2" onClick={() => { setShowAddForm(true); setAddStep(1); setShowSuccess(false); }}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="Terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(emp => (
            <Card key={emp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedEmployee(emp)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                    {emp.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{emp.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{emp.jobTitle}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="truncate">{emp.department}</p>
                  <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /><span className="truncate">{emp.email}</span></div>
                  <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{emp.phone}</div>
                </div>
                <Badge variant="outline" className={`mt-3 ${statusColor[emp.status]}`}>{emp.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(emp => (
                <TableRow key={emp.id} className="cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">{emp.avatar}</div>
                      {emp.name}
                    </div>
                  </TableCell>
                  <TableCell>{emp.jobTitle}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{emp.location}</div></TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[emp.status]}>{emp.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Employee Profile Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-medium">{selectedEmployee.avatar}</div>
                  <div>
                    <DialogTitle className="text-xl">{selectedEmployee.name}</DialogTitle>
                    <p className="text-muted-foreground">{selectedEmployee.jobTitle} · {selectedEmployee.department}</p>
                  </div>
                  <Badge variant="outline" className={`ml-auto ${statusColor[selectedEmployee.status]}`}>{selectedEmployee.status}</Badge>
                </div>
              </DialogHeader>
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="leave">Leave History</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><Label className="text-muted-foreground">Email</Label><p>{selectedEmployee.email}</p></div>
                    <div><Label className="text-muted-foreground">Phone</Label><p>{selectedEmployee.phone}</p></div>
                    <div><Label className="text-muted-foreground">Date of Birth</Label><p>{selectedEmployee.dob}</p></div>
                    <div><Label className="text-muted-foreground">Gender</Label><p>{selectedEmployee.gender}</p></div>
                    <div><Label className="text-muted-foreground">Location</Label><p>{selectedEmployee.location}</p></div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Emergency Contact</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><Label className="text-muted-foreground">Name</Label><p>{selectedEmployee.emergencyContact.name}</p></div>
                      <div><Label className="text-muted-foreground">Phone</Label><p>{selectedEmployee.emergencyContact.phone}</p></div>
                      <div><Label className="text-muted-foreground">Relation</Label><p>{selectedEmployee.emergencyContact.relation}</p></div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="employment" className="mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><Label className="text-muted-foreground">Hire Date</Label><p>{selectedEmployee.hireDate}</p></div>
                    <div><Label className="text-muted-foreground">Department</Label><p>{selectedEmployee.department}</p></div>
                    <div><Label className="text-muted-foreground">Manager</Label><p>{selectedEmployee.manager}</p></div>
                    <div><Label className="text-muted-foreground">Employment Type</Label><p>{selectedEmployee.employmentType}</p></div>
                    <div><Label className="text-muted-foreground">Location</Label><p>{selectedEmployee.location}</p></div>
                    <div><Label className="text-muted-foreground">Salary</Label><p>${selectedEmployee.salary.toLocaleString()}/yr</p></div>
                  </div>
                </TabsContent>
                <TabsContent value="documents" className="mt-4">
                  <div className="space-y-2">
                    {["Offer Letter.pdf", "Employment Contract.pdf", "ID Document.pdf"].map(doc => (
                      <div key={doc} className="flex items-center justify-between p-3 border rounded-md">
                        <span className="text-sm">{doc}</span>
                        <Button variant="ghost" size="sm">Download</Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-2">Upload Document</Button>
                  </div>
                </TabsContent>
                <TabsContent value="leave" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow><TableCell>Annual</TableCell><TableCell>2025-12-20</TableCell><TableCell>2025-12-27</TableCell><TableCell>5</TableCell><TableCell><Badge variant="outline" className="bg-success/10 text-success">Approved</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Sick</TableCell><TableCell>2025-09-10</TableCell><TableCell>2025-09-11</TableCell><TableCell>2</TableCell><TableCell><Badge variant="outline" className="bg-success/10 text-success">Approved</Badge></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="performance" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div><p className="font-medium">Annual Review 2025</p><p className="text-sm text-muted-foreground">Rating: 4.2/5</p></div>
                      <Badge className="bg-success text-success-foreground">Exceeds Expectations</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div><p className="font-medium">Mid-Year Review 2025</p><p className="text-sm text-muted-foreground">Rating: 3.8/5</p></div>
                      <Badge variant="secondary">Meets Expectations</Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          {showSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Employee Added Successfully!</h2>
              <p className="text-muted-foreground mb-6">The new employee has been added to the directory.</p>
              <Button onClick={() => setShowAddForm(false)}>Close</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add New Employee — Step {addStep} of 4</DialogTitle>
              </DialogHeader>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= addStep ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
              {addStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>First Name</Label><Input placeholder="John" /></div>
                    <div><Label>Last Name</Label><Input placeholder="Doe" /></div>
                  </div>
                  <div><Label>Date of Birth</Label><Input type="date" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Email</Label><Input placeholder="john@company.com" /></div>
                    <div><Label>Phone</Label><Input placeholder="+1 555-0000" /></div>
                  </div>
                </div>
              )}
              {addStep === 2 && (
                <div className="space-y-4">
                  <div><Label>Job Title</Label><Input placeholder="Software Engineer" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Department</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Manager</Label><Input placeholder="Manager name" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Start Date</Label><Input type="date" /></div>
                    <div><Label>Salary</Label><Input type="number" placeholder="80000" /></div>
                  </div>
                </div>
              )}
              {addStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Upload relevant documents for this employee.</p>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Drag & drop files here or click to browse</p>
                    <Button variant="outline" className="mt-3">Browse Files</Button>
                  </div>
                </div>
              )}
              {addStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Please review the information and submit.</p>
                  <div className="border rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> John Doe</p>
                    <p><span className="text-muted-foreground">Department:</span> Engineering</p>
                    <p><span className="text-muted-foreground">Role:</span> Software Engineer</p>
                    <p><span className="text-muted-foreground">Start Date:</span> 2026-03-01</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => addStep > 1 ? setAddStep(addStep - 1) : setShowAddForm(false)}>
                  {addStep === 1 ? "Cancel" : "Back"}
                </Button>
                <Button onClick={() => {
                  if (addStep < 4) setAddStep(addStep + 1);
                  else { setShowSuccess(true); toast.success("Employee added successfully!"); }
                }}>
                  {addStep === 4 ? "Submit" : "Next"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
