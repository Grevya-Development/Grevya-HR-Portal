import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { announcements, upcomingEvents } from "@/data/sampleData";
import { Plus, Pin } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  Policy: "bg-primary/10 text-primary",
  Event: "bg-chart-4/10 text-chart-4",
  General: "bg-muted text-muted-foreground",
  Urgent: "bg-destructive/10 text-destructive",
};

export default function Announcements() {
  const { role } = useRole();
  const [showPost, setShowPost] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<typeof announcements[0] | null>(null);

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {(role === "Admin" || role === "HR Manager") && (
          <Button className="gap-2" onClick={() => setShowPost(true)}>
            <Plus className="h-4 w-4" /> Post Announcement
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {sorted.map(a => (
            <Card
              key={a.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${a.pinned ? "border-l-4 border-l-success" : ""}`}
              onClick={() => setSelectedAnn(a)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="h-4 w-4 text-success shrink-0" />}
                    <h3 className="font-semibold">{a.title}</h3>
                  </div>
                  <Badge variant="outline" className={categoryColors[a.category]}>{a.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.body}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px]">{a.postedByAvatar}</div>
                    {a.postedBy}
                  </div>
                  <span>{a.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Events Sidebar */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <span>{e.text}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">{e.date}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcement Detail Modal */}
      <Dialog open={!!selectedAnn} onOpenChange={() => setSelectedAnn(null)}>
        <DialogContent className="max-w-lg">
          {selectedAnn && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedAnn.title}</DialogTitle>
                  <Badge variant="outline" className={categoryColors[selectedAnn.category]}>{selectedAnn.category}</Badge>
                </div>
              </DialogHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">{selectedAnn.postedByAvatar}</div>
                {selectedAnn.postedBy} · {selectedAnn.date}
              </div>
              <p className="text-sm leading-relaxed mt-2">{selectedAnn.body}</p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Post Announcement Dialog */}
      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input placeholder="Announcement title" /></div>
            <div><Label>Category</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Policy", "Event", "General", "Urgent"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Body</Label><Textarea rows={5} placeholder="Write your announcement..." /></div>
            <div className="flex items-center gap-2">
              <Switch id="pin" />
              <Label htmlFor="pin">Pin to top</Label>
            </div>
            <Button className="w-full" onClick={() => { setShowPost(false); toast.success("Announcement posted!"); }}>Publish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
