# Supabase konfiguracija

## 1) Kreiraj projekte i ključ
- URL: koristi `SUPABASE_URL` iz svog projekta
- KEY: koristi `SUPABASE_SERVICE_ROLE_KEY` (preporučeno) ili `SUPABASE_ANON_KEY` za demo

## 2) Importuj shemu
- Otvori Supabase SQL Editor i izvrši sadržaj `supabase/schema.sql`
- Ovo će kreirati tabele: `institutions`, `study_programs`, `accreditation_processes`, `documents`, `users`, `audit_logs`

## 3) Storage bucket za dokumente
- Kreiraj bucket `documents` (Public za demo)
- Dokumenti se uploaduju pod ključ `{institution_id}/{YYYY-MM-DD}_{TIP}_{ORIGINAL}.pdf`

## 4) Environment varijable (backend)
- U okruženju gdje se pokreće `api/server.ts` postavi:
  - `SUPABASE_URL=...`
  - `SUPABASE_KEY=...` (service role ili anon)

## 5) Environment varijable (frontend)
- Na Vercel-u postavi:
  - `VITE_API_BASE_URL=https://<tvoj-backend-host>/api`

## Napomene
- U demo režimu bucket može biti public; za produkciju koristi signed URL-ove i RLS politike.
- Audit zapisi se upisuju iz backend-a; tabela je kreirana bez RLS-a radi lakšeg demo-a.

