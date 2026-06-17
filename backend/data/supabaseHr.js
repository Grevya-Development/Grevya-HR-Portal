const supabaseDb = require('../config/supabase');

function hasRealEnvValue(value) {
  return Boolean(value && value.trim() && !value.startsWith('replace-with-') && !value.includes('placeholder') && !value.startsWith('your-'));
}

const supabaseUrl = hasRealEnvValue(process.env.SUPABASE_URL)
  ? process.env.SUPABASE_URL.replace(/\/$/, '')
  : '';
const supabaseServiceRoleKey = hasRealEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : '';
const appUrl = hasRealEnvValue(process.env.APP_URL) ? process.env.APP_URL.replace(/\/$/, '') : '';

function mapEmployee(row, includeSalary = true) {
  if (!row) return null;
  const employee = {
    id: row.id,
    name: row.full_name,
    email: row.email,
    department: row.department || '',
    position: row.job_title || '',
    status: row.status,
    joinDate: row.hire_date,
    performance: row.performance_score,
    attendance: row.attendance_score,
    avatar: row.avatar || '',
    phone: row.phone || '',
    location: row.location || '',
    points: row.points,
    streak: row.streak,
    managerId: row.manager_id,
    bio: row.bio || '',
  };
  if (includeSalary) employee.salary = Number(row.salary || 0);
  return employee;
}

function mapLeaveRequest(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name || '',
    employeeAvatar: row.employee_avatar || '',
    department: row.department || '',
    type: row.leave_type || '',
    startDate: row.from_date,
    endDate: row.to_date,
    days: Number(row.days || 0),
    reason: row.reason || '',
    status: row.status,
    appliedOn: row.created_at,
    approvedBy: row.approver_name || null,
    comments: row.comments || null,
  };
}

function mapAttendance(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.work_date,
    checkIn: row.clock_in ? new Date(row.clock_in).toTimeString().slice(0, 5) : '',
    checkOut: row.clock_out ? new Date(row.clock_out).toTimeString().slice(0, 5) : '',
    status: row.status,
    hours: Number(row.total_hours || 0),
  };
}

function mapPayslip(row) {
  const allowances = row.allowances || {};
  const deductions = row.deductions || {};
  return {
    id: row.id,
    employeeId: row.employee_id,
    month: row.month,
    year: row.year,
    basicSalary: Number(row.base_salary || 0),
    hra: Number(allowances.hra || 0),
    conveyance: Number(allowances.conveyance || 0),
    medical: Number(allowances.medical || 0),
    bonus: Number(allowances.bonus || 0),
    pf: Number(deductions.pf || deductions.pf_deduction || 0),
    tax: Number(deductions.tax || deductions.tax_deduction || 0),
    netSalary: Number(row.net_pay || 0),
    generatedOn: row.created_at,
  };
}

function mapPerformance(row) {
  const managerReview = row.manager_review || {};
  return {
    id: row.id,
    employeeId: row.employee_id,
    reviewerId: row.reviewer_id,
    period: row.period || row.cycle_name || '',
    technicalScore: Number(managerReview.technical || 0),
    communicationScore: Number(managerReview.communication || 0),
    leadershipScore: Number(managerReview.leadership || 0),
    deliveryScore: Number(managerReview.delivery || 0),
    innovationScore: Number(managerReview.innovation || 0),
    teamworkScore: Number(managerReview.teamwork || 0),
    overallScore: Number(managerReview.overall || row.rating || 0),
    comments: managerReview.comments || '',
    goals: row.self_assessment?.goals || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department || '',
    type: row.type || '',
    location: row.location || '',
    openings: row.openings,
    posted: row.posted_date,
    status: row.status,
  };
}

function mapCandidate(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    position: row.position || row.job_title || '',
    department: row.department || '',
    stage: row.stage,
    appliedDate: row.applied_at,
    avatar: row.name ? row.name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) : '',
    score: row.rating || 0,
    note: row.notes || '',
  };
}

function mapDocument(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    name: row.name,
    type: row.mime_type,
    category: row.category,
    filePath: row.storage_path,
    fileSize: row.file_size,
    uploadedBy: row.uploader_name || row.uploaded_by,
    uploadedAt: row.uploaded_at || row.created_at,
    description: row.description || '',
  };
}

function mapExpense(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name || '',
    employeeAvatar: row.employee_avatar || '',
    category: row.category,
    amount: Number(row.amount || 0),
    description: row.description || '',
    date: row.expense_date,
    status: row.status,
    receipt: row.receipt_path,
    submittedOn: row.submitted_at || row.created_at,
    approvedBy: row.approver_name || null,
    comments: row.comments || null,
  };
}

function mapShift(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name || '',
    date: row.shift_date,
    shiftType: row.shift_type,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
  };
}

function mapCalendarEvent(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.start_date,
    endDate: row.end_date,
    type: row.type,
    color: row.color,
    description: row.description,
    createdBy: row.created_by,
  };
}

function normalizeUuid(value) {
  const text = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

async function getEmployees(user, filters = {}) {
  const params = [];
  const where = [];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(p.id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`p.id = $${params.length}`);
    }
  }
  if (filters.department) {
    params.push(filters.department);
    where.push(`d.name = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`p.status = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(p.full_name ilike $${params.length} or p.email ilike $${params.length} or p.job_title ilike $${params.length})`);
  }

  const rows = await supabaseDb.queryAll(
    `
    select p.*, d.name as department
    from public.profiles p
    left join public.departments d on d.id = p.department_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by p.full_name asc
    `,
    params,
  );
  const includeSalary = ['super_admin', 'admin', 'hr_manager'].includes(user.role);
  return rows.map((row) => mapEmployee(row, includeSalary || row.id === user.id));
}

async function getEmployee(user, id) {
  const row = await supabaseDb.queryOne(
    `
    select p.*, d.name as department
    from public.profiles p
    left join public.departments d on d.id = p.department_id
    where p.id = $1
    `,
    [id],
  );
  if (!row) return null;
  const canAccess = ['super_admin', 'admin', 'hr_manager'].includes(user.role)
    || row.id === user.id
    || row.email === user.email
    || (user.role === 'manager' && row.manager_id === user.id);
  if (!canAccess) return false;
  const includeSalary = ['super_admin', 'admin', 'hr_manager'].includes(user.role) || row.id === user.id;
  return mapEmployee(row, includeSalary);
}

async function updateEmployee(user, id, updates) {
  const departmentId = updates.department
    ? await ensureDepartment(updates.department)
    : undefined;
  const patch = {};
  if (updates.name !== undefined) patch.full_name = updates.name;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.position !== undefined) patch.job_title = updates.position;
  if (updates.salary !== undefined) patch.salary = updates.salary;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.managerId !== undefined) patch.manager_id = updates.managerId || null;
  if (updates.bio !== undefined) patch.bio = updates.bio;
  if (departmentId !== undefined) patch.department_id = departmentId;

  await supabaseDb.query(
    `
    update public.profiles
    set
      full_name = coalesce($2, full_name),
      email = coalesce($3, email),
      department_id = coalesce($4, department_id),
      job_title = coalesce($5, job_title),
      salary = coalesce($6, salary),
      status = coalesce($7::public.profile_status, status),
      phone = coalesce($8, phone),
      location = coalesce($9, location),
      manager_id = coalesce($10, manager_id),
      bio = coalesce($11, bio)
    where id = $1
    `,
    [
      id,
      patch.full_name,
      patch.email,
      patch.department_id,
      patch.job_title,
      patch.salary,
      patch.status,
      patch.phone,
      patch.location,
      patch.manager_id,
      patch.bio,
    ],
  );
  return getEmployee(user, id);
}

async function createEmployee(body) {
  const fullName = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  if (!fullName || !email) throw new Error('Name and email required');
  const departmentId = body.department ? await ensureDepartment(body.department) : null;
  const role = body.position?.toLowerCase().includes('manager')
    ? 'manager'
    : body.position?.toLowerCase().includes('hr')
      ? 'hr_manager'
      : 'employee';
  const initials = fullName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  const authUser = await createOrInviteAuthUser(email, fullName, role);

  await supabaseDb.query(
    `
    insert into public.profiles (
      id, full_name, email, avatar, phone, role, department_id, manager_id, job_title,
      status, employment_type, location, hire_date, salary, performance_score, attendance_score,
      points, streak
    )
    values ($1, $2, $3, $4, $5, $6::public.app_role, $7, $8, $9, $10::public.profile_status,
      'full_time', $11, $12, $13, 80, 95, 0, 0)
    `,
    [
      authUser.id,
      fullName,
      email,
      initials,
      body.phone || null,
      role,
      departmentId,
      normalizeUuid(body.managerId),
      body.position || null,
      body.status || 'active',
      body.location || null,
      body.joinDate || new Date().toISOString().slice(0, 10),
      body.salary || 0,
    ],
  );

  return { id: authUser.id, name: fullName, email, inviteSent: authUser.inviteSent };
}

async function createOrInviteAuthUser(email, fullName, role) {
  const existing = await findAuthUserByEmail(email);
  if (existing) return { id: existing.id, inviteSent: false, existing: true };

  if (supabaseUrl && supabaseServiceRoleKey) {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({
          email,
          data: { full_name: fullName, name: fullName, requested_role: role },
          redirect_to: appUrl || undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return { id: body.id || body.user?.id, inviteSent: true };

      const afterInvite = await findAuthUserByEmail(email);
      if (afterInvite) return { id: afterInvite.id, inviteSent: false, existing: true };

      console.warn(`[Auth invite skipped] ${body.error_code || response.status}: ${body.msg || body.message || body.error || 'Supabase invite failed'}`);
    } catch (err) {
      console.warn(`[Auth invite skipped] ${err.message}`);
    }
  }

  return createAuthUserDirect(email, fullName, role);
}

async function findAuthUserByEmail(email) {
  return supabaseDb.queryOne('select id from auth.users where lower(email) = lower($1) limit 1', [email]);
}

async function createAuthUserDirect(email, fullName, role) {
  const authUser = await supabaseDb.queryOne(
    `
    insert into auth.users (
      id, aud, role, email, encrypted_password, invited_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
      phone, email_change_confirm_status, is_sso_user, is_anonymous
    )
    values (
      gen_random_uuid(), 'authenticated', 'authenticated', $1, null, now(), now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', $2::text, 'name', $2::text, 'requested_role', $3::text),
      false, now(), now(), null, 0, false, false
    )
    returning id
    `,
    [email, fullName, role],
  );

  await supabaseDb.query(
    `
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, created_at, updated_at
    )
    values (
      $1::text,
      $2::uuid,
      jsonb_build_object('sub', $2::text, 'email', $1::text, 'email_verified', false, 'full_name', $3::text),
      'email',
      now(),
      now()
    )
    on conflict (provider_id, provider) do update set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = now()
    `,
    [email, authUser.id, fullName],
  );
  return { id: authUser.id, inviteSent: false };
}

async function ensureDepartment(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  const row = await supabaseDb.queryOne(
    `
    insert into public.departments (name)
    values ($1)
    on conflict (name) do update set name = excluded.name
    returning id
    `,
    [trimmed],
  );
  return row.id;
}

async function getLeaveRequests(user, filters = {}) {
  const params = [];
  const where = [];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(lr.employee_id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`lr.employee_id = $${params.length}`);
    }
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`lr.status = $${params.length}`);
  }

  const rows = await supabaseDb.queryAll(
    `
    select
      lr.*,
      p.full_name as employee_name,
      p.avatar as employee_avatar,
      d.name as department,
      lt.name as leave_type,
      approver.full_name as approver_name
    from public.leave_requests lr
    join public.profiles p on p.id = lr.employee_id
    left join public.departments d on d.id = p.department_id
    left join public.leave_types lt on lt.id = lr.leave_type_id
    left join public.profiles approver on approver.id = lr.approver_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by lr.created_at desc
    `,
    params,
  );
  return rows.map(mapLeaveRequest);
}

async function createLeaveRequest(user, body) {
  const leaveType = await supabaseDb.queryOne('select id from public.leave_types where name = $1', [body.type]);
  if (!leaveType) throw new Error('Invalid leave type');
  const row = await supabaseDb.queryOne(
    `
    insert into public.leave_requests (employee_id, leave_type_id, from_date, to_date, days, reason)
    values ($1, $2, $3, $4, $5, $6)
    returning id
    `,
    [user.id, leaveType.id, body.startDate, body.endDate, body.days, body.reason || null],
  );
  return row;
}

async function decideLeaveRequest(user, id, status, comments) {
  const request = await supabaseDb.queryOne(
    `
    select
      lr.employee_id,
      lr.days,
      lr.from_date,
      p.manager_id,
      p.email,
      p.full_name,
      lt.name as leave_type
    from public.leave_requests lr
    join public.profiles p on p.id = lr.employee_id
    left join public.leave_types lt on lt.id = lr.leave_type_id
    where lr.id = $1
    `,
    [id],
  );
  if (!request) return null;
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role) && !(user.role === 'manager' && request.manager_id === user.id)) {
    return false;
  }
  await supabaseDb.query(
    `
    update public.leave_requests
    set status = $2::public.leave_status,
        approver_id = $3,
        comments = $4,
        decided_at = now()
    where id = $1
    `,
    [id, status, user.id, comments || null],
  );
  return {
    employeeId: request.employee_id,
    email: request.email,
    name: request.full_name,
    type: request.leave_type,
    days: Number(request.days || 0),
    startDate: request.from_date,
  };
}

async function getAttendance(user, filters = {}) {
  const params = [];
  const where = [];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(ar.employee_id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`ar.employee_id = $${params.length}`);
    }
  }
  if (filters.employeeId) {
    params.push(filters.employeeId);
    where.push(`ar.employee_id = $${params.length}`);
  }
  if (filters.month) {
    const month = String(filters.month);
    const year = filters.year || new Date().getFullYear();
    const formatted = month.includes('-') ? month : `${year}-${month.padStart(2, '0')}`;
    params.push(`${formatted}-01`, `${formatted}-31`);
    where.push(`ar.work_date between $${params.length - 1}::date and $${params.length}::date`);
  }
  const rows = await supabaseDb.queryAll(
    `
    select ar.*
    from public.attendance_records ar
    join public.profiles p on p.id = ar.employee_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by ar.work_date desc
    `,
    params,
  );
  return rows.map(mapAttendance);
}

async function checkIn(user) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await supabaseDb.queryOne(
    'select * from public.attendance_records where employee_id = $1 and work_date = $2',
    [user.id, today],
  );
  if (existing?.clock_in) throw new Error('Already checked in today');
  const now = new Date().toISOString();
  if (existing) {
    await supabaseDb.query(
      "update public.attendance_records set clock_in = $1, status = 'present' where id = $2",
      [now, existing.id],
    );
  } else {
    await supabaseDb.query(
      `
      insert into public.attendance_records (employee_id, work_date, clock_in, status, source)
      values ($1, $2, $3, 'present', 'web')
      `,
      [user.id, today, now],
    );
  }
  return { checkIn: new Date(now).toTimeString().slice(0, 5), date: today };
}

async function checkOut(user) {
  const today = new Date().toISOString().slice(0, 10);
  const record = await supabaseDb.queryOne(
    'select * from public.attendance_records where employee_id = $1 and work_date = $2',
    [user.id, today],
  );
  if (!record?.clock_in) throw new Error('Not checked in today');
  if (record.clock_out) throw new Error('Already checked out');
  const now = new Date();
  const hours = Math.max(0, (now.getTime() - new Date(record.clock_in).getTime()) / 3600000);
  const rounded = Math.round(hours * 10) / 10;
  await supabaseDb.query(
    `
    update public.attendance_records
    set clock_out = $1, total_hours = $2, overtime_hours = greatest($2 - 8, 0), is_incomplete = false
    where id = $3
    `,
    [now.toISOString(), rounded, record.id],
  );
  return { checkOut: now.toTimeString().slice(0, 5), hours: rounded };
}

async function getPayslips(user, filters = {}) {
  const params = [];
  const where = [];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    params.push(user.id);
    where.push(`pr.employee_id = $${params.length}`);
  } else if (filters.employeeId) {
    params.push(filters.employeeId);
    where.push(`pr.employee_id = $${params.length}`);
  }
  if (filters.month) {
    params.push(filters.month);
    where.push(`run.month = $${params.length}`);
  }
  if (filters.year) {
    params.push(Number(filters.year));
    where.push(`run.year = $${params.length}`);
  }
  const rows = await supabaseDb.queryAll(
    `
    select pr.*, run.month, run.year
    from public.payroll_records pr
    join public.payroll_runs run on run.id = pr.run_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by run.year desc, run.month asc
    `,
    params,
  );
  return rows.map(mapPayslip);
}

async function generatePayslips(user, month, year) {
  const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][Number(month) - 1] || month;
  const run = await supabaseDb.queryOne(
    `
    insert into public.payroll_runs (month, year, status, processed_by, processed_at)
    values ($1, $2, 'processing', $3, now())
    returning id
    `,
    [monthName, Number(year), user.id],
  );
  const employees = await supabaseDb.queryAll("select id, full_name, email, salary from public.profiles where status = 'active'");
  const results = [];
  for (const emp of employees) {
    const base = Number(emp.salary || 0);
    const hra = Math.round(base * 0.2);
    const conveyance = 1600;
    const medical = 1250;
    const bonus = 0;
    const pf = Math.round(base * 0.12);
    const tax = Math.round(base * 0.1);
    const net = base + hra + conveyance + medical + bonus - pf - tax;
    await supabaseDb.query(
      `
      insert into public.payroll_records (run_id, employee_id, base_salary, allowances, deductions, net_pay, status)
      values ($1, $2, $3, $4::jsonb, $5::jsonb, $6, 'processed')
      `,
      [
        run.id,
        emp.id,
        base,
        JSON.stringify({ hra, conveyance, medical, bonus }),
        JSON.stringify({ pf, tax }),
        net,
      ],
    );
    results.push({ id: emp.id, name: emp.full_name, email: emp.email, status: 'generated', net });
  }
  await supabaseDb.query("update public.payroll_runs set status = 'processed' where id = $1", [run.id]);
  return { monthName, results };
}

async function getPerformance(user, filters = {}) {
  const params = [];
  const where = [];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(pr.employee_id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`pr.employee_id = $${params.length}`);
    }
  }
  if (filters.employeeId) {
    params.push(filters.employeeId);
    where.push(`pr.employee_id = $${params.length}`);
  }
  const rows = await supabaseDb.queryAll(
    `
    select pr.*, rc.period, rc.name as cycle_name, p.manager_id
    from public.performance_reviews pr
    left join public.review_cycles rc on rc.id = pr.cycle_id
    join public.profiles p on p.id = pr.employee_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by pr.created_at desc
    `,
    params,
  );
  return rows.map(mapPerformance);
}

async function createPerformance(user, body) {
  const target = await supabaseDb.queryOne('select id, manager_id from public.profiles where id = $1', [body.employeeId]);
  if (!target) return null;
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role) && !(user.role === 'manager' && target.manager_id === user.id)) {
    return false;
  }
  const scores = {
    technical: Number(body.technicalScore || 0),
    communication: Number(body.communicationScore || 0),
    leadership: Number(body.leadershipScore || 0),
    delivery: Number(body.deliveryScore || 0),
    innovation: Number(body.innovationScore || 0),
    teamwork: Number(body.teamworkScore || 0),
  };
  scores.overall = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / 6);
  scores.comments = body.comments || '';
  const row = await supabaseDb.queryOne(
    `
    insert into public.performance_reviews (employee_id, reviewer_id, self_assessment, manager_review, rating, status)
    values ($1, $2, $3::jsonb, $4::jsonb, $5, 'completed')
    returning id
    `,
    [body.employeeId, user.id, JSON.stringify({ goals: body.goals || '' }), JSON.stringify(scores), scores.overall],
  );
  await supabaseDb.query('update public.profiles set performance_score = $1 where id = $2', [scores.overall, body.employeeId]);
  return { id: row.id, overall: scores.overall };
}

async function getJobs() {
  const rows = await supabaseDb.queryAll(
    `
    select jp.*, d.name as department
    from public.job_postings jp
    left join public.departments d on d.id = jp.department_id
    order by jp.posted_date desc nulls last, jp.created_at desc
    `,
  );
  return rows.map(mapJob);
}

async function createJob(user, body) {
  const departmentId = body.department ? await ensureDepartment(body.department) : null;
  const row = await supabaseDb.queryOne(
    `
    insert into public.job_postings (title, department_id, type, location, openings, posted_by, posted_date, status)
    values ($1, $2, $3, $4, $5, $6, current_date, 'active')
    returning *
    `,
    [body.title, departmentId, body.type || null, body.location || null, body.openings || 1, user.id],
  );
  return mapJob({ ...row, department: body.department || '' });
}

async function updateJob(id, body) {
  const departmentId = body.department ? await ensureDepartment(body.department) : undefined;
  const row = await supabaseDb.queryOne(
    `
    update public.job_postings
    set title = coalesce($2, title),
        department_id = coalesce($3, department_id),
        type = coalesce($4, type),
        location = coalesce($5, location),
        openings = coalesce($6, openings),
        status = coalesce($7, status),
        updated_at = now()
    where id = $1
    returning *
    `,
    [
      id,
      body.title || null,
      departmentId || null,
      body.type || null,
      body.location || null,
      body.openings ?? null,
      body.status || null,
    ],
  );
  return row ? mapJob({ ...row, department: body.department || '' }) : null;
}

async function deleteJob(id) {
  await supabaseDb.query('delete from public.job_postings where id = $1', [id]);
}

async function getCandidates() {
  const rows = await supabaseDb.queryAll(
    `
    select c.*, jp.title as position, d.name as department
    from public.candidates c
    left join public.job_postings jp on jp.id = c.job_posting_id
    left join public.departments d on d.id = jp.department_id
    order by c.applied_at desc
    `,
  );
  return rows.map(mapCandidate);
}

async function createCandidate(body) {
  const job = body.position
    ? await supabaseDb.queryOne('select id from public.job_postings where title = $1 limit 1', [body.position])
    : null;
  const row = await supabaseDb.queryOne(
    `
    insert into public.candidates (job_posting_id, name, email, phone, stage, rating, notes)
    values ($1, $2, $3, $4, $5::public.candidate_stage, 0, $6)
    returning *
    `,
    [job?.id || null, body.name, body.email, body.phone || null, body.stage || 'applied', body.note || null],
  );
  return mapCandidate({ ...row, position: body.position, department: body.department });
}

async function updateCandidate(id, body) {
  const row = await supabaseDb.queryOne(
    `
    update public.candidates
    set stage = coalesce($2::public.candidate_stage, stage),
        rating = coalesce($3, rating),
        notes = coalesce($4, notes)
    where id = $1
    returning *
    `,
    [id, body.stage || null, body.score ?? null, body.note ?? null],
  );
  return row ? mapCandidate(row) : null;
}

async function getDocuments(user, filters = {}) {
  const params = [];
  const where = [];
  if (filters.category) {
    params.push(filters.category);
    where.push(`doc.category = $${params.length}`);
  }
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(doc.employee_id is null or doc.employee_id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`(doc.employee_id is null or doc.employee_id = $${params.length})`);
    }
  }
  const rows = await supabaseDb.queryAll(
    `
    select doc.*, uploader.full_name as uploader_name
    from public.documents doc
    left join public.profiles p on p.id = doc.employee_id
    left join public.profiles uploader on uploader.id = doc.uploaded_by
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by doc.created_at desc
    `,
    params,
  );
  return rows.map(mapDocument);
}

async function createDocument(user, body, file) {
  const targetEmployeeId = body.employeeId || user.id;
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role) && targetEmployeeId !== user.id) {
    if (user.role !== 'manager') return false;
    const target = await supabaseDb.queryOne(
      'select id, manager_id from public.profiles where id = $1',
      [targetEmployeeId],
    );
    if (!target || target.manager_id !== user.id) return false;
  }
  const row = await supabaseDb.queryOne(
    `
    insert into public.documents (employee_id, name, mime_type, category, storage_path, file_size, uploaded_by, description)
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning *
    `,
    [
      targetEmployeeId,
      body.name || file.originalname,
      file.mimetype,
      body.category || 'general',
      `/uploads/${file.filename}`,
      file.size,
      user.id,
      body.description || '',
    ],
  );
  return mapDocument({ ...row, uploader_name: user.name });
}

async function deleteDocument(id) {
  const row = await supabaseDb.queryOne('delete from public.documents where id = $1 returning *', [id]);
  return row ? mapDocument(row) : null;
}

async function getExpenses(user, filters = {}) {
  const params = [];
  const where = [];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(ex.employee_id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`ex.employee_id = $${params.length}`);
    }
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`ex.status = $${params.length}`);
  }
  const rows = await supabaseDb.queryAll(
    `
    select ex.*, p.full_name as employee_name, p.avatar as employee_avatar, approver.full_name as approver_name
    from public.expenses ex
    join public.profiles p on p.id = ex.employee_id
    left join public.profiles approver on approver.id = ex.approver_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by ex.created_at desc
    `,
    params,
  );
  return rows.map(mapExpense);
}

async function createExpense(user, body) {
  const row = await supabaseDb.queryOne(
    `
    insert into public.expenses (employee_id, category, amount, description, expense_date, status)
    values ($1, $2, $3, $4, $5, 'pending')
    returning *
    `,
    [user.id, body.category, Number(body.amount), body.description || '', body.date || new Date().toISOString().slice(0, 10)],
  );
  return mapExpense({ ...row, employee_name: user.name, employee_avatar: user.avatar });
}

async function decideExpense(user, id, status, comments) {
  const expense = await supabaseDb.queryOne(
    `
    select ex.employee_id, p.manager_id
    from public.expenses ex
    join public.profiles p on p.id = ex.employee_id
    where ex.id = $1
    `,
    [id],
  );
  if (!expense) return null;
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role) && !(user.role === 'manager' && expense.manager_id === user.id)) return false;
  const row = await supabaseDb.queryOne(
    `
    update public.expenses
    set status = $2::public.expense_status, approver_id = $3, comments = $4, decided_at = now()
    where id = $1
    returning *
    `,
    [id, status, user.id, comments || null],
  );
  return mapExpense(row);
}

async function getShifts(user, filters = {}) {
  const params = [];
  const where = [];
  if (filters.week) {
    params.push(`${filters.week}%`);
    where.push(`sh.shift_date::text like $${params.length}`);
  }
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    if (user.role === 'manager') {
      params.push(user.id);
      where.push(`(sh.employee_id = $${params.length} or p.manager_id = $${params.length})`);
    } else {
      params.push(user.id);
      where.push(`sh.employee_id = $${params.length}`);
    }
  }
  const rows = await supabaseDb.queryAll(
    `
    select sh.*, p.full_name as employee_name
    from public.shifts sh
    join public.profiles p on p.id = sh.employee_id
    ${where.length ? `where ${where.join(' and ')}` : ''}
    order by sh.shift_date, sh.start_time
    `,
    params,
  );
  return rows.map(mapShift);
}

async function canManageProfile(user, employeeId) {
  if (['super_admin', 'admin', 'hr_manager'].includes(user.role)) return true;
  const row = await supabaseDb.queryOne('select manager_id from public.profiles where id = $1', [employeeId]);
  return user.role === 'manager' && row?.manager_id === user.id;
}

async function createShift(user, body) {
  if (!(await canManageProfile(user, body.employeeId))) return false;
  const row = await supabaseDb.queryOne(
    `
    insert into public.shifts (employee_id, shift_date, shift_type, start_time, end_time, status, notes, created_by)
    values ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
    returning *
    `,
    [body.employeeId, body.date, body.shiftType || 'morning', body.startTime || null, body.endTime || null, body.notes || null, user.id],
  );
  return mapShift({ ...row, employee_name: body.employeeName || '' });
}

async function updateShift(user, id, body) {
  const existing = await supabaseDb.queryOne('select employee_id from public.shifts where id = $1', [id]);
  if (!existing) return null;
  if (!(await canManageProfile(user, existing.employee_id))) return false;
  const row = await supabaseDb.queryOne(
    `
    update public.shifts
    set status = coalesce($2::public.shift_status, status),
        shift_type = coalesce($3, shift_type),
        start_time = coalesce($4, start_time),
        end_time = coalesce($5, end_time),
        notes = coalesce($6, notes)
    where id = $1
    returning *
    `,
    [id, body.status || null, body.shiftType || null, body.startTime || null, body.endTime || null, body.notes || null],
  );
  return mapShift(row);
}

async function deleteShift(user, id) {
  const existing = await supabaseDb.queryOne('select employee_id from public.shifts where id = $1', [id]);
  if (!existing) return null;
  if (!(await canManageProfile(user, existing.employee_id))) return false;
  await supabaseDb.query('delete from public.shifts where id = $1', [id]);
  return true;
}

async function getCalendarEvents() {
  const rows = await supabaseDb.queryAll('select * from public.calendar_events order by start_date asc');
  return rows.map(mapCalendarEvent);
}

async function createCalendarEvent(user, body) {
  const row = await supabaseDb.queryOne(
    `
    insert into public.calendar_events (title, start_date, end_date, type, color, description, created_by)
    values ($1, $2, $3, $4, $5, $6, $7)
    returning *
    `,
    [body.title, body.date, body.endDate || null, body.type || 'meeting', body.color || '#3b82f6', body.description || '', user.id],
  );
  return mapCalendarEvent(row);
}

async function deleteCalendarEvent(id) {
  await supabaseDb.query('delete from public.calendar_events where id = $1', [id]);
}

module.exports = {
  mapEmployee,
  mapLeaveRequest,
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getLeaveRequests,
  createLeaveRequest,
  decideLeaveRequest,
  getAttendance,
  checkIn,
  checkOut,
  getPayslips,
  generatePayslips,
  getPerformance,
  createPerformance,
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getCandidates,
  createCandidate,
  updateCandidate,
  getDocuments,
  createDocument,
  deleteDocument,
  getExpenses,
  createExpense,
  decideExpense,
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
};
