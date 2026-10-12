import { jsPDF } from 'jspdf';
import { PaySlip } from '../types';

export interface PayslipEmployeeInfo {
  name: string;
  code: string;
  designation?: string;
  department?: string;
}

export function generatePayslipPdfDoc(
  payslip: PaySlip,
  employee: PayslipEmployeeInfo = {
    name: 'Kiran Patel',
    code: 'EMP001',
    designation: 'Backend Developer',
    department: 'Engineering',
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const grossEarnings =
    payslip.basicSalary +
    payslip.hra +
    payslip.conveyance +
    payslip.medical +
    payslip.bonus;
  const totalDeductions = payslip.pf + payslip.tax;
  const netSalary = payslip.netSalary ?? (grossEarnings - totalDeductions);

  // Top Accent Banner (Grevya HR Dark Green)
  doc.setFillColor(15, 43, 24); // #0f2b18
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Emerald Green Accent Line
  doc.setFillColor(34, 197, 94); // #22c55e
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Company Info
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GREVYA HR PORTAL', 15, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(187, 247, 208); // green-200
  doc.text('CONFIDENTIAL SALARY STATEMENT', 15, 21);

  // Payslip Period Header Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Payslip — ${payslip.month} ${payslip.year}`, pageWidth - 15, 17, { align: 'right' });

  // Employee Information Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(15, 36, pageWidth - 30, 32, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('EMPLOYEE DETAILS', 20, 43);
  doc.text('PAYMENT DETAILS', 115, 43);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Employee Name:', 20, 50);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.name} (${employee.code})`, 55, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Designation / Dept:', 20, 56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${employee.designation || 'Software Engineer'} · ${employee.department || 'Engineering'}`, 55, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Pay Period:', 20, 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${payslip.month} ${payslip.year}`, 55, 62);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Month:', 115, 50);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${payslip.month} ${payslip.year}`, 145, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Status:', 115, 56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('PAID', 145, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Credited Date:', 115, 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`31 ${payslip.month} ${payslip.year}`, 145, 62);

  // Table Configuration
  const colWidth = (pageWidth - 35) / 2;
  const leftX = 15;
  const rightX = 15 + colWidth + 5;
  const startY = 76;

  // Earnings Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(leftX, startY, colWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EARNINGS', leftX + 4, startY + 5.5);
  doc.text('AMOUNT', leftX + colWidth - 4, startY + 5.5, { align: 'right' });

  // Deductions Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(rightX, startY, colWidth, 8, 'F');
  doc.text('DEDUCTIONS', rightX + 4, startY + 5.5);
  doc.text('AMOUNT', rightX + colWidth - 4, startY + 5.5, { align: 'right' });

  // Earnings breakdown
  const earningsItems = [
    { label: 'Basic Salary', amount: payslip.basicSalary },
    { label: 'House Rent Allowance (HRA)', amount: payslip.hra },
    { label: 'Conveyance Allowance', amount: payslip.conveyance },
    { label: 'Medical Allowance', amount: payslip.medical },
    { label: 'Performance Bonus', amount: payslip.bonus },
  ];

  let currentY = startY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  earningsItems.forEach((item) => {
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, leftX + 4, currentY);
    doc.setTextColor(15, 23, 42);
    doc.text(`₹${item.amount.toLocaleString()}`, leftX + colWidth - 4, currentY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(leftX, currentY + 2.5, leftX + colWidth, currentY + 2.5);
    currentY += 8;
  });

  // Deductions breakdown
  const deductionItems = [
    { label: 'Provident Fund (PF 12%)', amount: payslip.pf },
    { label: 'Income Tax (TDS)', amount: payslip.tax },
  ];

  let dY = startY + 14;
  deductionItems.forEach((item) => {
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, rightX + 4, dY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-₹${item.amount.toLocaleString()}`, rightX + colWidth - 4, dY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(rightX, dY + 2.5, rightX + colWidth, dY + 2.5);
    dY += 8;
  });

  // Total summary boxes
  const totalRowY = startY + 56;

  // Gross Earnings summary box
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208); // green-200
  doc.rect(leftX, totalRowY, colWidth, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('Gross Earnings:', leftX + 4, totalRowY + 6.5);
  doc.text(`₹${grossEarnings.toLocaleString()}`, leftX + colWidth - 4, totalRowY + 6.5, { align: 'right' });

  // Total Deductions summary box
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(254, 202, 202); // red-200
  doc.rect(rightX, totalRowY, colWidth, 10, 'FD');
  doc.setTextColor(153, 27, 27);
  doc.text('Total Deductions:', rightX + 4, totalRowY + 6.5);
  doc.text(`-₹${totalDeductions.toLocaleString()}`, rightX + colWidth - 4, totalRowY + 6.5, { align: 'right' });

  // Net Salary Hero Banner
  const netBannerY = totalRowY + 18;
  doc.setFillColor(15, 43, 24); // #0f2b18
  doc.roundedRect(15, netBannerY, pageWidth - 30, 26, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(187, 247, 208);
  doc.text('NET SALARY TAKE HOME', 22, netBannerY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`Net Salary: ₹${netSalary.toLocaleString()}`, 22, netBannerY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Disbursed via Direct Bank Transfer', pageWidth - 22, netBannerY + 11, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 222, 128);
  doc.text('HDFC Bank · A/C Ending ****4821', pageWidth - 22, netBannerY + 18, { align: 'right' });

  // Key Salary Details Summary Block (explicitly matches requested format)
  const summaryY = netBannerY + 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, summaryY, pageWidth - 30, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('SALARY DETAILS', 20, summaryY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Employee Name: ${employee.name} (${employee.code})`, 20, summaryY + 14);
  doc.text(`Month: ${payslip.month} ${payslip.year}`, 20, summaryY + 21);
  doc.text(`Gross Earnings: ₹${grossEarnings.toLocaleString()}`, 20, summaryY + 28);
  doc.text(`Total Deductions: -₹${totalDeductions.toLocaleString()}`, 115, summaryY + 21);
  doc.text(`Net Salary: ₹${netSalary.toLocaleString()}`, 115, summaryY + 28);

  // Footer
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, footerY, pageWidth - 15, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a system-generated document and requires no physical signature.', 15, footerY + 6);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} · Grevya HR Portal`,
    pageWidth - 15,
    footerY + 6,
    { align: 'right' }
  );

  return doc;
}

/**
 * Generates a valid application/pdf Blob for a payslip
 */
export function generatePayslipBlob(
  payslip: PaySlip,
  employee?: PayslipEmployeeInfo
): Blob {
  const doc = generatePayslipPdfDoc(payslip, employee);
  return doc.output('blob');
}

/**
 * Downloads the payslip as a valid PDF file
 */
export function downloadPayslipPdf(
  payslip: PaySlip,
  employee?: PayslipEmployeeInfo
): void {
  const blob = generatePayslipBlob(payslip, employee);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Payslip_${payslip.month}_${payslip.year}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
