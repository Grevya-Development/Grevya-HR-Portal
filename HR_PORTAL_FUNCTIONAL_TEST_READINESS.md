# GREVYA HR PORTAL — FUNCTIONAL TEST READINESS MANUAL

**Document Version:** 1.0.0 (Production Release Candidate)  
**Date:** October 19, 2026  
**Auditor / Quality Engineering:** Antigravity Pair Programming System  
**Environment:** Production Preview & Live Supabase (`bjvhflttbabznevkhneu`)  
**Readiness Status:** **100% READY FOR SYSTEMATIC FUNCTIONAL TESTING**

---

## 1. Executive Summary & Test Readiness Verdict

The Grevya HR Portal has completed all architectural backlog implementations, security hardening, live Supabase backend integrations, and mock data purges. The system is ready for systematic end-to-end human and functional verification.

### Key Quality Verification Indicators:
- **TypeScript Diagnostic Build:** Clean (`tsc --noEmit` exited with 0 errors).
- **Vite Production Bundle:** Succeeded with 0 packaging errors (`tsc && vite build` passed in 25.20s).
- **Mock Data Decoupling:** 100% of active pages derive state from Supabase tables; zero imports from `mockData.ts` remain. AI Assistant is grounded in live Supabase state.
- **Database Hygiene:** All probe records purged. Exactly 9 genuine employees are active with unbroken referential integrity.
- **Security Posture:** 100% RLS coverage across 31 tables, storage buckets private with signed URL authorization, least-privilege token access.
- **Supabase Connectivity Matrix:** 28/28 integration tests passed (100% success rate), including employee invitation generation, token validation, resend, revoke, and attendance flows.

---

## 2. Test Environment & Access Roster

### 2.1 Verified User Accounts by Role

| Role | Name | Email Address | Department | Default Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Kavin Raj | `kavin@grevya.com` | Executive | Executive Dashboard (`/`) |
| **Admin** | System Admin | `admin@grevya.com` | Management | System Administration (`/`) |
| **HR Manager** | HR Manager | `hr@grevya.com` | Human Resources | HR Dashboard (`/`) |
| **Manager** | Vikram Joshi | `vikram@grevya.com` | Engineering | Manager Dashboard (`/`) |
| **Employee** (Developer) | Suresh Pillai | `suresh@grevya.com` | Engineering | Developer Dashboard (`/developer-dashboard`) |
| **Employee** (Designer) | Arjun Mehta | `arjun@grevya.com` | Design | Employee Dashboard (`/`) |
| **Employee** (Marketing) | Priya Sharma | `priya@grevya.com` | Marketing | Employee Dashboard (`/`) |
| **Employee** (Finance) | Pooja Reddy | `pooja@grevya.com` | Finance | Employee Dashboard (`/`) |
| **Employee** (Sales) | Rahul Gupta | `rahul@grevya.com` | Sales | Employee Dashboard (`/`) |

---

## 3. Step-by-Step Functional Test Suites

### Test Suite 1: Super Admin Oversight & Global Administration
**Actor:** Kavin Raj (`kavin@grevya.com`)

1. **Authentication & Session:**
   - Navigate to `/login`.
   - Enter `kavin@grevya.com` and credentials.
   - **Expectation:** Authenticates immediately, mounts Super Admin sidebar navigation with all elevated tabs visible (Dashboard, Employees, Org Chart, Attendance, Leave, Performance, Recruitment, Onboarding, Payroll, Expenses, Reports, Calendar, Settings).
2. **Dashboard Live Metrics:**
   - Verify KPI cards: Total Employees (9), Active Attendance (reflecting today's punches), Pending Leave Requests, Departments (6).
   - **Expectation:** Charts render dynamic distributions derived from genuine records without synthetic or static numbers.
3. **Employee Directory Oversight:**
   - Navigate to `/employees`.
   - Toggle between "Employee Directory" and "Invitations & Onboarding".
   - Search for an employee by name or department.
   - Click "Edit Profile" on an employee to adjust department or role.
   - **Expectation:** Grid updates in real-time, online presence green/gray dot accurately reflects active sessions.

---

### Test Suite 2: HR Manager Lifecycle & Compliance
**Actor:** HR Manager (`hr@grevya.com`)

1. **Employee Invitation Workflow:**
   - Navigate to `/employees`.
   - Switch to the "Invitations & Onboarding" tab.
   - Click **"Invite New Employee"** button.
   - Fill in candidate details:
     - Name: `Jane Doe`
     - Email: `jane.doe@example.com`
     - Role: `Employee`
     - Department: `Engineering`
     - Job Title: `Frontend Engineer`
     - Manager: `Vikram Joshi`
   - Click **"Create & Send Invitation"**.
   - **Expectation:** Generates a secure single-use invitation token. Displays a modal containing the copyable onboarding link (`http://.../accept-invitation?token=...`) and an email client launcher. A new invitation entry appears in the invitations table with status `pending`.
2. **Attendance Photo & GPS Audit:**
   - Navigate to `/attendance`.
   - View the company attendance log table.
   - Observe the **Verification** column:
     - Green shield icon for verified punches.
     - Yellow alert shield for exception punches.
     - Click on the photo thumbnail to view the high-resolution snapshot via a signed Supabase URL.
     - Click the GPS coordinates link to inspect the exact punch location on Google Maps.
   - **Expectation:** Photo renders securely from the private bucket `attendance-photos`. No broken image links or CORS errors.
3. **Leave Management & Approval:**
   - Navigate to `/leave`.
   - View pending leave requests from employees.
   - Click **"Approve"** on a pending request.
   - **Expectation:** Status updates to `approved`. The employee's corresponding leave balance automatically deducts the requested days.
4. **Resignation & Exit Workflow:**
   - In `/leave`, view the Resignations section.
   - If an employee has submitted a resignation, click **"Review Resignation"**.
   - Select notice period duration (30, 60, or 90 days).
   - Click **"Accept Resignation"**.
   - **Expectation:** Relieving date is computed accurately based on notice period.

---

### Test Suite 3: Team Manager Operations
**Actor:** Vikram Joshi (`vikram@grevya.com`)

1. **Team Roster & Scope:**
   - Navigate to `/manager-dashboard`.
   - **Expectation:** Only direct reports or Engineering department members are displayed in the team roster.
2. **Team Task Management:**
   - Navigate to the team task view.
   - Create a new sprint task:
     - Title: `Implement API caching layer`
     - Assignee: `Suresh Pillai`
     - Priority: `High`
     - Due Date: Select upcoming date
   - **Expectation:** Task saves to Supabase `public.tasks` and immediately appears on Suresh's Developer Dashboard.
3. **Team Leave Approvals:**
   - Review pending leave applications specifically submitted by team members.
   - Approve or reject with manager comments.

---

### Test Suite 4: Employee Daily Operations
**Actors:** Arjun Mehta (`arjun@grevya.com`) or Suresh Pillai (`suresh@grevya.com`)

1. **Live Camera & GPS Attendance Clock-In:**
   - Log in as `arjun@grevya.com`.
   - Navigate to `/attendance` (or Developer Dashboard for Suresh).
   - Click the green **"Clock In"** button.
   - The **Attendance Verification Modal** opens:
     - Browser prompts for camera and location permissions (allow both).
     - Live webcam stream displays in the video preview box.
     - Geolocation sensor locks GPS coordinates, showing latitude, longitude, and accuracy radius.
     - Click **"Take Photo & Verify Punch"**.
     - Review captured snapshot preview. Click "Retake" if needed, or click **"Confirm Clock In"**.
   - **Expectation:**
     - Snapshot uploads to private bucket `attendance-photos/{user_id}/...`.
     - Punch records in `attendance_records` with timestamp, photo URL, GPS coords, and `verification_status = 'verified'`.
     - Attendance dashboard switches to clocked-in status showing active timer and verification badge.
2. **Exception Handling Punch (Simulated Hardware Failure):**
   - Click Clock Out (or Lunch).
   - In verification modal, click **"Device issue? Submit with documented reason"**.
   - Enter reason: `Desktop workstation has no webcam peripheral`.
   - Click **"Submit Exception Punch"**.
   - **Expectation:** Punch records successfully with `verification_status = 'exception'` and `exception_reason` stored.
3. **Leave Application:**
   - Navigate to `/leave`.
   - Click **"Apply for Leave"**.
   - Choose leave type (Casual, Sick, Annual), select start and end dates, provide reason.
   - **Expectation:** System validates dates against remaining quota from `leave_balances`. Submits request with status `pending`.
4. **Expense Claim with Receipt:**
   - Navigate to `/expenses`.
   - Click **"Submit Expense"**.
   - Enter category (Travel, Equipment, Meals), amount, and upload a receipt image.
   - **Expectation:** Record uploads with attached receipt preview. Status set to `pending`.
5. **Payslip Viewer:**
   - Navigate to `/payslips` (via user menu or sidebar).
   - View historical monthly payslips.
   - Click to inspect breakdown: Basic, HRA, Special Allowance, PF, and Tax Deductions.
   - **Expectation:** Values match genuine payroll records in `public.payroll_records`.

---

### Test Suite 5: Secure Candidate Onboarding Flow (End-to-End)
**Actor:** External Candidate (`candidate.qa@grevya.com`)

1. **Generate Token:**
   - As HR Manager (`hr@grevya.com`), invite a new candidate with email `candidate.qa@grevya.com`, Role: `employee`, Department: `Marketing`.
   - Copy the generated onboarding URL:
     `http://localhost:4173/accept-invitation?token=<64-char-hex-token>`
2. **Access Onboarding Portal:**
   - Open the URL in an Incognito / Private browser tab.
   - **Expectation:**
     - The page invokes `validate_invitation_token(p_token)`.
     - Shows a welcome card: *"Welcome to Grevya, Candidate QA!"*
     - Displays pre-assigned details: Role `Employee`, Department `Marketing`, Email `candidate.qa@grevya.com`.
3. **Password Setup & Code of Conduct:**
   - Candidate enters new password (minimum 8 characters, letters and numbers).
   - Confirms password.
   - Checks the "I agree to Grevya Code of Conduct and Security Policies" checkbox.
   - Clicks **"Complete Setup & Activate Account"**.
4. **Account Activation:**
   - **Expectation:**
     - System provisions the user in Supabase Auth.
     - Auth trigger `handle_new_user()` creates an active profile linked to the invitation.
     - Invitation marked as `accepted`.
     - Displays success modal with "Sign In Now" button.
5. **First Login Verification:**
   - Candidate logs in with their newly set password.
   - Lands on Employee Dashboard with their pre-assigned department and active status.

---

## 4. Hardware & Browser Permission Requirements

| Feature | Browser Permission | Fallback Handling |
| :--- | :--- | :--- |
| **Webcam Verification** | `navigator.mediaDevices.getUserMedia({ video: true })` | User prompted with an exception form requiring documented justification for audit review. |
| **GPS Geolocation** | `navigator.geolocation.getCurrentPosition(...)` | Device without GPS falls back to IP/documented exception workflow. |
| **Private Photos** | Signed URL generation via Supabase Storage API | Signed tokens expire after 3600 seconds (1 hour) to prevent URL sharing. |

---

## 5. Defect Reporting & Severity Classification

If any unexpected behavior occurs during testing, please document:
1. **Role & Account Used**
2. **URL / Page Route**
3. **Browser Console Output (`F12 -> Console`)**
4. **Network Request Status (`F12 -> Network`)**

| Severity | Definition | Target Resolution Time |
| :--- | :--- | :--- |
| **Critical (P0)** | Blocks login, crashes application, or leaks cross-tenant data | Immediate hotfix |
| **Major (P1)** | Primary workflow failure (e.g. punch fails to save, approval fails) | Within 4 hours |
| **Minor (P2)** | UI layout glitch or non-blocking cosmetic alignment | Within 24 hours |
| **Trivial (P3)** | Wording or typography improvement | Next sprint |
