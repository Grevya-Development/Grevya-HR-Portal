const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'grevya-secret-key-123';

// Middleware for JWT Verification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Middleware for Role Based Access Control (RBAC)
function requireAdminOrHR(req, res, next) {
  if (['admin', 'hr_manager', 'manager'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized: Requires Admin, HR, or Manager privileges' });
  }
}

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE email = ? AND password = ?').get(email, password);
  
  if (user) {
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(req.user.id);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- EMPLOYEES ---
app.get('/api/employees', authenticateToken, (req, res) => {
  if (req.user.role === 'employee') {
    // RBAC: Employee can only see their own record
    const employees = db.prepare('SELECT * FROM employees WHERE email = ?').all(req.user.email);
    return res.json(employees);
  }
  const employees = db.prepare('SELECT * FROM employees').all();
  res.json(employees);
});

app.post('/api/employees', authenticateToken, requireAdminOrHR, (req, res) => {
  const emp = req.body;
  const id = 'e' + Date.now();
  try {
    const stmt = db.prepare(`
      INSERT INTO employees 
      (id, name, email, department, position, status, joinDate, salary, performance, attendance, avatar, phone, location) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, emp.name, emp.email, emp.department, emp.position, emp.status, emp.joinDate, emp.salary, emp.performance, emp.attendance, emp.avatar, emp.phone || '', emp.location || '');
    res.status(201).json(db.prepare('SELECT * FROM employees WHERE id = ?').get(id));
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/employees/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  const emp = req.body;
  const { id } = req.params;
  try {
    const stmt = db.prepare(`
      UPDATE employees SET 
        name = ?, email = ?, department = ?, position = ?, 
        status = ?, joinDate = ?, salary = ?, performance = ?, 
        attendance = ?, avatar = ?, phone = ?, location = ?
      WHERE id = ?
    `);
    const info = stmt.run(emp.name, emp.email, emp.department, emp.position, emp.status, emp.joinDate, emp.salary, emp.performance, emp.attendance, emp.avatar, emp.phone || '', emp.location || '', id);
    if (info.changes > 0) res.json(db.prepare('SELECT * FROM employees WHERE id = ?').get(id));
    else res.status(404).json({ error: 'Employee not found' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/employees/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  const info = db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  if (info.changes > 0) res.json({ success: true, id: req.params.id });
  else res.status(404).json({ error: 'Employee not found' });
});

// --- JOBS ---
app.get('/api/jobs', authenticateToken, (req, res) => {
  res.json(db.prepare('SELECT * FROM jobs').all());
});

app.post('/api/jobs', authenticateToken, requireAdminOrHR, (req, res) => {
  const job = req.body;
  const id = 'j' + Date.now();
  try {
    db.prepare('INSERT INTO jobs (id, title, department, type, location, openings, posted, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, job.title, job.department, job.type, job.location, job.openings, job.posted, job.status);
    res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/jobs/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  const job = req.body;
  const info = db.prepare('UPDATE jobs SET title = ?, department = ?, type = ?, location = ?, openings = ?, posted = ?, status = ? WHERE id = ?')
    .run(job.title, job.department, job.type, job.location, job.openings, job.posted, job.status, req.params.id);
  if (info.changes) res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
  else res.status(404).json({ error: 'Not found' });
});

// --- CANDIDATES ---
app.get('/api/candidates', authenticateToken, requireAdminOrHR, (req, res) => res.json(db.prepare('SELECT * FROM candidates').all()));

app.post('/api/candidates', authenticateToken, requireAdminOrHR, (req, res) => {
  const cand = req.body;
  const id = 'c' + Date.now();
  try {
    db.prepare('INSERT INTO candidates (id, name, email, phone, position, department, stage, appliedDate, avatar, score, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, cand.name, cand.email, cand.phone, cand.position, cand.department, cand.stage, cand.appliedDate, cand.avatar, cand.score, cand.note);
    res.status(201).json(db.prepare('SELECT * FROM candidates WHERE id = ?').get(id));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/candidates/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  const cand = req.body;
  const info = db.prepare('UPDATE candidates SET name = ?, email = ?, phone = ?, position = ?, department = ?, stage = ?, appliedDate = ?, avatar = ?, score = ?, note = ? WHERE id = ?')
    .run(cand.name, cand.email, cand.phone, cand.position, cand.department, cand.stage, cand.appliedDate, cand.avatar, cand.score, cand.note, req.params.id);
  if (info.changes) res.json(db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id));
  else res.status(404).json({ error: 'Not found' });
});

// --- LEAVE REQUESTS ---
app.get('/api/leave-requests', authenticateToken, (req, res) => {
  if (req.user.role === 'employee') {
    return res.json(db.prepare('SELECT * FROM leave_requests WHERE employeeName = ?').all(req.user.name));
  }
  res.json(db.prepare('SELECT * FROM leave_requests').all());
});

app.post('/api/leave-requests', authenticateToken, (req, res) => {
  const lr = req.body;
  const id = 'l' + Date.now();
  try {
    db.prepare('INSERT INTO leave_requests (id, employeeId, employeeName, employeeAvatar, type, startDate, endDate, days, reason, status, appliedOn, approvedBy, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, lr.employeeId, lr.employeeName, lr.employeeAvatar, lr.type, lr.startDate, lr.endDate, lr.days, lr.reason, lr.status, lr.appliedOn, lr.approvedBy, lr.comments);
    res.status(201).json(db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/leave-requests/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'employee') {
    return res.status(403).json({ error: 'Employees cannot approve or reject leaves' });
  }
  const lr = req.body;
  const info = db.prepare('UPDATE leave_requests SET status = ?, approvedBy = ?, comments = ? WHERE id = ?')
    .run(lr.status, lr.approvedBy, lr.comments, req.params.id);
  if (info.changes) res.json(db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id));
  else res.status(404).json({ error: 'Not found' });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', authenticateToken, (req, res) => res.json(db.prepare('SELECT * FROM notifications').all()));

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const info = db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(req.params.id);
  if (info.changes) res.json({ success: true });
  else res.status(404).json({ error: 'Not found' });
});

app.put('/api/notifications/mark-all-read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET isRead = 1').run();
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
