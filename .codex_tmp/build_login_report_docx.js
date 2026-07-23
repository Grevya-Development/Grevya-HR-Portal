const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.codex_tmp', 'login_report_docx_pkg');
const outDocx = path.join(root, 'Grevya_HR_Login_Failure_Diagnostic_Report.docx');
const outZip = path.join(root, '.codex_tmp', 'Grevya_HR_Login_Failure_Diagnostic_Report.zip');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const w = (...parts) => parts.join('');

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
  if (opts.font) {
    props.push(`<w:rFonts w:ascii="${esc(opts.font)}" w:hAnsi="${esc(opts.font)}"/>`);
  }
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
  if (opts.shading) pPr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shading}"/>`);
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${run(text, opts.run || {})}</w:p>`;
}

function multiPara(runs, style = 'BodyText', opts = {}) {
  const pPr = [];
  if (style) pPr.push(`<w:pStyle w:val="${style}"/>`);
  if (opts.align) pPr.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.keepNext) pPr.push('<w:keepNext/>');
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join('')}</w:pPr>` : ''}${runs.map(([text, rOpts]) => run(text, rOpts || {})).join('')}</w:p>`;
}

function cell(content, width, opts = {}) {
  const fill = opts.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>` : '';
  const vAlign = '<w:vAlign w:val="center"/>';
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill}${vAlign}</w:tcPr>${content}</w:tc>`;
}

function table(rows, widths, opts = {}) {
  const grid = widths.map(width => `<w:gridCol w:w="${width}"/>`).join('');
  const tblW = widths.reduce((sum, width) => sum + width, 0);
  const borders = '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D9DEE8"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D9DEE8"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9DEE8"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D9DEE8"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9DEE8"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D9DEE8"/></w:tblBorders>';
  const margins = '<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>';
  const ind = opts.noIndent ? 0 : 120;
  const body = rows.map((row, rowIndex) => {
    const fill = rowIndex === 0 && opts.header ? 'F2F4F7' : undefined;
    const cells = row.map((text, colIndex) => {
      const style = rowIndex === 0 && opts.header ? 'TableHeader' : 'TableBody';
      const p = para(text, style);
      return cell(p, widths[colIndex], { fill });
    }).join('');
    return `<w:tr>${cells}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${tblW}" w:type="dxa"/><w:tblInd w:w="${ind}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}${margins}</w:tblPr><w:tblGrid>${grid}</w:tblGrid>${body}</w:tbl>`;
}

function callout(title, body) {
  return table([[`${title}\n${body}`]], [9360], { noIndent: false }).replace(
    '<w:tcPr><w:tcW w:w="9360" w:type="dxa"/>',
    '<w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F4F6F9"/>'
  ).replace(
    esc(`${title}\n${body}`),
    `${esc(title)}<w:br/>${esc(body)}`
  );
}

const body = [];
body.push(para('GREYVA HR PORTAL', 'Kicker'));
body.push(para('Login Failure Diagnostic Report', 'TitleText'));
body.push(para('Deep technical report on authentication failure, backend startup crash, root cause, remediation, and operating instructions.', 'SubtitleText'));
body.push(table([
  ['Prepared for', 'Grevya HR project workspace'],
  ['Prepared by', 'Codex'],
  ['Date', 'June 16, 2026'],
  ['Project path', 'D:\\Projects\\HR\\HR'],
  ['Scope', 'Local React/Vite frontend, Express API, SQLite-backed demo authentication']
], [2000, 7360], { header: false }));

body.push(para('Executive Summary', 'Heading1'));
body.push(callout('Primary finding', 'Login was failing because the frontend was calling http://localhost:3001/api/auth/login, but the backend API was not available. The backend process crashed on startup before it could accept requests.'));
body.push(para('The visible login error looked like an invalid email or password, but the credentials were not the main problem. The React login page catches failed network calls and returns false, which displays the same general invalid-credentials message to the user. Direct API testing confirmed that once the backend started correctly, the seeded demo credentials worked.'));

body.push(para('Key Conclusions', 'Heading1'));
[
  'The frontend login flow is hard-coded to call http://localhost:3001/api.',
  'The backend was not responding on port 3001 during the failed login attempts.',
  'The backend crashed because better-sqlite3 was compiled for a different Node.js ABI than the installed Node runtime.',
  'Current Node runtime observed: v24.16.0.',
  'The installed better-sqlite3 native module had been compiled for NODE_MODULE_VERSION 127, while Node v24.16.0 required NODE_MODULE_VERSION 137.',
  'Updating better-sqlite3 to a compatible version allowed the backend to start and the login endpoint to authenticate successfully.'
].forEach(item => body.push(para(item, 'ListParagraph', { numId: 1 })));

body.push(para('System Context', 'Heading1'));
body.push(table([
  ['Component', 'Observed Details', 'Impact on Login'],
  ['Frontend', 'React + Vite app in D:\\Projects\\HR\\HR. Login page calls store.login(email, password).', 'Provides the login form and displays the final error message.'],
  ['API client', 'src\\services\\store.ts sets API_URL to http://localhost:3001/api.', 'Requires the backend to be running locally on port 3001.'],
  ['Backend', 'Express server in HR\\backend\\server.js with POST /api/auth/login.', 'Authenticates users and returns JWT plus user record.'],
  ['Database', 'SQLite database grevya.db accessed through better-sqlite3.', 'Stores seeded users and demo passwords.'],
  ['Runtime', 'Node.js v24.16.0.', 'Requires native modules compiled for ABI 137.']
], [1500, 5260, 2600], { header: true }));

body.push(para('Authentication Flow', 'Heading1'));
[
  'User submits email and password in LoginPage.tsx.',
  'LoginPage calls useStore().login(email, password).',
  'store.ts sends POST /api/auth/login to http://localhost:3001/api/auth/login.',
  'server.js queries users by email and password.',
  'If a user is found, server.js signs a JWT and returns { token, user }.',
  'The frontend stores the token in localStorage, sets currentUser, fetches initial data, and moves into the app view.'
].forEach(item => body.push(para(item, 'ListParagraph', { numId: 1 })));

body.push(para('Failure Evidence', 'Heading1'));
body.push(table([
  ['Check', 'Result', 'Meaning'],
  ['Direct POST to /api/auth/login before repair', 'Unable to connect to the remote server.', 'The login API was not reachable.'],
  ['Running node server.js before repair', 'ERR_DLOPEN_FAILED from better_sqlite3.node.', 'Backend crashed during database initialization.'],
  ['Native module error', 'Compiled against NODE_MODULE_VERSION 127; current Node requires 137.', 'Installed better-sqlite3 binary did not match Node v24.16.0.'],
  ['npm rebuild better-sqlite3', 'Blocked by PowerShell npm.ps1 policy, then by network/Python constraints.', 'Local rebuild could not complete cleanly.'],
  ['npm.cmd install better-sqlite3@latest', 'Completed successfully.', 'Installed a compatible dependency package.'],
  ['Direct POST after repair', 'Returned JWT and user id demo-hr for hr@grevya.com / hr123.', 'Authentication works when backend is running.']
], [2300, 3560, 3500], { header: true }));

body.push(para('Root Cause Analysis', 'Heading1'));
body.push(multiPara([
  ['Root cause: ', { bold: true }],
  ['native dependency ABI mismatch in the backend SQLite driver. The application depends on better-sqlite3, which includes a compiled native binary. That binary must match the active Node.js ABI. After Node changed or dependencies were copied from a different environment, the binary no longer matched the runtime. The backend therefore crashed before Express could listen on port 3001.']
]));
body.push(multiPara([
  ['User-facing symptom: ', { bold: true }],
  ['the login page displayed a generic invalid-credentials message. This happened because the frontend login function catches request failures and returns false, treating network failure and authentication failure the same way.']
]));
body.push(multiPara([
  ['Secondary contributors: ', { bold: true }],
  ['PowerShell execution policy blocked npm.ps1, and node-gyp could not compile locally because Python was not available. Using npm.cmd and allowing a network install avoided both issues.']
]));

body.push(para('Remediation Performed', 'Heading1'));
[
  'Installed a current compatible better-sqlite3 package in HR\\backend using npm.cmd install better-sqlite3@latest.',
  'Updated backend\\package.json to depend on better-sqlite3 ^12.10.1.',
  'Confirmed node server.js starts and logs: Backend server running on http://localhost:3001.',
  'Confirmed POST /api/auth/login succeeds for the HR demo account while the backend is running.'
].forEach(item => body.push(para(item, 'ListParagraph', { numId: 1 })));

body.push(para('Current Valid Demo Accounts', 'Heading1'));
body.push(table([
  ['Role', 'Email', 'Password', 'Returned Role'],
  ['HR Manager', 'hr@grevya.com', 'hr123', 'hr_manager'],
  ['Manager', 'manager@grevya.com', 'mgr123', 'manager'],
  ['Employee', 'employee@grevya.com', 'emp123', 'employee']
], [1900, 3000, 1800, 2660], { header: true }));

body.push(para('Runbook: How to Start the App', 'Heading1'));
body.push(para('Terminal 1: start the backend', 'Heading2'));
body.push(para('cd D:\\Projects\\HR\\HR\\backend', 'CodeBlock'));
body.push(para('npm.cmd start', 'CodeBlock'));
body.push(para('Keep this terminal open. The backend must remain available on http://localhost:3001 for login and data fetches to work.'));
body.push(para('Terminal 2: start the frontend', 'Heading2'));
body.push(para('cd D:\\Projects\\HR\\HR', 'CodeBlock'));
body.push(para('npm.cmd run dev', 'CodeBlock'));
body.push(para('Open the Vite URL shown in the terminal and sign in with one of the demo accounts above.'));

body.push(para('Recommended Follow-Up Improvements', 'Heading1'));
[
  'Improve login error handling so network/API failures show a message such as "Backend is not running" instead of "Invalid credentials."',
  'Move the API base URL into a Vite environment variable so different machines and ports can be configured without editing source code.',
  'Add a backend health endpoint, for example GET /api/health, and optionally check it before login.',
  'Avoid committing node_modules if possible. Track package.json and package-lock.json, then run npm install per environment.',
  'Pin a supported Node.js version with .nvmrc or Volta to reduce native dependency mismatch risk.',
  'Consider replacing plain-text demo passwords with hashed passwords if the project moves beyond demo/local use.'
].forEach(item => body.push(para(item, 'ListParagraph', { numId: 1 })));

body.push(para('Residual Risks', 'Heading1'));
body.push(table([
  ['Risk', 'Likelihood', 'Impact', 'Mitigation'],
  ['Backend not started before frontend login', 'High', 'Login always fails', 'Use a combined dev script or add clear frontend health checks.'],
  ['Node version changes again', 'Medium', 'Native module may fail again', 'Pin Node version and reinstall dependencies after upgrades.'],
  ['Generic error masks real failure', 'High', 'Slower debugging', 'Return distinct frontend messages for network, 401, and server errors.'],
  ['Plain-text passwords remain in SQLite', 'Medium', 'Security weakness outside demo use', 'Hash passwords before any real deployment.']
], [2800, 1400, 1800, 3360], { header: true }));

body.push(para('Appendix: Verification Commands', 'Heading1'));
body.push(para('Backend startup check:', 'Heading2'));
body.push(para('cd D:\\Projects\\HR\\HR\\backend', 'CodeBlock'));
body.push(para('node server.js', 'CodeBlock'));
body.push(para('Direct login API check:', 'Heading2'));
body.push(para(`Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/auth/login -ContentType "application/json" -Body '{"email":"hr@grevya.com","password":"hr123"}'`, 'CodeBlock'));

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
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14"><w:body>${body.join('')}${sectPr}</w:body></w:document>`);

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
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="BodyText"/><w:jc w:val="right"/></w:pPr>${run('Grevya HR Portal | Login Diagnostic', { size: 9, color: '666666' })}</w:p></w:hdr>`);

write('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="BodyText"/><w:jc w:val="center"/></w:pPr>${run('Prepared June 16, 2026', { size: 9, color: '666666' })}</w:p></w:ftr>`);

write('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Grevya HR Login Failure Diagnostic Report</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-16T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-16T00:00:00Z</dcterms:modified></cp:coreProperties>`);

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
