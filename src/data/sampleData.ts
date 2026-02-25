export type Role = "Admin" | "HR Manager" | "Manager" | "Employee";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  jobTitle: string;
  department: string;
  status: "Active" | "On Leave" | "Remote" | "Terminated";
  location: string;
  hireDate: string;
  manager: string;
  employmentType: "Full-time" | "Part-time" | "Contract";
  salary: number;
  dob: string;
  gender: string;
  emergencyContact: { name: string; phone: string; relation: string };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Annual" | "Sick" | "Casual" | "Unpaid";
  from: string;
  to: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  applicants: number;
  postedDate: string;
  status: "Open" | "Closed";
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  applicationDate: string;
  source: string;
  stage: "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";
  rating: number;
  notes: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "Processed" | "Pending";
  month: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  period: string;
  type: "Annual" | "Mid-Year" | "Probation";
  status: "Ongoing" | "Completed";
  dueDate: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  postedBy: string;
  postedByAvatar: string;
  date: string;
  category: "Policy" | "Event" | "General" | "Urgent";
  pinned: boolean;
}

const departments = ["Engineering", "Marketing", "Operations", "Finance"];

export const employees: Employee[] = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@company.com", phone: "+1 555-0101", avatar: "SC", jobTitle: "Senior Software Engineer", department: "Engineering", status: "Active", location: "New York", hireDate: "2021-03-15", manager: "James Wilson", employmentType: "Full-time", salary: 125000, dob: "1990-06-12", gender: "Female", emergencyContact: { name: "Mike Chen", phone: "+1 555-0102", relation: "Spouse" } },
  { id: "2", name: "James Wilson", email: "james.wilson@company.com", phone: "+1 555-0103", avatar: "JW", jobTitle: "Engineering Manager", department: "Engineering", status: "Active", location: "New York", hireDate: "2019-01-10", manager: "Lisa Park", employmentType: "Full-time", salary: 155000, dob: "1985-11-23", gender: "Male", emergencyContact: { name: "Anna Wilson", phone: "+1 555-0104", relation: "Spouse" } },
  { id: "3", name: "Maria Garcia", email: "maria.garcia@company.com", phone: "+1 555-0105", avatar: "MG", jobTitle: "Marketing Director", department: "Marketing", status: "Active", location: "Los Angeles", hireDate: "2020-07-01", manager: "Lisa Park", employmentType: "Full-time", salary: 140000, dob: "1988-03-18", gender: "Female", emergencyContact: { name: "Carlos Garcia", phone: "+1 555-0106", relation: "Brother" } },
  { id: "4", name: "David Kim", email: "david.kim@company.com", phone: "+1 555-0107", avatar: "DK", jobTitle: "Operations Lead", department: "Operations", status: "Remote", location: "Chicago", hireDate: "2022-02-14", manager: "Lisa Park", employmentType: "Full-time", salary: 110000, dob: "1992-09-05", gender: "Male", emergencyContact: { name: "Julia Kim", phone: "+1 555-0108", relation: "Spouse" } },
  { id: "5", name: "Emily Thompson", email: "emily.t@company.com", phone: "+1 555-0109", avatar: "ET", jobTitle: "Financial Analyst", department: "Finance", status: "Active", location: "New York", hireDate: "2023-01-20", manager: "Robert Brown", employmentType: "Full-time", salary: 95000, dob: "1995-12-30", gender: "Female", emergencyContact: { name: "Tom Thompson", phone: "+1 555-0110", relation: "Father" } },
  { id: "6", name: "Robert Brown", email: "robert.b@company.com", phone: "+1 555-0111", avatar: "RB", jobTitle: "Finance Manager", department: "Finance", status: "Active", location: "New York", hireDate: "2018-06-15", manager: "Lisa Park", employmentType: "Full-time", salary: 145000, dob: "1983-04-22", gender: "Male", emergencyContact: { name: "Susan Brown", phone: "+1 555-0112", relation: "Spouse" } },
  { id: "7", name: "Aisha Patel", email: "aisha.p@company.com", phone: "+1 555-0113", avatar: "AP", jobTitle: "UX Designer", department: "Engineering", status: "On Leave", location: "San Francisco", hireDate: "2021-09-01", manager: "James Wilson", employmentType: "Full-time", salary: 105000, dob: "1993-07-14", gender: "Female", emergencyContact: { name: "Raj Patel", phone: "+1 555-0114", relation: "Father" } },
  { id: "8", name: "Marcus Johnson", email: "marcus.j@company.com", phone: "+1 555-0115", avatar: "MJ", jobTitle: "Content Strategist", department: "Marketing", status: "Active", location: "Los Angeles", hireDate: "2022-04-10", manager: "Maria Garcia", employmentType: "Full-time", salary: 85000, dob: "1991-01-28", gender: "Male", emergencyContact: { name: "Lisa Johnson", phone: "+1 555-0116", relation: "Mother" } },
  { id: "9", name: "Nina Rodriguez", email: "nina.r@company.com", phone: "+1 555-0117", avatar: "NR", jobTitle: "DevOps Engineer", department: "Engineering", status: "Active", location: "Austin", hireDate: "2020-11-15", manager: "James Wilson", employmentType: "Full-time", salary: 120000, dob: "1989-05-09", gender: "Female", emergencyContact: { name: "Pedro Rodriguez", phone: "+1 555-0118", relation: "Spouse" } },
  { id: "10", name: "Alex Turner", email: "alex.t@company.com", phone: "+1 555-0119", avatar: "AT", jobTitle: "Supply Chain Analyst", department: "Operations", status: "Active", location: "Chicago", hireDate: "2023-03-05", manager: "David Kim", employmentType: "Full-time", salary: 78000, dob: "1996-08-17", gender: "Male", emergencyContact: { name: "Beth Turner", phone: "+1 555-0120", relation: "Sister" } },
  { id: "11", name: "Lisa Park", email: "lisa.park@company.com", phone: "+1 555-0121", avatar: "LP", jobTitle: "VP of People", department: "Operations", status: "Active", location: "New York", hireDate: "2017-02-01", manager: "-", employmentType: "Full-time", salary: 180000, dob: "1980-10-03", gender: "Female", emergencyContact: { name: "John Park", phone: "+1 555-0122", relation: "Spouse" } },
  { id: "12", name: "Tom Mitchell", email: "tom.m@company.com", phone: "+1 555-0123", avatar: "TM", jobTitle: "Junior Developer", department: "Engineering", status: "Active", location: "New York", hireDate: "2024-01-15", manager: "James Wilson", employmentType: "Full-time", salary: 72000, dob: "1998-02-14", gender: "Male", emergencyContact: { name: "Karen Mitchell", phone: "+1 555-0124", relation: "Mother" } },
  { id: "13", name: "Rachel Adams", email: "rachel.a@company.com", phone: "+1 555-0125", avatar: "RA", jobTitle: "Marketing Coordinator", department: "Marketing", status: "Active", location: "Los Angeles", hireDate: "2023-06-01", manager: "Maria Garcia", employmentType: "Part-time", salary: 52000, dob: "1997-11-20", gender: "Female", emergencyContact: { name: "Dan Adams", phone: "+1 555-0126", relation: "Spouse" } },
  { id: "14", name: "Kevin Lee", email: "kevin.l@company.com", phone: "+1 555-0127", avatar: "KL", jobTitle: "Accountant", department: "Finance", status: "Active", location: "New York", hireDate: "2022-08-20", manager: "Robert Brown", employmentType: "Full-time", salary: 82000, dob: "1994-06-08", gender: "Male", emergencyContact: { name: "Grace Lee", phone: "+1 555-0128", relation: "Spouse" } },
  { id: "15", name: "Sophia Martinez", email: "sophia.m@company.com", phone: "+1 555-0129", avatar: "SM", jobTitle: "QA Engineer", department: "Engineering", status: "Terminated", location: "Remote", hireDate: "2021-05-10", manager: "James Wilson", employmentType: "Contract", salary: 90000, dob: "1991-12-01", gender: "Female", emergencyContact: { name: "Luis Martinez", phone: "+1 555-0130", relation: "Brother" } },
];

export const leaveRequests: LeaveRequest[] = [
  { id: "L1", employeeId: "1", employeeName: "Sarah Chen", type: "Annual", from: "2026-03-10", to: "2026-03-14", days: 5, status: "Pending", reason: "Family vacation" },
  { id: "L2", employeeId: "7", employeeName: "Aisha Patel", type: "Sick", from: "2026-02-20", to: "2026-02-25", days: 4, status: "Approved", reason: "Medical procedure" },
  { id: "L3", employeeId: "8", employeeName: "Marcus Johnson", type: "Casual", from: "2026-03-01", to: "2026-03-01", days: 1, status: "Approved", reason: "Personal errand" },
  { id: "L4", employeeId: "4", employeeName: "David Kim", type: "Annual", from: "2026-03-20", to: "2026-03-28", days: 7, status: "Pending", reason: "Spring break with family" },
  { id: "L5", employeeId: "10", employeeName: "Alex Turner", type: "Sick", from: "2026-02-18", to: "2026-02-19", days: 2, status: "Approved", reason: "Flu" },
  { id: "L6", employeeId: "12", employeeName: "Tom Mitchell", type: "Casual", from: "2026-03-05", to: "2026-03-05", days: 1, status: "Rejected", reason: "Moving apartments" },
  { id: "L7", employeeId: "3", employeeName: "Maria Garcia", type: "Annual", from: "2026-04-01", to: "2026-04-05", days: 5, status: "Pending", reason: "Conference attendance" },
  { id: "L8", employeeId: "9", employeeName: "Nina Rodriguez", type: "Unpaid", from: "2026-03-15", to: "2026-03-17", days: 3, status: "Pending", reason: "Extended travel" },
  { id: "L9", employeeId: "5", employeeName: "Emily Thompson", type: "Sick", from: "2026-02-24", to: "2026-02-24", days: 1, status: "Approved", reason: "Doctor appointment" },
  { id: "L10", employeeId: "14", employeeName: "Kevin Lee", type: "Annual", from: "2026-03-25", to: "2026-03-28", days: 4, status: "Pending", reason: "Wedding attendance" },
];

export const jobPostings: JobPosting[] = [
  { id: "J1", title: "Senior Frontend Developer", department: "Engineering", location: "New York", type: "Full-time", applicants: 24, postedDate: "2026-02-01", status: "Open", description: "Looking for an experienced React developer..." },
  { id: "J2", title: "Marketing Manager", department: "Marketing", location: "Los Angeles", type: "Full-time", applicants: 18, postedDate: "2026-02-05", status: "Open", description: "Lead our marketing initiatives..." },
  { id: "J3", title: "Financial Controller", department: "Finance", location: "New York", type: "Full-time", applicants: 12, postedDate: "2026-01-20", status: "Open", description: "Oversee financial reporting and compliance..." },
  { id: "J4", title: "Operations Coordinator", department: "Operations", location: "Chicago", type: "Full-time", applicants: 8, postedDate: "2026-02-10", status: "Open", description: "Coordinate daily operations..." },
  { id: "J5", title: "UX Researcher", department: "Engineering", location: "Remote", type: "Contract", applicants: 31, postedDate: "2026-01-15", status: "Open", description: "Conduct user research..." },
  { id: "J6", title: "Data Analyst", department: "Finance", location: "New York", type: "Full-time", applicants: 15, postedDate: "2026-01-25", status: "Closed", description: "Analyze financial data..." },
];

export const candidates: Candidate[] = [
  { id: "C1", name: "John Smith", role: "Senior Frontend Developer", applicationDate: "2026-02-03", source: "LinkedIn", stage: "Interview", rating: 4, notes: "Strong React experience" },
  { id: "C2", name: "Amy Zhang", role: "Senior Frontend Developer", applicationDate: "2026-02-05", source: "Referral", stage: "Offer", rating: 5, notes: "Excellent technical skills" },
  { id: "C3", name: "Carlos Rivera", role: "Marketing Manager", applicationDate: "2026-02-07", source: "LinkedIn", stage: "Screening", rating: 3, notes: "Good portfolio" },
  { id: "C4", name: "Diana Foster", role: "Financial Controller", applicationDate: "2026-01-22", source: "Indeed", stage: "Applied", rating: 0, notes: "" },
  { id: "C5", name: "Eric Wang", role: "UX Researcher", applicationDate: "2026-01-18", source: "LinkedIn", stage: "Hired", rating: 5, notes: "Outstanding candidate" },
  { id: "C6", name: "Fiona O'Brien", role: "Senior Frontend Developer", applicationDate: "2026-02-08", source: "Website", stage: "Applied", rating: 0, notes: "" },
  { id: "C7", name: "George Nakamura", role: "Marketing Manager", applicationDate: "2026-02-09", source: "Referral", stage: "Interview", rating: 4, notes: "Great communication skills" },
  { id: "C8", name: "Hannah Lee", role: "Operations Coordinator", applicationDate: "2026-02-12", source: "LinkedIn", stage: "Screening", rating: 3, notes: "Relevant experience" },
  { id: "C9", name: "Ivan Petrov", role: "Data Analyst", applicationDate: "2026-01-28", source: "Indeed", stage: "Rejected", rating: 2, notes: "Insufficient experience" },
];

export const payrollRecords: PayrollRecord[] = employees.filter(e => e.status !== "Terminated").map(e => ({
  id: `P-${e.id}`,
  employeeId: e.id,
  employeeName: e.name,
  department: e.department,
  baseSalary: Math.round(e.salary / 12),
  allowances: Math.round(e.salary / 12 * 0.15),
  deductions: Math.round(e.salary / 12 * 0.22),
  netPay: Math.round(e.salary / 12 * 0.93),
  status: Math.random() > 0.3 ? "Processed" as const : "Pending" as const,
  month: "2026-02",
}));

export const reviewCycles: ReviewCycle[] = [
  { id: "RC1", name: "Annual Review 2025", period: "Jan 2025 – Dec 2025", type: "Annual", status: "Completed", dueDate: "2026-01-31" },
  { id: "RC2", name: "Mid-Year Review 2026", period: "Jan 2026 – Jun 2026", type: "Mid-Year", status: "Ongoing", dueDate: "2026-07-15" },
  { id: "RC3", name: "Q1 Probation Reviews", period: "Jan 2026 – Mar 2026", type: "Probation", status: "Ongoing", dueDate: "2026-03-31" },
];

export const announcements: Announcement[] = [
  { id: "A1", title: "Office Closure: President's Day", body: "Please note that our offices will be closed on Monday, February 17th for President's Day. All employees are expected to resume work on Tuesday, February 18th. If you have any urgent tasks, please coordinate with your manager beforehand.", postedBy: "Lisa Park", postedByAvatar: "LP", date: "2026-02-10", category: "General", pinned: true },
  { id: "A2", title: "New Health Insurance Policy Update", body: "We are excited to announce updates to our health insurance coverage starting March 1st. The new plan includes expanded mental health coverage, lower co-pays for specialist visits, and a new dental plan option. Please review the detailed document attached and reach out to HR with any questions.", postedBy: "Robert Brown", postedByAvatar: "RB", date: "2026-02-15", category: "Policy", pinned: false },
  { id: "A3", title: "Q1 Company Town Hall – March 5th", body: "Join us for the Q1 Town Hall meeting on March 5th at 2:00 PM EST. CEO will present company performance, upcoming initiatives, and Q&A. Remote employees can join via the Zoom link that will be shared one day before. Attendance is strongly encouraged.", postedBy: "Lisa Park", postedByAvatar: "LP", date: "2026-02-20", category: "Event", pinned: false },
  { id: "A4", title: "⚠️ Security Alert: Phishing Emails", body: "Our IT Security team has detected a new wave of phishing emails targeting employees. DO NOT click on any links from emails claiming to be from 'IT Support' asking you to reset your password. Report suspicious emails to security@company.com immediately.", postedBy: "James Wilson", postedByAvatar: "JW", date: "2026-02-22", category: "Urgent", pinned: true },
  { id: "A5", title: "Employee Appreciation Week", body: "We're celebrating Employee Appreciation Week from March 10-14! Expect daily surprises, team lunches, and a special awards ceremony on Friday. Nominations for peer recognition awards are now open – submit yours by March 7th.", postedBy: "Maria Garcia", postedByAvatar: "MG", date: "2026-02-24", category: "Event", pinned: false },
];

export const currentUser = {
  name: "Lisa Park",
  role: "Admin" as Role,
  avatar: "LP",
  title: "VP of People",
};

export const recentActivity = [
  { text: "Tom Mitchell was hired as Junior Developer", time: "2 hours ago", type: "hire" },
  { text: "Aisha Patel's sick leave was approved", time: "3 hours ago", type: "leave" },
  { text: "New job posted: Senior Frontend Developer", time: "5 hours ago", type: "job" },
  { text: "February payroll processing completed", time: "1 day ago", type: "payroll" },
  { text: "Annual Review 2025 cycle marked complete", time: "2 days ago", type: "review" },
  { text: "Security Alert announcement posted", time: "3 days ago", type: "announcement" },
];

export const upcomingEvents = [
  { text: "🎂 Sarah Chen's Birthday", date: "Mar 1" },
  { text: "🎉 Nina Rodriguez – 5 Year Anniversary", date: "Mar 3" },
  { text: "📋 Q1 Town Hall Meeting", date: "Mar 5" },
  { text: "⭐ Mid-Year Review Kickoff", date: "Mar 10" },
  { text: "🎂 Marcus Johnson's Birthday", date: "Mar 15" },
];

export const departmentHeadcount = departments.map(d => ({
  department: d,
  count: employees.filter(e => e.department === d).length,
}));

export const employeeStatusBreakdown = [
  { name: "Active", value: employees.filter(e => e.status === "Active").length, fill: "hsl(var(--chart-2))" },
  { name: "On Leave", value: employees.filter(e => e.status === "On Leave").length, fill: "hsl(var(--chart-3))" },
  { name: "Remote", value: employees.filter(e => e.status === "Remote").length, fill: "hsl(var(--chart-4))" },
  { name: "Terminated", value: employees.filter(e => e.status === "Terminated").length, fill: "hsl(var(--chart-5))" },
];
