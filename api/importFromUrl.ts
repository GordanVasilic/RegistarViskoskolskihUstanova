import Database from 'better-sqlite3';

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseTable(html: string) {
  const rows: string[][] = [];
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const cells = [...(tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || [])].map(cell => stripTags(cell));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function parseList(html: string) {
  const items: string[] = [];
  const liMatches = html.match(/<li[\s\S]*?<\/li>/gi) || [];
  for (const li of liMatches) {
    const text = stripTags(li);
    if (text) items.push(text);
  }
  return items;
}

async function main() {
  const urlArg = process.argv.find(a => a.startsWith('--url='));
  if (!urlArg) {
    console.error('Usage: tsx api/importFromUrl.ts --url=<SOURCE_URL>');
    process.exit(1);
  }
  const sourceUrl = urlArg.replace('--url=', '');
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    console.error('Failed to fetch URL:', res.status, res.statusText);
    process.exit(1);
  }
  const html = await res.text();

  let records: { name: string; city?: string; address?: string; email?: string; website?: string; type?: string }[] = [];

  const rows = parseTable(html);
  if (rows.length > 1) {
    const headers = rows[0].map(h => h.toLowerCase());
    const idx = {
      name: headers.findIndex(h => /naziv|name/.test(h)),
      city: headers.findIndex(h => /grad|city/.test(h)),
      address: headers.findIndex(h => /adresa|address/.test(h)),
      email: headers.findIndex(h => /email/.test(h)),
      website: headers.findIndex(h => /web|website|stranica/.test(h)),
      type: headers.findIndex(h => /tip|type/.test(h)),
    };
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = idx.name >= 0 ? r[idx.name] : r[0];
      if (!name) continue;
      records.push({
        name,
        city: idx.city >= 0 ? r[idx.city] : undefined,
        address: idx.address >= 0 ? r[idx.address] : undefined,
        email: idx.email >= 0 ? r[idx.email] : undefined,
        website: idx.website >= 0 ? r[idx.website] : undefined,
        type: idx.type >= 0 ? r[idx.type] : 'university',
      });
    }
  } else {
    const items = parseList(html);
    for (const text of items) {
      const m = text.match(/^\s*(.+?)\s*(?:\(([^)]+)\))?/); // Naziv (Grad)
      const name = m ? m[1].trim() : text.trim();
      const city = m && m[2] ? m[2].trim() : undefined;
      records.push({ name, city, type: 'university' });
    }
  }

  if (records.length === 0) {
    console.error('No records parsed from source');
    process.exit(1);
  }

  const db = new Database('registry.db');
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO institutions (id, name, address, city, phone, email, website, institution_type, accreditation_status, logo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let inserted = 0;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const id = `inst-${rec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`.slice(0, 32);
    const slug = rec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const logo_url = `/logos/${slug}.svg`;
    const result = stmt.run(id, rec.name, rec.address || '', rec.city || '', '', rec.email || '', rec.website || '', rec.type || 'university', 'accredited', logo_url);
    if (result.changes > 0) inserted++;
  }
  console.log(`Imported ${inserted} institutions from ${sourceUrl}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
