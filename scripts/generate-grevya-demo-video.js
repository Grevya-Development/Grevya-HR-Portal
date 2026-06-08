const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const sharp = require('sharp');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'frontend', 'public', 'videos');
const workDir = path.join(outDir, '.grevya-demo-build');
const framesDir = path.join(workDir, 'frames');
const output = path.join(outDir, 'grevya-hr-demo.mp4');
const narrationFile = path.join(workDir, 'narration.wav');
const musicFile = path.join(workDir, 'music.wav');
const narrationTextFile = path.join(workDir, 'narration.txt');
const logoPng = path.join(root, 'frontend', 'public', 'brand', 'grevya-logo.png');
const logoDataUri = `data:image/png;base64,${fs.readFileSync(logoPng).toString('base64')}`;

const W = 1920;
const H = 1080;
const FPS = 4;
const OUT_FPS = 30;
const SCENE_DURATION = 10;
const SAMPLE_RATE = 48000;

const scenes = [
  {
    section: 'Opening',
    title: 'Grevya HR Portal',
    body: 'A modern workforce and HR platform designed for growing organizations.',
    tag: 'Built for startups, SMEs, and growing teams',
    ui: 'hero',
    cursor: [1430, 650],
    counters: [
      ['Employees', 247],
      ['Attendance', 94, '%'],
      ['Leave Requests', 12],
    ],
    narration: 'Welcome to Grevya HR Portal, a modern workforce and human resource management platform designed for growing organizations.',
  },
  {
    section: 'Landing Overview',
    title: 'A polished product experience',
    body: 'Clear product messaging, feature sections, workflow previews, and a direct path into the HR portal.',
    tag: 'Professional Grevya green brand experience',
    ui: 'landing',
    cursor: [1415, 422],
    narration: 'The landing experience introduces Grevya with a focused product story, clear benefits, and a local demo video that plays directly inside the website.',
  },
  {
    section: 'Secure Authentication',
    title: 'Secure login for every user',
    body: 'Email password and Google sign-in connect to approved profiles while unknown users stay outside the portal.',
    tag: 'No automatic access for unknown users',
    ui: 'login',
    cursor: [1360, 664],
    narration: 'Secure authentication and role based access ensure every user only sees the information relevant to their responsibilities.',
  },
  {
    section: 'Founder Access',
    title: 'Super Admin control',
    body: 'Founder level visibility keeps critical controls available to authorized leadership only.',
    tag: 'Complete platform control',
    ui: 'dashboard',
    cursor: [1168, 438],
    narration: 'Founder and super admin access provides complete platform control, while sensitive operations remain protected by backend checks and database policies.',
  },
  {
    section: 'Access Request Workflow',
    title: 'Request, review, approve',
    body: 'New users request access, HR reviews details, assigns role and profile data, then grants secure access.',
    tag: 'Reviewer tracking, approval history, role assignment',
    ui: 'access',
    cursor: [1478, 715],
    narration: 'New employees can request access while administrators review, approve, assign roles, and grant secure access to the platform.',
  },
  {
    section: 'Role-Based Access Control',
    title: 'Every role gets the right scope',
    body: 'Employees see self service data, managers handle direct reports, HR runs people operations, and founders retain oversight.',
    tag: 'Backend and RLS enforced access',
    ui: 'rbac',
    cursor: [1325, 568],
    narration: 'With role based access, employees see only their own information, managers handle their teams, HR manages people operations, and founders retain full administrative control.',
  },
  {
    section: 'Employee Management',
    title: 'Centralized employee records',
    body: 'Manage employee profiles, departments, reporting structure, lifecycle status, and visibility rules from one workspace.',
    tag: 'Immediate create and update feedback',
    ui: 'employees',
    cursor: [1470, 346],
    counters: [
      ['Active Employees', 247],
      ['Departments', 8],
      ['Managers', 18],
    ],
    narration: 'Manage employee profiles, departments, reporting structures, and workforce information from a centralized dashboard.',
  },
  {
    section: 'Attendance Tracking',
    title: 'Daily attendance visibility',
    body: 'Track check ins, work mode, regularization, WFH requests, overtime, and scoped team attendance.',
    tag: 'Clear attendance workflows',
    ui: 'attendance',
    cursor: [1398, 642],
    narration: 'Track attendance, manage work from home and regularization requests, and keep attendance workflows moving without manual follow up.',
  },
  {
    section: 'Leave Management',
    title: 'Leave requests stay in motion',
    body: 'Employees apply, managers approve scoped team requests, and HR monitors leave patterns across the organization.',
    tag: 'Approvals, balances, and audit trail',
    ui: 'leave',
    cursor: [1498, 584],
    counters: [
      ['Pending', 12],
      ['Approved', 36],
      ['Balance Days', 18],
    ],
    narration: 'Track leave applications, approvals, balances, and decision history so employees and managers always know what is pending.',
  },
  {
    section: 'Payroll & Payslips',
    title: 'Payroll with privacy built in',
    body: 'Generate payroll records, payslips, and compensation reporting while keeping salary data isolated.',
    tag: 'Sensitive salary data protected',
    ui: 'payroll',
    cursor: [1485, 730],
    narration: 'Generate payroll records, payslips, and compensation reports efficiently, while keeping payroll visibility limited to authorized users.',
  },
  {
    section: 'Performance Reviews',
    title: 'Structured performance cycles',
    body: 'Run review cycles, self assessments, manager feedback, scores, and growth conversations.',
    tag: 'Private review data stays scoped',
    ui: 'performance',
    cursor: [1312, 626],
    narration: 'Conduct performance reviews, assign goals, capture manager feedback, and monitor employee growth in a structured review workflow.',
  },
  {
    section: 'Recruitment Management',
    title: 'Hiring pipeline clarity',
    body: 'Manage jobs, candidates, interview stages, offer decisions, and hire to employee handoff.',
    tag: 'Candidate stage updates and hiring flow',
    ui: 'recruitment',
    cursor: [1515, 542],
    narration: 'Manage candidates, interviews, hiring pipelines, and onboarding activities so recruitment stays connected to employee operations.',
  },
  {
    section: 'Documents & Expenses',
    title: 'Operational workflows together',
    body: 'Upload documents, submit expenses, review approvals, and keep workflow events auditable.',
    tag: 'Document and claim workflows in one place',
    ui: 'docs',
    cursor: [1428, 660],
    narration: 'Documents and expenses are handled through clear submission and review flows, with notifications and records kept in the same HR workspace.',
  },
  {
    section: 'Notifications',
    title: 'Real-time updates',
    body: 'Access requests, approvals, leave, payroll, performance, recruitment, documents, and announcements stay visible.',
    tag: 'Email plus in-app notification support',
    ui: 'notifications',
    cursor: [1508, 408],
    narration: 'Stay informed with real time notifications for approvals, payroll updates, performance reviews, recruitment updates, expenses, and employee activities.',
  },
  {
    section: 'Responsive Design',
    title: 'Ready on every screen',
    body: 'The portal adapts across mobile, tablet, laptop, and desktop views with clean navigation and responsive tables.',
    tag: 'Mobile, tablet, laptop, desktop',
    ui: 'responsive',
    cursor: [1288, 738],
    narration: 'Grevya is designed for practical daily use, with responsive layouts for mobile, tablet, laptop, and desktop workflows.',
  },
  {
    section: 'Workforce Insights',
    title: 'Streamline HR with Grevya',
    body: 'Reduce manual work, protect employee data, and keep HR workflows transparent, efficient, and scalable.',
    tag: 'Centralized HR operations for growing organizations',
    ui: 'closing',
    cursor: [960, 778],
    narration: 'Grevya HR Portal helps organizations simplify workforce management through a secure, scalable, and modern HR platform.',
  },
];

const totalFrames = scenes.length * SCENE_DURATION * FPS;
const totalDuration = totalFrames / FPS;

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[char]));
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp(t), 3);
}

function easeInOut(t) {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function smooth(start, end, value) {
  return easeInOut((value - start) / (end - start));
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(text, x, y, maxChars, fontSize, fill, weight = 500, lineGap = 1.32) {
  return wrapText(text, maxChars).map((line, i) => `
    <text x="${x}" y="${y + i * fontSize * lineGap}" fill="${fill}" font-size="${fontSize}" font-weight="${weight}" font-family="Inter, Arial">${esc(line)}</text>
  `).join('');
}

function grevyaLogoSvg(x = 0, y = 0, scale = 1, tile = true) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      ${tile ? '<rect x="0" y="0" width="256" height="256" rx="22" fill="#000000" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>' : ''}
      <image href="${logoDataUri}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid meet"/>
    </g>
  `;
}

function progressOpacity(p) {
  return clamp(smooth(0.03, 0.14, p) * (1 - smooth(0.92, 1, p)));
}

function cursor(scene, p) {
  const [tx, ty] = scene.cursor || [1420, 620];
  const move = smooth(0.18, 0.58, p);
  const x = lerp(1040, tx, move);
  const y = lerp(870, ty, move);
  const click = Math.sin(clamp((p - 0.58) / 0.2) * Math.PI);
  return `
    <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" opacity="${progressOpacity(p)}">
      <circle cx="13" cy="12" r="${(20 + click * 20).toFixed(1)}" fill="none" stroke="#86efac" stroke-width="4" opacity="${(0.48 * click).toFixed(2)}"/>
      <path d="M0 0 L0 54 L16 40 L27 66 L43 59 L31 35 L54 35 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
    </g>
  `;
}

function browserShell(inner, p, options = {}) {
  const scale = 0.94 + 0.04 * easeInOut(p);
  const y = 162 - 18 * smooth(0.05, 0.4, p);
  return `
    <g transform="translate(928 ${y.toFixed(1)}) scale(${scale.toFixed(4)})" filter="url(#shadow)">
      <rect width="720" height="610" rx="38" fill="${options.light ? '#f8fafc' : 'rgba(9,21,14,0.93)'}" stroke="${options.light ? '#dbe7df' : 'rgba(34,197,94,0.26)'}"/>
      <rect x="42" y="38" width="636" height="62" rx="18" fill="${options.light ? '#ffffff' : 'rgba(255,255,255,0.06)'}" stroke="${options.light ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}"/>
      <circle cx="74" cy="69" r="9" fill="#ef4444"/>
      <circle cx="104" cy="69" r="9" fill="#f59e0b"/>
      <circle cx="134" cy="69" r="9" fill="#22c55e"/>
      <text x="186" y="77" fill="${options.light ? '#64748b' : '#64748b'}" font-size="20" font-family="Inter, Arial">grevya.hr/${options.path || 'dashboard'}</text>
      ${inner}
    </g>
  `;
}

function kpiCards(scene, p) {
  const counters = scene.counters || [
    ['Workflows', 12],
    ['Approvals', 44],
    ['Privacy', 100, '%'],
  ];
  const counterProgress = smooth(0.22, 0.74, p);
  return counters.map(([label, value, suffix = ''], i) => {
    const count = Math.round(Number(value) * counterProgress);
    return `
      <g transform="translate(${1008 + i * 218} 326)">
        <rect width="186" height="112" rx="22" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.26)"/>
        <text x="22" y="44" fill="#94a3b8" font-size="19" font-family="Inter, Arial">${esc(label)}</text>
        <text x="22" y="86" fill="#4ade80" font-size="42" font-weight="900" font-family="Inter, Arial">${count}${esc(suffix)}</text>
      </g>
    `;
  }).join('');
}

function heroUi(scene, p) {
  const bars = [74, 92, 58, 84].map((w, i) => `
    <rect x="426" y="${254 + i * 48}" width="${(w * smooth(0.2, 0.82, p)).toFixed(1)}" height="18" rx="9" fill="${i === 1 ? '#22c55e' : '#334155'}"/>
  `).join('');
  return browserShell(`
    <text x="58" y="176" fill="#ffffff" font-size="42" font-weight="900" font-family="Inter, Arial">HR Command Center</text>
    ${kpiCards(scene, p).replaceAll('translate(1008', 'translate(58')}
    <rect x="58" y="478" width="598" height="82" rx="22" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.1)"/>
    <text x="88" y="528" fill="#e2e8f0" font-size="27" font-weight="800" font-family="Inter, Arial">Workflow visibility</text>
    ${bars}
  `, p, { path: 'dashboard' });
}

function landingUi(scene, p) {
  return browserShell(`
    <rect x="66" y="150" width="592" height="190" rx="30" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.25)"/>
    <text x="104" y="218" fill="#ffffff" font-size="40" font-weight="900" font-family="Inter, Arial">The HR Platform</text>
    <text x="104" y="268" fill="#4ade80" font-size="38" font-weight="900" font-family="Inter, Arial">Your Team Deserves</text>
    <rect x="104" y="304" width="186" height="50" rx="16" fill="#22c55e"/>
    <text x="136" y="337" fill="#052e16" font-size="21" font-weight="900" font-family="Inter, Arial">Get Started</text>
    <rect x="314" y="304" width="184" height="50" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)"/>
    <text x="344" y="337" fill="#ffffff" font-size="21" font-weight="900" font-family="Inter, Arial">Watch Demo</text>
    ${[0, 1, 2].map((i) => `
      <rect x="${74 + i * 208}" y="402" width="170" height="118" rx="20" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.1)"/>
      <text x="${104 + i * 208}" y="462" fill="#4ade80" font-size="32" font-weight="900" font-family="Inter, Arial">${Math.round([247, 94, 88][i] * smooth(0.25, 0.78, p))}${i === 1 ? '%' : ''}</text>
    `).join('')}
  `, p, { path: '', light: false });
}

function loginUi(scene, p) {
  const google = smooth(0.44, 0.78, p);
  return browserShell(`
    <rect x="156" y="148" width="408" height="432" rx="34" fill="#ffffff"/>
    <text x="206" y="220" fill="#0f172a" font-size="38" font-weight="900" font-family="Inter, Arial">Sign in</text>
    <rect x="206" y="260" width="308" height="54" rx="14" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="230" y="294" fill="#64748b" font-size="20" font-family="Inter, Arial">email@company.com</text>
    <rect x="206" y="336" width="308" height="54" rx="14" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="230" y="371" fill="#94a3b8" font-size="24" font-family="Inter, Arial">••••••••</text>
    <rect x="206" y="420" width="308" height="58" rx="16" fill="#16a34a"/>
    <text x="346" y="456" fill="#ffffff" font-size="22" font-weight="900" text-anchor="middle" font-family="Inter, Arial">Sign In</text>
    <rect x="206" y="498" width="308" height="58" rx="16" fill="#ffffff" stroke="#dbe7df" opacity="${google}"/>
    <text x="286" y="534" fill="#0f172a" font-size="21" font-weight="800" font-family="Inter, Arial" opacity="${google}">Continue with Google</text>
  `, p, { path: 'login', light: true });
}

function dashboardUi(scene, p) {
  return browserShell(`
    <rect x="52" y="134" width="190" height="460" rx="24" fill="rgba(255,255,255,0.055)"/>
    ${['Dashboard', 'Employees', 'Access Requests', 'Audit Log', 'Budget'].map((item, i) => `
      <rect x="72" y="${170 + i * 68}" width="150" height="44" rx="13" fill="${i === 0 ? 'rgba(34,197,94,0.18)' : 'transparent'}"/>
      <text x="90" y="${198 + i * 68}" fill="${i === 0 ? '#4ade80' : '#94a3b8'}" font-size="19" font-weight="800" font-family="Inter, Arial">${esc(item)}</text>
    `).join('')}
    <text x="286" y="176" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Founder View</text>
    ${kpiCards({ counters: [['Access', 100, '%'], ['Modules', 14], ['Audits', 73]] }, p).replaceAll('translate(1008', 'translate(286')}
    <rect x="286" y="488" width="380" height="78" rx="20" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.25)"/>
    <text x="316" y="536" fill="#bbf7d0" font-size="25" font-weight="800" font-family="Inter, Arial">Full HR/Admin permissions</text>
  `, p);
}

function accessUi(scene, p) {
  const labels = ['Employee', 'Request Access', 'HR Review', 'Assign Role', 'Approve'];
  return browserShell(`
    <text x="64" y="164" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Approval workflow</text>
    ${labels.map((label, i) => {
      const active = smooth(0.12 + i * 0.12, 0.24 + i * 0.12, p);
      return `
        <g transform="translate(${78 + i * 126} 276)" opacity="${0.38 + active * 0.62}">
          <circle cx="44" cy="44" r="${(28 + active * 12).toFixed(1)}" fill="${i === 4 ? '#22c55e' : 'rgba(34,197,94,0.14)'}" stroke="#22c55e" stroke-width="3"/>
          <text x="44" y="53" fill="#ffffff" font-size="24" font-weight="900" text-anchor="middle" font-family="Inter, Arial">${i + 1}</text>
          <text x="44" y="116" fill="#cbd5e1" font-size="17" font-weight="700" text-anchor="middle" font-family="Inter, Arial">${esc(label)}</text>
        </g>
        ${i < labels.length - 1 ? `<line x1="${184 + i * 126}" y1="320" x2="${228 + i * 126}" y2="320" stroke="#22c55e" stroke-width="5" opacity="${smooth(0.18 + i * 0.12, 0.34 + i * 0.12, p)}"/>` : ''}
      `;
    }).join('')}
    <rect x="96" y="500" width="548" height="64" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
    <text x="128" y="540" fill="#e2e8f0" font-size="22" font-family="Inter, Arial">Reviewed by super_admin • Role assigned • Notification sent</text>
  `, p);
}

function rbacUi(scene, p) {
  const roles = [
    ['Founder / Super Admin', 'Complete platform control', 360, 156],
    ['Admin', 'Organization wide HR access', 174, 344],
    ['HR Manager', 'HR operations lifecycle', 360, 344],
    ['Manager', 'Direct reports only', 546, 344],
    ['Employee', 'Self service access', 360, 512],
  ];
  return browserShell(`
    <text x="58" y="140" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Access hierarchy</text>
    <line x1="360" y1="242" x2="174" y2="344" stroke="#22c55e" stroke-width="4" opacity="${smooth(0.24, 0.54, p)}"/>
    <line x1="360" y1="242" x2="360" y2="344" stroke="#22c55e" stroke-width="4" opacity="${smooth(0.32, 0.62, p)}"/>
    <line x1="360" y1="242" x2="546" y2="344" stroke="#22c55e" stroke-width="4" opacity="${smooth(0.4, 0.7, p)}"/>
    <line x1="546" y1="430" x2="360" y2="512" stroke="#22c55e" stroke-width="4" opacity="${smooth(0.5, 0.78, p)}"/>
    ${roles.map(([role, desc, x, y], i) => {
      const a = smooth(0.12 + i * 0.08, 0.28 + i * 0.08, p);
      return `
        <g transform="translate(${x - 96} ${y - 48}) scale(${(0.88 + a * 0.12).toFixed(3)})" opacity="${a}">
          <rect width="192" height="96" rx="22" fill="${i === 0 ? '#16a34a' : 'rgba(255,255,255,0.07)'}" stroke="rgba(34,197,94,0.3)"/>
          <text x="96" y="38" fill="#ffffff" font-size="18" font-weight="900" text-anchor="middle" font-family="Inter, Arial">${esc(role)}</text>
          <text x="96" y="67" fill="${i === 0 ? '#dcfce7' : '#94a3b8'}" font-size="14" text-anchor="middle" font-family="Inter, Arial">${esc(desc)}</text>
        </g>
      `;
    }).join('')}
  `, p);
}

function employeesUi(scene, p) {
  const rows = ['Aarav Mehta', 'Priya Nair', 'Rahul Shah', 'Sneha Rao'];
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Employees</text>
    <rect x="534" y="116" width="128" height="48" rx="15" fill="#22c55e"/>
    <text x="556" y="147" fill="#052e16" font-size="19" font-weight="900" font-family="Inter, Arial">Add Employee</text>
    ${kpiCards(scene, p).replaceAll('translate(1008', 'translate(58').replaceAll('326)', '206)')}
    <rect x="58" y="368" width="606" height="226" rx="24" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.1)"/>
    ${rows.map((row, i) => `
      <line x1="88" y1="${424 + i * 46}" x2="632" y2="${424 + i * 46}" stroke="rgba(255,255,255,0.08)"/>
      <text x="92" y="${406 + i * 46}" fill="#e2e8f0" font-size="20" font-family="Inter, Arial">${row}</text>
      <text x="438" y="${406 + i * 46}" fill="#94a3b8" font-size="18" font-family="Inter, Arial">${i % 2 ? 'Engineering' : 'Operations'}</text>
      <circle cx="612" cy="${399 + i * 46}" r="9" fill="#22c55e"/>
    `).join('')}
  `, p);
}

function attendanceUi(scene, p) {
  const steps = ['Check-in', 'Work mode', 'Regularize', 'Approve'];
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Attendance</text>
    <rect x="58" y="214" width="606" height="124" rx="26" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.24)"/>
    <text x="92" y="266" fill="#bbf7d0" font-size="28" font-weight="900" font-family="Inter, Arial">94% attendance rate</text>
    <text x="92" y="306" fill="#94a3b8" font-size="22" font-family="Inter, Arial">Today: 219 present, 18 WFH, 10 leave</text>
    ${steps.map((step, i) => {
      const a = smooth(0.16 + i * 0.13, 0.34 + i * 0.13, p);
      return `
        <g transform="translate(${74 + i * 160} 438)" opacity="${0.35 + a * 0.65}">
          <rect width="130" height="96" rx="22" fill="${i === 2 ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)'}" stroke="rgba(255,255,255,0.1)"/>
          <text x="65" y="56" fill="#e2e8f0" font-size="20" font-weight="800" text-anchor="middle" font-family="Inter, Arial">${esc(step)}</text>
        </g>
      `;
    }).join('')}
  `, p);
}

function leaveUi(scene, p) {
  const states = [['Applied', 18], ['Pending', 12], ['Approved', 36], ['Rejected', 3]];
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Leave</text>
    ${states.map(([label, value], i) => {
      const count = Math.round(value * smooth(0.18, 0.76, p));
      return `
        <g transform="translate(${72 + (i % 2) * 306} ${220 + Math.floor(i / 2) * 154})">
          <rect width="264" height="118" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
          <text x="28" y="48" fill="#94a3b8" font-size="21" font-family="Inter, Arial">${label}</text>
          <text x="28" y="92" fill="${i === 2 ? '#22c55e' : '#ffffff'}" font-size="44" font-weight="900" font-family="Inter, Arial">${count}</text>
        </g>
      `;
    }).join('')}
    <rect x="92" y="552" width="520" height="54" rx="18" fill="#22c55e" opacity="${smooth(0.58, 0.78, p)}"/>
    <text x="246" y="587" fill="#052e16" font-size="22" font-weight="900" font-family="Inter, Arial" opacity="${smooth(0.58, 0.78, p)}">Manager approval recorded</text>
  `, p);
}

function payrollUi(scene, p) {
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Payslip</text>
    <rect x="94" y="204" width="512" height="402" rx="32" fill="#f8fafc"/>
    <text x="132" y="272" fill="#0f172a" font-size="34" font-weight="900" font-family="Inter, Arial">June Payroll</text>
    ${['Basic salary', 'Allowances', 'Deductions', 'Net pay'].map((row, i) => `
      <rect x="132" y="${312 + i * 70}" width="436" height="48" rx="13" fill="${i === 3 ? '#dcfce7' : '#ffffff'}" stroke="#e2e8f0"/>
      <text x="154" y="${343 + i * 70}" fill="#334155" font-size="19" font-family="Inter, Arial">${row}</text>
      <text x="532" y="${343 + i * 70}" fill="${i === 3 ? '#16a34a' : '#64748b'}" font-size="19" font-weight="900" text-anchor="end" font-family="Inter, Arial">${i === 3 ? 'Ready' : 'Private'}</text>
    `).join('')}
    <rect x="374" y="538" width="194" height="48" rx="14" fill="#16a34a" opacity="${smooth(0.55, 0.76, p)}"/>
    <text x="410" y="569" fill="#ffffff" font-size="19" font-weight="900" font-family="Inter, Arial" opacity="${smooth(0.55, 0.76, p)}">Generate Payslip</text>
  `, p, { light: true, path: 'payroll' });
}

function performanceUi(scene, p) {
  const ring = 360 * smooth(0.18, 0.78, p);
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Performance</text>
    <circle cx="360" cy="344" r="156" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="30"/>
    <circle cx="360" cy="344" r="156" fill="none" stroke="#22c55e" stroke-width="30" stroke-dasharray="${ring.toFixed(1)} 980" stroke-linecap="round" transform="rotate(-90 360 344)"/>
    <text x="360" y="330" fill="#ffffff" font-size="72" font-weight="900" text-anchor="middle" font-family="Inter, Arial">${Math.round(88 * smooth(0.18, 0.78, p))}</text>
    <text x="360" y="382" fill="#94a3b8" font-size="26" text-anchor="middle" font-family="Inter, Arial">Review score</text>
    <rect x="118" y="566" width="484" height="52" rx="16" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.24)"/>
    <text x="148" y="599" fill="#bbf7d0" font-size="21" font-weight="800" font-family="Inter, Arial">Manager review and self assessment separated</text>
  `, p);
}

function recruitmentUi(scene, p) {
  const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Recruitment</text>
    ${stages.map((stage, i) => {
      const active = smooth(0.14 + i * 0.11, 0.28 + i * 0.11, p);
      return `
        <g transform="translate(${58 + i * 132} 306)" opacity="${0.36 + active * 0.64}">
          <circle cx="46" cy="46" r="${(30 + active * 11).toFixed(1)}" fill="${i === 4 ? '#22c55e' : 'rgba(34,197,94,0.14)'}" stroke="#22c55e" stroke-width="3"/>
          <text x="46" y="54" fill="#ffffff" font-size="22" font-weight="900" text-anchor="middle" font-family="Inter, Arial">${i + 1}</text>
          <text x="46" y="112" fill="#cbd5e1" font-size="16" text-anchor="middle" font-family="Inter, Arial">${stage}</text>
        </g>
      `;
    }).join('')}
    <rect x="96" y="518" width="530" height="70" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
    <text x="128" y="562" fill="#e2e8f0" font-size="22" font-family="Inter, Arial">Candidate hired to employee workflow</text>
  `, p);
}

function docsUi(scene, p) {
  const items = ['Document Upload', 'Expense Submitted', 'Manager Review', 'Decision Sent'];
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Documents &amp; Expenses</text>
    ${items.map((item, i) => `
      <g transform="translate(${86 + (i % 2) * 318} ${224 + Math.floor(i / 2) * 168})" opacity="${smooth(0.12 + i * 0.1, 0.28 + i * 0.1, p)}">
        <rect width="248" height="122" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
        <rect x="26" y="28" width="46" height="54" rx="10" fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.28)"/>
        <text x="92" y="62" fill="#e2e8f0" font-size="19" font-weight="800" font-family="Inter, Arial">${item}</text>
      </g>
    `).join('')}
  `, p);
}

function notificationsUi(scene, p) {
  const notes = [
    'Access Request Submitted',
    'Access Approved',
    'Leave Approved',
    'Payslip Generated',
    'Performance Review Assigned',
    'Expense Approved',
    'Recruitment Update',
  ];
  return browserShell(`
    <text x="58" y="132" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Notifications</text>
    ${notes.map((note, i) => {
      const y = 174 + i * 68;
      const a = smooth(0.08 + i * 0.08, 0.2 + i * 0.08, p);
      return `
        <g transform="translate(${(70 + (1 - a) * 70).toFixed(1)} ${y})" opacity="${a}">
          <rect width="580" height="52" rx="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.1)"/>
          <circle cx="30" cy="26" r="10" fill="#22c55e"/>
          <text x="54" y="34" fill="#e2e8f0" font-size="20" font-family="Inter, Arial">${note}</text>
        </g>
      `;
    }).join('')}
  `, p);
}

function responsiveUi(scene, p) {
  return browserShell(`
    <text x="58" y="152" fill="#ffffff" font-size="34" font-weight="900" font-family="Inter, Arial">Responsive portal</text>
    <g transform="translate(72 236) scale(${(0.94 + smooth(0.18, 0.68, p) * 0.06).toFixed(3)})">
      <rect width="356" height="222" rx="22" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)"/>
      <text x="178" y="118" fill="#ffffff" font-size="26" font-weight="900" text-anchor="middle" font-family="Inter, Arial">Desktop</text>
    </g>
    <g transform="translate(468 292) scale(${(0.9 + smooth(0.24, 0.74, p) * 0.1).toFixed(3)})">
      <rect width="150" height="280" rx="28" fill="rgba(34,197,94,0.14)" stroke="rgba(34,197,94,0.34)"/>
      <text x="75" y="150" fill="#ffffff" font-size="22" font-weight="900" text-anchor="middle" font-family="Inter, Arial">Mobile</text>
    </g>
    <g transform="translate(258 500) scale(${(0.9 + smooth(0.32, 0.82, p) * 0.1).toFixed(3)})">
      <rect width="210" height="158" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
      <text x="105" y="88" fill="#ffffff" font-size="23" font-weight="900" text-anchor="middle" font-family="Inter, Arial">Tablet</text>
    </g>
  `, p);
}

function closingUi(scene, p) {
  return `
    <g transform="translate(960 540) scale(${(0.94 + smooth(0.08, 0.52, p) * 0.06).toFixed(4)})" text-anchor="middle">
      ${grevyaLogoSvg(-64, -244, 0.5, true)}
      <rect x="-390" y="132" width="780" height="88" rx="28" fill="#22c55e"/>
      <text y="187" fill="#052e16" font-size="34" font-weight="900" font-family="Inter, Arial">Streamline HR with Grevya HR Portal</text>
      <text y="282" fill="#94a3b8" font-size="24" font-family="Inter, Arial">Secure role based access • Centralized HR operations • Real time visibility</text>
    </g>
  `;
}

function sceneUi(scene, p) {
  switch (scene.ui) {
    case 'hero': return heroUi(scene, p);
    case 'landing': return landingUi(scene, p);
    case 'login': return loginUi(scene, p);
    case 'dashboard': return dashboardUi(scene, p);
    case 'access': return accessUi(scene, p);
    case 'rbac': return rbacUi(scene, p);
    case 'employees': return employeesUi(scene, p);
    case 'attendance': return attendanceUi(scene, p);
    case 'leave': return leaveUi(scene, p);
    case 'payroll': return payrollUi(scene, p);
    case 'performance': return performanceUi(scene, p);
    case 'recruitment': return recruitmentUi(scene, p);
    case 'docs': return docsUi(scene, p);
    case 'notifications': return notificationsUi(scene, p);
    case 'responsive': return responsiveUi(scene, p);
    case 'closing': return closingUi(scene, p);
    default: return heroUi(scene, p);
  }
}

function svgForFrame(scene, index, localFrame) {
  const p = localFrame / (SCENE_DURATION * FPS - 1);
  const op = progressOpacity(p);
  const camera = 1 + 0.035 * easeInOut(p) + (index % 2 ? 0.01 * Math.sin(p * Math.PI) : 0);
  const panX = (index % 2 ? -24 : 24) * easeInOut(p);
  const panY = -18 * easeInOut(p);
  const titleY = 0 + (1 - smooth(0.08, 0.26, p)) * 34;
  const sectionOpacity = smooth(0.05, 0.22, p);
  const sceneNo = String(index + 1).padStart(2, '0');
  const transition = clamp((1 - smooth(0.9, 1, p)) * smooth(0, 0.12, p));

  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGlow" cx="78%" cy="16%" r="70%">
        <stop offset="0" stop-color="#14532d"/>
        <stop offset="0.36" stop-color="#052e16"/>
        <stop offset="1" stop-color="#020617"/>
      </radialGradient>
      <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#22c55e" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#22c55e" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="30" stdDeviation="28" flood-color="#000000" flood-opacity="0.42"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>
    <circle cx="${1500 + Math.sin(p * Math.PI) * 80}" cy="190" r="520" fill="url(#greenGlow)"/>
    <circle cx="${250 + Math.cos(p * Math.PI) * 60}" cy="850" r="430" fill="url(#greenGlow)" opacity="0.5"/>
    <g opacity="0.12" transform="translate(${(p * 80).toFixed(1)} 0)">
      ${Array.from({ length: 24 }).map((_, i) => `<line x1="${i * 106 - 260}" y1="0" x2="${i * 106 - 520}" y2="1080" stroke="#22c55e" stroke-width="1"/>`).join('')}
    </g>
    <g opacity="${op}" transform="translate(${panX.toFixed(1)} ${panY.toFixed(1)}) scale(${camera.toFixed(4)})">
      <g transform="translate(96 72)">
        ${grevyaLogoSvg(0, 0, 0.23, true)}
        <text x="76" y="38" fill="#ffffff" font-size="30" font-weight="900" font-family="Inter, Arial">Grevya</text>
        <text x="204" y="38" fill="#4ade80" font-size="20" font-weight="800" font-family="Inter, Arial">HR</text>
      </g>
      <g opacity="0.10">${grevyaLogoSvg(1580, 828, 0.46, false)}</g>
      <g transform="translate(96 ${(210 + titleY).toFixed(1)})" opacity="${sectionOpacity}">
        <rect width="340" height="46" rx="23" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.28)"/>
        <text x="28" y="31" fill="#86efac" font-size="19" font-weight="900" letter-spacing="2" font-family="Inter, Arial">${esc(scene.section.toUpperCase())}</text>
      </g>
      <g transform="translate(96 ${(330 + titleY).toFixed(1)})" opacity="${smooth(0.1, 0.28, p)}">
        ${textBlock(scene.title, 0, 0, 18, 72, '#ffffff', 900, 1.1)}
        ${textBlock(scene.body, 0, 116, 48, 31, '#94a3b8', 600, 1.34)}
      </g>
      <g transform="translate(96 650)" opacity="${smooth(0.28, 0.52, p)}">
        <rect width="690" height="72" rx="22" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.28)"/>
        <circle cx="44" cy="36" r="${(10 + 5 * Math.sin(p * Math.PI * 4) * smooth(0.3, 0.8, p)).toFixed(1)}" fill="#22c55e"/>
        <text x="76" y="45" fill="#bbf7d0" font-size="26" font-weight="800" font-family="Inter, Arial">${esc(scene.tag)}</text>
      </g>
      ${sceneUi(scene, p)}
      <text x="96" y="980" fill="#475569" font-size="22" font-family="Inter, Arial">${sceneNo} / ${scenes.length}</text>
    </g>
    ${cursor(scene, p)}
    <rect width="${W}" height="${H}" fill="#020617" opacity="${(1 - transition).toFixed(3)}"/>
  </svg>`;
}

function ensureTools() {
  if (!ffmpeg.path || !fs.existsSync(ffmpeg.path)) {
    throw new Error('FFmpeg binary from @ffmpeg-installer/ffmpeg was not found.');
  }
}

async function renderFrames() {
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  let frameIndex = 0;
  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    for (let localFrame = 0; localFrame < SCENE_DURATION * FPS; localFrame += 1) {
      const svg = svgForFrame(scenes[sceneIndex], sceneIndex, localFrame);
      const file = path.join(framesDir, `frame-${String(frameIndex).padStart(6, '0')}.jpg`);
      await sharp(Buffer.from(svg)).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(file);
      frameIndex += 1;
    }
    console.log(`Rendered scene ${sceneIndex + 1}/${scenes.length}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} failed with status ${result.status}`);
  }
}

function generateNarration() {
  const narration = scenes.map((scene) => scene.narration).join('\n\n');
  fs.writeFileSync(narrationTextFile, narration, 'utf8');

  const ps = `
Add-Type -AssemblyName System.Speech
$text = Get-Content -Path '${narrationTextFile.replace(/'/g, "''")}' -Raw
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.Rate = -1
$speaker.Volume = 100
$voice = $speaker.GetInstalledVoices() | Select-Object -First 1
if ($voice) { $speaker.SelectVoice($voice.VoiceInfo.Name) }
$speaker.SetOutputToWaveFile('${narrationFile.replace(/'/g, "''")}')
$speaker.Speak($text)
$speaker.Dispose()
`;

  run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps]);
}

function writeWav(file, samples, sampleRate) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2 * 2, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buffer);
}

function generateMusic() {
  const duration = totalDuration;
  const totalSamples = Math.ceil(duration * SAMPLE_RATE);
  const out = new Float32Array(totalSamples * 2);
  const chords = [
    [261.63, 329.63, 392.0],
    [196.0, 246.94, 392.0],
    [220.0, 261.63, 329.63],
    [174.61, 220.0, 349.23],
  ];
  const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0];
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const fadeIn = clamp(t / 3);
    const fadeOut = clamp((duration - t) / 4);
    const env = Math.min(fadeIn, fadeOut);
    const chord = chords[Math.floor(t / 8) % chords.length];
    let sample = 0;
    for (const freq of chord) {
      sample += Math.sin(2 * Math.PI * freq * t) * 0.045;
      sample += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.035;
    }
    const beat = t % 0.75;
    const pluckEnv = Math.exp(-beat * 8);
    const note = notes[Math.floor(t / 0.75) % notes.length];
    sample += Math.sin(2 * Math.PI * note * t) * 0.045 * pluckEnv;
    const kick = Math.exp(-(t % 1.5) * 9) * Math.sin(2 * Math.PI * 78 * t) * 0.08;
    sample = (sample + kick) * env;
    out[i * 2] = sample * 0.9;
    out[i * 2 + 1] = sample;
  }
  writeWav(musicFile, out, SAMPLE_RATE);
}

function renderVideo() {
  const videoOnly = path.join(workDir, 'video-only.mp4');
  run(ffmpeg.path, [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(framesDir, 'frame-%06d.jpg'),
    '-r', String(OUT_FPS),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '21',
    '-preset', 'medium',
    '-movflags', '+faststart',
    videoOnly,
  ]);

  const fadeOutStart = Math.max(0, totalDuration - 4).toFixed(2);
  run(ffmpeg.path, [
    '-y',
    '-i', videoOnly,
    '-i', narrationFile,
    '-i', musicFile,
    '-filter_complex',
    '[1:a]volume=0.95[voice];' +
      `[2:a]volume=0.13[music];` +
      `[voice][music]amix=inputs=2:duration=longest:dropout_transition=2,` +
      `afade=t=in:st=0:d=1.2,afade=t=out:st=${fadeOutStart}:d=4[a]`,
    '-map', '0:v',
    '-map', '[a]',
    '-t', totalDuration.toFixed(2),
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    output,
  ]);
}

(async () => {
  ensureTools();
  console.log(`Rendering Grevya HR Portal animated demo (${totalDuration.toFixed(0)} seconds)...`);
  await renderFrames();
  console.log('Generating local narration...');
  generateNarration();
  console.log('Generating original royalty-free music bed...');
  generateMusic();
  console.log('Encoding MP4 with narration and music...');
  renderVideo();
  fs.rmSync(workDir, { recursive: true, force: true });
  const stat = fs.statSync(output);
  console.log(`Wrote ${output} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
})();
