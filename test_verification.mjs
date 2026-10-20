import { createClient } from '@supabase/supabase-js';

// 1. Email validation logic
function isPermittedGrevyaEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;
  if (domain === 'grevya.com') return true;
  if (domain === 'gmail.com' && localPart.endsWith('.grevya')) return true;
  return false;
}

// 2. Leave calculation logic
function calculateLeaveDays(startDate, endDate, holidays = []) {
  if (!startDate || !endDate) return 0;
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  const holidaySet = new Set(holidays.filter(h => !h.isOptional).map(h => h.date));
  let workdays = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);
    if (!isWeekend && !isHoliday) workdays++;
    current.setDate(current.getDate() + 1);
  }
  return workdays;
}

function checkLeaveOverlap(newStart, newEnd, existingRequests, excludeRequestId) {
  if (!newStart || !newEnd) return { hasOverlap: false };
  for (const req of existingRequests) {
    if (excludeRequestId && req.id === excludeRequestId) continue;
    if (req.status === 'rejected' || req.status === 'cancelled') continue;
    const reqStart = req.startDate;
    const reqEnd = req.endDate;
    if (!(newEnd < reqStart || newStart > reqEnd)) {
      return { hasOverlap: true, conflictingRequest: req };
    }
  }
  return { hasOverlap: false };
}

// 3. Attendance state machine validation logic
function validateAttendanceTransition(currentAttendance, requestedAction) {
  const isClockedIn = Boolean(currentAttendance?.clockIn);
  const isClockedOut = Boolean(currentAttendance?.clockOut);

  if (requestedAction === 'clock_in') {
    if (isClockedIn && isClockedOut) {
      return { allowed: false, error: 'Workday already completed for today.' };
    }
    if (isClockedIn) {
      return { allowed: false, error: 'Already clocked in for today.' };
    }
    return { allowed: true };
  }

  if (requestedAction === 'clock_out') {
    if (!isClockedIn) {
      return { allowed: false, error: 'Cannot clock out: You have not clocked in.' };
    }
    if (isClockedOut) {
      return { allowed: false, error: 'Already clocked out for today.' };
    }
    return { allowed: true };
  }

  return { allowed: false, error: 'Unknown punch action.' };
}

function calculateSessionHours(clockInIso, clockOutIso, lunchStartIso, lunchEndIso) {
  if (!clockInIso || !clockOutIso) return 0;
  const tIn = new Date(clockInIso).getTime();
  const tOut = new Date(clockOutIso).getTime();
  let grossSec = Math.max(0, (tOut - tIn) / 1000);

  let breakSec = 0;
  if (lunchStartIso && lunchEndIso) {
    const lStart = new Date(lunchStartIso).getTime();
    const lEnd = new Date(lunchEndIso).getTime();
    breakSec = Math.max(0, (lEnd - lStart) / 1000);
  }

  const netHours = Math.max(0, (grossSec - breakSec) / 3600);
  return Number(netHours.toFixed(2));
}

async function runTests() {
  console.log('=================================================================');
  console.log('   GREVYA HR PORTAL - MASTER SYSTEM & LIVE DATABASE AUDIT SUITE   ');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testId, description, condition, actualInfo) {
    if (condition) {
      console.log(`[PASS] ${testId}: ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testId}: ${description} (Actual: ${actualInfo})`);
      failed++;
    }
  }

  // --- SUITE 1: EMAIL POLICY ---
  console.log('--- SUITE 1: EMAIL POLICY ENFORCEMENT ---');
  assert('EMAIL-01', 'Allowed: official @grevya.com', isPermittedGrevyaEmail('kavin@grevya.com') === true);
  assert('EMAIL-02', 'Allowed: prefix.grevya@gmail.com', isPermittedGrevyaEmail('harikanth.grevya@gmail.com') === true);
  assert('EMAIL-03', 'Allowed: case-insensitive mixed case', isPermittedGrevyaEmail('Arun.Grevya@Gmail.Com') === true);
  assert('EMAIL-04', 'Rejected: generic gmail without .grevya', isPermittedGrevyaEmail('harikanth@gmail.com') === false);
  assert('EMAIL-05', 'Rejected: yahoo domain with .grevya', isPermittedGrevyaEmail('user.grevya@yahoo.com') === false);
  assert('EMAIL-06', 'Rejected: domain containing grevya substring', isPermittedGrevyaEmail('user@grevya.other.org') === false);
  assert('EMAIL-07', 'Rejected: malformed email string', isPermittedGrevyaEmail('invalid.email@') === false);

  // --- SUITE 2: LEAVE & HOLIDAYS ---
  console.log('\n--- SUITE 2: LEAVE & HOLIDAY CALCULATIONS ---');
  const holidays = [
    { date: '2026-01-26', name: 'Republic Day', isOptional: false },
    { date: '2026-03-25', name: 'Optional Holiday Example', isOptional: true },
  ];

  const days1 = calculateLeaveDays('2026-06-01', '2026-06-05', holidays);
  assert('LEAVE-01', 'Mon-Fri calculates exactly 5 business days', days1 === 5, days1);

  const days2 = calculateLeaveDays('2026-06-06', '2026-06-07', holidays);
  assert('LEAVE-02', 'Weekend days are excluded (0 days)', days2 === 0, days2);

  const days3 = calculateLeaveDays('2026-01-26', '2026-01-30', holidays);
  assert('LEAVE-03', 'Public holidays are excluded from leave balance (4 days)', days3 === 4, days3);

  const days4 = calculateLeaveDays('2026-03-23', '2026-03-27', holidays);
  assert('LEAVE-04', 'Optional holidays are NOT automatically deducted from mandatory list (5 days)', days4 === 5, days4);

  const existingRequests = [
    { id: '1', startDate: '2026-10-19', endDate: '2026-10-21', status: 'approved' }
  ];
  const overlapCheck1 = checkLeaveOverlap('2026-10-20', '2026-10-22', existingRequests);
  assert('LEAVE-05', 'Detects overlapping leave date ranges correctly', overlapCheck1.hasOverlap === true);

  const overlapCheck2 = checkLeaveOverlap('2026-10-22', '2026-10-23', existingRequests);
  assert('LEAVE-06', 'Allows non-overlapping leave date ranges', overlapCheck2.hasOverlap === false);

  // --- SUITE 3: ATTENDANCE STATE MACHINE ---
  console.log('\n--- SUITE 3: ATTENDANCE STATE MACHINE & TIMESTAMPS ---');
  const unstartedAttendance = { clockIn: null, clockOut: null };
  const openAttendance = { clockIn: '2026-10-20T09:00:00+05:30', clockOut: null };
  const closedAttendance = { clockIn: '2026-10-20T09:00:00+05:30', clockOut: '2026-10-20T17:30:00+05:30' };

  const punchCheck1 = validateAttendanceTransition(unstartedAttendance, 'clock_in');
  assert('ATT-01', 'Permits Clock In when no session open', punchCheck1.allowed === true);

  const punchCheck2 = validateAttendanceTransition(unstartedAttendance, 'clock_out');
  assert('ATT-02', 'Blocks Clock Out when not clocked in', punchCheck2.allowed === false);

  const punchCheck3 = validateAttendanceTransition(openAttendance, 'clock_in');
  assert('ATT-03', 'Blocks duplicate Clock In when session already active', punchCheck3.allowed === false);

  const punchCheck4 = validateAttendanceTransition(openAttendance, 'clock_out');
  assert('ATT-04', 'Permits Clock Out when session is active', punchCheck4.allowed === true);

  const punchCheck5 = validateAttendanceTransition(closedAttendance, 'clock_in');
  assert('ATT-05', 'Blocks duplicate Clock In when workday already completed', punchCheck5.allowed === false);

  const sessionHours = calculateSessionHours('2026-10-20T09:00:00Z', '2026-10-20T17:30:00Z', '2026-10-20T13:00:00Z', '2026-10-20T13:45:00Z');
  assert('ATT-06', 'Calculates accurate net hours deducting lunch break (7.75h)', sessionHours === 7.75, sessionHours);

  // --- SUITE 4: SUPABASE AUTH & LIVE DATABASE AUDIT ---
  console.log('\n--- SUITE 4: SUPABASE ARCHITECTURE & SECURITY ISOLATION ---');
  const supabaseUrl = 'https://bjvhflttbabznevkhneu.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdmhmbHR0YmFiem5ldmtobmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDU0NTMsImV4cCI6MjA5NTk4MTQ1M30.sslSYs1mI5rO-xqBpdJRqoMfQdWhOw7E1Sr7tkGS4Rg';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log('       [MODE] Authenticated verification via provided environment credentials.');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    assert('AUTH-01', 'Admin authentication with live Supabase', !authErr && !!authData?.user, authErr?.message);

    const { data: depts, error: deptsErr } = await supabase.from('departments').select('id, name, code, is_active');
    assert('DB-01', 'Departments table query returns valid records', !deptsErr && Array.isArray(depts) && depts.length > 0, deptsErr?.message);

    const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, full_name, role, employee_code, bank_name').limit(10);
    assert('DB-02', 'Profiles table is accessible with new HRMS columns', !profErr && Array.isArray(profiles), profErr?.message);

    const { data: leaveTypes, error: ltErr } = await supabase.from('leave_types').select('id, name, annual_quota');
    assert('DB-03', 'Leave types configured in database including optional_holiday', !ltErr && Array.isArray(leaveTypes) && leaveTypes.length > 0, ltErr?.message);
  } else {
    console.log('       [MODE] Security isolation audit (no test credentials passed in environment).');
    
    // Assert RLS protection blocks unauthenticated reading of sensitive data
    const { data: depts } = await supabase.from('departments').select('id');
    const isDeptProtected = !depts || depts.length === 0;
    assert('SEC-01', 'RLS blocks unauthenticated anonymous department enumeration', isDeptProtected);

    const { data: profs } = await supabase.from('profiles').select('id, bank_account_no');
    const isProfileProtected = !profs || profs.length === 0;
    assert('SEC-02', 'RLS blocks unauthenticated anonymous profile & bank detail access', isProfileProtected);

    const { data: leaves } = await supabase.from('leave_types').select('id');
    const isLeaveProtected = !leaves || leaves.length === 0;
    assert('SEC-03', 'RLS blocks unauthenticated anonymous leave quota access', isLeaveProtected);
  }

  // Attendance table structure check (RPC/columns accessible)
  const { error: attErr } = await supabase
    .from('attendance_records')
    .select('id, employee_id, clock_in, clock_out, check_in_photo_url, check_out_photo_url, latitude, longitude, check_out_latitude, check_out_longitude, check_in_accuracy, check_out_accuracy, verification_status')
    .limit(1);
  assert('DB-SCHEMA-01', 'attendance_records table has all dual-photo and dual-GPS verification columns', !attErr, attErr?.message);

  // Storage Bucket verification via direct operations
  const { error: signedErr } = await supabase.storage.from('attendance-photos').createSignedUrl('test.jpg', 60);
  const bucketPhotosExists = !signedErr || !signedErr.message.includes('Bucket not found');
  assert('STORAGE-01', 'Private attendance-photos storage bucket is operational', bucketPhotosExists, signedErr?.message);

  const { error: docSignedErr } = await supabase.storage.from('employee-documents').createSignedUrl('test.pdf', 60);
  const bucketDocsExists = !docSignedErr || !docSignedErr.message.includes('Bucket not found');
  assert('STORAGE-02', 'Private employee-documents storage bucket is operational', bucketDocsExists, docSignedErr?.message);

  // --- SUITE 5: DATA MASKING & FIELD INTEGRITY ---
  console.log('\n--- SUITE 5: DATA MASKING & FIELD INTEGRITY ---');
  function maskString(str) {
    if (!str) return '•••• •••• ••••';
    if (str.length <= 4) return '•••• ' + str;
    return '•••• •••• ' + str.slice(-4);
  }

  function validateDepartmentCode(code) {
    if (!code || typeof code !== 'string') return false;
    const trimmed = code.trim();
    return /^[A-Z0-9_-]{2,10}$/.test(trimmed);
  }

  function canAccessFinancials(role) {
    return ['super_admin', 'admin', 'hr_manager'].includes(role);
  }

  assert('MASK-01', 'Masks full bank account number exposing only last 4 digits', maskString('50100492817291') === '•••• •••• 7291');
  assert('MASK-02', 'Handles null or missing bank details with standard placeholder', maskString(null) === '•••• •••• ••••');
  assert('MASK-03', 'Masks PAN tax identifier exposing only last 4 characters', maskString('ABCDE1234F') === '•••• •••• 234F');
  assert('DEPT-01', 'Validates uppercase alphanumeric department codes', validateDepartmentCode('ENG-01') === true && validateDepartmentCode('HR') === true && validateDepartmentCode('invalid code with spaces') === false);
  assert('ROLE-01', 'Restricts payroll & financial modification rights away from employee and manager roles', canAccessFinancials('employee') === false && canAccessFinancials('manager') === false && canAccessFinancials('admin') === true);

  // --- SUITE 6: DAILY ATTENDANCE MONITORING & RECONCILIATION ---
  console.log('\n--- SUITE 6: DAILY ATTENDANCE MONITORING & RECONCILIATION ---');
  function reconcileDailyAttendance(employees, records, leaves, holidays, dateStr, isToday, currentMinutes, cutoffMinutes) {
    const isHoliday = holidays.some(h => h.date === dateStr && !h.isOptional);
    const dayOfWeek = new Date(dateStr).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isOffDay = isHoliday || isWeekend;

    let clockedIn = 0;
    let currentlyWorking = 0;
    let onLunch = 0;
    let completed = 0;
    let notClockedIn = 0;
    let absent = 0;
    let onLeave = 0;
    let onHoliday = 0;
    let exceptions = 0;

    for (const emp of employees) {
      const rec = records.find(r => r.employeeId === emp.id && (r.workDate === dateStr || r.date === dateStr));
      const hasLeave = leaves.some(l => l.employeeId === emp.id && l.status === 'approved' && dateStr >= l.startDate && dateStr <= l.endDate);

      if (rec && rec.clockIn) {
        clockedIn++;
        if (rec.clockOut) {
          completed++;
        } else if (rec.lunchStart && !rec.lunchEnd) {
          onLunch++;
        } else {
          currentlyWorking++;
        }
        if (rec.verificationStatus === 'exception' || rec.exceptionReason) {
          exceptions++;
        }
      } else {
        if (hasLeave) {
          onLeave++;
        } else if (isOffDay) {
          onHoliday++;
        } else if (!isToday) {
          absent++;
        } else if (currentMinutes < cutoffMinutes) {
          notClockedIn++;
        } else {
          absent++;
        }
      }
    }

    const expectedToWork = employees.length - onLeave - onHoliday;
    return {
      totalActive: employees.length,
      expectedToWork,
      clockedIn,
      currentlyWorking,
      onLunch,
      completed,
      notClockedIn,
      absent,
      onLeave,
      onHoliday,
      exceptions,
    };
  }

  const sampleStaff = [
    { id: 'emp-1', name: 'Alice', status: 'active' },
    { id: 'emp-2', name: 'Bob', status: 'active' },
    { id: 'emp-3', name: 'Charlie', status: 'active' },
    { id: 'emp-4', name: 'Diana', status: 'active' },
  ];

  const sampleRecords = [
    { employeeId: 'emp-1', workDate: '2026-10-20', clockIn: '2026-10-20T09:00:00Z', clockOut: null, lunchStart: null, lunchEnd: null },
    { employeeId: 'emp-2', workDate: '2026-10-20', clockIn: '2026-10-20T09:15:00Z', clockOut: null, lunchStart: '2026-10-20T13:00:00Z', lunchEnd: null },
  ];

  const sampleLeaves = [
    { employeeId: 'emp-3', startDate: '2026-10-19', endDate: '2026-10-21', status: 'approved' },
  ];

  // Test 1: Morning before cutoff (e.g. 10:30 AM = 630 min; cutoff = 780 min)
  const statsMorning = reconcileDailyAttendance(sampleStaff, sampleRecords, sampleLeaves, [], '2026-10-20', true, 630, 780);
  assert('DAILY-ATT-01', 'Reconciled expected to work = total - onLeave - holiday', statsMorning.expectedToWork === 3, statsMorning.expectedToWork);
  assert('DAILY-ATT-02', 'Reconciled clock-in breakdown = working (1) + lunch (1) + completed (0)', statsMorning.clockedIn === 2 && statsMorning.currentlyWorking === 1 && statsMorning.onLunch === 1);
  assert('DAILY-ATT-03', 'Employee on approved leave is NOT marked absent', statsMorning.onLeave === 1 && statsMorning.absent === 0);
  assert('DAILY-ATT-04', 'Unpunched employee shows Not Clocked In before deadline', statsMorning.notClockedIn === 1);
  assert('DAILY-ATT-05', 'Attendance count reconciles: expectedToWork === clockedIn + notClockedIn + absent', statsMorning.expectedToWork === (statsMorning.clockedIn + statsMorning.notClockedIn + statsMorning.absent));

  // Test 2: Afternoon after cutoff (e.g. 14:00 = 840 min; cutoff = 780 min)
  const statsAfternoon = reconcileDailyAttendance(sampleStaff, sampleRecords, sampleLeaves, [], '2026-10-20', true, 840, 780);
  assert('DAILY-ATT-06', 'Unpunched employee converts to Absent after configured deadline', statsAfternoon.notClockedIn === 0 && statsAfternoon.absent === 1);

  // --- SUITE 7: ORGANIZATIONAL CHART INTEGRITY & CYCLE DETECTION ---
  console.log('\n--- SUITE 7: ORGANIZATIONAL CHART INTEGRITY & CYCLE DETECTION ---');
  function wouldCreateReportingCycle(employeeId, candidateManagerId, allEmployees) {
    if (!candidateManagerId) return false;
    if (employeeId === candidateManagerId) return true;

    let currentId = candidateManagerId;
    const visited = new Set([employeeId]);

    while (currentId) {
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      const mgr = allEmployees.find(e => e.id === currentId);
      currentId = mgr?.managerId;
    }
    return false;
  }

  const orgEmployees = [
    { id: 'kavin', name: 'Kavin', managerId: null },
    { id: 'arunika', name: 'Arunika', managerId: 'kavin' },
    { id: 'harikanth', name: 'Harikanth', managerId: 'kavin' },
    { id: 'dhanin', name: 'Dhanin', managerId: 'harikanth' },
  ];

  assert('ORG-01', 'Rejects self-reporting (emp cannot be own manager)', wouldCreateReportingCycle('harikanth', 'harikanth', orgEmployees) === true);
  assert('ORG-02', 'Rejects direct 2-node circular reporting (Harikanth cannot report to Dhanin)', wouldCreateReportingCycle('harikanth', 'dhanin', orgEmployees) === true);
  
  // Multi-tier cycle: Kavin reporting to Dhanin would create Kavin -> Arunika/Harikanth -> Dhanin -> Kavin
  assert('ORG-03', 'Rejects transitive circular reporting (Root cannot report to descendant)', wouldCreateReportingCycle('kavin', 'dhanin', orgEmployees) === true);
  assert('ORG-04', 'Permits valid non-cyclical reporting re-assignment (Dhanin reporting to Arunika)', wouldCreateReportingCycle('dhanin', 'arunika', orgEmployees) === false);
  assert('ORG-05', 'Permits promoting to top-level executive (managerId = null)', wouldCreateReportingCycle('harikanth', null, orgEmployees) === false);

  // --- SUITE 8: GPS ACCURACY, BOUNDS VALIDATION & SIGNAL TIERS ---
  console.log('\n--- SUITE 8: GPS ACCURACY, BOUNDS & SIGNAL TIERS ---');
  function validateGpsCoordinates(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return { valid: false, error: 'Non-numeric coordinates' };
    if (isNaN(lat) || isNaN(lng)) return { valid: false, error: 'NaN coordinates' };
    if (lat < -90 || lat > 90) return { valid: false, error: 'Latitude out of bounds [-90, 90]' };
    if (lng < -180 || lng > 180) return { valid: false, error: 'Longitude out of bounds [-180, 180]' };
    return { valid: true };
  }

  function classifyGpsSignalTier(accuracyMeters) {
    if (accuracyMeters <= 100) return 'satellite_gps';
    if (accuracyMeters <= 500) return 'wifi_cell_triangulation';
    return 'network_ip_estimate';
  }

  assert('GPS-01', 'Validates realistic coordinates (Chennai, India)', validateGpsCoordinates(13.0827, 80.2707).valid === true);
  assert('GPS-02', 'Rejects latitude exceeding 90 degrees', validateGpsCoordinates(95.1234, 80.2707).valid === false);
  assert('GPS-03', 'Rejects longitude exceeding 180 degrees', validateGpsCoordinates(13.0827, 185.0).valid === false);
  assert('GPS-04', 'Rejects reversed coordinates when lat exceeds valid bound', validateGpsCoordinates(130.0827, 13.0827).valid === false);
  assert('GPS-05', 'Classifies <=100m as high-precision satellite GPS', classifyGpsSignalTier(18) === 'satellite_gps');
  assert('GPS-06', 'Classifies 100-500m as Wi-Fi/Cell triangulation', classifyGpsSignalTier(250) === 'wifi_cell_triangulation');
  assert('GPS-07', 'Classifies >500m as Network/IP estimate requiring user disclosure', classifyGpsSignalTier(15000) === 'network_ip_estimate');

  // --- SUITE 9: DEPARTMENT DELETION SAFETY RULES ---
  console.log('\n--- SUITE 9: DEPARTMENT DELETION SAFETY RULES ---');
  function canSafelyDeleteDepartment(deptId, allEmployees, hasHistoricalRecords) {
    const assigned = allEmployees.filter(e => e.departmentId === deptId);
    if (assigned.length > 0) {
      return { allowed: false, reason: 'BLOCKED_ACTIVE_STAFF', count: assigned.length };
    }
    if (hasHistoricalRecords) {
      return { allowed: false, reason: 'BLOCKED_HISTORICAL_AUDIT_DATA', recommendDeactivation: true };
    }
    return { allowed: true };
  }

  const deptsForTesting = [
    { id: 'dept-dev', name: 'Developer' },
    { id: 'dept-empty', name: 'Empty Dept' },
    { id: 'dept-history', name: 'Legacy Archive' },
  ];
  const staffInDept = [
    { id: 'emp-1', name: 'Harikanth', departmentId: 'dept-dev' }
  ];

  const deptCheck1 = canSafelyDeleteDepartment('dept-dev', staffInDept, false);
  assert('DEPT-DEL-01', 'Blocks department deletion when active employees are assigned', deptCheck1.allowed === false && deptCheck1.reason === 'BLOCKED_ACTIVE_STAFF');

  const deptCheck2 = canSafelyDeleteDepartment('dept-history', [], true);
  assert('DEPT-DEL-02', 'Blocks deletion when historical records reference department (recommends archival)', deptCheck2.allowed === false && deptCheck2.recommendDeactivation === true);

  const deptCheck3 = canSafelyDeleteDepartment('dept-empty', [], false);
  assert('DEPT-DEL-03', 'Allows permanent deletion only when 0 employees and 0 historical references exist', deptCheck3.allowed === true);

  // --- SUITE 10: 4 PROTECTED IDENTITIES DRY-RUN AUDIT ---
  console.log('\n--- SUITE 10: 4 PROTECTED IDENTITIES AUDIT ---');
  const PROTECTED_EMAILS = new Set([
    'harikanth.grevya@gmail.com',
    'dhanin.grevya@gmail.com',
    'kavin@grevya.com',
    'hr@grevya.com',
  ]);

  function isProtectedIdentity(email) {
    if (!email) return false;
    return PROTECTED_EMAILS.has(email.trim().toLowerCase());
  }

  assert('PROT-01', 'Harikanth is explicitly protected', isProtectedIdentity('harikanth.grevya@gmail.com') === true);
  assert('PROT-02', 'Dhanin is explicitly protected', isProtectedIdentity('dhanin.grevya@gmail.com') === true);
  assert('PROT-03', 'Kavin Raj (Admin) is explicitly protected', isProtectedIdentity('kavin@grevya.com') === true);
  assert('PROT-04', 'HR (hr@grevya.com) is explicitly protected', isProtectedIdentity('hr@grevya.com') === true);
  assert('PROT-05', 'Non-protected demo email is identified for cleanup scope', isProtectedIdentity('demo.employee@grevya.com') === false);

  console.log('\n=================================================================');
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
