import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { candidates, jobPostings, Candidate } from "@/data/sampleData";
import { Plus, Star, Users, MapPin, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const stageColors: Record<string, string> = {
  Applied: "bg-muted text-muted-foreground",
  Screening: "bg-chart-4/10 text-chart-4",
  Interview: "bg-warning/10 text-warning",
  Offer: "bg-primary/10 text-primary",
  Hired: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const stages = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"] as const;
const kanbanStages = ["Applied", "Screening", "Interview", "Offer"] as const;

export default function Recruitment() {
  const [showPostJob, setShowPostJob] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const funnelData = stages.slice(0, 5).map(s => ({
    stage: s,
    count: candidates.filter(c => c.stage === s).length,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Recruitment</h1>
        <Button className="gap-2" onClick={() => setShowPostJob(true)}>
          <Plus className="h-4 w-4" /> Post New Job
        </Button>
      </div>

      {/* Job Listings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobPostings.map(job => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{job.title}</h3>
                <Badge variant={job.status === "Open" ? "default" : "secondary"}>{job.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{job.department}</p>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.applicants}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job.postedDate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recruitment Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recruitment Funnel</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <h2 className="text-lg font-semibold">Candidate Pipeline</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kanbanStages.map(stage => (
          <div key={stage} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{stage}</h3>
              <Badge variant="secondary" className="text-xs">{candidates.filter(c => c.stage === stage).length}</Badge>
            </div>
            <div className="space-y-2">
              {candidates.filter(c => c.stage === stage).map(c => (
                <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCandidate(c)}>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.role}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{c.source}</span>
                      <Badge variant="outline" className={`text-xs ${stageColors[c.stage]}`}>{c.stage}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Side Panel */}
      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent>
          {selectedCandidate && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCandidate.name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Applied For</Label>
                  <p>{selectedCandidate.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Application Date</Label>
                  <p>{selectedCandidate.applicationDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p>{selectedCandidate.source}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`h-4 w-4 ${i <= selectedCandidate.rating ? "fill-warning text-warning" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedCandidate.notes || "No notes yet"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stage</Label>
                  <Select defaultValue={selectedCandidate.stage} onValueChange={() => toast.success("Stage updated!")}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Post Job Dialog */}
      <Dialog open={showPostJob} onOpenChange={setShowPostJob}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post New Job</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Job Title</Label><Input placeholder="e.g. Senior Developer" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Department</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Engineering", "Marketing", "Operations", "Finance"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input placeholder="New York" /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={4} placeholder="Job description..." /></div>
            <Button className="w-full" onClick={() => { setShowPostJob(false); toast.success("Job posted successfully!"); }}>Post Job</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
