import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { payrollRecords } from "@/data/sampleData";
import { DollarSign, Download } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString();

export default function Payroll() {
  const [selectedRecord, setSelectedRecord] = useState<typeof payrollRecords[0] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [month, setMonth] = useState("2026-02");

  const totalGross = payrollRecords.reduce((s, r) => s + r.baseSalary + r.allowances, 0);
  const totalDeductions = payrollRecords.reduce((s, r) => s + r.deductions, 0);
  const totalNet = payrollRecords.reduce((s, r) => s + r.netPay, 0);
  const processed = payrollRecords.filter(r => r.status === "Processed").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <div className="flex gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-02">February 2026</SelectItem>
              <SelectItem value="2026-01">January 2026</SelectItem>
              <SelectItem value="2025-12">December 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => setShowConfirm(true)}>
            <DollarSign className="h-4 w-4" /> Run Payroll
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Gross Pay", value: fmt(totalGross) },
          { label: "Total Deductions", value: fmt(totalDeductions) },
          { label: "Net Pay", value: fmt(totalNet) },
          { label: "Employees Paid", value: `${processed}/${payrollRecords.length}` },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payroll Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Base Salary</TableHead>
              <TableHead className="text-right">Allowances</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollRecords.map(r => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedRecord(r)}>
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell>{r.department}</TableCell>
                <TableCell className="text-right">{fmt(r.baseSalary)}</TableCell>
                <TableCell className="text-right">{fmt(r.allowances)}</TableCell>
                <TableCell className="text-right">{fmt(r.deductions)}</TableCell>
                <TableCell className="text-right font-medium">{fmt(r.netPay)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={r.status === "Processed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Payslip Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          {selectedRecord && (
            <>
              <DialogHeader><DialogTitle>Payslip — {selectedRecord.employeeName}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{month} · {selectedRecord.department}</p>
                <div>
                  <h4 className="font-medium text-sm mb-2">Earnings</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Base Salary</span><span>{fmt(selectedRecord.baseSalary)}</span></div>
                    <div className="flex justify-between"><span>HRA</span><span>{fmt(Math.round(selectedRecord.allowances * 0.5))}</span></div>
                    <div className="flex justify-between"><span>Transport</span><span>{fmt(Math.round(selectedRecord.allowances * 0.3))}</span></div>
                    <div className="flex justify-between"><span>Bonus</span><span>{fmt(Math.round(selectedRecord.allowances * 0.2))}</span></div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Deductions</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Income Tax</span><span>{fmt(Math.round(selectedRecord.deductions * 0.5))}</span></div>
                    <div className="flex justify-between"><span>Provident Fund</span><span>{fmt(Math.round(selectedRecord.deductions * 0.3))}</span></div>
                    <div className="flex justify-between"><span>Insurance</span><span>{fmt(Math.round(selectedRecord.deductions * 0.2))}</span></div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Pay</span><span>{fmt(selectedRecord.netPay)}</span>
                </div>
                <Button variant="outline" className="w-full gap-2"><Download className="h-4 w-4" /> Download Payslip (PDF)</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Run Payroll Confirm */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Payroll Run</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to run payroll for {month}? This will process payments for {payrollRecords.length} employees.</p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={() => { setShowConfirm(false); toast.success("Payroll processed successfully!"); }}>Confirm & Run</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
