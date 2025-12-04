import fs from 'fs';
import Database from 'better-sqlite3';

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseRows(html: string) {
  return html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
}

function getCells(rowHtml: string) {
  const cells = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
  return cells.map(c => stripTags(c));
}

function getFirstHref(rowHtml: string) {
  const m = rowHtml.match(/href="([^"]+)"/i);
  return m ? m[1] : undefined;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
}

async function main() {
  let filePath = '';
  const arg = process.argv.find(a => a.startsWith('--path='));
  if (arg) {
    filePath = arg.replace('--path=', '');
  } else {
    const cand = process.argv.slice(2).find(a => fs.existsSync(a));
    if (cand) {
      filePath = cand;
    } else {
      console.error('Usage: tsx api/importFromFile.ts --path=<FILE_PATH>');
      process.exit(1);
    }
  }
  const html = fs.readFileSync(filePath, 'utf-8');

  const rows = parseRows(html);
  let category: 'university' | 'college' = 'university';

  const records: { name: string; city?: string; website?: string; type: 'university' | 'college'; ownership_type?: string; founded_on?: string; accreditation_valid_from?: string; accreditation_valid_to?: string; competent_authority?: string; notes?: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const text = stripTags(r).toLowerCase();
    if (text.includes('univerziteti')) {
      category = 'university';
      continue;
    }
    if (text.includes('visoke škole')) {
      category = 'college';
      continue;
    }
    const cells = getCells(r);
    if (cells.length < 2) continue;
    const nameCell = cells[0];
    const cityCell = cells[1];
    const name = nameCell.replace(/\s+/g, ' ').trim();
    const city = cityCell.replace(/\s+/g, ' ').trim();
    if (!name || name.toLowerCase().startsWith('naziv')) continue;
    const website = getFirstHref(r);
    const ownership = cells[2] ? cells[2].trim() : undefined;
    const founded = cells[3] ? cells[3].trim() : undefined;
    const validFrom = cells[4] ? cells[4].trim() : undefined;
    const validTo = cells[5] ? cells[5].trim() : undefined;
    const authority = cells[6] ? cells[6].trim() : undefined;
    const notes = cells[7] ? cells[7].trim() : undefined;
    records.push({ name, city, website, type: category, ownership_type: ownership, founded_on: founded, accreditation_valid_from: validFrom, accreditation_valid_to: validTo, competent_authority: authority, notes });
  }

  if (records.length === 0) {
    console.error('No institutions parsed');
    process.exit(1);
  }

  const db = new Database('registry.db');
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO institutions (id, name, address, city, phone, email, website, institution_type, accreditation_status, logo_url, ownership_type, founded_on, accreditation_valid_from, accreditation_valid_to, competent_authority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  let inserted = 0;
  records.forEach((rec, idx) => {
    const id = `inst-${slugify(rec.name)}-${idx}`;
    const logo_url = `/logos/${slugify(rec.name)}.svg`;
    const res = stmt.run(id, rec.name, '', rec.city || '', '', '', rec.website || '', rec.type, 'accredited', logo_url, rec.ownership_type || null, rec.founded_on || null, rec.accreditation_valid_from || null, rec.accreditation_valid_to || null, rec.competent_authority || null, rec.notes || null);
    if (res.changes > 0) inserted++;
  });

  console.log(`Imported ${inserted} institutions from file`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
