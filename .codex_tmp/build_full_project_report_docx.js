const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.codex_tmp', 'full_project_report_pkg');
const outDocx = path.join(root, 'Grevya_HR_Full_Project_Report.docx');
const outZip = path.join(root, '.codex_tmp', 'Grevya_HR_Full_Project_Report.zip');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function write(rel, content) {
  const full = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function run(text, opts = {}) {
  const props = [];
  if (opts.bold) props.push('<w:b/>');
  if (opts.italic) props.push('<w:i/>');
  if (opts.size) props.push(`<w:sz w:val="${opts.size * 2}"/>`);
  if (opts.color) props.push(`<w:color w:val="${opts.color}"/>`);
  if (opts.font) props.push(`<w:rFonts w:ascii="${esc(opts.font)}" w:hAnsi="${esc(opts.font)}"/>`);
  return `<w:r>${props.length ? `<w:rPr>${props.join('')}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function para(text, style = 'BodyText', opts = {}) {
  const pPr = [];
  if (style) pPr.push(`<w:pStyle w:val="${style}"/>`);
  if (opts.align) pPr.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.keepNext) pPr.push('<w:keepNext/>');
  if (opts.pageBreakBefore) pPr.push('<w:pageBreakBefore/>');
  if (opts.numId) {
    pPr.push(`<w:numPr><w:ilvl w:val="${opts.level || 0}"/><w:numId w:val="${opts.numId}"/></w:numPr>`);
  }
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${run(text, opts.run || {})}</w:p>`;
}

function richPara(parts, style = 'BodyText', opts = {}) {
  const pPr = [];
  if (style) pPr.push(`<w:pStyle w:val="${style}"/>`);
  if (opts.align) pPr.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.keepNext) pPr.push('<w:keepNext/>');
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${parts.map(([text, rOpts]) => run(text, rOpts || {})).join('')}</w:p>`;
}

function cell(content, width, opts = {}) {
  const fill = opts.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>` : '';
  const vAlign = '<w:vAlign w:val="center"/>';
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill}${vAlign}</w:tcPr>${content}</w:tc>`;
}

function table(rows, widths, opts = {}) {
  const grid = widths.map(width => `<w:gridCol w:w="${width}"/>`).join('');
  const tblW = widths.reduce((sum, width) => sum + width, 0);
  const borderColor = opts.borderColor || 'D9DEE8';
  const borders = `<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/><w:left w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/><w:right w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/></w:tblBorders>`;
  const margins = '<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>';
  const body = rows.map((row, rowIndex) => {
    const fill = rowIndex === 0 && opts.header ? 'F2F4F7' : undefined;
    const cells = row.map((text, colIndex) => {
      const style = rowIndex === 0 && opts.header ? 'TableHeader' : 'TableBody';
      return cell(para(text, style), widths[colIndex], { fill });
    }).join('');
    return `<w:tr>${cells}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${tblW}" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}${margins}</w:tblPr><w:tblGrid>${grid}</w:tblGrid>${body}</w:tbl>`;
}

function callout(title, body, fill = 'F4F6F9') {
  const content = richPara([[title, { bold: true, color: '0B2545' }], [' - ' + body, {}]], 'TableBody');
  return `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="D9DEE8"/><w:left w:val="single" w:sz="6" w:space="0" w:color="D9DEE8"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="D9DEE8"/><w:right w:val="single" w:sz="6" w:space="0" w:color="D9DEE8"/></w:tblBorders><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr>${cell(content, 9360, { fill })}</w:tr></w:tbl>`;
}

function bullets(items) {
  return items.map(item => para(item, 'ListParagraph', { numId: 1 })).join('');
}

const body = [];

body.push(para('GREYVA HR PORTAL', 'Kicker'));
body.push(para('Full Project Report', 'TitleText'));
body.push(para('Comprehensive technical and functional review of the React HR portal, demo data model, state management, backend alternatives, build health, risks, and recommended roadmap.', 'SubtitleText'));
body.push(table([
  ['Prepared for', 'Grevya HR project workspace'],
  ['Prepared by', 'Codex'],
  ['Report date', 'June 16, 2026'],
  ['Primary app path', 'D:\\Projects\\HR\\HR'],
  ['Secondary backend paths', 'D:\\Projects\\HR\\backend and D:\\Projects\\HR\\springboot-backend'],
  ['Verification run', 'npm.cmd run build failed because src/components/ui/Toast.tsx is missing']
], [2100, 7260]));

body.push(para('1. Executive Summary', 'Heading1'));
body.push(callout('Overall status', 'The project is a strong HR portal prototype with broad product coverage, polished UI structure, role-based navigation, and rich mock HR workflows. It is not currently production-ready because the active frontend build is broken, data persistence is mostly browser-local, and there are multiple backend implementations that are not consistently integrated.'));
body.push(para('The active user experience is a React/Vite single-page app. Authentication currently runs against demo users in src/data/mockData.ts through a Zustand store, then persists current user and editable HR records in localStorage. This means most workflows work as a local demo without a running backend. However, the recruitment page still calls the Express API on localhost:3001 for jobs and candidates, creating a mixed data architecture.'));
body.push(para('The repository also contains two backend directions. The Express/SQLite backend exposes JWT-protected endpoints backed by better-sqlite3, while springboot-backend exposes similar in-memory endpoints on port 8080. The Spring Boot README says Vite proxies /api to Spring Boot, but vite.config.ts does not define that proxy. This mismatch should be resolved before the project is treated as an integrated full-stack app.'));

body.push(para('2. Project Inventory', 'Heading1'));
body.push(table([
  ['Area', 'Technology / Path', 'Current role'],
  ['Frontend app', 'HR: React 18, TypeScript, Vite, Zustand, Recharts, Lucide', 'Main active product experience.'],
  ['State layer', 'HR/src/services/store.ts', 'Zustand store using localStorage and mockData for most app data.'],
  ['Mock data', 'HR/src/data/mockData.ts', 'Seeds users, employees, HR managers, leaves, notifications, AI insights, payslips, and analytics data.'],
  ['Express backend', 'HR/backend and top-level backend', 'SQLite/JWT API on port 3001; partially referenced by RecruitmentPage.'],
  ['Spring Boot backend', 'springboot-backend', 'Java 17 / Spring Boot API on port 8080 with in-memory collections.'],
  ['Generated output', 'HR/dist and springboot-backend/target', 'Build artifacts present in the workspace.'],
  ['Brand asset', 'HR/src/brandimage/icon-192.png', 'Used on login and sidebar identity surfaces.']
], [2100, 3200, 4060], { header: true }));

body.push(para('3. Product Capabilities', 'Heading1'));
body.push(para('The UI covers a broad HR operating surface, including admin controls, employee lifecycle management, leave workflows, attendance, performance, recruiting, onboarding, expenses, analytics, notifications, and employee self-service views.'));
body.push(table([
  ['Capability', 'Implemented surface', 'Notes'],
  ['Role-specific dashboard', 'AdminDashboard, HRDashboard, ManagerDashboard, EmployeeDashboard', 'Dashboard changes according to currentUser.role.'],
  ['Employee management', 'EmployeesPage', 'Create, update, delete, credential sharing, status and employee profile workflows.'],
  ['HR manager management', 'HRManagersPage', 'Admin-only manager CRUD and status toggling.'],
  ['Leave management', 'LeavePage', 'Apply, approve, reject, comment, and track leave requests.'],
  ['Attendance', 'AttendancePage', 'Attendance summary and record-oriented views based on mock data.'],
  ['Performance', 'PerformancePage', 'Performance and department analytics using Recharts.'],
  ['Recruitment', 'RecruitmentPage', 'Candidate pipeline and job openings; currently API-coupled to localhost:3001.'],
  ['Org chart', 'OrgChartPage', 'Visual hierarchy and reporting structure.'],
  ['Expenses', 'ExpensesPage', 'Claim submission and approval/rejection simulation.'],
  ['Onboarding', 'OnboardingPage', 'New-hire task tracking.'],
  ['Calendar', 'CalendarPage', 'Events, holidays, and schedule-oriented HR view.'],
  ['AI features', 'AIInsightCard, AIChat, AIPage', 'Static/demo AI insights and chat-style assistant UI.'],
  ['Employee self-service', 'PayslipsPage, ProfilePage, NotificationsPage', 'Employee views for payroll, profile, and notifications.']
], [1900, 2800, 4660], { header: true }));

body.push(para('4. Active Architecture', 'Heading1'));
body.push(table([
  ['Layer', 'Current implementation', 'Observation'],
  ['Routing / page selection', 'App.tsx keeps current page in local component state, not react-router routes.', 'Simple and demo-friendly, but browser URLs do not represent page state.'],
  ['Authentication', 'store.login checks DEMO_USERS and writes grevya.currentUser to localStorage.', 'Works offline but is not secure or server-authoritative.'],
  ['Data store', 'Zustand store plus localStorage keys: user, employees, leaveRequests, notifications, hrManagers.', 'Fast for demo use; no multi-device persistence or server consistency.'],
  ['Authorization', 'Sidebar filters nav items by UserRole; page rendering uses currentUser.role.', 'Good UX-level separation but not a server-side security boundary.'],
  ['Backend calls', 'RecruitmentPage directly fetches localhost:3001 endpoints.', 'Partial backend coupling creates inconsistent app behavior when Express is not running.'],
  ['Styling', 'Large CSS system in styles.css plus inline styles in many pages.', 'Effective for rapid UI work, but style logic is spread across CSS and components.']
], [1900, 3600, 3860], { header: true }));

body.push(para('5. Authentication and Roles', 'Heading1'));
body.push(para('The active login flow is local and demo-oriented. LoginPage provides four demo accounts and calls useStore().login. The store normalizes email, matches password against DEMO_USERS, removes the password field from the user object, persists the user in localStorage, and then loads local data sets.'));
body.push(table([
  ['Role', 'Demo email', 'Password', 'Main access pattern'],
  ['Admin', 'admin@grevya.com', 'admin123', 'Admin dashboard, HR managers, employees, leave, attendance, reports.'],
  ['HR Manager', 'hr@grevya.com', 'hr123', 'Main HR dashboard, employee and HR workflows, recruitment, AI insights.'],
  ['Manager', 'manager@grevya.com', 'mgr123', 'Team-oriented dashboard, employees, leave, recruitment, onboarding, reports.'],
  ['Employee', 'employee@grevya.com', 'emp123', 'Employee dashboard, leave, attendance, performance, expenses, payslips, profile.']
], [1600, 2500, 1500, 3760], { header: true }));
body.push(callout('Security note', 'Credentials are stored in source mock data and authentication is performed entirely in the browser. This is acceptable for a local demo, but not for production or sensitive HR data.'));

body.push(para('6. Data Model Overview', 'Heading1'));
body.push(para('The TypeScript model defines users, employees, HR managers, leave requests, attendance records, notifications, AI insights, performance data, department stats, badges, chat messages, and payslips. The primary editable records in the active frontend are employees, HR managers, leave requests, and notifications.'));
body.push(table([
  ['Entity', 'Key fields', 'Current persistence'],
  ['User', 'id, name, email, role, department, position, avatar, joinDate, managerId', 'DEMO_USERS plus localStorage current user.'],
  ['Employee', 'identity, department, salary, performance, attendance, managerId, points, badges, streak', 'mockData initial seed, then localStorage.'],
  ['HRManager', 'name, email, department, status, contact, location', 'mockData initial seed, then localStorage.'],
  ['LeaveRequest', 'employee, department, type, dates, days, reason, status, approver, comments', 'mockData initial seed, then localStorage.'],
  ['Notification', 'title, message, type, timestamp, read', 'mockData initial seed, then localStorage.'],
  ['Recruitment candidate/job', 'candidate stage, score, note; job department, openings, status', 'RecruitmentPage uses API calls rather than the main store.'],
  ['Analytics data', 'performance, department stats, AI insights, leaderboard, payslips', 'Static arrays in mockData.']
], [2000, 4100, 3260], { header: true }));

body.push(para('7. Backend Implementations', 'Heading1'));
body.push(para('There are two backend implementations in the workspace. They overlap in purpose but differ in persistence and integration state.'));
body.push(table([
  ['Backend', 'Runtime', 'Storage', 'Port', 'Strengths', 'Concerns'],
  ['Express / SQLite', 'Node + Express + better-sqlite3 + jsonwebtoken', 'SQLite grevya.db', '3001', 'Persistent local database, JWT-style auth, role checks on protected routes.', 'Native SQLite dependency can break across Node versions; current frontend no longer uses it for login/core data.'],
  ['Spring Boot', 'Java 17 + Spring Boot 3.3.6', 'In-memory CopyOnWriteArrayList collections', '8080', 'Simple typed API, validation annotations, CORS for Vite.', 'No durable persistence, no token auth, README proxy claim does not match vite.config.ts.']
], [1400, 2000, 1200, 800, 2000, 1960], { header: true }));
body.push(para('The Express backend is the only backend currently referenced by frontend source, and only from RecruitmentPage. The Spring Boot backend is documented as an API for the React app, but the active Vite config contains only the React plugin and no proxy section.'));

body.push(para('8. Build and Verification Status', 'Heading1'));
body.push(table([
  ['Check', 'Command', 'Result', 'Impact'],
  ['Frontend production build', 'npm.cmd run build in D:\\Projects\\HR\\HR', 'Failed', 'TypeScript cannot resolve ./components/ui/Toast.'],
  ['Missing file check', 'Get-ChildItem src\\components\\ui', 'Only GlobalSearch.tsx and StatCard.tsx exist', 'Toast imports are unresolved.'],
  ['Toast import search', 'rg Toast src', 'App and six pages import Toast or toast', 'Multiple workflows depend on the missing module.'],
  ['Vite proxy check', 'vite.config.ts', 'No server.proxy configured', 'Spring Boot README proxy guidance is not implemented.']
], [1900, 2600, 2360, 2500], { header: true }));
body.push(callout('Blocking issue', 'The project cannot currently pass the frontend build until src/components/ui/Toast.tsx is restored or all toast imports are replaced.'));

body.push(para('9. Key Technical Findings', 'Heading1'));
body.push(bullets([
  'The active app is more complete as a frontend demo than as a full-stack system.',
  'The state layer is internally consistent for employees, HR managers, leaves, notifications, and current user, but recruitment bypasses that layer.',
  'Role-based navigation is well represented in the sidebar, but page-level and backend-level enforcement is incomplete or inconsistent.',
  'The project has backend duplication: two Express backend folders plus a Spring Boot backend.',
  'The frontend build is currently broken because Toast.tsx is deleted or missing.',
  'Several files include mojibake-style text where emoji or special characters were encoded incorrectly, which may affect UI polish.',
  'There is no automated test suite for frontend components, store behavior, or backend endpoints.',
  'Demo credentials and plain-text passwords appear in both frontend mock data and backend seed code.'
]));

body.push(para('10. Risk Register', 'Heading1'));
body.push(table([
  ['Risk', 'Severity', 'Evidence', 'Recommended response'],
  ['Build failure', 'Critical', 'npm.cmd run build fails on missing Toast.tsx.', 'Restore Toast component or remove imports; add build check to routine workflow.'],
  ['Mixed data architecture', 'High', 'Store uses localStorage while RecruitmentPage fetches localhost:3001.', 'Choose one data strategy and refactor all pages through it.'],
  ['Backend ambiguity', 'High', 'Express and Spring Boot APIs both exist; Vite does not proxy Spring Boot.', 'Declare one canonical backend for the project.'],
  ['Security model is demo-only', 'High', 'Passwords in source, local auth, hard-coded JWT secret in Express.', 'Use hashed passwords, environment secrets, and server-side sessions/JWT validation.'],
  ['No persistence for Spring Boot', 'Medium', 'Spring backend stores records in memory only.', 'Add database persistence if Spring Boot is selected.'],
  ['Native dependency fragility', 'Medium', 'better-sqlite3 requires ABI-compatible native build.', 'Pin Node version and reinstall dependencies after runtime upgrades.'],
  ['No tests', 'Medium', 'No test scripts or visible test suites.', 'Add unit tests for store logic and API tests for backend endpoints.'],
  ['Repository hygiene', 'Medium', 'Generated artifacts and local dependency caches appear in git status.', 'Ignore build outputs, node_modules, .m2, .tools, and target folders.']
], [2100, 1200, 3060, 3000], { header: true }));

body.push(para('11. Recommended Roadmap', 'Heading1'));
body.push(para('Immediate stabilization', 'Heading2'));
body.push(bullets([
  'Restore src/components/ui/Toast.tsx and rerun npm.cmd run build.',
  'Decide whether the active app should remain localStorage-only for demo use or become fully API-backed.',
  'If API-backed, update store.ts to use a shared API client instead of direct localStorage persistence.',
  'Move RecruitmentPage away from hard-coded localhost:3001 fetches and into the same store/API layer as other modules.'
]));
body.push(para('Backend consolidation', 'Heading2'));
body.push(bullets([
  'Pick Express/SQLite or Spring Boot as the canonical backend.',
  'If choosing Express, remove or archive Spring Boot to avoid confusion and upgrade/pin better-sqlite3 safely.',
  'If choosing Spring Boot, add Vite proxy configuration or an API base URL, add persistence, and implement authentication tokens.',
  'Document one run path in the root README with exact frontend and backend commands.'
]));
body.push(para('Production hardening', 'Heading2'));
body.push(bullets([
  'Replace browser-only auth with server-side authentication and authorization.',
  'Hash all passwords and move secrets to environment variables.',
  'Add validation and authorization checks to every mutating backend route.',
  'Add error boundaries and user-friendly API failure messages.',
  'Add unit, integration, and build verification workflows.'
]));

body.push(para('12. Suggested Target Architecture', 'Heading1'));
body.push(table([
  ['Concern', 'Recommended target'],
  ['Frontend', 'React/Vite app with clear route state, shared API client, and role-aware UI.'],
  ['State', 'Zustand for UI/session cache only; server remains source of truth for HR records.'],
  ['API', 'Single backend selected and documented; all pages use the same base URL strategy.'],
  ['Persistence', 'SQLite/Postgres or another durable database behind the selected backend.'],
  ['Auth', 'Server-issued token/session, hashed passwords, role claims, protected endpoints.'],
  ['Config', 'Environment variables for API base URL, secrets, CORS origins, and database path.'],
  ['Quality gate', 'npm build, backend tests, and API smoke tests before delivery.']
], [2000, 7360], { header: true }));

body.push(para('13. Run Instructions', 'Heading1'));
body.push(para('Current frontend demo path', 'Heading2'));
body.push(para('cd D:\\Projects\\HR\\HR', 'CodeBlock'));
body.push(para('npm.cmd run dev', 'CodeBlock'));
body.push(para('The active login flow can work without a backend for the main localStorage-backed pages, once the Toast component issue is fixed for builds. Recruitment currently expects the Express backend for jobs and candidates.'));
body.push(para('Express backend path', 'Heading2'));
body.push(para('cd D:\\Projects\\HR\\HR\\backend', 'CodeBlock'));
body.push(para('npm.cmd start', 'CodeBlock'));
body.push(para('Runs on http://localhost:3001 and exposes JWT-protected endpoints for users, employees, leave requests, notifications, jobs, and candidates.'));
body.push(para('Spring Boot backend path', 'Heading2'));
body.push(para('cd D:\\Projects\\HR\\springboot-backend', 'CodeBlock'));
body.push(para('mvn spring-boot:run', 'CodeBlock'));
body.push(para('Runs on http://localhost:8080. The README says React proxies /api to this backend, but the current Vite config does not contain a proxy; add one before relying on this integration.'));

body.push(para('14. Appendix: Important Files', 'Heading1'));
body.push(table([
  ['File', 'Purpose'],
  ['HR/src/App.tsx', 'App shell, page selection, role-specific dashboard routing, landing/login/app view transitions.'],
  ['HR/src/services/store.ts', 'Zustand store, localStorage persistence, demo auth, employee/HR manager/leave/notification mutations.'],
  ['HR/src/data/mockData.ts', 'Main seed data and demo users.'],
  ['HR/src/components/layout/Sidebar.tsx', 'Role-filtered navigation and logout.'],
  ['HR/src/components/layout/Topbar.tsx', 'Global search launcher, notifications, theme toggle, user menu.'],
  ['HR/src/components/ui/GlobalSearch.tsx', 'Keyboard-accessible page/employee/leave search overlay.'],
  ['HR/src/pages/RecruitmentPage.tsx', 'Candidate and job workflows; direct calls to Express API.'],
  ['HR/backend/server.js', 'Express API routes and JWT middleware.'],
  ['HR/backend/db.js', 'SQLite schema and seed data.'],
  ['springboot-backend/src/main/java/com/grevya/hrportal/HrPortalApiApplication.java', 'Spring Boot in-memory API implementation.'],
  ['HR/vite.config.ts', 'Vite setup; currently React plugin only, no backend proxy.']
], [3600, 5760], { header: true }));

const sectPr = '<w:sectPr><w:headerReference w:type="default" r:id="rId7"/><w:footerReference w:type="default" r:id="rId8"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>';

write('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

write('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

write('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`);

write('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" mc:Ignorable=""><w:body>${body.join('')}${sectPr}</w:body></w:document>`);

write('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="120" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Kicker"><w:name w:val="Kicker"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:caps/><w:color w:val="1F4D78"/><w:sz w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TitleText"><w:name w:val="Title Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="0B2545"/><w:sz w:val="48"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="SubtitleText"><w:name w:val="Subtitle Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="240" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="555555"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="2E74B5"/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="160" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="0B2545"/><w:sz w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableBody"><w:name w:val="Table Body"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock"><w:name w:val="Code Block"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="40" w:after="40"/><w:ind w:left="240"/><w:shd w:val="clear" w:color="auto" w:fill="F6F8FA"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/><w:color w:val="24292F"/></w:rPr></w:style>
</w:styles>`);

write('word/numbering.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`);

write('word/settings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/></w:settings>`);

write('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="BodyText"/><w:jc w:val="right"/></w:pPr>${run('Grevya HR Portal | Full Project Report', { size: 9, color: '666666' })}</w:p></w:hdr>`);

write('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="BodyText"/><w:jc w:val="center"/></w:pPr>${run('Prepared June 16, 2026', { size: 9, color: '666666' })}</w:p></w:ftr>`);

write('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Grevya HR Full Project Report</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-16T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-16T00:00:00Z</dcterms:modified></cp:coreProperties>`);

write('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex OOXML Builder</Application></Properties>`);

fs.rmSync(outDocx, { force: true });
fs.rmSync(outZip, { force: true });
execFileSync('powershell.exe', [
  '-NoProfile',
  '-Command',
  `Compress-Archive -Path '${outDir}\\*' -DestinationPath '${outZip}' -Force`
], { stdio: 'inherit' });
fs.copyFileSync(outZip, outDocx);
console.log(outDocx);
