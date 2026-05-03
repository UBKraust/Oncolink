# Client Service Flows — Plan și Arhitectură

Generat: 2026-05-02 · Actualizat: 2026-05-03 · Status: implementare incrementală activă

---

## Viziune generală

Terapeuta oferă 4 tipuri de servicii distincte. Toate folosesc aceeași coloană vertebrală de client lifecycle, dar diferă în ce se întâmplă în mijloc: documente necesare, structura notelor clinice, tipul evaluărilor, rapoartele generate, și next actions recomandate.

```
Client
  └── Service Track
        ├── Clinical Psychology Track    (psihologie_clinica)
        ├── CBT Track                    (psihoterapie_cbt)
        ├── DBT Track                    (psihoterapie_dbt)
        └── Counseling Track             (consiliere_psihologica)
```

### Flow comun (coloana vertebrală)

```
Lead → Onboarding → Evaluare inițială → Plan de lucru → Ședințe → Reevaluare / Raport → Închidere / Follow-up
```

Diferența între servicii este ce anume se întâmplă în fiecare etapă.

## Cum se vede asta în dashboard

După refactorul `/dashboard` către clinical command center, service tracks nu mai sunt doar context în fișa clientului, ci apar și agregat în dashboard:

- `ServiceTracksOverview` grupează cazurile active pe:
  - `CLINICAL_PSYCHOLOGY`
  - `CBT`
  - `DBT`
  - `COUNSELING`
  - `UNDECIDED`
- `ClinicalAlertsPanel` și `DocumentTasksPanel` expun blocajele administrative și legale care afectează track-urile
- `AssessmentTasksPanel` este puntea către viitorul catalog de teste și către rapoarte
- `ResearchReadinessPanel` rămâne discret și nu domină experiența clinică zilnică

Scopul dashboard-ului nu este să înlocuiască fișa clientului, ci să răspundă dimineața la:

1. Ce se întâmplă azi?
2. Ce cazuri sunt blocate?
3. Ce documente lipsesc?
4. Ce evaluări sau rapoarte trebuie urmărite?

## Cum se vede asta în programări și fișa clientului

Service tracks nu mai sunt vizibile doar agregat în dashboard. Ele influențează acum și contextul operațional din:

- `AppointmentsToday`
- `SessionDrawer`
- pagina completă a programării
- fișa clientului

### Programări

În lista programărilor de azi și în detaliul unei ședințe apar acum, dacă datele există:

- tipul de serviciu
- nivelul de risc
- stare contract
- stare notă
- stare factură
- jurnal DBT pentru săptămâna curentă

### Fișa clientului

Fișa clientului are un panou nou de `Pregătire sesiune`, care sintetizează:

- următoarea ședință
- ultima ședință finalizată
- dacă ultima ședință are notă
- dacă ultima ședință are factură
- ce lipsește înainte de următoarea sesiune

Scopul acestui panou este să reducă salturile între module exact înaintea unei intervenții clinice.

---

## 1. Psihologie Clinică

**Focus:** evaluare, psihodiagnostic, testare, raportare, recomandări.

### Flow client

```
1. Lead / solicitare
2. Onboarding + consimțământ GDPR
3. Programare evaluare clinică inițială
4. Interviu clinic
5. Aplicare teste / scale psihologice
6. Interpretare rezultate
7. Raport psihologic / concluzii
8. Ședință feedback
9. Recomandare:
   - psihoterapie
   - consiliere
   - trimitere psihiatru / medic
   - reevaluare periodică
10. Închidere evaluare sau tranziție în terapie
```

### Statusuri specifice

```
Lead
Onboarding complet
Evaluare clinică programată
Evaluare în desfășurare
Teste administrate
Raport în lucru
Raport finalizat
Feedback oferit
Recomandare transmisă
Închis / Continuă în terapie
```

### Documente necesare

```
Contract prestări servicii psihologice
Consimțământ informat
GDPR
Fișă anamneză
Fișă interviu clinic
Teste psihologice administrate
Raport psihologic
Recomandări finale
```

### Carduri utile în fișa clientului

| Card | Conținut |
|------|---------|
| Status evaluare | Etapa curentă în fluxul de evaluare |
| Teste administrate | Lista teste + date administrare |
| Scoruri | Rezultate numerice + interpretare |
| Raport psihologic | Status (în lucru / finalizat) + link |
| Recomandări | Text recomandare transmisă clientului |
| Documente semnate | Checklist documente colectate |
| Next action | Pasul imediat următor |

### AI assistant — use cases

| Use case | Ce face AI-ul |
|----------|--------------|
| Sumar anamneză | Extrage datele cheie din notele de interviu |
| Structurare interviu clinic | Propune întrebări lipsă pe secțiuni standard |
| Extragere teme clinice | Identifică patternuri din note multiple |
| Draft raport psihologic | Propune structura + secțiunile pe baza notelor |
| Draft recomandări | Sugerează formulări pentru recomandare finală |
| Verificare date lipsă | Identifică secțiuni incomplete înainte de raport |
| Anonimizare cercetare | Pregătește date anonimizate pentru studii |

> AI-ul poate sugera, nu decide diagnostic și nu înlocuiește judecata clinică.

---

## 2. Psihoterapie Cognitiv-Comportamentală — CBT

**Focus:** structurat, orientat pe obiective, gânduri automate, emoții, comportamente, teme între ședințe, măsurarea progresului.

### Flow client

```
1. Lead / solicitare terapie
2. Onboarding + contract + GDPR
3. Evaluare inițială
4. Stabilire obiective terapeutice
5. Formulare de caz CBT
6. Plan terapeutic
7. Ședințe recurente + teme pentru acasă
8. Monitorizare scoruri / simptome
9. Reevaluare periodică
10. Prevenție recădere
11. Închidere proces / follow-up
```

### Statusuri specifice

```
Lead
Onboarding
Evaluare inițială
Formulare de caz
Plan terapeutic activ
În terapie
Reevaluare lunară
Prevenție recădere
Închis
Follow-up
```

### Elemente clinice importante

| Element | Descriere |
|---------|-----------|
| Problemă principală | Prezentarea inițială |
| Obiective SMART | Obiective terapeutice definite |
| Gânduri automate | Înregistrate per ședință |
| Distorsiuni cognitive | Identificate din gânduri automate |
| Emoții dominante | Pattern emoțional |
| Comportamente de evitare | Comportamente problematice |
| Credințe centrale | Core beliefs identificate |
| Expuneri / exerciții | Intervențiile aplicate |
| Teme pentru acasă | Temele date + statut completare |
| Scoruri pre/post | Măsurători standardizate |

### Documente / formulare

```
Contract terapie adult / minor
Consimțământ informat
Fișă obiective terapeutice
Formulare de caz CBT
Jurnal gânduri automate
Plan de expunere
Fișă teme pentru acasă
Raport progres
Plan prevenție recădere
```

### Carduri utile în fișa clientului

| Card | Conținut |
|------|---------|
| Obiective terapeutice | Lista obiectivelor SMART + progres |
| Formulare CBT | Formularele de caz completate |
| Teme active | Tema curentă + data dată + statut |
| Scoruri evoluție | Grafic sau tabel scoruri pe timp |
| Ultimele gânduri automate | Extras din ultima ședință |
| Intervenții folosite | Lista tehnicilor aplicate |
| Raport progres | Sumar progres generabil |

### AI assistant — use cases

| Use case | Ce face AI-ul |
|----------|--------------|
| Format SOAP | Transformă nota liberă în format SOAP |
| Gânduri automate | Extrage gândurile automate din notă |
| Distorsiuni cognitive | Identifică distorsiunile posibile |
| Formulare de caz | Propune structură pentru formular |
| Sumar progres | Generează sumar din ultimele 5 ședințe |
| Teme recurente | Extrage patternuri din multiple ședințe |
| Raport de progres | Pregătește draft raport progres |

---

## 3. Psihoterapie Dialectic-Comportamentală — DBT

**Focus:** reglare emoțională, risc, comportamente problematice, abilități, diary card, plan de criză.

### Flow client

```
1. Lead / solicitare
2. Screening inițial
3. Evaluare risc
4. Onboarding + contract + consimțământ
5. Angajament terapeutic
6. Stabilire comportamente țintă
7. Plan DBT
8. Ședințe individuale
9. Monitorizare diary card
10. Training abilități:
    - mindfulness
    - toleranță la distres
    - reglare emoțională
    - eficiență interpersonală
11. Management criză
12. Reevaluare comportamente țintă
13. Generalizare abilități
14. Închidere / follow-up
```

### Statusuri specifice

```
Lead
Screening DBT
Evaluare risc
Contract terapeutic
Plan DBT activ
Monitorizare intensă
Stabilizare
Generalizare abilități
Follow-up
Închis
```

### Elemente clinice importante

| Element | Descriere |
|---------|-----------|
| Nivel risc | Risc suicidar / autoagresiv curent |
| Comportamente țintă | Comportamentele prioritare de lucru |
| Comportamente de criză | Istoricul crizelor |
| Diary card | Înregistrare zilnică emoții + comportamente |
| Lanț comportamental | Analiza secvenței ce duce la comportament |
| Abilități DBT folosite | Abilitățile exersate |
| Triggeri | Situații / emoții declanșatoare |
| Strategii de reglare | Ce funcționează pentru client |
| Plan de siguranță | Pași concreți în criză |
| Contacte de suport | Persoane de contact în urgență |

### Documente / formulare

```
Contract psihoterapie
Consimțământ informat
Fișă evaluare risc
Plan de siguranță
Diary card
Analiză lanț comportamental
Fișă abilități DBT
Raport progres DBT
Plan de criză
```

### Carduri utile în fișa clientului

| Card | Conținut |
|------|---------|
| Nivel risc curent | Indicator vizual risc (cu data ultimei evaluări) |
| Diary card săptămânal | Ultimul diary card completat |
| Comportamente țintă | Lista + frecvența din ultima perioadă |
| Abilități exersate | Ce abilități a folosit |
| Note de criză | Ultimele note de criză (accesibil rapid) |
| Plan de siguranță | Afișat permanent, editabil |
| Ultima reevaluare | Data + concluzii |

### AI assistant — use cases

| Use case | Ce face AI-ul |
|----------|--------------|
| Rezumat diary card | Sumarizează diary card-ul săptămânii |
| Patternuri emoționale | Identifică patternuri din diary cards multiple |
| Analiză lanț | Structurează analiza lanțului comportamental |
| Extragere triggeri | Extrage triggerii menționați în note |
| Abilități folosite | Lista abilitățile menționate |
| Raport progres DBT | Draft raport pe comportamente țintă |
| Sumar ședință | Prepară sumar pentru ședința următoare |

> Atenție: orice zonă de risc rămâne sub control uman. AI-ul structurează informația, nu evaluează riscul.

---

## 4. Consiliere Psihologică

**Focus:** suportiv, orientat pe problemă punctuală, clarificare, decizie, adaptare, sprijin emoțional.

### Flow client

```
1. Lead / solicitare
2. Onboarding + consimțământ
3. Ședință inițială de clarificare
4. Stabilire obiectiv de consiliere
5. Plan scurt de lucru
6. Ședințe suportive
7. Recomandări practice
8. Reevaluare după 3–5 ședințe
9. Închidere / trimitere către psihoterapie
```

### Statusuri specifice

```
Lead
Onboarding
Clarificare nevoie
Consiliere activă
Reevaluare
Închis
Recomandat către psihoterapie
```

### Elemente importante

| Element | Descriere |
|---------|-----------|
| Problemă actuală | Prezentarea și contextul |
| Obiectiv scurt | Ce vrea clientul să obțină |
| Resurse client | Puncte forte și resurse identificate |
| Decizii de luat | Decizii cu care clientul se confruntă |
| Strategii recomandate | Ce tehnici / abordări s-au folosit |
| Nivel stres | Auto-raportare |
| Progres perceput | Evaluare subiectivă a clientului |

### Documente / formulare

```
Contract consiliere psihologică
Consimțământ informat
Fișă obiectiv consiliere
Fișă recomandări
Raport scurt progres
Plan de resurse
```

### Carduri utile în fișa clientului

| Card | Conținut |
|------|---------|
| Obiectiv consiliere | Obiectivul definit + progres |
| Număr ședințe | Contor ședințe + target (dacă definit) |
| Stare curentă | Auto-evaluare ultimă |
| Recomandări | Recomandări practice transmise |
| Resurse | Resurse identificate |
| Decizie finală | Continuare / trimitere / închidere |

### AI assistant — use cases

| Use case | Ce face AI-ul |
|----------|--------------|
| Sumar ședință | Sumarizează nota de ședință |
| Clarificare problemă | Structurează problema pe dimensiuni |
| Recomandări practice | Propune o lista de pași practicabili |
| Raport scurt | Draft raport scurt pentru client |
| Plan pași | Plan concret până la ședința următoare |
| Teme recurente | Identifică ce revine în multiple ședințe |

---

## Propunere Model de Date

### Câmpuri deja existente pe `clients` (sau în migrare pendingă)

```sql
-- Deja în migrarea 20260502110000_service_type_and_clinical_fields.sql
service_type           text DEFAULT 'UNDECIDED'   -- selectat din UI
service_track_status   text                        -- status curent în track
main_complaint         text                        -- prezentarea inițială
clinical_focus         text                        -- focus ales de terapeut
treatment_goals        text                        -- obiective terapeutice
treatment_plan         text                        -- planul de lucru
risk_level             text                        -- nivel risc curent
research_consent       boolean DEFAULT false       -- consimțământ pentru cercetare
```

### Câmpuri noi necesare (P1+)

```sql
-- Tabel homework_items (teme pentru acasă — CBT)
CREATE TABLE homework_items (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  appointment_id uuid REFERENCES appointments(id),
  description text NOT NULL,
  due_date date,
  completed_at timestamptz,
  therapist_notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabel dbt_diary_cards (diary card săptămânal — DBT)
CREATE TABLE dbt_diary_cards (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  week_start date NOT NULL,
  entries jsonb,              -- zile + scoruri emoționale + abilități
  target_behaviors jsonb,     -- comportamente țintă + frecvențe
  skills_used text[],
  therapist_notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabel cbt_case_formulations (formulare CBT)
CREATE TABLE cbt_case_formulations (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  presenting_problem text,
  automatic_thoughts jsonb,
  cognitive_distortions text[],
  core_beliefs text,
  behavioral_patterns text,
  triggering_situations text,
  maintenance_factors text,
  strengths text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabel safety_plans (plan de siguranță — DBT / risc)
CREATE TABLE safety_plans (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  warning_signs text,
  internal_coping text,
  social_distractions text,
  support_contacts jsonb,    -- persoane + telefoane
  professional_contacts jsonb,
  means_restriction text,
  reasons_for_living text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Propunere UI

### Service Selector în client form

Un selector nativ `<select>` poziționat înainte de câmpurile demografice (deja implementat în P0):

```
Tip serviciu principal
○ Nedecis (default)
○ Psihologie clinică
○ Psihoterapie CBT
○ Psihoterapie DBT
○ Consiliere psihologică
```

### Service Track Card în client dashboard

Componentă `ServiceTrackCard` (deja implementată în P0) — afișează:
- Badge colorat cu tipul de serviciu
- Status track curent
- Next best action contextual per tip + lifecycle

### Next best action — exemple per serviciu

| Serviciu | Lifecycle | Next action |
|----------|-----------|-------------|
| Psihologie clinică | ONBOARDING | "Completează fișa de anamneză" |
| Psihologie clinică | ACTIV | "Aplică testele selectate" |
| CBT | ONBOARDING | "Definește obiectivele terapeutice SMART" |
| CBT | ACTIV | "Actualizează tema pentru acasă" |
| DBT | ONBOARDING | "Completează evaluarea de risc" |
| DBT | ACTIV | "Verifică diary card-ul săptămânii" |
| Consiliere | ONBOARDING | "Clarifică obiectivul consilierii" |
| Consiliere | ACTIV | "Programează reevaluare după 3–5 ședințe" |

### Tabs / carduri service-specific în fișa clientului (P1+)

Carduri afișate condiționat pe baza `service_type`:

| Service type | Carduri suplimentare |
|-------------|---------------------|
| `CLINICAL_PSYCHOLOGY` | Teste psihologice, Scoruri, Raport psihologic |
| `CBT` | Obiective SMART, Formulare CBT, Teme pentru acasă, Scoruri evoluție |
| `DBT` | Nivel risc, Diary card, Comportamente țintă, Plan de siguranță |
| `COUNSELING` | Obiectiv consiliere, Resurse client, Recomandări |

### Document templates per serviciu (P1+)

| Service type | Template-uri sugerate |
|-------------|----------------------|
| `CLINICAL_PSYCHOLOGY` | Contract psihologie clinică, Fișă anamneză, Raport psihologic |
| `CBT` | Contract CBT adult/minor, Formulare CBT, Plan prevenție recădere |
| `DBT` | Contract DBT, Plan de siguranță, Diary card, Raport progres DBT |
| `COUNSELING` | Contract consiliere, Fișă obiectiv, Raport scurt progres |

---

## Propunere AI Assistant

### Principii

1. AI-ul este **assistant-only** — sugerează, structurează, extrage, propune drafturi
2. AI-ul **nu ia decizii clinice** și nu pune diagnostic automat
3. AI-ul **nu evaluează riscul** — orice zonă de risc rămâne sub control uman
4. Tot ce generează AI-ul este editabil și aprobat manual de terapeut

### Prompts contextuale per serviciu (P2+)

Sistemul va injecta automat în contextul AI-ului:
- tipul de serviciu
- statusul lifecycle
- ultimele N note clinice
- obiectivele / formularea de caz

Exemple de prompts:
```
CBT:    "Extrage gândurile automate din nota de ședință"
DBT:    "Sumarizează diary card-ul și identifică triggerii"
Clinic: "Propune structura secțiunii de concluzii pentru raportul psihologic"
Consiliere: "Generează un plan de 3 pași practicabili pentru client"
```

---

## Faze de Implementare

### P0 — Deja implementat ✅
- `service_type` câmp pe `clients` cu 6 variante (inclusiv UNDECIDED)
- Selector nativ în formularul de client
- `ServiceTrackCard` componentă reutilizabilă
- `computeServiceTrackNextAction()` — next action contextuală per tip + lifecycle
- Badge service type în header fișa clientului

### P1 — Următor (după aplicarea migrării service_type)
- Mapare documente recomandate per `service_type`
- Checklist documente lipsă în fișa clientului
- Next actions mai granulare pe baza service_track_status
- Carduri condiționat afișate pe baza service_type

### P2 — Formulare structurate
- `homework_items` — teme pentru acasă (CBT)
- `cbt_case_formulations` — formulare de caz CBT
- `dbt_diary_cards` — diary card săptămânal DBT
- `safety_plans` — plan de siguranță DBT

### P3 — Rapoarte și AI contextual
- AI prompts contextuale per service_type
- Generare draft raport psihologic
- Generare raport progres CBT/DBT
- Export date anonimizate pentru cercetare
- Dashboard funnel per service_type

---

## Relație cu Service Types Existente

Valorile `service_type` din DB (migrarea P0) mapate pe flow-uri:

| DB value | Flow |
|----------|------|
| `UNDECIDED` | Nedecis — fără flow specific |
| `INDIVIDUAL` | Poate fi CBT sau Consiliere — se rafinează |
| `MINOR_CLIENT` | Poate fi Clinică sau CBT pentru minori |
| `B2B_COMPANY` | Consiliere organizațională / training |
| `TRAINING_GROUP` | Flow grup — nu este în scope inițial |
| `SUPERVISION` | Flow supervizare — nu este în scope inițial |

> Recomandare: înlocuiește valorile `INDIVIDUAL` și `MINOR_CLIENT` cu valorile mai granulare (`CLINICAL_PSYCHOLOGY`, `CBT`, `DBT`, `COUNSELING`) în migrarea P1, sau adaugă un câmp separat `clinical_track` ca să nu rupi P0.
