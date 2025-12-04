import express from 'express';
import cors from 'cors';
let Database: any = null;
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory (for logos and temporary files)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files (logos)
app.use('/uploads', express.static(uploadsDir));

// DMS storage root for documents
const storageRoot = path.join(__dirname, '../storage/app/files');
if (!fs.existsSync(storageRoot)) {
  fs.mkdirSync(storageRoot, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const IS_VERCEL = !!process.env.VERCEL;
const useSupabase = !!supabase;

// Initialize SQLite database (disabled on Vercel)
const db = IS_VERCEL ? null : (Database || (Database = require('better-sqlite3')) , new Database('registry.db'));

// Create tables
if (db) db.exec(`
  CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    institution_type TEXT NOT NULL CHECK (institution_type IN ('university', 'college', 'academy')),
    accreditation_status TEXT DEFAULT 'pending' CHECK (accreditation_status IN ('pending', 'accredited', 'expired', 'suspended')),
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS study_programs (
    id TEXT PRIMARY KEY,
    institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    degree_level TEXT NOT NULL CHECK (degree_level IN ('bachelor', 'master', 'phd', 'professional')),
    duration_years INTEGER NOT NULL CHECK (duration_years > 0 AND duration_years <= 6),
    ects_credits INTEGER,
    accreditation_status TEXT DEFAULT 'pending',
    accreditation_expiry DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accreditation_processes (
    id TEXT PRIMARY KEY,
    institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
    assigned_officer_id TEXT,
    process_type TEXT NOT NULL CHECK (process_type IN ('initial', 'renewal', 're-evaluation')),
    status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'appeal')),
    application_date DATE NOT NULL,
    decision_date DATE,
    decision TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
    program_id TEXT REFERENCES study_programs(id) ON DELETE CASCADE,
    process_id TEXT REFERENCES accreditation_processes(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT,
    description TEXT,
    issuer TEXT,
    issued_at DATE,
    number TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    sha256 TEXT,
    version INTEGER DEFAULT 1,
    is_confidential BOOLEAN DEFAULT 0,
    tags TEXT,
    uploaded_by TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer', 'institution')),
    is_active BOOLEAN DEFAULT 1,
    institution_id TEXT REFERENCES institutions(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_role TEXT,
    actor_name TEXT,
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    changed_fields TEXT,
    prev_values TEXT,
    new_values TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations: add columns to institutions if missing
function ensureColumn(table: string, column: string, typeClause: string) {
  if (!db) return;
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  const exists = info.some(c => c.name === column);
  if (!exists) {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeClause}`).run();
    } catch { /* ignore */ }
  }
}

ensureColumn('institutions', 'ownership_type', 'TEXT');
ensureColumn('institutions', 'founded_on', 'DATE');
ensureColumn('institutions', 'accreditation_valid_from', 'DATE');
ensureColumn('institutions', 'accreditation_valid_to', 'DATE');
ensureColumn('institutions', 'competent_authority', 'TEXT');
ensureColumn('institutions', 'notes', 'TEXT');
ensureColumn('accreditation_processes', 'program_id', 'TEXT');
ensureColumn('institutions', 'registration_number', 'TEXT');
ensureColumn('institutions', 'tax_id', 'TEXT');
ensureColumn('institutions', 'short_name', 'TEXT');
ensureColumn('institutions', 'municipality', 'TEXT');
ensureColumn('institutions', 'postal_code', 'TEXT');
ensureColumn('institutions', 'country', "TEXT DEFAULT 'Bosna i Hercegovina'");
ensureColumn('institutions', 'founder_name', 'TEXT');
ensureColumn('institutions', 'founding_act_reference', 'TEXT');
ensureColumn('institutions', 'head_name', 'TEXT');
ensureColumn('institutions', 'head_title', 'TEXT');
ensureColumn('institutions', 'fax', 'TEXT');
ensureColumn('institutions', 'is_active', 'BOOLEAN DEFAULT 1');

// Migrate old user roles
if (db) {
  try {
    const roles = db.prepare(`SELECT DISTINCT role FROM users`).all() as Array<{ role: string }>;
    const hasOldRole = roles.some(r => r.role === 'officer');
    if (hasOldRole) {
      db.prepare(`UPDATE users SET role = 'operator' WHERE role = 'officer'`).run();
    }
  } catch {}
}

// Rebuild users table to ensure updated CHECK constraint
if (db) {
try {
  db.prepare('BEGIN').run();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer', 'institution')),
      is_active BOOLEAN DEFAULT 1,
      institution_id TEXT REFERENCES institutions(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const rows = db.prepare('SELECT id, email, password, full_name, role, is_active, institution_id, created_at FROM users').all() as any[];
  const insert = db.prepare('INSERT INTO users_new (id, email, password, full_name, role, is_active, institution_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const r of rows) {
    const newRole = r.role === 'officer' ? 'operator' : r.role;
    insert.run(r.id, r.email, r.password, r.full_name, newRole, r.is_active, r.institution_id, r.created_at);
  }
  db.prepare('DROP TABLE users').run();
  db.prepare('ALTER TABLE users_new RENAME TO users').run();
  db.prepare('COMMIT').run();
} catch (e) {
  try { db.prepare('ROLLBACK').run(); } catch {}
}
}

if (db) {
try {
  db.prepare('BEGIN').run();
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs_new (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_role TEXT,
      actor_name TEXT,
      action TEXT,
      resource_type TEXT,
      resource_id TEXT,
      changed_fields TEXT,
      prev_values TEXT,
      new_values TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'").get() as any;
  if (exists?.name) {
    const oldLogs = db.prepare('SELECT id, actor_id, actor_role, action, resource_type, resource_id, changes, created_at FROM audit_logs').all() as any[];
    const ins = db.prepare('INSERT INTO audit_logs_new (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const l of oldLogs) {
      ins.run(l.id, l.actor_id || null, l.actor_role || null, null, l.action || null, l.resource_type || null, l.resource_id || null, null, null, l.changes || null, l.created_at || null);
    }
    db.prepare('DROP TABLE audit_logs').run();
  }
  db.prepare('ALTER TABLE audit_logs_new RENAME TO audit_logs').run();
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS audit_logs_no_update BEFORE UPDATE ON audit_logs BEGIN SELECT RAISE(ABORT, 'Audit logs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete BEFORE DELETE ON audit_logs BEGIN SELECT RAISE(ABORT, 'Audit logs are immutable'); END;
  `);
  db.prepare('COMMIT').run();
} catch (e) {
  try { db.prepare('ROLLBACK').run(); } catch {}
}
}

function actorNameById(id?: string) {
  if (!id) return null;
  try {
    if (db) {
      const u = db.prepare('SELECT full_name FROM users WHERE id = ?').get(id) as any;
      return u?.full_name || null;
    }
    return null;
  } catch { return null; }
}

function diffObject(prev: any, next: any, fields?: string[]) {
  const keys = fields && fields.length ? fields : Array.from(new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]));
  const changed: string[] = [];
  const prevOut: any = {};
  const nextOut: any = {};
  for (const k of keys) {
    const pv = prev ? prev[k] : undefined;
    const nv = next ? next[k] : undefined;
    if (JSON.stringify(pv) !== JSON.stringify(nv)) {
      changed.push(k);
      if (prev && k in prev) prevOut[k] = pv;
      if (next && k in next) nextOut[k] = nv;
    }
  }
  return { changed, prevOut, nextOut };
}

// Insert sample data
const sampleData = db ? (db.prepare('SELECT COUNT(*) as count FROM institutions').get() as { count: number }) : { count: 0 };
if (db) {
  const institutions = [
    {
      id: 'inst-001',
      name: 'Univerzitet u Sarajevu',
      address: 'Obala Kulina bana 7/II',
      city: 'Sarajevo',
      phone: '+387 33 668 500',
      email: 'info@unsa.ba',
      website: 'https://www.unsa.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/unsa.svg'
    },
    {
      id: 'inst-002',
      name: 'Univerzitet u Tuzli',
      address: 'Univerzitetska 4',
      city: 'Tuzla',
      phone: '+387 35 320 800',
      email: 'info@untz.ba',
      website: 'https://www.untz.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/untz.svg'
    },
    {
      id: 'inst-003',
      name: 'Univerzitet u Mostaru',
      address: 'Matice hrvatske bb',
      city: 'Mostar',
      phone: '+387 36 350 800',
      email: 'info@unmo.ba',
      website: 'https://www.unmo.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/unmo.svg'
    },
    {
      id: 'inst-004',
      name: 'Internacionalni Univerzitet Burch',
      address: 'Ilidža 1',
      city: 'Sarajevo',
      phone: '+387 33 957 000',
      email: 'info@ibu.edu.ba',
      website: 'https://www.ibu.edu.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/burch.svg'
    },
    {
      id: 'inst-005',
      name: 'Univerzitet u Banjoj Luci',
      address: 'Bulevar vojvode Petra Bojovića 1A',
      city: 'Banja Luka',
      phone: '+387 51 321 000',
      email: 'info@unibl.org',
      website: 'https://www.unibl.org',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/unibl.svg'
    },
    {
      id: 'inst-006',
      name: 'Univerzitet u Zenici',
      address: 'Fakultetska 3',
      city: 'Zenica',
      phone: '+387 32 444 000',
      email: 'info@unze.ba',
      website: 'https://www.unze.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/unze.svg'
    },
    {
      id: 'inst-007',
      name: 'Univerzitet u Istočnom Sarajevu',
      address: 'Vuka Karadžića 30',
      city: 'Istočno Sarajevo',
      phone: '+387 57 320 100',
      email: 'info@ues.rs.ba',
      website: 'https://www.ues.rs.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/ues.svg'
    },
    {
      id: 'inst-008',
      name: 'Univerzitet u Bihaću',
      address: 'Luke Marjanovića bb',
      city: 'Bihać',
      phone: '+387 37 221 000',
      email: 'info@unbi.ba',
      website: 'https://www.unbi.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/unbi.svg'
    },
    {
      id: 'inst-009',
      name: 'Internacionalni Univerzitet Sarajevo (IUS)',
      address: 'Hrasnička cesta 15',
      city: 'Sarajevo',
      phone: '+387 33 957 175',
      email: 'info@ius.edu.ba',
      website: 'https://www.ius.edu.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/ius.svg'
    },
    {
      id: 'inst-010',
      name: 'Univerzitet Sarajevo School of Science and Technology (SSST)',
      address: 'Hrasnička cesta 3',
      city: 'Sarajevo',
      phone: '+387 33 975 000',
      email: 'info@ssst.edu.ba',
      website: 'https://www.ssst.edu.ba',
      institution_type: 'college',
      accreditation_status: 'accredited',
      logo_url: '/logos/ssst.svg'
    },
    {
      id: 'inst-011',
      name: 'Univerzitet "Džemal Bijedić" u Mostaru',
      address: 'Univerzitetski kampus bb',
      city: 'Mostar',
      phone: '+387 36 253 000',
      email: 'info@unmo.ba',
      website: 'https://www.unmo.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/djb.svg'
    },
    {
      id: 'inst-012',
      name: 'Univerzitet u Travniku',
      address: 'Aleja konzula bb',
      city: 'Travnik',
      phone: '+387 30 333 000',
      email: 'info@unt.ba',
      website: 'https://www.unt.ba',
      institution_type: 'university',
      accreditation_status: 'accredited',
      logo_url: '/logos/travnik.svg'
    }
  ];

  const insertInstitution = db.prepare(`
    INSERT OR IGNORE INTO institutions (id, name, address, city, phone, email, website, institution_type, accreditation_status, logo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  institutions.forEach(inst => {
    insertInstitution.run(inst.id, inst.name, inst.address, inst.city, inst.phone, inst.email, inst.website, inst.institution_type, inst.accreditation_status, inst.logo_url);
  });

  // Insert sample study programs
  const studyPrograms = [
    { id: 'prog-001', institution_id: 'inst-001', name: 'Računarstvo i informatika', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited', accreditation_expiry: '2025-12-31' },
    { id: 'prog-002', institution_id: 'inst-001', name: 'Elektrotehnika', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited', accreditation_expiry: '2025-12-31' },
    { id: 'prog-003', institution_id: 'inst-001', name: 'Pravo', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-06-30' },
    { id: 'prog-004', institution_id: 'inst-002', name: 'Strojarstvo', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited', accreditation_expiry: '2025-09-30' },
    { id: 'prog-005', institution_id: 'inst-002', name: 'Ekonomija', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited', accreditation_expiry: '2026-03-31' },
    { id: 'prog-006', institution_id: 'inst-003', name: 'Medicina', degree_level: 'bachelor', duration_years: 6, ects_credits: 360, accreditation_status: 'accredited', accreditation_expiry: '2027-12-31' },
    { id: 'prog-007', institution_id: 'inst-005', name: 'Matematika', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-12-31' },
    { id: 'prog-008', institution_id: 'inst-005', name: 'Informatika', degree_level: 'master', duration_years: 2, ects_credits: 120, accreditation_status: 'accredited', accreditation_expiry: '2027-06-30' },
    { id: 'prog-009', institution_id: 'inst-006', name: 'Građevinarstvo', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-09-30' },
    { id: 'prog-010', institution_id: 'inst-006', name: 'Metalurgija', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-05-31' },
    { id: 'prog-011', institution_id: 'inst-007', name: 'Ekonomija', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited', accreditation_expiry: '2026-03-31' },
    { id: 'prog-012', institution_id: 'inst-007', name: 'Pravo', degree_level: 'master', duration_years: 2, ects_credits: 120, accreditation_status: 'accredited', accreditation_expiry: '2027-03-31' },
    { id: 'prog-013', institution_id: 'inst-008', name: 'Šumarstvo', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-11-30' },
    { id: 'prog-014', institution_id: 'inst-009', name: 'Software Engineering', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2027-12-31' },
    { id: 'prog-015', institution_id: 'inst-009', name: 'International Relations', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2027-12-31' },
    { id: 'prog-016', institution_id: 'inst-010', name: 'Computer Science', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-12-31' },
    { id: 'prog-017', institution_id: 'inst-010', name: 'Information Systems', degree_level: 'master', duration_years: 2, ects_credits: 120, accreditation_status: 'accredited', accreditation_expiry: '2027-06-30' },
    { id: 'prog-018', institution_id: 'inst-011', name: 'Mašinstvo', degree_level: 'bachelor', duration_years: 4, ects_credits: 240, accreditation_status: 'accredited', accreditation_expiry: '2026-10-31' },
    { id: 'prog-019', institution_id: 'inst-011', name: 'Nastavnički smjer', degree_level: 'master', duration_years: 2, ects_credits: 120, accreditation_status: 'accredited', accreditation_expiry: '2027-05-31' },
    { id: 'prog-020', institution_id: 'inst-012', name: 'Biznis i menadžment', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited', accreditation_expiry: '2026-07-31' }
  ];

  const insertProgram = db.prepare(`
    INSERT OR IGNORE INTO study_programs (id, institution_id, name, degree_level, duration_years, ects_credits, accreditation_status, accreditation_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  studyPrograms.forEach(prog => {
    insertProgram.run(prog.id, prog.institution_id, prog.name, prog.degree_level, prog.duration_years, prog.ects_credits, prog.accreditation_status, prog.accreditation_expiry);
  });

  // Insert sample users
  const users = [
    { id: 'user-001', email: 'admin@registry.ba', password: 'admin123', full_name: 'Administrator Sistema', role: 'admin' },
    { id: 'user-002', email: 'officer@registry.ba', password: 'officer123', full_name: 'Službenik za akreditaciju', role: 'officer' },
    { id: 'user-003', email: 'info@unsa.ba', password: 'institution123', full_name: 'UNSA Administrator', role: 'institution', institution_id: 'inst-001' },
    { id: 'user-004', email: 'info@unibl.org', password: 'institution123', full_name: 'UNBL Administrator', role: 'institution', institution_id: 'inst-005' },
    { id: 'user-005', email: 'info@unze.ba', password: 'institution123', full_name: 'UNZE Administrator', role: 'institution', institution_id: 'inst-006' },
    { id: 'user-006', email: 'info@ues.rs.ba', password: 'institution123', full_name: 'UES Administrator', role: 'institution', institution_id: 'inst-007' },
    { id: 'user-007', email: 'info@unbi.ba', password: 'institution123', full_name: 'UNBI Administrator', role: 'institution', institution_id: 'inst-008' },
    { id: 'user-008', email: 'info@ius.edu.ba', password: 'institution123', full_name: 'IUS Administrator', role: 'institution', institution_id: 'inst-009' },
    { id: 'user-009', email: 'info@ssst.edu.ba', password: 'institution123', full_name: 'SSST Administrator', role: 'institution', institution_id: 'inst-010' },
    { id: 'user-010', email: 'info@unmo.ba', password: 'institution123', full_name: 'UNMO Administrator', role: 'institution', institution_id: 'inst-011' },
    { id: 'user-011', email: 'info@unt.ba', password: 'institution123', full_name: 'UNT Administrator', role: 'institution', institution_id: 'inst-012' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, full_name, role, institution_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.id, user.email, user.password, user.full_name, user.role, user.institution_id || null);
  });
}

// API Routes

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  // Mock authentication - in real app, use JWT
  res.json({ user: null });
});

// Institutions
app.get('/api/institutions', (req, res) => {
  const { search, city, accreditation_status, limit = 50, offset = 0 } = req.query as any;
  if (useSupabase) {
    (async () => {
      let q = supabase!.from('institutions').select('*');
      if (search) q = q.ilike('name', `%${search}%`);
      if (city) q = q.eq('city', city);
      if (accreditation_status) q = q.eq('accreditation_status', accreditation_status);
      const lim = Number(limit) || 50;
      const off = Number(offset) || 0;
      const { data, error } = await q.order('name', { ascending: true }).range(off, off + lim - 1);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    })();
    return;
  }
  // SQLite fallback (not supported on Vercel)
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  const lim = Number(limit) || 50;
  const off = Number(offset) || 0;
  let query = 'SELECT * FROM institutions WHERE 1=1';
  const params: any[] = [];
  if (search) { query += ' AND (name LIKE ? OR city LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (city) { query += ' AND city = ?'; params.push(city); }
  if (accreditation_status) { query += ' AND accreditation_status = ?'; params.push(accreditation_status); }
  query += ' ORDER BY name LIMIT ? OFFSET ?';
  params.push(lim, off);
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.post('/api/institutions', (req, res) => {
  const actorId = (req.headers['x-user-id'] || '').toString();
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, address, city, phone, email, website, institution_type, accreditation_status, logo_url, ownership_type, founded_on, accreditation_valid_from, accreditation_valid_to, competent_authority, notes, registration_number, tax_id, short_name, municipality, postal_code, country, founder_name, founding_act_reference, head_name, head_title, fax, is_active } = req.body;
  if (useSupabase) {
    (async () => {
      const id = 'inst-' + Date.now();
      const insertPayload = { id, name, address, city, phone: phone || '', email, website: website || '', institution_type, accreditation_status: accreditation_status || 'pending', logo_url: logo_url || '', ownership_type: ownership_type || null, founded_on: founded_on || null, accreditation_valid_from: accreditation_valid_from || null, accreditation_valid_to: accreditation_valid_to || null, competent_authority: competent_authority || null, notes: notes || null, registration_number: registration_number || null, tax_id: tax_id || null, short_name: short_name || null, municipality: municipality || null, postal_code: postal_code || null, country: country || 'Bosna i Hercegovina', founder_name: founder_name || null, founding_act_reference: founding_act_reference || null, head_name: head_name || null, head_title: head_title || null, fax: fax || null, is_active: (typeof is_active === 'boolean' ? (is_active ? 1 : 0) : (is_active === undefined ? 1 : (Number(is_active) ? 1 : 0))) };
      const { data, error } = await supabase!.from('institutions').insert(insertPayload).select('*').single();
      if (error) return res.status(500).json({ error: error.message });
      const an = actorNameById(actorId);
      const ch = Object.keys(req.body || {});
      const payload = diffObject(null, req.body, ch);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'create', resource_type: 'institution', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: null, new_values: JSON.stringify(payload.nextOut) });
      return res.json(data);
    })();
    return;
  }
  // SQLite fallback
  const id = 'inst-' + Date.now();
  const stmt = db.prepare(`INSERT INTO institutions (id, name, address, city, phone, email, website, institution_type, accreditation_status, logo_url, ownership_type, founded_on, accreditation_valid_from, accreditation_valid_to, competent_authority, notes, registration_number, tax_id, short_name, municipality, postal_code, country, founder_name, founding_act_reference, head_name, head_title, fax, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(id, name, address, city, phone || '', email, website || '', institution_type, accreditation_status || 'pending', logo_url || '', ownership_type || null, founded_on || null, accreditation_valid_from || null, accreditation_valid_to || null, competent_authority || null, notes || null, registration_number || null, tax_id || null, short_name || null, municipality || null, postal_code || null, country || 'Bosna i Hercegovina', founder_name || null, founding_act_reference || null, head_name || null, head_title || null, fax || null, (typeof is_active === 'boolean' ? (is_active ? 1 : 0) : (is_active === undefined ? 1 : (Number(is_active) ? 1 : 0))));
  if (result.changes > 0) {
    const row = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
    const an = actorNameById(actorId);
    const ch = Object.keys(req.body || {});
    const payload = diffObject(null, req.body, ch);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'create', 'institution', id, JSON.stringify(payload.changed), null, JSON.stringify(payload.nextOut));
    res.json(row);
  } else {
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

app.put('/api/institutions/:id', (req, res) => {
  const id = req.params.id;
  const actorId = (req.headers['x-user-id'] || '').toString();
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, address, city, phone, email, website, institution_type, accreditation_status, logo_url, ownership_type, founded_on, accreditation_valid_from, accreditation_valid_to, competent_authority, notes, registration_number, tax_id, short_name, municipality, postal_code, country, founder_name, founding_act_reference, head_name, head_title, fax, is_active } = req.body;
  if (useSupabase) {
    (async () => {
      const { data: before } = await supabase!.from('institutions').select('*').eq('id', id).single();
      const upd: any = { name, address, city, phone, email, website, institution_type, accreditation_status, logo_url, ownership_type, founded_on, accreditation_valid_from, accreditation_valid_to, competent_authority, notes, registration_number, tax_id, short_name, municipality, postal_code, country, founder_name, founding_act_reference, head_name, head_title, fax, is_active };
      Object.keys(upd).forEach(k => { if (upd[k] === undefined) delete upd[k]; });
      const { data, error } = await supabase!.from('institutions').update(upd).eq('id', id).select('*').single();
      if (error) return res.status(404).json({ error: 'Institution not found' });
      const an = actorNameById(actorId);
      const fields = Object.keys(upd || {});
      const payload = diffObject(before, data, fields);
      if (payload.changed.length > 0) {
        await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'update', resource_type: 'institution', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: JSON.stringify(payload.nextOut) });
      }
      return res.json(data);
    })();
    return;
  }
  const before = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
  const stmt = db.prepare(`UPDATE institutions SET name = COALESCE(?, name), address = COALESCE(?, address), city = COALESCE(?, city), phone = COALESCE(?, phone), email = COALESCE(?, email), website = COALESCE(?, website), institution_type = COALESCE(?, institution_type), accreditation_status = COALESCE(?, accreditation_status), logo_url = COALESCE(?, logo_url), ownership_type = COALESCE(?, ownership_type), founded_on = COALESCE(?, founded_on), accreditation_valid_from = COALESCE(?, accreditation_valid_from), accreditation_valid_to = COALESCE(?, accreditation_valid_to), competent_authority = COALESCE(?, competent_authority), notes = COALESCE(?, notes), registration_number = COALESCE(?, registration_number), tax_id = COALESCE(?, tax_id), short_name = COALESCE(?, short_name), municipality = COALESCE(?, municipality), postal_code = COALESCE(?, postal_code), country = COALESCE(?, country), founder_name = COALESCE(?, founder_name), founding_act_reference = COALESCE(?, founding_act_reference), head_name = COALESCE(?, head_name), head_title = COALESCE(?, head_title), fax = COALESCE(?, fax), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  const result = stmt.run(name, address, city, phone, email, website, institution_type, accreditation_status, logo_url, ownership_type, founded_on, accreditation_valid_from, accreditation_valid_to, competent_authority, notes, registration_number, tax_id, short_name, municipality, postal_code, country, founder_name, founding_act_reference, head_name, head_title, fax, (typeof is_active === 'boolean' ? (is_active ? 1 : 0) : (is_active === undefined ? undefined : (Number(is_active) ? 1 : 0))), id);
  if (result.changes > 0) {
    const row = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
    const an = actorNameById(actorId);
    const fields = Object.keys(req.body || {});
    const payload = diffObject(before, row, fields);
    if (payload.changed.length > 0) {
      db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'update', 'institution', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
    }
    res.json(row);
  } else {
    res.status(404).json({ error: 'Institution not found' });
  }
});

app.delete('/api/institutions/:id', (req, res) => {
  const id = req.params.id;
  const actorId = (req.headers['x-user-id'] || '').toString();
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (useSupabase) {
    (async () => {
      const { data: before } = await supabase!.from('institutions').select('*').eq('id', id).single();
      const { error } = await supabase!.from('institutions').delete().eq('id', id);
      if (error) return res.json({ ok: false });
      const an = actorNameById(actorId);
      const payload = diffObject(before, null);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'delete', resource_type: 'institution', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: null });
      return res.json({ ok: true });
    })();
    return;
  }
  const before = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
  const result = db.prepare('DELETE FROM institutions WHERE id = ?').run(id);
  if (result.changes > 0) {
    const an = actorNameById(actorId);
    const payload = diffObject(before, null);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'delete', 'institution', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), null);
  }
  res.json({ ok: result.changes > 0 });
});

app.get('/api/institutions/:id', (req, res) => {
  if (useSupabase) {
    (async () => {
      const { data: inst, error: e1 } = await supabase!.from('institutions').select('*').eq('id', req.params.id).single();
      if (e1 || !inst) return res.status(404).json({ error: 'Institution not found' });
      const { data: programs } = await supabase!.from('study_programs').select('*').eq('institution_id', req.params.id).order('name', { ascending: true });
      return res.json({ ...inst, programs: programs || [] });
    })();
    return;
  }
  const institution = db.prepare('SELECT * FROM institutions WHERE id = ?').get(req.params.id) as any;
  if (!institution) return res.status(404).json({ error: 'Institution not found' });
  const programs = db.prepare('SELECT * FROM study_programs WHERE institution_id = ?').all(req.params.id);
  res.json({ ...institution, programs });
});

// Study Programs
app.get('/api/study-programs', (req, res) => {
  const { institution_id, degree_level, accreditation_status } = req.query as any;
  if (useSupabase) {
    (async () => {
      let q = supabase!.from('study_programs').select('*');
      if (institution_id) q = q.eq('institution_id', institution_id);
      if (degree_level) q = q.eq('degree_level', degree_level);
      if (accreditation_status) q = q.eq('accreditation_status', accreditation_status);
      const { data, error } = await q.order('name', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    })();
    return;
  }
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  let query = 'SELECT * FROM study_programs WHERE 1=1';
  const params: any[] = [];
  if (institution_id) { query += ' AND institution_id = ?'; params.push(institution_id); }
  if (degree_level) { query += ' AND degree_level = ?'; params.push(degree_level); }
  if (accreditation_status) { query += ' AND accreditation_status = ?'; params.push(accreditation_status); }
  query += ' ORDER BY name';
  const programs = db.prepare(query).all(...params);
  res.json(programs);
});

app.post('/api/study-programs', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { institution_id, name, degree_level, duration_years, ects_credits, accreditation_status, accreditation_expiry } = req.body;
  if (useSupabase) {
    (async () => {
      const id = 'prog-' + Date.now();
      const { data, error } = await supabase!.from('study_programs').insert({ id, institution_id, name, degree_level, duration_years, ects_credits: ects_credits || null, accreditation_status: accreditation_status || 'pending', accreditation_expiry: accreditation_expiry || null }).select('*').single();
      if (error) return res.status(500).json({ error: error.message });
      const an = actorNameById(actorId);
      const ch = Object.keys(req.body || {});
      const payload = diffObject(null, req.body, ch);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'create', resource_type: 'study_program', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: null, new_values: JSON.stringify(payload.nextOut) });
      return res.json(data);
    })();
    return;
  }
  const id = 'prog-' + Date.now();
  const stmt = db.prepare(`INSERT INTO study_programs (id, institution_id, name, degree_level, duration_years, ects_credits, accreditation_status, accreditation_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(id, institution_id, name, degree_level, duration_years, ects_credits || null, accreditation_status || 'pending', accreditation_expiry || null);
  if (result.changes > 0) {
    const row = db.prepare('SELECT * FROM study_programs WHERE id = ?').get(id);
    const an = actorNameById(actorId);
    const ch = Object.keys(req.body || {});
    const payload = diffObject(null, req.body, ch);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'create', 'study_program', id, JSON.stringify(payload.changed), null, JSON.stringify(payload.nextOut));
    res.json(row);
  } else {
    res.status(500).json({ error: 'Failed to create study program' });
  }
});

app.put('/api/study-programs/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, degree_level, duration_years, ects_credits, accreditation_status, accreditation_expiry } = req.body;
  const before = db.prepare('SELECT * FROM study_programs WHERE id = ?').get(id);
  const stmt = db.prepare(`
    UPDATE study_programs SET
      name = COALESCE(?, name),
      degree_level = COALESCE(?, degree_level),
      duration_years = COALESCE(?, duration_years),
      ects_credits = COALESCE(?, ects_credits),
      accreditation_status = COALESCE(?, accreditation_status),
      accreditation_expiry = COALESCE(?, accreditation_expiry),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(name, degree_level, duration_years, ects_credits, accreditation_status, accreditation_expiry, id);
  if (result.changes > 0) {
    const row = db.prepare('SELECT * FROM study_programs WHERE id = ?').get(id);
    const an = actorNameById(actorId);
    const fields = Object.keys(req.body || {});
    const payload = diffObject(before, row, fields);
    if (payload.changed.length > 0) {
      db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('audit-' + Date.now(), actorId, actorRole, an, 'update', 'study_program', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
    }
    res.json(row);
  } else {
    res.status(404).json({ error: 'Study program not found' });
  }
});

app.delete('/api/study-programs/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (useSupabase) {
    (async () => {
      const { data: before } = await supabase!.from('study_programs').select('*').eq('id', id).single();
      const { error } = await supabase!.from('study_programs').delete().eq('id', id);
      if (error) return res.json({ ok: false });
      const an = actorNameById(actorId);
      const payload = diffObject(before, null);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'delete', resource_type: 'study_program', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: null });
      return res.json({ ok: true });
    })();
    return;
  }
  const before = db.prepare('SELECT * FROM study_programs WHERE id = ?').get(id);
  const result = db.prepare('DELETE FROM study_programs WHERE id = ?').run(id);
  if (result.changes > 0) {
    const an = actorNameById(actorId);
    const payload = diffObject(before, null);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'delete', 'study_program', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), null);
  }
  res.json({ ok: result.changes > 0 });
});

// Accreditation Processes
app.get('/api/accreditation-processes', (req, res) => {
  const { institution_id, status, assigned_officer_id } = req.query as any;
  if (useSupabase) {
    (async () => {
      let q = supabase!.from('accreditation_processes').select('*');
      if (institution_id) q = q.eq('institution_id', institution_id);
      if (status) q = q.eq('status', status);
      if (assigned_officer_id) q = q.eq('assigned_officer_id', assigned_officer_id);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    })();
    return;
  }
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  let query = 'SELECT * FROM accreditation_processes WHERE 1=1';
  const params: any[] = [];
  if (institution_id) { query += ' AND institution_id = ?'; params.push(institution_id); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (assigned_officer_id) { query += ' AND assigned_officer_id = ?'; params.push(assigned_officer_id); }
  query += ' ORDER BY created_at DESC';
  const processes = db.prepare(query).all(...params);
  res.json(processes);
});

app.post('/api/accreditation-processes', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { institution_id, process_type, application_date, notes, program_id } = req.body;
  if (!institution_id || !process_type || !application_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (useSupabase) {
    (async () => {
      if (program_id) {
        const { data: prog } = await supabase!.from('study_programs').select('institution_id').eq('id', program_id).single();
        if (!prog || prog.institution_id !== institution_id) return res.status(400).json({ error: 'Program does not belong to institution' });
      }
      const id = 'proc-' + Date.now();
      const status = 'submitted';
      const { data, error } = await supabase!.from('accreditation_processes').insert({ id, institution_id, program_id: program_id || null, process_type, status, application_date, notes }).select('*').single();
      if (error) return res.status(500).json({ error: error.message });
      const an = actorNameById(actorId);
      const ch = Object.keys(req.body || {});
      const payload = diffObject(null, req.body, ch);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'create', resource_type: 'accreditation_process', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: null, new_values: JSON.stringify(payload.nextOut) });
      return res.json(data);
    })();
    return;
  }
  if (program_id) {
    const prog = db.prepare('SELECT institution_id FROM study_programs WHERE id = ?').get(program_id) as any;
    if (!prog || prog.institution_id !== institution_id) {
      return res.status(400).json({ error: 'Program does not belong to institution' });
    }
  }
  const id = 'proc-' + Date.now();
  const status = 'submitted';
  const result = db.prepare(`INSERT INTO accreditation_processes (id, institution_id, program_id, process_type, status, application_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, institution_id, program_id || null, process_type, status, application_date, notes);
  if (result.changes > 0) {
    const newProcess = db.prepare('SELECT * FROM accreditation_processes WHERE id = ?').get(id);
    const an = actorNameById(actorId);
    const ch = Object.keys(req.body || {});
    const payload = diffObject(null, req.body, ch);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'create', 'accreditation_process', id, JSON.stringify(payload.changed), null, JSON.stringify(payload.nextOut));
    res.json(newProcess);
  } else {
    res.status(500).json({ error: 'Failed to create accreditation process' });
  }
});

app.put('/api/accreditation-processes/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { status, assigned_officer_id, decision, decision_date, notes, program_id } = req.body;
  const before = db.prepare('SELECT * FROM accreditation_processes WHERE id = ?').get(id) as any;
  if (program_id) {
    const prog = db.prepare('SELECT institution_id FROM study_programs WHERE id = ?').get(program_id) as any;
    if (!prog || prog.institution_id !== before?.institution_id) {
      return res.status(400).json({ error: 'Program does not belong to institution' });
    }
  }
  const stmt = db.prepare(`
    UPDATE accreditation_processes SET
      status = COALESCE(?, status),
      assigned_officer_id = COALESCE(?, assigned_officer_id),
      decision = COALESCE(?, decision),
      decision_date = COALESCE(?, decision_date),
      notes = COALESCE(?, notes),
      program_id = COALESCE(?, program_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(status, assigned_officer_id, decision, decision_date, notes, program_id, id);
  if (result.changes > 0) {
    const row = db.prepare('SELECT * FROM accreditation_processes WHERE id = ?').get(id) as any;
    const an = actorNameById(actorId);
    const fields = Object.keys(req.body || {});
    const payload = diffObject(before, row, fields);
    if (payload.changed.length > 0) {
      db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('audit-' + Date.now(), actorId, actorRole, an, 'update', 'accreditation_process', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
    }
    try {
      const finalStatus = row.status as string;
      const progId = row.program_id as string | undefined;
      if (finalStatus === 'approved') {
        if (progId) {
          const exp = (req.body as any).accreditation_expiry || null;
          db.prepare('UPDATE study_programs SET accreditation_status = ?, accreditation_expiry = COALESCE(?, accreditation_expiry), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run('accredited', exp, progId);
        } else {
          const validTo = (req.body as any).accreditation_valid_to || null;
          const validFrom = decision_date || row.decision_date || row.application_date;
          db.prepare('UPDATE institutions SET accreditation_status = ?, accreditation_valid_from = COALESCE(?, accreditation_valid_from), accreditation_valid_to = COALESCE(?, accreditation_valid_to), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run('accredited', validFrom, validTo, row.institution_id);
        }
      }
    } catch {}
    res.json(row);
  } else {
    res.status(404).json({ error: 'Process not found' });
  }
});

app.delete('/api/accreditation-processes/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (useSupabase) {
    (async () => {
      const { data: before } = await supabase!.from('accreditation_processes').select('*').eq('id', id).single();
      if (!before) return res.status(404).json({ error: 'Process not found' });
      const { error } = await supabase!.from('accreditation_processes').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Failed to delete process' });
      const an = actorNameById(actorId);
      const payload = diffObject(before, null);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'delete', resource_type: 'accreditation_process', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: null });
      return res.json({ ok: true });
    })();
    return;
  }
  const before = db.prepare('SELECT * FROM accreditation_processes WHERE id = ?').get(id);
  if (!before) return res.status(404).json({ error: 'Process not found' });
  const result = db.prepare('DELETE FROM accreditation_processes WHERE id = ?').run(id);
  if (result.changes > 0) {
    const an = actorNameById(actorId);
    const payload = diffObject(before, null);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'delete', 'accreditation_process', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), null);
    res.json({ ok: true });
  } else {
    res.status(500).json({ error: 'Failed to delete process' });
  }
});

// Helper: sanitize filename
function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.\-]+/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '');
}

// Institution Logo Upload
app.post('/api/institutions/:id/logo', upload.single('logo'), (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const id = req.params.id;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const before = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
  if (!before) {
    return res.status(404).json({ error: 'Institution not found' });
  }
  const publicPath = `/uploads/${path.basename(req.file.path)}`;
  const result = db.prepare('UPDATE institutions SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(publicPath, id);
  if (result.changes > 0) {
    const row = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id);
    const an = actorNameById(actorId);
    const payload = diffObject(before, row, ['logo_url']);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('audit-' + Date.now(), actorId, actorRole, an, 'upload', 'institution', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
    res.json({ logo_url: publicPath, institution: row });
  } else {
    res.status(500).json({ error: 'Failed to update logo' });
  }
});

// Documents: Upload
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { institution_id, program_id, process_id, document_type, title, description, issuer, issued_at, number, is_confidential, tags } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!document_type) return res.status(400).json({ error: 'document_type is required' });
  if (!(institution_id || program_id || process_id)) return res.status(400).json({ error: 'association id required' });
  const mime = req.file.mimetype;
  if (mime !== 'application/pdf') {
    return res.status(400).json({ error: 'Only PDF allowed' });
  }

  let instId = institution_id as string | undefined;
  try {
    if (!instId && program_id) {
      const prog = db.prepare('SELECT institution_id FROM study_programs WHERE id = ?').get(program_id) as any;
      instId = prog?.institution_id;
    }
    if (!instId && process_id) {
      const proc = db.prepare('SELECT institution_id FROM accreditation_processes WHERE id = ?').get(process_id) as any;
      instId = proc?.institution_id;
    }
  } catch {}
  if (!instId) return res.status(400).json({ error: 'institution_id resolution failed' });

  const dateStr = new Date().toISOString().slice(0, 10);
  const origBase = path.parse(req.file.originalname).name;
  const safeBase = sanitizeName(origBase);
  const typePart = sanitizeName(String(document_type));
  let finalName = `${dateStr}_${typePart}_${safeBase}.pdf`;
  let version = 1;
  let fileUrl = '';
  let sha256: string | null = null;

  if (useSupabase) {
    (async () => {
      // Upload to Supabase storage (bucket: documents)
      const bucket = 'documents';
      // ensure unique name by probing public URL
      let idx = 1;
      let key = `${instId}/${finalName}`;
      while (true) {
        const probe = supabase!.storage.from(bucket).getPublicUrl(key);
        if (!probe.data?.publicUrl) break;
        // Try a different name
        idx++;
        version = idx;
        finalName = `${dateStr}_${typePart}_${safeBase}_v${idx}.pdf`;
        key = `${instId}/${finalName}`;
        if (idx > 100) break;
      }
      const buffer = fs.readFileSync(req.file.path);
      const { error: upErr } = await supabase!.storage.from(bucket).upload(key, buffer, { contentType: 'application/pdf', upsert: false });
      try { fs.unlinkSync(req.file.path); } catch {}
      if (upErr) return res.status(500).json({ error: upErr.message });
      const pub = supabase!.storage.from(bucket).getPublicUrl(key);
      fileUrl = pub.data?.publicUrl || '';
      try { const hash = crypto.createHash('sha256'); hash.update(buffer); sha256 = hash.digest('hex'); } catch {}
      const id = 'doc-' + Date.now();
      const { error: insErr } = await supabase!.from('documents').insert({ id, institution_id: instId, program_id: program_id || null, process_id: process_id || null, document_type, title: title || null, description: description || null, issuer: issuer || null, issued_at: issued_at || null, number: number || null, file_name: finalName, file_path: fileUrl, file_size: req.file.size, mime_type: mime, sha256: sha256 || null, version, is_confidential: is_confidential ? 1 : 0, tags: tags || null, uploaded_by: actorId || null });
      if (insErr) return res.status(500).json({ error: insErr.message });
      const an = actorNameById(actorId);
      const payload = { changed: ['create'], prevOut: null, nextOut: { id, institution_id: instId, program_id, process_id, document_type, title, issuer, number, file_path: fileUrl, version } };
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'create', resource_type: 'document', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: JSON.stringify(payload.nextOut) });
      return res.json({ id, file_url: fileUrl });
    })();
    return;
  }
  // SQLite/local storage fallback
  const targetDir = path.join(storageRoot, instId);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  let finalPath = path.join(targetDir, finalName);
  if (fs.existsSync(finalPath)) {
    version = 2;
    let idx2 = 2;
    while (fs.existsSync(finalPath)) {
      finalName = `${dateStr}_${typePart}_${safeBase}_v${idx2}.pdf`;
      finalPath = path.join(targetDir, finalName);
      version = idx2;
      idx2++;
    }
  }
  try { fs.renameSync(req.file.path, finalPath); } catch (e) { return res.status(500).json({ error: 'Failed to store file' }); }
  try { const hash = crypto.createHash('sha256'); const data = fs.readFileSync(finalPath); hash.update(data); sha256 = hash.digest('hex'); } catch {}
  const id = 'doc-' + Date.now();
  const relPath = `/storage/app/files/${instId}/${finalName}`;
  const stmt = db.prepare(`INSERT INTO documents (id, institution_id, program_id, process_id, document_type, title, description, issuer, issued_at, number, file_name, file_path, file_size, mime_type, sha256, version, is_confidential, tags, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(id, instId, program_id || null, process_id || null, document_type, title || null, description || null, issuer || null, issued_at || null, number || null, finalName, relPath, req.file.size, mime, sha256 || null, version, is_confidential ? 1 : 0, tags || null, actorId || null);
  const an = actorNameById(actorId);
  const payload = { changed: ['create'], prevOut: null, nextOut: { id, institution_id: instId, program_id, process_id, document_type, title, issuer, number, file_path: relPath, version } };
  db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'create', 'document', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
  res.json({ id, file_url: relPath });
});

// Documents: List
app.get('/api/documents', (req, res) => {
  const { institution_id, program_id, process_id, type, search, date_from, date_to, limit = 50, offset = 0 } = req.query as any;
  if (useSupabase) {
    (async () => {
      let q = supabase!.from('documents').select('*');
      if (institution_id) q = q.eq('institution_id', institution_id);
      if (program_id) q = q.eq('program_id', program_id);
      if (process_id) q = q.eq('process_id', process_id);
      if (type) q = q.eq('document_type', type);
      if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%,number.ilike.%${search}%`);
      const lim = Number(limit) || 50;
      const off = Number(offset) || 0;
      const { data, error } = await q.order('uploaded_at', { ascending: false }).range(off, off + lim - 1);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    })();
    return;
  }
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  const where: string[] = [];
  const params: any[] = [];
  if (institution_id) { where.push('institution_id = ?'); params.push(institution_id); }
  if (program_id) { where.push('program_id = ?'); params.push(program_id); }
  if (process_id) { where.push('process_id = ?'); params.push(process_id); }
  if (type) { where.push('document_type = ?'); params.push(type); }
  if (search) { where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(number) LIKE ?)'); params.push(`%${String(search).toLowerCase()}%`, `%${String(search).toLowerCase()}%`, `%${String(search).toLowerCase()}%`); }
  if (date_from) { where.push('date(uploaded_at) >= date(?)'); params.push(date_from); }
  if (date_to) { where.push('date(uploaded_at) <= date(?)'); params.push(date_to); }
  const sql = `SELECT * FROM documents ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Cities
app.get('/api/cities', (req, res) => {
  if (useSupabase) {
    (async () => {
      const { data, error } = await supabase!.from('institutions').select('city');
      if (error) return res.status(500).json({ error: error.message });
      const set = new Set<string>();
      (data || []).forEach((r: any) => { const c = String(r.city || '').trim(); if (c) set.add(c); });
      const list = Array.from(set).sort((a, b) => a.localeCompare(b));
      return res.json(list);
    })();
    return;
  }
  const rows = db.prepare('SELECT DISTINCT city FROM institutions WHERE city IS NOT NULL AND city != "" ORDER BY city').all() as any[];
  res.json(rows.map(r => r.city));
});

// Documents: Download
app.get('/api/documents/:id/download', (req, res) => {
  const id = req.params.id;
  if (useSupabase) {
    (async () => {
      const { data: doc, error } = await supabase!.from('documents').select('file_name,file_path,mime_type').eq('id', id).single();
      if (error || !doc) return res.status(404).json({ error: 'Not found' });
      // file_path assumed to be public URL
      return res.redirect(String(doc.file_path));
    })();
    return;
  }
  const doc = db.prepare('SELECT file_name, file_path, mime_type FROM documents WHERE id = ?').get(id) as any;
  if (!doc) return res.status(404).json({ error: 'Not found' });
  let absolute: string;
  if (String(doc.file_path).startsWith('/storage/')) {
    absolute = path.join(__dirname, '..', doc.file_path.replace(/^\//, ''));
  } else {
    absolute = path.join(__dirname, '..', doc.file_path.replace(/^\/uploads\//, 'uploads/'));
  }
  res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
  fs.createReadStream(absolute).pipe(res);
});

// Documents: Update meta
app.put('/api/documents/:id', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const id = req.params.id;
  const before = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
  if (!before) return res.status(404).json({ error: 'Not found' });
  const { document_type, title, description, issuer, issued_at, number, is_confidential, tags } = req.body;
  const stmt = db.prepare(`UPDATE documents SET document_type = COALESCE(?, document_type), title = COALESCE(?, title), description = COALESCE(?, description), issuer = COALESCE(?, issuer), issued_at = COALESCE(?, issued_at), number = COALESCE(?, number), is_confidential = COALESCE(?, is_confidential), tags = COALESCE(?, tags), uploaded_at = uploaded_at WHERE id = ?`);
  stmt.run(document_type, title, description, issuer, issued_at, number, (typeof is_confidential === 'boolean' ? (is_confidential ? 1 : 0) : undefined), tags, id);
  const after = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  const an = actorNameById(actorId);
  const diff = diffObject(before, after);
  db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'update', 'document', id, JSON.stringify(diff.changed), JSON.stringify(diff.prevOut), JSON.stringify(diff.nextOut));
  res.json(after);
});

// Documents: Delete
app.delete('/api/documents/:id', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (!['admin', 'operator'].includes(actorRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const id = req.params.id;
  if (useSupabase) {
    (async () => {
      const { data: before } = await supabase!.from('documents').select('*').eq('id', id).single();
      if (!before) return res.status(404).json({ error: 'Not found' });
      // If stored in Supabase storage, try to remove
      try {
        const url: string = String(before.file_path || '');
        const bucket = 'documents';
        const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.*)$/);
        if (match) {
          const key = match[2];
          await supabase!.storage.from(bucket).remove([key]);
        }
      } catch {}
      const { error } = await supabase!.from('documents').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Failed to delete' });
      const an = actorNameById(actorId);
      const payload = diffObject(before, null);
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: an, action: 'delete', resource_type: 'document', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: JSON.stringify(payload.nextOut) });
      return res.json({ ok: true });
    })();
    return;
  }
  const before = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!before) return res.status(404).json({ error: 'Not found' });
  let abs: string;
  if (String(before.file_path).startsWith('/storage/')) {
    abs = path.join(__dirname, '..', before.file_path.replace(/^\//, ''));
  } else {
    abs = path.join(__dirname, '..', before.file_path.replace(/^\/uploads\//, 'uploads/'));
  }
  try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
  const result = db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  if (result.changes > 0) {
    const an = actorNameById(actorId);
    const payload = diffObject(before, null);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('audit-' + Date.now(), actorId, actorRole, an, 'delete', 'document', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
    res.json({ ok: true });
  } else {
    res.status(500).json({ error: 'Failed to delete' });
  }
});


// Bulk import institutions from CSV (upload)
app.post('/api/institutions/import-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const csvData = fs.readFileSync(req.file.path, 'utf-8');
  const lines = csvData.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return res.status(400).json({ error: 'CSV is empty' });
  }

  const parseCsvLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const idx = {
    name: headers.indexOf('naziv') !== -1 ? headers.indexOf('naziv') : headers.indexOf('name'),
    city: headers.indexOf('grad') !== -1 ? headers.indexOf('grad') : headers.indexOf('city'),
    address: headers.indexOf('adresa') !== -1 ? headers.indexOf('adresa') : headers.indexOf('address'),
    email: headers.indexOf('email'),
    website: headers.indexOf('website') !== -1 ? headers.indexOf('website') : headers.indexOf('web stranica'),
    type: headers.indexOf('tip') !== -1 ? headers.indexOf('tip') : headers.indexOf('institution_type')
  };

  const insertInstitution = db.prepare(`
    INSERT OR IGNORE INTO institutions (id, name, address, city, phone, email, website, institution_type, accreditation_status, logo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = idx.name >= 0 ? cols[idx.name] : undefined;
    if (!name) continue;
    const city = idx.city >= 0 ? cols[idx.city] : '';
    const address = idx.address >= 0 ? cols[idx.address] : '';
    const email = idx.email >= 0 ? cols[idx.email] : '';
    const website = idx.website >= 0 ? cols[idx.website] : '';
    const type = idx.type >= 0 ? cols[idx.type] : 'university';
    const id = `inst-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`.slice(0, 32);
    const logo_url = `https://via.placeholder.com/150x150/1e40af/ffffff?text=${encodeURIComponent(name.slice(0, 12))}`;
    const result = insertInstitution.run(id, name, address, city, '', email, website, type, 'accredited', logo_url);
    if (result.changes > 0) inserted++;
  }

  res.json({ inserted });
});

// Cities endpoint for filters
app.get('/api/cities', (req, res) => {
  const cities = db.prepare('SELECT DISTINCT city FROM institutions ORDER BY city').all();
  res.json(cities.map(c => c.city));
});

// Statistics
app.get('/api/statistics', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM institutions) AS total_institutions,
        (SELECT COUNT(*) FROM institutions WHERE accreditation_status = 'accredited') AS accredited_institutions,
        (SELECT COUNT(*) FROM study_programs) AS total_programs,
        (SELECT COUNT(*) FROM study_programs WHERE accreditation_status = 'accredited') AS accredited_programs
    `).get() as any;

    res.json({
      total_institutions: stats?.total_institutions ?? 0,
      accredited_institutions: stats?.accredited_institutions ?? 0,
      total_programs: stats?.total_programs ?? 0,
      accredited_programs: stats?.accredited_programs ?? 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute statistics' });
  }
});

app.get('/api/audit-logs', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { limit = 100, offset = 0, resource_type, action, actor_role, search } = req.query as any;
  const lim = Number(limit) || 100;
  const off = Number(offset) || 0;
  let q = 'SELECT * FROM audit_logs WHERE 1=1';
  const p: any[] = [];
  if (resource_type) { q += ' AND resource_type = ?'; p.push(resource_type); }
  if (action) { q += ' AND action = ?'; p.push(action); }
  if (actor_role) { q += ' AND actor_role = ?'; p.push(actor_role); }
  if (search) { q += ' AND (actor_name LIKE ? OR actor_id LIKE ? OR resource_id LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  p.push(lim, off);
  const rows = db.prepare(q).all(...p);
  res.json(rows);
});

app.get('/api/audit-logs/export', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { format = 'csv', resource_type, action, actor_role, search } = req.query as any;
  let q = 'SELECT * FROM audit_logs WHERE 1=1';
  const p: any[] = [];
  if (resource_type) { q += ' AND resource_type = ?'; p.push(resource_type); }
  if (action) { q += ' AND action = ?'; p.push(action); }
  if (actor_role) { q += ' AND actor_role = ?'; p.push(actor_role); }
  if (search) { q += ' AND (actor_name LIKE ? OR actor_id LIKE ? OR resource_id LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  q += ' ORDER BY created_at DESC';
  const rows = db.prepare(q).all(...p) as any[];
  if (String(format).toLowerCase() === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.json(rows);
  } else {
    const header = ['created_at','actor_name','actor_role','action','resource_type','resource_id','changed_fields','prev_values','new_values'];
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      const needs = /[",\n]/.test(s);
      return needs ? '"' + s.replace(/"/g,'""') + '"' : s;
    };
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => esc(r[h])).join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
    res.send(csv);
  }
});

app.get('/api/_debug/audit', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const master = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='audit_logs'").get() as any;
    const count = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any;
    res.json({ schema: master?.sql || null, count: count?.c || 0 });
  } catch (e: any) {
    res.status(500).json({ error: 'Debug failed' });
  }
});

app.post('/api/_debug/audit-insert', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    db.prepare('INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run('audit-' + Date.now(), 'user-001', 'admin', 'Administrator Sistema', 'debug', 'user', 'user-xyz', '["email"]', '{"email":"old"}', '{"email":"new"}');
    const count = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any;
    res.json({ ok: true, count: count?.c || 0 });
  } catch (e: any) {
    res.status(500).json({ error: 'Debug insert failed' });
  }
});

// Setup: create storage bucket 'documents' (public)
app.post('/api/_setup/storage', async (req, res) => {
  try {
    if (!useSupabase || !supabase) return res.status(400).json({ error: 'Supabase is not configured' });
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some(b => b.name === 'documents');
    if (!exists) {
      const { error } = await supabase.storage.createBucket('documents', { public: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ created: true });
    }
    return res.json({ created: false, message: 'Bucket already exists' });
  } catch (e: any) {
    return res.status(500).json({ error: 'Bucket setup failed' });
  }
});

// Export current database as SQL (compatible with Supabase schema)
app.get('/api/export/sql', (req, res) => {
  function esc(v: any) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    const s = String(v);
    return "'" + s.replace(/'/g, "''") + "'";
  }
  function insertStmt(table: string, cols: string[], row: any) {
    const values = cols.map(c => esc((row as any)[c]));
    return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')});`;
  }
  const lines: string[] = [];
  lines.push('-- Schema');
  lines.push(fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf-8'));
  lines.push('\n-- Data\nBEGIN;');
  try {
    // institutions
    const instCols = ['id','name','address','city','phone','email','website','institution_type','accreditation_status','logo_url','ownership_type','founded_on','accreditation_valid_from','accreditation_valid_to','competent_authority','notes','registration_number','tax_id','short_name','municipality','postal_code','country','founder_name','founding_act_reference','head_name','head_title','fax','is_active','created_at','updated_at'];
    const institutions = db.prepare('SELECT ' + instCols.join(',') + ' FROM institutions').all() as any[];
    institutions.forEach(r => lines.push(insertStmt('public.institutions', instCols, r)));
    // study_programs
    const spCols = ['id','institution_id','name','degree_level','duration_years','ects_credits','accreditation_status','accreditation_expiry','created_at','updated_at'];
    const programs = db.prepare('SELECT ' + spCols.join(',') + ' FROM study_programs').all() as any[];
    programs.forEach(r => lines.push(insertStmt('public.study_programs', spCols, r)));
    // accreditation_processes
    const apCols = ['id','institution_id','program_id','assigned_officer_id','process_type','status','application_date','decision_date','decision','notes','created_at','updated_at'];
    const processes = db.prepare('SELECT ' + apCols.join(',') + ' FROM accreditation_processes').all() as any[];
    processes.forEach(r => lines.push(insertStmt('public.accreditation_processes', apCols, r)));
    // documents
    const docCols = ['id','institution_id','program_id','process_id','document_type','title','description','issuer','issued_at','number','file_name','file_path','file_size','mime_type','sha256','version','is_confidential','tags','uploaded_by','uploaded_at'];
    const documents = db.prepare('SELECT ' + docCols.join(',') + ' FROM documents').all() as any[];
    documents.forEach(r => lines.push(insertStmt('public.documents', docCols, r)));
    // users
    const userCols = ['id','email','password','full_name','role','is_active','institution_id','created_at'];
    const users = db.prepare('SELECT ' + userCols.join(',') + ' FROM users').all() as any[];
    users.forEach(r => lines.push(insertStmt('public.users', userCols, r)));
    // audit_logs
    const alCols = ['id','actor_id','actor_role','actor_name','action','resource_type','resource_id','changed_fields','prev_values','new_values','created_at'];
    const logs = db.prepare('SELECT ' + alCols.join(',') + ' FROM audit_logs').all() as any[];
    logs.forEach(r => lines.push(insertStmt('public.audit_logs', alCols, r)));
  } catch (e: any) {
    lines.push('-- Export error: ' + String(e?.message || e));
  }
  lines.push('COMMIT;');
  const sql = lines.join('\n');
  res.setHeader('Content-Type', 'application/sql');
  res.send(sql);
});

// Maintenance: normalize logo URLs to local assets to avoid external DNS issues
app.post('/api/maintenance/fix-logos', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, logo_url FROM institutions').all() as Array<{ id: string; name: string; logo_url?: string }>;
    const update = db.prepare('UPDATE institutions SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    let updated = 0;
    for (const r of rows) {
      const needsFix = !r.logo_url || r.logo_url.startsWith('http');
      if (needsFix) {
        const slug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const local = `/logos/${slug}.svg`;
        update.run(local, r.id);
        updated++;
      }
    }
    res.json({ updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fix logos' });
  }
});

// Users
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, email, full_name, role, is_active, institution_id, created_at FROM users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { email, password, full_name, role, is_active = 1, institution_id = null } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const allowedRoles = new Set(['admin', 'operator', 'viewer', 'institution']);
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const id = 'user-' + Date.now();
  const activeFlag = typeof is_active === 'boolean' ? (is_active ? 1 : 0) : Number(is_active) ? 1 : 0;
  const instId = institution_id ? institution_id : null;
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (existing?.id) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    const result = db.prepare('INSERT INTO users (id, email, password, full_name, role, is_active, institution_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, email, password, full_name, role, activeFlag, instId);
    if (result.changes > 0) {
      const row = db.prepare('SELECT id, email, full_name, role, is_active, institution_id, created_at FROM users WHERE id = ?').get(id);
      const an = actorNameById(actorId);
      const payload = diffObject(null, { email, full_name, role, is_active: activeFlag, institution_id: instId });
      db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('audit-' + Date.now(), actorId, actorRole, an, 'create', 'user', id, JSON.stringify(payload.changed), null, JSON.stringify(payload.nextOut));
      res.json(row);
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (e: any) {
    const msg = String(e?.message || '');
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { email, full_name, role, is_active, institution_id } = req.body;
  if (role) {
    const allowedRoles = new Set(['admin', 'operator', 'viewer', 'institution']);
    if (!allowedRoles.has(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
  }
  const activeFlag = typeof is_active === 'boolean' ? (is_active ? 1 : 0) : (is_active === undefined ? undefined : (Number(is_active) ? 1 : 0));
  try {
    const before = db.prepare('SELECT id, email, full_name, role, is_active, institution_id, created_at FROM users WHERE id = ?').get(id);
    if (email) {
      const other = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
      if (other?.id && other.id !== id) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    const result = db.prepare('UPDATE users SET email = COALESCE(?, email), full_name = COALESCE(?, full_name), role = COALESCE(?, role), is_active = COALESCE(?, is_active), institution_id = COALESCE(?, institution_id) WHERE id = ?')
      .run(email, full_name, role, activeFlag, institution_id ?? null, id);
    if (result.changes > 0) {
      const row = db.prepare('SELECT id, email, full_name, role, is_active, institution_id, created_at FROM users WHERE id = ?').get(id);
      const an = actorNameById(actorId);
      const fields = Object.keys(req.body || {});
      const payload = diffObject(before, row, fields);
      if (payload.changed.length > 0) {
        db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run('audit-' + Date.now(), actorId, actorRole, an, 'update', 'user', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), JSON.stringify(payload.nextOut));
      }
      res.json(row);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const before = db.prepare('SELECT id, email, full_name, role, is_active, institution_id, created_at FROM users WHERE id = ?').get(id);
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes > 0) {
    const an = actorNameById(actorId);
    const payload = diffObject(before, null);
    db.prepare(`INSERT INTO audit_logs (id, actor_id, actor_role, actor_name, action, resource_type, resource_id, changed_fields, prev_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('audit-' + Date.now(), actorId, actorRole, an, 'delete', 'user', id, JSON.stringify(payload.changed), JSON.stringify(payload.prevOut), null);
  }
  res.json({ ok: result.changes > 0 });
});

// Global error handler to always return JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.error(err);
  } catch {}
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
  console.log(`Database initialized with sample data`);
});

export default app;
// Migrations: add columns to documents if missing
ensureColumn('documents', 'institution_id', 'TEXT');
ensureColumn('documents', 'program_id', 'TEXT');
ensureColumn('documents', 'title', 'TEXT');
ensureColumn('documents', 'description', 'TEXT');
ensureColumn('documents', 'issuer', 'TEXT');
ensureColumn('documents', 'issued_at', 'DATE');
ensureColumn('documents', 'number', 'TEXT');
ensureColumn('documents', 'sha256', 'TEXT');
ensureColumn('documents', 'version', 'INTEGER DEFAULT 1');
ensureColumn('documents', 'is_confidential', 'BOOLEAN DEFAULT 0');
ensureColumn('documents', 'tags', 'TEXT');
// Auth (demo)
app.get('/api/auth/me', (req, res) => {
  const uid = String(req.headers['x-user-id'] || '').trim();
  const role = String(req.headers['x-user-role'] || '').trim();
  if (uid && role) {
    return res.json({ user: { id: uid, email: '', full_name: '', role, is_active: true, created_at: new Date().toISOString() } });
  }
  return res.json({ user: null });
});
