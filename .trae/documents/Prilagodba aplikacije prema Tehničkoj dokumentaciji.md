## Fokus iz dokumentacije
- Polja na nivou ustanove: Naziv, Sjedište (grad), Oblik vlasništva, Datum osnivanja, Period važenja akreditacije (OD/DO), Nadležna obrazovna vlast, Napomena
- Kategorije: Univerziteti i Visoke škole (mapirati na `institution_type: 'university' | 'college'`)
- Statusi akreditacije uključuju i uslovnu akreditaciju

## Izmjene modela podataka (SQLite)
- Dodati kolone u `institutions`: `ownership_type`, `founded_on`, `accreditation_valid_from`, `accreditation_valid_to`, `competent_authority`, `notes`
- Proširiti `accreditation_processes.status`: dodati `'conditional'`
- Migracija: ALTER TABLE skripte + re‑seed bez gubitka postojećih podataka

## Backend API dopune
- `GET /institutions`: novi filteri (`ownership_type`, `authority`, `valid_until_before/after`, `type`)
- `POST/PUT /institutions`: podrška za nove kolone, validacija datuma
- `GET /statistics`: dodati statistiku po tipu i vlasništvu (npr. broj javnih/privatnih)
- Import: poboljšati parser (HTML/CSV) da popuni `ownership_type`, `founded_on`, `valid_from`, `valid_to`, `competent_authority`, `notes`

## Frontend prilagodbe
- Javni registar: filteri po vlasništvu, tipu, nadležnoj vlasti, roku važenja; prikaz `OD–DO` na kartici ustanove
- Stranica ustanove: prikaz vlasništva, osnivanja, nadležne vlasti, napomene i `OD/DO`; programski i procesi ostaju
- Admin Panel → Ustanove: proširiti formu sa novim poljima; validacija datuma; status prikaza uključuje “Uslovna akreditacija”
- Admin Panel → Import: prikaz rezultata (broj novih, broj ažuriranih); alat za “fix logos” ostaje

## UX/Validacija
- Datumi: format `dd.mm.yyyy`, jasne poruke grešaka
- Fallback logotipa ostaje (`/logos/default.svg`) i automatska normalizacija URL‑ova

## Verifikacija
- Dodati demo podatke za oba tipa (univerzitet/visoka škola) sa `OD/DO` i različitim vlasništvima
- Testirati filtere i statistiku; ručni uvoz iz dostavljene HTML tabele

Ako odobriš, implementiram izmjene (migracije SQLite + API + UI) i re‑importujem podatke iz dostavljene tabele kako bi popunio nova polja.