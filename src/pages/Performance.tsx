import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { reviewCycles, employees } from "@/data/sampleData";
import { Plus, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const trendData = [
  { department: "Engineering", cycle1: 3.8, cycle2: 4.0, cycle3: 4.2 },
  { department: "Marketing", cycle1: 3.5, cycle2: 3.7, cycle3: 3.9 },
  { department: "Operations", cycle1: 3.6, cycle2: 3.8, cycle3: 3.7 },
  { department: "Finance", cycle1: 4.0, cycle2: 4.1, cycle3: 4.3 },
];

const reviewEmployees = employees.filter(e => e.status !== "Terminated").slice(0, 8).map(e => ({
  ...e,
  selfAssessment: Math.random() > 0.4 ? "Completed" : "Pending",
  managerReview: Math.random() > 0.5 ? "Completed" : "Pending",
  rating: Math.round((3 + Math.random() * 2) * 10) / 10,
}));

export default function Performance() {
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Performance Management</h1>
        <Button className="gap-2" onClick={() => setShowCreateCycle(true)}>
          <Plus className="h-4 w-4" /> Create Review Cycle
        </Button>
      </div>

      {/* Review Cycles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviewCycles.map(rc => (
          <Card key={rc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCycle(rc.id)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{rc.name}</h3>
                <Badge variant={rc.status === "Ongoing" ? "default" : "secondary"}>{rc.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{rc.period}</p>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span>{rc.type}</span>
                <span>Due: {rc.dueDate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cycle Detail */}
      {selectedCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {reviewCycles.find(r => r.id === selectedCycle)?.name} — Employee Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Self Assessment</TableHead>
                  <TableHead>Manager Review</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewEmployees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={e.selfAssessment === "Completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                        {e.selfAssessment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={e.managerReview === "Completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                        {e.managerReview}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-sm font-medium">{e.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setShowReview(true)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader><CardTitle className="text-base">Performance Trends (Last 3 Cycles)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="department" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cycle1" name="Cycle 1" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cycle2" name="Cycle 2" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cycle3" name="Cycle 3" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual Review Modal */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Performance Review — Sarah Chen</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <h4 className="font-medium mb-2">Self-Assessment</h4>
              <div className="space-y-3">
                {["Communication Skills", "Technical Proficiency", "Leadership"].map(q => (
                  <div key={q}>
                    <div className="flex justify-between text-sm mb-1"><span>{q}</span><span className="text-muted-foreground">4/5</span></div>
                    <Progress value={80} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Manager Feedback</h4>
              <p className="text-sm text-muted-foreground">Consistently delivers high-quality work. Strong team player with excellent communication skills. Recommended for senior role progression.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Goals</h4>
              <div className="space-y-2">
                {[
                  { goal: "Complete AWS certification", status: "Completed", progress: 100 },
                  { goal: "Mentor 2 junior developers", status: "In Progress", progress: 60 },
                  { goal: "Lead architecture redesign", status: "Not Started", progress: 0 },
                ].map(g => (
                  <div key={g.goal} className="border rounded-md p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{g.goal}</span>
                      <Badge variant="outline" className="text-xs">{g.status}</Badge>
                    </div>
                    <Progress value={g.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t pt-4">
              <span className="font-medium">Final Rating:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`h-5 w-5 ${i <= 4 ? "fill-warning text-warning" : "text-muted"}`} />
                ))}
              </div>
              <Badge className="ml-2 bg-success text-success-foreground">Exceeds Expectations</Badge>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => toast.success("Draft saved!")}>Save Draft</Button>
              <Button className="flex-1" onClick={() => { setShowReview(false); toast.success("Review submitted!"); }}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Cycle Dialog */}
      <Dialog open={showCreateCycle} onOpenChange={setShowCreateCycle}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Review Cycle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cycle Name</Label><Input placeholder="e.g. Annual Review 2026" /></div>
            <div><Label>Period</Label><Input placeholder="e.g. Jan 2026 – Dec 2026" /></div>
            <div><Label>Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                  <SelectItem value="Probation">Probation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => { setShowCreateCycle(false); toast.success("Review cycle created!"); }}>Create Cycle</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
