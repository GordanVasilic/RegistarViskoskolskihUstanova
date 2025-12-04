## Ciljevi
- Omogućiti upload, pregled, preuzimanje i upravljanje PDF dokumentima za: ustanovu (Knjiga 1), studijski program (Knjiga 2) i procese akreditacije.
- Pratiti metapodatke (tip dokumenta, izdavač, datum, broj akta), sigurnost (role), audit i pretragu.

## Lokacije i Tipovi Dokumenata
- Ustanova: founding_act, statute, license, authority_decision, organization_chart, change_decision.
- Program: curriculum, program_certificate, ser_program, resources_evidence.
- Proces: application, self_evaluation, external_report, site_visit_minutes, commission_recommendation, decision, certificate, appeal, correspondence.

## Backend (Baza i API)
- Shema `documents` proširiti:
  - id, institution_id?, program_id?, process_id?
  - document_type (TEXT), title?, description?
  - file_name, mime_type, file_size, storage_path
  - issued_at?, issuer?, number?
  - uploaded_by, uploaded_at (TIMESTAMP), sha256?, version? (INTEGER), is_confidential? (BOOLEAN), tags? (JSON/TEXT)
- Valdacija:
  - Dozvoljeni MIME: `application/pdf`
  - Obavezno: barem jedno od [institution_id, program_id, process_id]
  - Max veličina (npr. 20MB) – konfigurisati
- Skladištenje:
  - Disk: `/uploads/documents/<yyyy>/<mm>/<uuid>-<sanitized_original>`
  - Izračunati i snimiti `sha256` (opciono deduplikacija)
- Rute:
  - POST `/api/documents/upload` (multipart/form-data): polja meta + fajl; vraća zapis i URL
  - GET `/api/documents` sa filterima: `institution_id | program_id | process_id`, `type`, `search`, `date_from/date_to`, `limit/offset`
  - GET `/api/documents/:id/download` (Content-Disposition: attachment)
  - PUT `/api/documents/:id` (izmjena meta – bez fajla)
  - DELETE `/api/documents/:id`
- Sigurnost i role:
  - `admin`/`operator`: upload/update/delete, pregled svih
  - `viewer`: samo pregled i preuzimanje
  - `institution`: (ako se koristi) – ograničiti na sopstvenu ustanovu/programe/procese
- Audit log:
  - Kreiranje: `action=create`, `resource=documents`, diff meta polja
  - Ažuriranje meta: `action=update`
  - Brisanje: `action=delete`

## Frontend (UI/UX)
- Komponente:
  - `DocumentList`: lista sa kolonama (tip, naziv, veličina, datum, izdavač, broj), pretraga i filteri
  - `DocumentUploadModal`: upload forma (tip, izdavač, datum izdavanja, broj, napomena + PDF fajl)
- Integracije:
  - Ustanova (Detalji): sekcija „Dokumenti ustanove“ (lista + upload)
  - Program: u prikazu programa „Dokumenti“ (lista + upload)
  - Proces akreditacije: u tabeli procesa dugme „Dokumenti“ i upload direktno iz modala procesa / odluke
- UX detalji:
  - Progress bar pri uploada
  - Validacija (PDF, obavezna polja)
  - Preuzimanje jednim klikom, brisanje uz potvrdu
  - Lokalizacija naziva tipova dokumenata

## Pretraga i Filtriranje
- Klijentski filteri: tip dokumenta, datum interval, izdavač, tekstualna pretraga (title/description/number)
- Pagincija `limit/offset` i prikaz broja rezultata

## Testiranje i Verifikacija
- Backend unit: upload (200), download (200), invalid MIME (400), role (403)
- E2E: upload → list → download → delete → audit vidljiv
- Testovi za velike datoteke, prazna polja, filtere

## Migracija i Kompatibilnost
- Dodati kolone u `documents` (idempotentno)
- Ako već postoje procesni dokumenti, ostaju validni; novi uploadi mogu vezati `institution_id`/`program_id`

## Performanse i Ograničenja
- Limit veličine (npr. 20MB), timeouti i provjera grešaka
- Eventualno kasnije: skladištenje u objektni storage; verzioniranje

## Buduća Proširenja
- Masovni upload ZIP → batch import
- Digitalni potpis i verifikacija
- Automatizirani check-list (obavezni dokumenti po tipu procesa)

## Plan Implementacije (koraci)
1) Proširiti `documents` tabelu i validacije (institution_id/program_id/process_id; meta polja)
2) Dopuniti upload rutu (meta + PDF), list rutu sa filterima, download i delete
3) Dodati audit log za create/update/delete
4) Izgraditi `DocumentList` i `DocumentUploadModal` komponente
5) Ugraditi dokumente u: Detalji ustanove (sekcija), program (akcija/dio liste), proces (akcija + upload u modalu odluke)
6) Dodati filtere i paginaciju na UI
7) Napisati testove (unit + E2E) i verifikovati
8) Dokumentovati tipove, uloge i ograničenja veličine

Da li ti odgovara ovakav plan implementacije? Potvrdom krećem u izradu.