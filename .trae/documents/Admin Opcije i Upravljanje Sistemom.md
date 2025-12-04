## Uloge i Guard
- Dodati role‑based guard na rute: samo `user.role === 'admin'` može na `"/admin"`
- Sakriti admin linkove u headeru kada korisnik nije admin
- Persistirati sesiju u `localStorage` (demo) i učitati u `authStore.checkAuth`

## Admin Panel Navigacija
- Tabovi: Kontrolna tabla, Ustanove, Programi, Procesi, Dokumenti, Korisnici, Uvoz, Podešavanja
- Zadržati Dashboard, dopuniti metrikama iz `/api/statistics`

## Ustanove (CRUD)
- Lista sa pretragom i filterima; inline akcije: Pogledaj, Uredi, Deaktiviraj/Suspenduj
- Forma za dodavanje/uređivanje: naziv, adresa, grad, email, website, tip, status, logo_url
- Backend: dodati `POST/PUT/DELETE /api/institutions` endpoint

## Programi (CRUD)
- Grid po ustanovi; akcije: Dodaj/Uredi/Obriši
- Polja: naziv, degree_level, duration_years, ects, status, expiry
- Backend: `POST/PUT/DELETE /api/study-programs`

## Procesi akreditacije
- Pregled, kreiranje procesa (`initial/renewal/re-evaluation`) i dodjela službenika
- Akcije: `approve/reject`, promjena statusa, bilješke
- Backend: dopuniti `PUT /api/accreditation-processes/:id` za promjene statusa i dodjelu

## Dokumenti
- Upload kroz postojeći `/api/documents/upload` (već postoji)
- Lista dokumenata po procesu; download linkovi

## Korisnici
- Lista i kreiranje korisnika (admin/officer/institution)
- Polja: email, full_name, role, is_active, institution_id
- Backend: `POST/PUT/DELETE /api/users`

## Uvoz Podataka
- CSV upload: koristiti `/api/institutions/import-csv` (već postoji)
- Uvoz iz URL/fajla: koristiti `npm run import:url` i `npm run import:file`
- UI: sekcija sa upload inputom i prikazom rezultata (inserted count)

## Podešavanja
- Branding (naziv, logo), default `logo_url`, kontakt info za footer
- Konfiguratorka pohranjena u `config.json` (demo) ili DB tabela `settings`

## UI Izmjene
- Proširiti `src/pages/AdminPanel.tsx` novim tabovima i formama
- Dodati modal komponente za forme, validaciju, i potvrdu brisanja

## Backend Dopune
- Dodati CRUD rute za institutions, study_programs, users
- Dodati `PUT` rutu za ažuriranje akreditacijskog procesa (status, officer)
- Opcionalno: dodati kolonу `accreditation_expires_at` u `institutions` za prikaz isteka

## Testiranje i Verifikacija
- Seedirati demo podatke i testirati sve CRUD tokove
- Provjeriti role guard: samo admin vidi i koristi admin funkcije

Ako potvrdiš, implementiram ove sekcije end‑to‑end (frontend + backend), uz validaciju i demonstraciju u radu.