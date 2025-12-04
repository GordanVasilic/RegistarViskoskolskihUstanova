import express from 'express';
import cors from 'cors';
let Database: any = null;
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
 

const ROOT_DIR = process.cwd();

const app = express();
const PORT = process.env.PORT || 3001;
const IS_VERCEL = !!process.env.VERCEL;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory (for logos and temporary files)
const uploadsDir = IS_VERCEL ? os.tmpdir() : path.join(ROOT_DIR, 'uploads');
try { if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); } } catch {}

// Serve uploaded files (logos)
if (!IS_VERCEL) app.use('/uploads', express.static(uploadsDir));

// DMS storage root for documents
const storageRoot = IS_VERCEL ? path.join(os.tmpdir(), 'app_files') : path.join(ROOT_DIR, 'storage/app/files');
try { if (!fs.existsSync(storageRoot)) { fs.mkdirSync(storageRoot, { recursive: true }); } } catch {}

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
const FORCE_SQLITE = String(process.env.USE_SQLITE || '').toLowerCase() === '1' || String(process.env.USE_SQLITE || '').toLowerCase() === 'true';
const useSupabase = !!supabase && !FORCE_SQLITE;

const db = null;

// Create tables
 

// Migrations: add columns to institutions if missing
 

// Migrate old user roles
 

// Rebuild users table to ensure updated CHECK constraint
 

 

function actorNameById(id?: string) {
  return null;
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
 

// API Routes

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (useSupabase) {
    (async () => {
      const { data, error } = await supabase!.from('users').select('*').eq('email', email).eq('password', password).single();
      if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
      const { password: _pw, ...userWithoutPassword } = data as any;
      return res.json({ user: userWithoutPassword });
    })();
    return;
  }
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const uid = String(req.headers['x-user-id'] || '').trim();
  const role = String(req.headers['x-user-role'] || '').trim();
  if (uid && role) {
    return res.json({ user: { id: uid, email: '', full_name: '', role, is_active: true, created_at: new Date().toISOString() } });
  }
  return res.json({ user: null });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
    absolute = path.join(ROOT_DIR, doc.file_path.replace(/^\//, ''));
  } else {
    absolute = path.join(ROOT_DIR, doc.file_path.replace(/^\/uploads\//, 'uploads/'));
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (IS_VERCEL && !useSupabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
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
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  const csvData = fs.readFileSync(req.file.path, 'utf-8');
  const lines = csvData.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return res.status(400).json({ error: 'CSV is empty' });
  const parseCsvLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; } else { current += ch; }
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
  let inserted = 0;
  (async () => {
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
      const { error } = await supabase!.from('institutions').upsert({ id, name, address, city, phone: '', email, website, institution_type: type, accreditation_status: 'accredited', logo_url });
      if (!error) inserted++;
    }
    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ inserted });
  })();
});

// Cities endpoint for filters
 

// Statistics
app.get('/api/statistics', (req, res) => {
  (async () => {
    if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
    const { count: instTotal } = await supabase!.from('institutions').select('*', { count: 'exact', head: true });
    const { count: instAcc } = await supabase!.from('institutions').select('*', { count: 'exact', head: true }).eq('accreditation_status', 'accredited');
    const { count: progTotal } = await supabase!.from('study_programs').select('*', { count: 'exact', head: true });
    const { count: progAcc } = await supabase!.from('study_programs').select('*', { count: 'exact', head: true }).eq('accreditation_status', 'accredited');
    res.json({
      total_institutions: instTotal || 0,
      accredited_institutions: instAcc || 0,
      total_programs: progTotal || 0,
      accredited_programs: progAcc || 0
    });
  })();
});

app.get('/api/audit-logs', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { limit = 100, offset = 0, resource_type, action, actor_role, search } = req.query as any;
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  (async () => {
    let q = supabase!.from('audit_logs').select('*');
    if (resource_type) q = q.eq('resource_type', resource_type);
    if (action) q = q.eq('action', action);
    if (actor_role) q = q.eq('actor_role', actor_role);
    if (search) q = q.or(`actor_name.ilike.%${search}%,actor_id.ilike.%${search}%,resource_id.ilike.%${search}%`);
    const lim = Number(limit) || 100;
    const off = Number(offset) || 0;
    const { data, error } = await q.order('created_at', { ascending: false }).range(off, off + lim - 1);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  })();
});

app.get('/api/audit-logs/export', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { format = 'csv', resource_type, action, actor_role, search } = req.query as any;
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  (async () => {
    let q = supabase!.from('audit_logs').select('*');
    if (resource_type) q = q.eq('resource_type', resource_type);
    if (action) q = q.eq('action', action);
    if (actor_role) q = q.eq('actor_role', actor_role);
    if (search) q = q.or(`actor_name.ilike.%${search}%,actor_id.ilike.%${search}%,resource_id.ilike.%${search}%`);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const rows = (data || []) as any[];
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
  })();
});

app.get('/api/_debug/audit', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  (async () => {
    if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
    const { count } = await supabase!.from('audit_logs').select('*', { count: 'exact', head: true });
    res.json({ schema: null, count: count || 0 });
  })();
});

app.post('/api/_debug/audit-insert', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  if (actorRole !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  (async () => {
    if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
    const id = 'audit-' + Date.now();
    const { error } = await supabase!.from('audit_logs').insert({ id, actor_id: 'user-001', actor_role: 'admin', actor_name: 'Administrator Sistema', action: 'debug', resource_type: 'user', resource_id: 'user-xyz', changed_fields: '["email"]', prev_values: '{"email":"old"}', new_values: '{"email":"new"}' });
    if (error) return res.status(500).json({ error: 'Debug insert failed' });
    const { count } = await supabase!.from('audit_logs').select('*', { count: 'exact', head: true });
    res.json({ ok: true, count: count || 0 });
  })();
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

// Setup: seed minimal data into Supabase
app.post('/api/_setup/seed', async (req, res) => {
  try {
    if (!useSupabase || !supabase) return res.status(400).json({ error: 'Supabase is not configured' });
    const institutions = [
      { id: 'inst-001', name: 'Univerzitet u Sarajevu', address: 'Obala Kulina bana 7/II', city: 'Sarajevo', phone: '+387 33 668 500', email: 'info@unsa.ba', website: 'https://www.unsa.ba', institution_type: 'university', accreditation_status: 'accredited', logo_url: '/logos/unsa.svg' },
      { id: 'inst-002', name: 'Univerzitet u Tuzli', address: 'Univerzitetska 4', city: 'Tuzla', phone: '+387 35 320 800', email: 'info@untz.ba', website: 'https://www.untz.ba', institution_type: 'university', accreditation_status: 'accredited', logo_url: '/logos/untz.svg' }
    ];
    const users = [
      { id: 'user-001', email: 'admin@registry.ba', password: 'admin123', full_name: 'Administrator Sistema', role: 'admin', is_active: 1 },
      { id: 'user-003', email: 'info@unsa.ba', password: 'institution123', full_name: 'UNSA Administrator', role: 'institution', is_active: 1, institution_id: 'inst-001' }
    ];
    const { error: e1 } = await supabase.from('institutions').upsert(institutions, { onConflict: 'id' });
    if (e1) return res.status(500).json({ error: e1.message });
    const { error: e2 } = await supabase.from('users').upsert(users, { onConflict: 'id' });
    if (e2) return res.status(500).json({ error: e2.message });
    const programs = [
      { id: 'prog-001', institution_id: 'inst-001', name: 'Računarstvo i informatika', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited' },
      { id: 'prog-004', institution_id: 'inst-002', name: 'Strojarstvo', degree_level: 'bachelor', duration_years: 3, ects_credits: 180, accreditation_status: 'accredited' }
    ];
    const { error: e3 } = await supabase.from('study_programs').upsert(programs, { onConflict: 'id' });
    if (e3) return res.status(500).json({ error: e3.message });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'Seed failed' });
  }
});

// Health check
app.get('/api/_health', async (req, res) => {
  const hasUrl = !!SUPABASE_URL;
  const hasKey = !!SUPABASE_KEY;
  const sup = useSupabase;
  let dbok = false;
  if (useSupabase) {
    try {
      const { error } = await supabase!.from('institutions').select('*', { count: 'exact', head: true });
      dbok = !error;
    } catch { dbok = false; }
  }
  res.json({ useSupabase: sup, hasUrl, hasKey, dbok });
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
  (async () => {
    if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
    const lines: string[] = [];
    lines.push('-- Schema');
    lines.push(fs.readFileSync(path.join(ROOT_DIR, 'supabase/schema.sql'), 'utf-8'));
    lines.push('\n-- Data\nBEGIN;');
    const pushRows = (table: string, cols: string[], rows: any[]) => { rows.forEach(r => lines.push(insertStmt(`public.${table}`, cols, r))); };
    const { data: inst } = await supabase!.from('institutions').select('*');
    if (inst) pushRows('institutions', ['id','name','address','city','phone','email','website','institution_type','accreditation_status','logo_url','ownership_type','founded_on','accreditation_valid_from','accreditation_valid_to','competent_authority','notes','registration_number','tax_id','short_name','municipality','postal_code','country','founder_name','founding_act_reference','head_name','head_title','fax','is_active','created_at','updated_at'], inst as any[]);
    const { data: sp } = await supabase!.from('study_programs').select('*');
    if (sp) pushRows('study_programs', ['id','institution_id','name','degree_level','duration_years','ects_credits','accreditation_status','accreditation_expiry','created_at','updated_at'], sp as any[]);
    const { data: ap } = await supabase!.from('accreditation_processes').select('*');
    if (ap) pushRows('accreditation_processes', ['id','institution_id','program_id','assigned_officer_id','process_type','status','application_date','decision_date','decision','notes','created_at','updated_at'], ap as any[]);
    const { data: docs } = await supabase!.from('documents').select('*');
    if (docs) pushRows('documents', ['id','institution_id','program_id','process_id','document_type','title','description','issuer','issued_at','number','file_name','file_path','file_size','mime_type','sha256','version','is_confidential','tags','uploaded_by','uploaded_at'], docs as any[]);
    const { data: users } = await supabase!.from('users').select('*');
    if (users) pushRows('users', ['id','email','password','full_name','role','is_active','institution_id','created_at'], users as any[]);
    const { data: logs } = await supabase!.from('audit_logs').select('*');
    if (logs) pushRows('audit_logs', ['id','actor_id','actor_role','actor_name','action','resource_type','resource_id','changed_fields','prev_values','new_values','created_at'], logs as any[]);
    lines.push('COMMIT;');
    const sql = lines.join('\n');
    res.setHeader('Content-Type', 'application/sql');
    res.send(sql);
  })();
});

// Maintenance: normalize logo URLs to local assets to avoid external DNS issues
app.post('/api/maintenance/fix-logos', (req, res) => {
  try {
    if (IS_VERCEL && !useSupabase) {
      return res.status(500).json({ error: 'Supabase is not configured' });
    }
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
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  (async () => {
    const { data, error } = await supabase!.from('users').select('id,email,full_name,role,is_active,institution_id,created_at').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  })();
});

app.post('/api/users', (req, res) => {
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { email, password, full_name, role, is_active = 1, institution_id = null } = req.body;
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const allowedRoles = new Set(['admin', 'operator', 'viewer', 'institution']);
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  (async () => {
    const id = 'user-' + Date.now();
    const activeFlag = typeof is_active === 'boolean' ? (is_active ? 1 : 0) : Number(is_active) ? 1 : 0;
    const instId = institution_id ? institution_id : null;
    const { data: existing } = await supabase!.from('users').select('id').eq('email', email).single();
    if (existing?.id) return res.status(409).json({ error: 'Email already exists' });
    const { data, error } = await supabase!.from('users').insert({ id, email, password, full_name, role, is_active: activeFlag, institution_id: instId }).select('id,email,full_name,role,is_active,institution_id,created_at').single();
    if (error) return res.status(500).json({ error: 'Failed to create user' });
    const payload = diffObject(null, { email, full_name, role, is_active: activeFlag, institution_id: instId });
    await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: null, action: 'create', resource_type: 'user', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: null, new_values: JSON.stringify(payload.nextOut) });
    res.json(data);
  })();
});

app.put('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { email, full_name, role, is_active, institution_id } = req.body;
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  if (role) {
    const allowedRoles = new Set(['admin', 'operator', 'viewer', 'institution']);
    if (!allowedRoles.has(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
  }
  (async () => {
    if (email) {
      const { data: other } = await supabase!.from('users').select('id').eq('email', email).single();
      if (other?.id && other.id !== id) return res.status(409).json({ error: 'Email already exists' });
    }
    const upd: any = { email, full_name, role, is_active, institution_id };
    Object.keys(upd).forEach(k => { if (upd[k] === undefined) delete upd[k]; });
    const { data, error } = await supabase!.from('users').update(upd).eq('id', id).select('id,email,full_name,role,is_active,institution_id,created_at').single();
    if (error) return res.status(404).json({ error: 'User not found' });
    const fields = Object.keys(upd || {});
    const payload = diffObject({}, upd, fields);
    if (payload.changed.length > 0) {
      await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: null, action: 'update', resource_type: 'user', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: JSON.stringify(payload.nextOut) });
    }
    res.json(data);
  })();
});

app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const actorRole = (req.headers['x-user-role'] || '').toString();
  const actorId = (req.headers['x-user-id'] || '').toString();
  if (actorRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!useSupabase) return res.status(500).json({ error: 'Supabase is not configured' });
  (async () => {
    const { data: before } = await supabase!.from('users').select('*').eq('id', id).single();
    const { error } = await supabase!.from('users').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Failed to delete user' });
    const payload = diffObject(before, null);
    await supabase!.from('audit_logs').insert({ id: 'audit-' + Date.now(), actor_id: actorId, actor_role: actorRole, actor_name: null, action: 'delete', resource_type: 'user', resource_id: id, changed_fields: JSON.stringify(payload.changed), prev_values: JSON.stringify(payload.prevOut), new_values: null });
    res.json({ ok: true });
  })();
});

// Global error handler to always return JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.error(err);
  } catch {}
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
