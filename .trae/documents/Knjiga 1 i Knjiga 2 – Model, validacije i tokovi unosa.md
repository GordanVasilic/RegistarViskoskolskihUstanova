## Objašnjenje
Da: svaka ustanova ima svoje studijske programe (Knjiga 2) i pripadajuće procese akreditacije. Zbog toga je praktično da se upravljanje programima i procesima radi iz konteksta ustanove (detalji/sekcija), umjesto zasebnih globalnih menija.

## UI Pristup
- Administracija → Ustanove (Knjiga 1) ostaje glavna lista.
- Klik na ustanovu otvara detalje sa pod-sekcijama:
  - Programi (Knjiga 2): tabela + dodavanje/uređivanje/brisanje, filtriranje po nivou; validacije iz šifrarnika.
  - Procesi akreditacije: tabela procesa za tu ustanovu (i opcionalno za pojedine programe); kreiranje, odluka, upload dokumenata.
- Globalni „Programi“ i „Procesi“ linkovi mogu biti skriveni ili zadržani kao brzi pregled (opcionalno), ali primarna manipulacija ide kroz detalj Ustanove.

## Model i Povezivanje
- Ustanova 1—N Programi.
- Proces N—1 Ustanova i opcionalno N—1 Program.
- Dokument N—1 Proces.

## Validacije
- Program: jedinstven naziv + nivo unutar ustanove; trajanje/ECTS rasponi; status i rok akreditacije dosljedni.
- Proces: obavezno `institution_id`; ako je `program_id` prisutan, mora pripadati istoj ustanovi; odluka i datumi konzistentni po statusu.

## Audit i Objave
- Sve promjene kroz sekcije Programi/Procesi se auditiraju (stare/nove vrijednosti).
- Javni registar ostaje s filtrima; prikaz programa kroz detalj ustanove.

## Implementacija (sačuvana logika, promjena UX)
- Frontend: prebaciti CRUD Programi/Procesi iz glavnih tabova u detalj ustanove (dvije pod-sekcije), dodati modale i liste.
- Backend: zadržati postojeće rute; dodati `program_id` u proces (ako već nije), validacije i jedinstvenosti.

## Potvrda
Ako je ovakav UX prihvatljiv, započinjem sa izmjenama: detalj ustanove sa integrisanim Programima i Procesima, modali i validacije, bez razbijanja postojećeg backend-a.