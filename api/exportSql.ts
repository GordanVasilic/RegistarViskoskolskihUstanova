import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function esc(v: any) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  const s = String(v)
  return "'" + s.replace(/'/g, "''") + "'"
}

function insertStmt(table: string, cols: string[], row: any, typeMap?: Record<string, 'date'|'bool'|'int'|'text'>) {
  const values = cols.map(c => encodeValue(table, c, (row as any)[c], typeMap))
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')});`
}

function encodeValue(table: string, col: string, val: any, typeMap?: Record<string, 'date'|'bool'|'int'|'text'>) {
  const t = typeMap?.[col]
  if (t === 'date') {
    if (val === null || val === undefined) return 'NULL'
    const s = String(val).trim()
    if (!s) return 'NULL'
    return esc(s)
  }
  if (t === 'bool') {
    if (val === null || val === undefined) return 'NULL'
    if (val === 1 || val === '1' || val === true || val === 'true') return 'true'
    if (val === 0 || val === '0' || val === false || val === 'false') return 'false'
    return String(val).toLowerCase() === 'true' ? 'true' : 'false'
  }
  if (t === 'int') {
    if (val === null || val === undefined || String(val).trim() === '') return 'NULL'
    return String(Number(val))
  }
  // default text
  return esc(val)
}

function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const projectRoot = path.resolve(path.join(__dirname, '..'))
  const dbPath = path.join(projectRoot, 'registry.db')
  const schemaPath = path.join(projectRoot, 'supabase', 'schema.sql')
  const outPath = path.join(projectRoot, 'supabase-dump.sql')

  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath)
    process.exit(1)
  }
  const db = new Database(dbPath)
  const lines: string[] = []
  lines.push('-- Schema')
  if (fs.existsSync(schemaPath)) {
    lines.push(fs.readFileSync(schemaPath, 'utf-8'))
  } else {
    console.warn('Schema file not found:', schemaPath)
  }
  lines.push('\n-- Data')
  lines.push('BEGIN;')

  try {
    const instCols = ['id','name','address','city','phone','email','website','institution_type','accreditation_status','logo_url','ownership_type','founded_on','accreditation_valid_from','accreditation_valid_to','competent_authority','notes','registration_number','tax_id','short_name','municipality','postal_code','country','founder_name','founding_act_reference','head_name','head_title','fax','is_active','created_at','updated_at']
    const institutions = db.prepare('SELECT ' + instCols.join(',') + ' FROM institutions').all() as any[]
    const instTypes: Record<string,'date'|'bool'|'int'|'text'> = { founded_on:'date', accreditation_valid_from:'date', accreditation_valid_to:'date', is_active:'bool' }
    institutions.forEach(r => lines.push(insertStmt('public.institutions', instCols, r, instTypes)))

    const spCols = ['id','institution_id','name','degree_level','duration_years','ects_credits','accreditation_status','accreditation_expiry','created_at','updated_at']
    const programs = db.prepare('SELECT ' + spCols.join(',') + ' FROM study_programs').all() as any[]
    const spTypes: Record<string,'date'|'bool'|'int'|'text'> = { duration_years:'int', ects_credits:'int', accreditation_expiry:'date' }
    programs.forEach(r => lines.push(insertStmt('public.study_programs', spCols, r, spTypes)))

    const apCols = ['id','institution_id','program_id','assigned_officer_id','process_type','status','application_date','decision_date','decision','notes','created_at','updated_at']
    const processes = db.prepare('SELECT ' + apCols.join(',') + ' FROM accreditation_processes').all() as any[]
    const apTypes: Record<string,'date'|'bool'|'int'|'text'> = { application_date:'date', decision_date:'date' }
    processes.forEach(r => lines.push(insertStmt('public.accreditation_processes', apCols, r, apTypes)))

    const docCols = ['id','institution_id','program_id','process_id','document_type','title','description','issuer','issued_at','number','file_name','file_path','file_size','mime_type','sha256','version','is_confidential','tags','uploaded_by','uploaded_at']
    const documents = db.prepare('SELECT ' + docCols.join(',') + ' FROM documents').all() as any[]
    const docTypes: Record<string,'date'|'bool'|'int'|'text'> = { issued_at:'date', file_size:'int', version:'int', is_confidential:'bool' }
    documents.forEach(r => lines.push(insertStmt('public.documents', docCols, r, docTypes)))

    const userCols = ['id','email','password','full_name','role','is_active','institution_id','created_at']
    const users = db.prepare('SELECT ' + userCols.join(',') + ' FROM users').all() as any[]
    const userTypes: Record<string,'date'|'bool'|'int'|'text'> = { is_active:'bool' }
    users.forEach(r => lines.push(insertStmt('public.users', userCols, r, userTypes)))

    const alCols = ['id','actor_id','actor_role','actor_name','action','resource_type','resource_id','changed_fields','prev_values','new_values','created_at']
    const logs = db.prepare('SELECT ' + alCols.join(',') + ' FROM audit_logs').all() as any[]
    logs.forEach(r => lines.push(insertStmt('public.audit_logs', alCols, r)))
  } catch (e: any) {
    lines.push('-- Export error: ' + String(e?.message || e))
  }

  lines.push('COMMIT;')
  const sql = lines.join('\n')
  fs.writeFileSync(outPath, sql, 'utf-8')
  console.log('SQL dump written to', outPath)
}

main()
