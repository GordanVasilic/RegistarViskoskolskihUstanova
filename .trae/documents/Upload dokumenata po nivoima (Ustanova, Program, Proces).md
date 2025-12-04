## Cilj
Uvesti dosljedan DMS po tri nivoa (ustanova, program, proces) uz upload u modalima sa lokalnom listom (queue) i poštivanje zahtjeva lokacije i imenovanja fajlova.

## Pravila DMS (prema specifikaciji)
- Lokacija: fajlovi čuvati u `/storage/app/files/{institution_id}/`.
- Imenovanje: automatsko preimenovanje u `{DATUM}_{TIP}_{ORIGINAL_NAZIV}.pdf` (npr. `2025-12-03_RJEŠENJE_akt.pdf`).
- PDF-only; zabraniti druge MIME tipove/ekstenzije.

## Backend
- Upload dokumenta:
  - Prilikom upload-a, utvrditi `institution_id`:
    - Ako je prosleđen `institution_id` → koristiti direktno.
    - Ako je `program_id` → SELECT program → izvući `institution_id`.
    - Ako je `process_id` → SELECT proces → izvući `program_id` i `institution_id`.
  - Dinamička destinacija: kreirati folder `/storage/app/files/{institution_id}/` ako ne postoji.
  - Preimenovanje fajla: datum iz servera (`YYYY-MM-DD`), `TIP` iz `document_type`, originalni naziv sanitizirati (bez razmaka/spec. znakova) i dodati `.pdf`.
  - Kolizije: ako isti naziv postoji, automatski povećati sufiks ili inkrementirati `version` u bazi i dodati `_(v{version})` u naziv.
  - Zapis u `documents` uključuje: `institution_id`, opciono `program_id`/`process_id`, `document_type`, meta (title, description, issuer, issued_at, number), `file_name`, `file_path` (apsolutna/relativna putanja pod storage), `file_size`, `mime_type`, `sha256`, `version`, `uploaded_by`.
  - Audit: kreiranje/brisanje/izmjena meta logovati (actor, vrijeme, diff).
- Listanje i preuzimanje:
  - `GET /api/documents` filtrira po bilo kom od tri nivoa.
  - `GET /api/documents/:id/download` servira fajl iz storage-a.
- Ovlaštenja:
  - `admin/operator`: upload/update/delete.
  - `viewer`: read/download.

## Frontend: komponente
- `DocumentSection` (nova):
  - Props: `title`, `association` (objekt sa jednim od: `institution_id` | `program_id` | `process_id`).
  - Sadrži `DocumentList` i dugme "Dodaj dokument" koje otvara `DocumentUploadModal` sa istom asocijacijom.
  - Prikaz badge-a sa brojem dokumenata; lazy-load na expand.
- `DocumentUploadModal` (proširenje):
  - Podrška za višestruke PDF fajlove (dropzone + queue lista).
  - Svaki fajl u listi ima polja: `document_type`, `title`, `description`, `issuer`, `issued_at`, `number`, `is_confidential`, `tags`.
  - Akcije: dodaj/ukloni fajl iz liste; upload svih u batch-u; progress indikatori.
  - Callback `onUploaded` osvježi parent sekciju.
- Integracija u postojeće ekrane:
  - Ustanova (`InstitutionDetail`): sekcija "Dokumenti ustanove" (unutar boxa Podaci o ustanovi ili odmah ispod) → `DocumentSection` sa `institution_id`.
  - Programi: kod svake stavke programa dodati podsekciju "Dokumenti programa" → `DocumentSection` sa `program_id`; opcija expand/collapse.
  - Procesi akreditacije: kod svake stavke procesa dodati "Dokumenti procesa" → `DocumentSection` sa `process_id`.

## Modali: dodavanje u listu (queue)
- `ProgramModal` (kreiranje/uređivanje):
  - Tab "Dokumenti": dropzone + tabela za queue (bez stvarnog upload-a dok program ne postoji).
  - Nakon uspješnog snimanja programa: uz dobijeni `program_id` izvršiti batch upload svih fajlova iz queue-a sa `association={ program_id }`; prikazati rezultat i obrisati queue.
  - Kod uređivanja postojećeg programa: upload ide odmah (može i kroz isti queue UI).
- `ProcessModal` (kreiranje/uređivanje):
  - Isto kao za program, ali sa `process_id` nakon snimanja procesa.
- Prednosti: korisnik unosi podatke i dokumente u jednom flow-u, a backend garantuje ispravno vezivanje tek nakon kreiranja entiteta.

## Validacije i UX
- Validacija PDF-only; max veličina (npr. 10 MB po fajlu) i max broj u batch-u (npr. 10).
- Obavezna asocijacija: barem jedan od `institution_id`/`program_id`/`process_id`.
- Jasne poruke grešaka; toast na uspjeh; prikaz veličine i datuma.

## Performanse
- Paginacija u `DocumentList` (limit/offset); lazy-load pri expand.
- Debounce pretrage i filtera; prebrojavanje za badge klijentski ili preko opcionalnog `GET /api/documents/counts`.

## Verifikacija
- Testovi upload-a po sva tri nivoa; provjera imenovanja i lokacije.
- Audit log provjera za kreiranje/brisanje/izmjenu.
- Role test (`viewer` nema upload/delete).

## Kompatibilnost i migracija
- Postojeće dokumente iz `/uploads` opcionalno premjestiti u `/storage/app/files/{institution_id}/` maintenance skriptom.
- UI se prilagođava bez rušenja postojećih funkcionalnosti.

Ako je ovakav plan u redu, odmah krećem sa implementacijom: backend preimenovanje i lokacija, proširenje modalâ i dodavanje sekcija u detaljima ustanove/programa/procesa.