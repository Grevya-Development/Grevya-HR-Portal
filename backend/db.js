const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'grevya.db');
const db = new Database(dbPath);

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL,
      joinDate TEXT NOT NULL,
      salary REAL NOT NULL,
      performance INTEGER NOT NULL,
      attendance INTEGER NOT NULL,
      avatar TEXT,
      phone TEXT,
      location TEXT,
      points INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeAvatar TEXT,
      type TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      days INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL,
      appliedOn TEXT NOT NULL,
      approvedBy TEXT,
      comments TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      openings INTEGER NOT NULL,
      posted TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      stage TEXT NOT NULL,
      appliedDate TEXT NOT NULL,
      avatar TEXT,
      score INTEGER,
      note TEXT
    );
  `);

  // Insert mock data if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const count = countStmt.get().count;

  if (count === 0) {
    console.log("Seeding initial demo database...");
    const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)');
    insertUser.run('sys-admin', 'System Admin', 'admin@grevya.com', 'admin123', 'admin', 'SA');
    insertUser.run('demo-hr', 'Divya Kumar (HR)', 'hr@grevya.com', 'hr123', 'hr_manager', 'DK');
    insertUser.run('demo-mgr', 'Ravi Nair (Manager)', 'manager@grevya.com', 'mgr123', 'manager', 'RN');
    insertUser.run('demo-emp', 'Kiran Patel', 'employee@grevya.com', 'emp123', 'employee', 'KP');

    const insertEmp = db.prepare(`
      INSERT INTO employees 
      (id, name, email, department, position, status, joinDate, salary, performance, attendance, avatar, phone, location) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertEmp.run('e1', 'Kiran Patel', 'employee@grevya.com', 'Engineering', 'Frontend Developer', 'active', '2022-03-15', 85000, 92, 98, 'KP', '+91 98765 43210', 'Bangalore');
    insertEmp.run('e2', 'Sneha Rao', 'sneha@grevya.com', 'Design', 'UX Designer', 'active', '2021-08-10', 78000, 88, 95, 'SR', '+91 98765 00001', 'Mumbai');
    insertEmp.run('e3', 'Ravi Nair', 'manager@grevya.com', 'Engineering', 'Engineering Manager', 'active', '2020-01-20', 145000, 95, 99, 'RN', '+91 98765 00002', 'Bangalore');
    insertEmp.run('e4', 'Divya Kumar', 'hr@grevya.com', 'HR', 'HR Manager', 'active', '2019-11-05', 110000, 90, 96, 'DK', '+91 98765 00003', 'Delhi');
    insertEmp.run('e5', 'Arjun Mehta', 'arjun@grevya.com', 'Sales', 'Account Exec', 'active', '2023-01-10', 65000, 75, 85, 'AM', '+91 98765 00004', 'Mumbai');

    const insertJob = db.prepare('INSERT INTO jobs (id, title, department, type, location, openings, posted, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertJob.run('j1', 'Senior Backend Engineer', 'Engineering', 'full_time', 'Bangalore', 2, '2024-03-01', 'active');
    insertJob.run('j2', 'Product Designer', 'Design', 'full_time', 'Remote', 1, '2024-03-05', 'active');

    const insertCandidate = db.prepare('INSERT INTO candidates (id, name, email, phone, position, department, stage, appliedDate, avatar, score, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertCandidate.run('c1', 'Aditya Verma', 'aditya@email.com', '+91 98700 00001', 'Senior Backend Engineer', 'Engineering', 'interview', '2024-03-10', 'AV', 82, 'Strong Python skills.');
    insertCandidate.run('c2', 'Ritika Shah', 'ritika@email.com', '+91 98700 00002', 'Product Designer', 'Design', 'screening', '2024-03-12', 'RS', 75, null);
    
    const insertLeave = db.prepare('INSERT INTO leave_requests (id, employeeId, employeeName, employeeAvatar, type, startDate, endDate, days, reason, status, appliedOn, approvedBy, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLeave.run('l1', 'e1', 'Kiran Patel', 'KP', 'casual', '2024-03-20', '2024-03-21', 2, 'Family trip', 'approved', '2024-03-10', 'Ravi Nair', 'Have a good time.');
    insertLeave.run('l2', 'e5', 'Arjun Mehta', 'AM', 'sick', '2024-03-25', '2024-03-26', 2, 'Fever', 'pending', '2024-03-24', null, null);
  }
}

initDb();

module.exports = db;
