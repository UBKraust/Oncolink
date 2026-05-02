# Catalog Teste Psihologice — Plan

**Repository:** `UBKraust/Oncolink`  
**Branch:** `Ceai-Patit`  
**Data:** 2026-05-02  
**Mod:** plan și audit, fără modificări de implementare

> **Disclaimer important:** Acest document nu face recomandări clinice și nu validează instrumentele enumerate. Fiecare test trebuie verificat independent pentru: licență, drept de administrare în România, traducere validată, etalonare și condiții de utilizare comercială. Nu includeți itemii din teste licențiate în aplicație fără confirmare scrisă de drepturi.

---

## 1. Stare actuală (audit repo)

### Ce există

#### Tabele Supabase

| Tabel | Rol | Status |
|---|---|---|
| `assessments` | Legacy — `assessment_type`, `scoring_data`, `content_summary`, `sent_to_parent_at` | Activ, deprecat gradual |
| `client_assessments` | Curent — `test_id` FK, `raw_answers`, `calculated_score`, `ai_interpretation` | Activ, principal |
| `psychological_tests` | Template-uri teste — `questions` JSONB, `scoring_logic` JSONB, `therapist_id` | Activ |

RLS activ pe toate trei tabelele, izolare per `therapist_id`.

#### Logică existentă

| Fișier | Conținut |
|---|---|
| [`src/lib/assessments/types.ts`](../src/lib/assessments/types.ts) | `Question`, `ScoringLogic`, `InterpretationBand`, `TestTemplate`, `ClientAssessment`, `CalculatedScore` |
| [`src/lib/assessments/scoringEngine.ts`](../src/lib/assessments/scoringEngine.ts) | `calculateTestScore()` — SUM și SUBSCALES, reverse scoring, interpretation bands |
| [`src/lib/assessments/seededTests.ts`](../src/lib/assessments/seededTests.ts) | PHQ-9, GAD-7, DASS-21 — seedate cu scoring complet |
| [`src/components/assessments/TestExecutionForm.tsx`](../src/components/assessments/TestExecutionForm.tsx) | Administrare test, scoring local, AI interpretare Ollama, salvare |
| [`src/components/assessments/TestBuilderForm.tsx`](../src/components/assessments/TestBuilderForm.tsx) | Constructor teste custom — subscale, reverse scoring, opțiuni |
| [`src/app/dashboard/assessments/actions.ts`](../src/app/dashboard/assessments/actions.ts) | `saveAssessmentAction` — salvare în `assessments` (legacy) |
| [`src/app/dashboard/tests/test-actions.ts`](../src/app/dashboard/tests/test-actions.ts) | `saveTestTemplate` — salvare în `psychological_tests` |
| [`src/app/dashboard/tests/page.tsx`](../src/app/dashboard/tests/page.tsx) | Catalog teste — grid cu `seededTests`, link administrare |
| [`src/app/dashboard/assessments/page.tsx`](../src/app/dashboard/assessments/page.tsx) | Registru evaluări — tabel istoric, join cu clienți |
| [`src/lib/mock/assessments.ts`](../src/lib/mock/assessments.ts) | Mock BDI (Andrei, score 14) + STAI (state 45, trait 40) |

#### Teste seedate acum

| Cod | Scor | Subscale |
|---|---|---|
| PHQ-9 | SUM 0–27 | — |
| GAD-7 | SUM 0–21 | — |
| DASS-21 | SUBSCALES | Depresie / Anxietate / Stres |

#### Ce lipsește pentru catalog real

- Metadata extinsă per test (licență, durată, vârstă, track, frecvență)
- Categorizare și filtrare în UI (`/dashboard/tests`)
- Formulare interne CBT/DBT (Diary Card, Jurnal gânduri automate etc.)
- T0/T1/T2 tracking și comparare scoruri în timp
- Instrucțiuni de administrare și interpretare per test
- Export anonim pentru research
- Zona pentru minori / adolescenți

### Legătura actuală cu dashboard-ul

Refactorul dashboard-ului a introdus deja o primă zonă de integrare prin `AssessmentTasksPanel`, dar într-o formă intenționat conservatoare:

- folosește tabela `assessments` existentă, nu `client_assessments`
- poate afișa:
  - rapoarte lunare nesendate
  - evaluări recente fără `content_summary`
  - clienți fără evaluare inițială, când se poate deduce sigur
- nu implementează încă:
  - T0 / T1 / T2 tracking real
  - comparații longitudinale
  - scoring complex
  - integrare completă cu Research Hub

Concluzie: dashboard-ul este pregătit să consume catalogul de teste, dar nu trebuie considerat încă integrat complet cu arhitectura finală de assessments.

---

## 2. Structură metadata recomandată per test

```typescript
interface TestCatalogEntry {
  code: string;                // "GAD7"
  name: string;                // "GAD-7"
  fullName: string;            // "Generalized Anxiety Disorder Scale"
  category: TestCategory;
  serviceTracks: ServiceTrack[];
  ageGroup: "adult" | "adolescent" | "child" | "all";
  administrationType: "self_report" | "clinician_administered" | "structured_interview" | "internal_form";
  estimatedDurationMinutes: number;
  scoringMode: "SUM" | "SUBSCALES" | "CLINICIAN_SCORED" | "STRUCTURED";
  licenseStatus: "OPEN_VERIFY" | "LICENSED" | "INTERNAL_FORM" | "RESEARCH_ONLY";
  recommendedFrequency: ("T0" | "T1" | "T2" | "SESSION" | "AS_NEEDED")[];
  researchUse: boolean;
  inRepoAlready: boolean;      // seeded sau mock prezent
  notes: string;
}
```

### Categorii catalog

```
SCREENING_RAPID
DEPRESIE
ANXIETATE
STRES_WELLBEING
CBT
DBT
RISC_CRIZA
COPII_ADOLESCENTI
PERSONALITATE_CLINIC_AVANSAT
RESEARCH_DOCTORAT
FORMULARE_INTERNE
```

### Service tracks

```
CLINICAL_PSYCHOLOGY
CBT
DBT
COUNSELING
MINOR
RESEARCH
```

---

## 3. Catalog complet propus

### Licență — legende

| Status | Înțeles |
|---|---|
| `OPEN_VERIFY` | Posibil liber de folosit, dar necesită verificare înainte de producție |
| `LICENSED` | Instrument licențiat — nu se implementează fără drept de utilizare confirmat |
| `INTERNAL_FORM` | Formular intern construit în ERP, fără nici un risc de licență |
| `RESEARCH_ONLY` | Util pentru export anonim / doctorat, nu workflow clinic |

---

### 3.1 Pachet CORE — screening și monitorizare progres

Acestea sunt baza ERP-ului clinic. Pot fi administrate repetat T0/T1/T2, sunt potrivite pentru toate flow-urile și cele trei sunt deja în repo.

---

#### PHQ-9 — Patient Health Questionnaire

```
code:              PHQ9
name:              PHQ-9
fullName:          Patient Health Questionnaire - 9
category:          DEPRESIE / SCREENING_RAPID
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT, COUNSELING, RESEARCH
ageGroup:          adult (variantă adolescenți: PHQ-A)
administrationType: self_report
duration:          2–3 min
scoringMode:       SUM (0–27)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            true (seededTests.ts)
notes:             Instrument de referință pentru screening depresie. Versiunea pentru
                   adolescenți PHQ-A necesită verificare separată.
```

**Prioritate:** maximă.

---

#### GAD-7 — Generalized Anxiety Disorder Scale

```
code:              GAD7
name:              GAD-7
fullName:          Generalized Anxiety Disorder Scale - 7
category:          ANXIETATE / SCREENING_RAPID
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT, COUNSELING, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          2–3 min
scoringMode:       SUM (0–21)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            true (seededTests.ts)
notes:             Pereche naturală cu PHQ-9. Împreună acoperă depresie + anxietate
                   în ~5 minute.
```

**Prioritate:** maximă.

---

#### DASS-21 — Depression Anxiety Stress Scales

```
code:              DASS21
name:              DASS-21
fullName:          Depression Anxiety and Stress Scales - 21
category:          DEPRESIE / ANXIETATE / STRES_WELLBEING
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT, DBT, COUNSELING, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          5–7 min
scoringMode:       SUBSCALES (Depresie / Anxietate / Stres)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            true (seededTests.ts)
notes:             Instrument gratuit cu versiune românească de verificat.
                   Acoperă trei dimensiuni simultan — optim pentru T0.
```

**Prioritate:** maximă.

---

#### PSS-10 — Perceived Stress Scale

```
code:              PSS10
name:              PSS-10
fullName:          Perceived Stress Scale - 10
category:          STRES_WELLBEING
serviceTracks:     CBT, COUNSELING, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          3–4 min
scoringMode:       SUM (0–40)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Bun pentru stres perceput în consiliere și CBT.
                   Versiunile PSS-4 și PSS-10 sunt publice, PSS-14 la fel.
```

**Prioritate:** mare.

---

#### WHO-5 Well-Being Index

```
code:              WHO5
name:              WHO-5
fullName:          WHO Well-Being Index - 5
category:          STRES_WELLBEING
serviceTracks:     CBT, DBT, COUNSELING, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          1–2 min
scoringMode:       SUM (0–25, convertit la 0–100%)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2, SESSION
researchUse:       true
inRepo:            false
notes:             Foarte scurt. Excelent pentru monitoring progres ședință-cu-ședință.
                   Disponibil în zeci de limbi prin WHO, verificați termenii WHO.
```

**Prioritate:** mare.

---

### 3.2 Anxietate specifică

#### BAI — Beck Anxiety Inventory

```
code:              BAI
name:              BAI
fullName:          Beck Anxiety Inventory
category:          ANXIETATE
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT
ageGroup:          adult
administrationType: self_report
duration:          5–10 min
scoringMode:       SUM (0–63)
licenseStatus:     LICENSED
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Licențiat Pearson. Nu se implementează itemi/scoring fără
                   contract formal de utilizare.
```

**Prioritate:** mare clinic, dar blocat pe licență.

---

#### SPIN — Social Phobia Inventory

```
code:              SPIN
name:              SPIN
fullName:          Social Phobia Inventory
category:          ANXIETATE
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT
ageGroup:          adult
administrationType: self_report
duration:          5–7 min
scoringMode:       SUM (0–68)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Bun pentru anxietate socială. De verificat condițiile de utilizare.
```

**Prioritate:** mare pentru cazuri de anxietate socială.

---

#### PSWQ — Penn State Worry Questionnaire

```
code:              PSWQ
name:              PSWQ
fullName:          Penn State Worry Questionnaire
category:          ANXIETATE
serviceTracks:     CBT, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          5 min
scoringMode:       SUM (16–80)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Specific pentru îngrijorare excesivă / TAG. Bun pentru cercetare.
```

**Prioritate:** medie-mare.

---

### 3.3 Depresie suplimentară

#### BDI-II — Beck Depression Inventory

```
code:              BDI2
name:              BDI-II
fullName:          Beck Depression Inventory - II
category:          DEPRESIE
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT
ageGroup:          adult (BDI-Y pentru copii)
administrationType: self_report
duration:          5–10 min
scoringMode:       SUM (0–63)
licenseStatus:     LICENSED
frequency:         T0, T1, T2
researchUse:       true
inRepo:            mock (assessments.ts — BDI simplu, nu BDI-II)
notes:             Licențiat Pearson. Există mock în repo cu cod BDI, dar itemii
                   reali și scoring-ul oficial nu pot fi incluși fără drept.
```

**Prioritate:** mare clinic, blocat pe licență.

---

### 3.4 Stres și funcționare

#### WHODAS 2.0

```
code:              WHODAS20
name:              WHODAS 2.0
fullName:          World Health Organization Disability Assessment Schedule 2.0
category:          STRES_WELLBEING
serviceTracks:     CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          adult
administrationType: self_report / clinician_administered
duration:          5–20 min (versiunile 12 și 36 itemi)
scoringMode:       SUBSCALES
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1
researchUse:       true
inRepo:            false
notes:             WHO, gratuit. Bun pentru rapoarte de funcționare și impact.
                   Util în psihologie clinică cu scop de raportare.
```

**Prioritate:** medie-mare pentru psihologie clinică.

---

### 3.5 Anxietate cu etalonare veche

#### STAI — State-Trait Anxiety Inventory

```
code:              STAI
name:              STAI
fullName:          State-Trait Anxiety Inventory
category:          ANXIETATE
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          10–20 min
scoringMode:       SUBSCALES (state / trait)
licenseStatus:     LICENSED
frequency:         T0, T1
researchUse:       true
inRepo:            mock (assessments.ts — state 45, trait 40)
notes:             Licențiat Mind Garden. Există mock în repo, dar scoring oficial
                   și itemii nu pot fi incluși fără licență.
```

**Prioritate:** mare clinic, blocat pe licență.

---

### 3.6 Screening clinic general (psihologie clinică)

#### SCL-90-R / BSI

```
code:              SCL90R
name:              SCL-90-R / BSI
fullName:          Symptom Checklist 90 Revised / Brief Symptom Inventory
category:          PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          10–15 min (SCL-90-R), 5–8 min (BSI)
scoringMode:       SUBSCALES (9 dimensiuni + indici globali)
licenseStatus:     LICENSED
frequency:         T0, T1
researchUse:       true
inRepo:            false
notes:             Pearson. Screening larg al simptomatologiei. Nu se implementează
                   fără drept. Util dacă terapeuta face evaluări extinse.
```

**Prioritate:** mare dacă evaluarea clinică e frecventă.

---

#### PID-5 — Personality Inventory for DSM-5

```
code:              PID5
name:              PID-5
fullName:          Personality Inventory for DSM-5
category:          PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          25–35 min
scoringMode:       SUBSCALES (25 faceleti + 5 domenii)
licenseStatus:     OPEN_VERIFY
frequency:         T0
researchUse:       true
inRepo:            false
notes:             APA, posibil disponibil gratuit pentru uz clinic. De verificat
                   condițiile APA. Util pentru profil de personalitate DSM-5.
```

**Prioritate:** mare pentru cercetare / evaluare personalitate.

---

#### MMPI-2 / MMPI-2-RF

```
code:              MMPI2
name:              MMPI-2 / MMPI-2-RF
fullName:          Minnesota Multiphasic Personality Inventory
category:          PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     CLINICAL_PSYCHOLOGY
ageGroup:          adult
administrationType: clinician_administered
duration:          60–90 min
scoringMode:       CLINICIAN_SCORED
licenseStatus:     LICENSED
frequency:         T0
researchUse:       false
inRepo:            false
notes:             Pearson. Training necesar. Scoring oficial obligatoriu. Nu se
                   integrează direct în ERP fără contract formal și sistem de scoring.
```

**Prioritate:** mare clinic, integrare directă MVP exclusă.

---

#### MINI / SCID-5

```
code:              MINI / SCID5
name:              MINI / SCID-5
fullName:          Mini International Neuropsychiatric Interview / SCID-5
category:          PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     CLINICAL_PSYCHOLOGY
ageGroup:          adult
administrationType: structured_interview
duration:          15–45 min
scoringMode:       STRUCTURED
licenseStatus:     LICENSED
frequency:         T0
researchUse:       true
inRepo:            false
notes:             Nu sunt chestionare simple. Mai degrabă template ghidat / checklist
                   profesional de interviu. Integrare ca formular structurat intern,
                   nu ca test cu scoring automat.
```

**Prioritate:** medie — util ca checklist structurat, nu ca test standard.

---

### 3.7 CBT specific

#### OCI-R — Obsessive Compulsive Inventory Revised

```
code:              OCIR
name:              OCI-R
fullName:          Obsessive Compulsive Inventory - Revised
category:          ANXIETATE / CBT
serviceTracks:     CBT, CLINICAL_PSYCHOLOGY
ageGroup:          adult
administrationType: self_report
duration:          5 min
scoringMode:       SUBSCALES
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             De verificat condițiile de utilizare.
```

**Prioritate:** medie-mare.

---

#### Y-BOCS — Yale-Brown Obsessive Compulsive Scale

```
code:              YBOCS
name:              Y-BOCS
fullName:          Yale-Brown Obsessive Compulsive Scale
category:          CBT / PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     CBT, CLINICAL_PSYCHOLOGY
ageGroup:          adult
administrationType: clinician_administered
duration:          10–15 min
scoringMode:       CLINICIAN_SCORED
licenseStatus:     LICENSED
frequency:         T0, T1
researchUse:       true
inRepo:            false
notes:             Instrument clinic pentru severitate OCD. De tratat ca instrument
                   clinician-administrat, nu simplu quiz.
```

**Prioritate:** medie.

---

#### ATQ — Automatic Thoughts Questionnaire

```
code:              ATQ
name:              ATQ
fullName:          Automatic Thoughts Questionnaire
category:          CBT
serviceTracks:     CBT, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          5–7 min
scoringMode:       SUM
licenseStatus:     LICENSED
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Relevant pentru CBT — gânduri automate negative. Verificare
                   drepturi obligatorie înainte de implementare.
```

**Prioritate:** mare ca direcție, dar verificare licență.

---

#### LSAS — Liebowitz Social Anxiety Scale

```
code:              LSAS
name:              LSAS
fullName:          Liebowitz Social Anxiety Scale
category:          ANXIETATE / CBT
serviceTracks:     CBT, CLINICAL_PSYCHOLOGY
ageGroup:          adult
administrationType: clinician_administered / self_report
duration:          10 min
scoringMode:       SUBSCALES (frică + evitare)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Pentru anxietate socială severă. Versiune self-report LSAS-SR
                   de verificat.
```

**Prioritate:** medie.

---

#### BADS — Behavioral Activation for Depression Scale

```
code:              BADS
name:              BADS
fullName:          Behavioral Activation for Depression Scale
category:          CBT / DEPRESIE
serviceTracks:     CBT
ageGroup:          adult
administrationType: self_report
duration:          5 min
scoringMode:       SUBSCALES
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Specific pentru activare comportamentală în CBT.
```

**Prioritate:** medie.

---

#### CORE-OM / ORS / SRS — Monitorizare proces terapeutic

```
code:              ORS / SRS
name:              ORS — Outcome Rating Scale / SRS — Session Rating Scale
fullName:          ORS + SRS (Partners for Change Outcome Management System)
category:          SCREENING_RAPID / CBT
serviceTracks:     CBT, COUNSELING
ageGroup:          adult
administrationType: self_report
duration:          1 min (fiecare)
scoringMode:       SUM (scale vizuale)
licenseStatus:     LICENSED
frequency:         SESSION
researchUse:       true
inRepo:            false
notes:             ORS — progres per ședință. SRS — alianță terapeutică.
                   Extrem de scurte și utile pentru monitoring proces.
                   Verificare condiții de utilizare Partners for Change.
```

**Prioritate:** mare — ideal pentru consiliere și CBT.

---

### 3.8 DBT specific

#### DERS — Difficulties in Emotion Regulation Scale

```
code:              DERS
name:              DERS
fullName:          Difficulties in Emotion Regulation Scale
category:          DBT / STRES_WELLBEING
serviceTracks:     DBT, CBT, RESEARCH
ageGroup:          adult (DERS-16 versiune scurtă)
administrationType: self_report
duration:          5–10 min
scoringMode:       SUBSCALES
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             De referință pentru DBT. Măsoară dificultăți de reglare emoțională
                   pe 6 dimensiuni. Versiunea scurtă DERS-16 la fel de bună.
```

**Prioritate:** foarte mare pentru DBT.

---

#### BSL-23 — Borderline Symptom List

```
code:              BSL23
name:              BSL-23
fullName:          Borderline Symptom List - 23
category:          DBT
serviceTracks:     DBT, CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          5 min
scoringMode:       SUM + subscale comportament
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Relevant pentru simptomatologie BPD în context DBT.
                   De verificat condițiile de utilizare.
```

**Prioritate:** medie-mare dacă DBT e direcție importantă.

---

#### ERQ — Emotion Regulation Questionnaire

```
code:              ERQ
name:              ERQ
fullName:          Emotion Regulation Questionnaire
category:          DBT / CBT
serviceTracks:     DBT, CBT, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          3 min
scoringMode:       SUBSCALES (reappraisal / suppression)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Scurt și bun pentru reglare emoțională. De verificat.
```

**Prioritate:** medie.

---

#### DES-II — Dissociative Experiences Scale

```
code:              DES2
name:              DES-II
fullName:          Dissociative Experiences Scale - II
category:          DBT / PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     DBT, CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          10 min
scoringMode:       SUM
licenseStatus:     OPEN_VERIFY
frequency:         T0
researchUse:       true
inRepo:            false
notes:             Pentru simptome disociative. Util în cazuri specifice.
```

**Prioritate:** medie — cazuri specifice.

---

#### C-SSRS — Columbia Suicide Severity Rating Scale

```
code:              CSSRS
name:              C-SSRS
fullName:          Columbia Suicide Severity Rating Scale
category:          RISC_CRIZA
serviceTracks:     DBT, CLINICAL_PSYCHOLOGY
ageGroup:          adult, adolescent
administrationType: clinician_administered
duration:          5–10 min
scoringMode:       CLINICIAN_SCORED
licenseStatus:     OPEN_VERIFY
frequency:         AS_NEEDED
researchUse:       false
inRepo:            false
notes:             FOARTE SENSIBIL. Trebuie flow clinic separat, audit log complet,
                   validare terapeut obligatorie. Zero AI pe scoring sau interpretare.
                   Zero date în export anonim. Implementare separată de restul catalogului.
```

**Prioritate:** mare pentru DBT, dar implementare cu tratament special și strict.

---

### 3.9 Copii și adolescenți

#### SDQ — Strengths and Difficulties Questionnaire

```
code:              SDQ
name:              SDQ
fullName:          Strengths and Difficulties Questionnaire
category:          COPII_ADOLESCENTI
serviceTracks:     CLINICAL_PSYCHOLOGY, COUNSELING, CBT, RESEARCH
ageGroup:          child (4–10), adolescent (11–17)
administrationType: self_report (adolescent) / parent_report / teacher_report
duration:          5 min
scoringMode:       SUBSCALES (5 subscale + impact)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Instrument de referință pentru screening copii/adolescenți.
                   Disponibil gratuit pe sdqinfo.org, cu restricții de utilizare comercială
                   ce trebuie verificate.
```

**Prioritate:** foarte mare pentru cazuri cu minori.

---

#### RCADS — Revised Children's Anxiety and Depression Scale

```
code:              RCADS
name:              RCADS
fullName:          Revised Children's Anxiety and Depression Scale
category:          COPII_ADOLESCENTI / ANXIETATE / DEPRESIE
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT, RESEARCH
ageGroup:          child (6+), adolescent
administrationType: self_report + parent_report
duration:          10–15 min
scoringMode:       SUBSCALES
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             De referință pentru anxietate și depresie copii. Versiune
                   și pentru părinți. De verificat condițiile UCLA.
```

**Prioritate:** mare pentru cazuri cu minori.

---

#### SCARED

```
code:              SCARED
name:              SCARED
fullName:          Screen for Child Anxiety Related Disorders
category:          COPII_ADOLESCENTI / ANXIETATE
serviceTracks:     CBT, CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          child (8+), adolescent
administrationType: self_report + parent_report
duration:          10 min
scoringMode:       SUBSCALES
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Instrument gratuit. Disponibil pentru uz clinic și cercetare.
                   De verificat traducerea în română.
```

**Prioritate:** mare.

---

#### CDI-2 — Children's Depression Inventory

```
code:              CDI2
name:              CDI-2
fullName:          Children's Depression Inventory - 2
category:          COPII_ADOLESCENTI / DEPRESIE
serviceTracks:     CLINICAL_PSYCHOLOGY, CBT
ageGroup:          child (7+), adolescent
administrationType: self_report
duration:          10–15 min
scoringMode:       SUBSCALES
licenseStatus:     LICENSED
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Pearson. Licențiat. Nu se implementează fără drept.
```

**Prioritate:** mare clinic, blocat pe licență.

---

#### CBCL / YSR

```
code:              CBCL / YSR
name:              CBCL — Child Behavior Checklist / YSR — Youth Self Report
fullName:          Achenbach System of Empirically Based Assessment
category:          COPII_ADOLESCENTI / PERSONALITATE_CLINIC_AVANSAT
serviceTracks:     CLINICAL_PSYCHOLOGY, RESEARCH
ageGroup:          child (6–18), adolescent
administrationType: parent_report (CBCL) / self_report (YSR)
duration:          15–20 min
scoringMode:       SUBSCALES (8 sindrom + broadband)
licenseStatus:     LICENSED
frequency:         T0, T1
researchUse:       true
inRepo:            false
notes:             ASEBA. Licențiat. Scoring oficial prin software ASEBA.
                   Nu se integrează direct fără contract.
```

**Prioritate:** mare clinic, integrare directă exclusă.

---

### 3.10 Wellbeing și coping (consiliere)

#### SWLS — Satisfaction With Life Scale

```
code:              SWLS
name:              SWLS
fullName:          Satisfaction With Life Scale
category:          STRES_WELLBEING
serviceTracks:     COUNSELING, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          1–2 min
scoringMode:       SUM (5–35)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2
researchUse:       true
inRepo:            false
notes:             Scurt și util pentru satisfacție față de viață. De verificat
                   condițiile DIENER lab.
```

**Prioritate:** medie.

---

#### Brief COPE

```
code:              BRIEFCOPE
name:              Brief COPE
fullName:          Brief COPE
category:          STRES_WELLBEING / CBT
serviceTracks:     CBT, COUNSELING, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          5–8 min
scoringMode:       SUBSCALES (14 subscale, 28 itemi)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1
researchUse:       true
inRepo:            false
notes:             Strategii de coping. Bun pentru research și consiliere.
```

**Prioritate:** medie-mare.

---

#### PANAS — Positive and Negative Affect Schedule

```
code:              PANAS
name:              PANAS
fullName:          Positive and Negative Affect Schedule
category:          STRES_WELLBEING / DBT
serviceTracks:     DBT, CBT, RESEARCH
ageGroup:          adult
administrationType: self_report
duration:          2–3 min
scoringMode:       SUBSCALES (PA / NA)
licenseStatus:     OPEN_VERIFY
frequency:         T0, T1, T2, SESSION
researchUse:       true
inRepo:            false
notes:             Scurt, bun pentru monitorizare afect pozitiv/negativ.
```

**Prioritate:** medie.

---

### 3.11 Formulare interne — fără risc de licență

Acestea se construiesc direct în ERP cu `TestBuilderForm` și nu copiază conținut licențiat. Sunt **cele mai valoroase pentru MVP** pentru că sunt imediat legale și utile clinic.

#### Diary Card DBT

```
code:              DBT_DIARY_CARD
name:              Diary Card DBT
category:          DBT / FORMULARE_INTERNE
serviceTracks:     DBT
ageGroup:          adult, adolescent
administrationType: self_report
duration:          2–5 min
scoringMode:       INTERNAL_FORM (nu sum standardizat)
licenseStatus:     INTERNAL_FORM
frequency:         SESSION sau DAILY
researchUse:       true (agregat anonim)
inRepo:            false
structurăPropusă:
  - emoții dominante pe zi (intensitate 0–10)
  - impulsuri (tip + intensitate)
  - comportamente țintă (da/nu)
  - abilități DBT folosite (checkbox TIPP / DEAR MAN / GIVE / FAST etc.)
  - risc suicidar / autoagresiv (flag separat cu audit log)
  - notă scurtă
notes:             Componentă centrală pentru DBT. Nu copiază nici un instrument
                   licențiat. Se poate construi direct cu TestBuilderForm.
```

**Prioritate:** maximă pentru DBT.

---

#### Jurnal gânduri automate CBT

```
code:              CBT_THOUGHT_JOURNAL
name:              Jurnal gânduri automate CBT
category:          CBT / FORMULARE_INTERNE
serviceTracks:     CBT
licenseStatus:     INTERNAL_FORM
frequency:         SESSION, AS_NEEDED
structurăPropusă:
  - situația (text scurt)
  - emoția (intensitate 0–10)
  - gândul automat (text)
  - distorsiunea identificată (dropdown — generalizare, catastrofizare, etc.)
  - gândul alternativ (text)
  - emoția după restructurare (0–10)
notes:             Standard CBT. Fără licență. Poate fi construit cu TestBuilderForm
                   sau ca formular dedicat.
```

**Prioritate:** maximă pentru CBT.

---

#### Fișă obiective terapeutice

```
code:              THERAPY_GOALS
name:              Fișă obiective terapeutice
category:          FORMULARE_INTERNE
serviceTracks:     CBT, DBT, COUNSELING, CLINICAL_PSYCHOLOGY
licenseStatus:     INTERNAL_FORM
frequency:         T0, revizie la T1/T2
structurăPropusă:
  - obiectiv principal (text)
  - obiective secundare (listă)
  - indicatori de progres
  - termen estimat
  - status obiectiv (în lucru / atins / reformulat)
notes:             Fundament pentru orice approach terapeutic.
```

**Prioritate:** maximă.

---

#### Formulare de caz CBT

```
code:              CBT_CASE_FORMULATION
name:              Formulare de caz CBT
category:          CBT / FORMULARE_INTERNE
serviceTracks:     CBT
licenseStatus:     INTERNAL_FORM
frequency:         T0
structurăPropusă:
  - precipitanți actuali
  - comportamente de evitare
  - gânduri automate frecvente
  - credințe de bază
  - mecanisme compensatorii
  - model cognitiv (text structurat)
notes:             Nu copiază un instrument licențiat. Standard de formulare CBT.
```

**Prioritate:** mare.

---

#### Plan de siguranță DBT / crize

```
code:              SAFETY_PLAN
name:              Plan de siguranță
category:          RISC_CRIZA / FORMULARE_INTERNE
serviceTracks:     DBT, CLINICAL_PSYCHOLOGY
licenseStatus:     INTERNAL_FORM
frequency:         T0, AS_NEEDED (actualizat periodic)
structurăPropusă:
  - semne de avertizare personale
  - strategii de coping intern
  - persoane de contact (cu număr de telefon)
  - număr de urgență (112, linie de criză)
  - motivele de trăit
  - persoana de contact terapeut
notes:             NU se generează automat. Completat de terapeut cu/pentru client.
                   Audit log. Criptat. Zero AI.
```

**Prioritate:** maximă pentru DBT și psihologie clinică.

---

#### Fișă prevenție recădere

```
code:              RELAPSE_PREVENTION
name:              Fișă prevenție recădere
category:          CBT / DBT / FORMULARE_INTERNE
serviceTracks:     CBT, DBT
licenseStatus:     INTERNAL_FORM
frequency:         End of therapy
structurăPropusă:
  - trigger-i identificați
  - semne timpurii de recădere
  - plan de acțiune
  - resurse de suport
  - contact terapeut pentru booster session
notes:             Standard end-of-therapy. Fără licență.
```

**Prioritate:** medie-mare.

---

#### Fișă teme pentru acasă CBT

```
code:              CBT_HOMEWORK
name:              Fișă teme pentru acasă
category:          CBT / FORMULARE_INTERNE
serviceTracks:     CBT
licenseStatus:     INTERNAL_FORM
frequency:         SESSION
structurăPropusă:
  - tema (text)
  - scop terapeutic
  - instrucțiuni
  - feedback client (completat înainte de ședință)
notes:             Simple, utile, zero licență.
```

**Prioritate:** mare.

---

## 4. Catalog recomandat MVP

### Raft 1 — gata de implementat, fără blocaje legale

| Cod | Instrument | Tip |
|---|---|---|
| PHQ9 | PHQ-9 | Seeded — gata |
| GAD7 | GAD-7 | Seeded — gata |
| DASS21 | DASS-21 | Seeded — gata |
| PSS10 | PSS-10 | De adăugat în seededTests |
| WHO5 | WHO-5 | De adăugat în seededTests |
| SDQ | SDQ | De adăugat în seededTests (versiune adulți/minori) |
| RCADS | RCADS | De adăugat în seededTests |
| SCARED | SCARED | De adăugat în seededTests |
| DERS | DERS | De adăugat în seededTests |
| DBT_DIARY_CARD | Diary Card DBT | Formular intern — TestBuilderForm |
| CBT_THOUGHT_JOURNAL | Jurnal gânduri automate | Formular intern — TestBuilderForm |
| THERAPY_GOALS | Fișă obiective terapeutice | Formular intern — TestBuilderForm |
| CBT_CASE_FORMULATION | Formular de caz CBT | Formular intern — TestBuilderForm |
| SAFETY_PLAN | Plan de siguranță | Formular special — flux separat |
| CBT_HOMEWORK | Fișă teme | Formular intern — TestBuilderForm |
| RELAPSE_PREVENTION | Fișă prevenție recădere | Formular intern — TestBuilderForm |

### Raft 2 — utile, verificare licență obligatorie

| Cod | Instrument | Blocat pe |
|---|---|---|
| BDI2 | BDI-II | Pearson |
| BAI | BAI | Pearson |
| STAI | STAI | Mind Garden |
| SCL90R | SCL-90-R / BSI | Pearson |
| ORS | ORS | Partners for Change |
| SRS | SRS | Partners for Change |
| CBCL | CBCL / YSR | ASEBA |
| CDI2 | CDI-2 | Pearson |
| ATQ | ATQ | De verificat |
| YBOCS | Y-BOCS | De verificat |

### Raft 3 — clinic avansat, faza ulterioară

| Cod | Instrument | Note |
|---|---|---|
| MMPI2 | MMPI-2 / MMPI-2-RF | Training + contract Pearson |
| MCMI4 | MCMI-IV | Training + contract |
| SCID5 | SCID-5 | Template interviu structurat |
| MINI | MINI | Template interviu structurat |
| CSSRS | C-SSRS | Flux special, zero AI, audit complet |
| BSL23 | BSL-23 | Verificare condiții |
| DES2 | DES-II | Verificare condiții |
| PID5 | PID-5 | Verificare condiții APA |

---

## 5. Reguli obligatorii de implementare

1. **Nu includeți itemii din teste licențiate** în `seededTests.ts` sau în baza de date fără confirmare scrisă de drepturi.
2. **Nu implementați scoring automat** pentru teste proprietare fără verificare oficială a algoritmului.
3. **Separați testele clinice de formularele interne** vizual și în metadata — utilizatorul trebuie să știe ce e standardizat și ce e formular intern.
4. **AI poate ajuta la sumarizare preliminară**, dar nu produce diagnostic automat și nu scorează teste clinice proprietare.
5. **Plan de siguranță și C-SSRS** necesită flux complet separat: audit log, criptare, validare terapeut, zero export anonim, zero AI pe conținut.
6. **Exportul pentru research** trebuie să fie anonim implicit — `client_id` înlocuit cu hash anonim în orice export extern.
7. **Datele pentru minori** necesită tratament separat: `sent_to_parent_at`, consent explicit, vizibilitate restricționată.

---

## 6. Propunere faze de implementare

### P0 — Catalog metadata + formulare interne

- Extinde `seededTests.ts` cu câmpuri metadata: `licenseStatus`, `serviceTracks`, `ageGroup`, `estimatedDuration`, `recommendedFrequency`
- Construiește Diary Card DBT ca formular intern în TestBuilderForm
- Construiește Jurnal gânduri automate CBT
- Construiește Fișă obiective terapeutice
- Actualizează `/dashboard/tests` cu categorii și filtre
- Marchează vizual licenseStatus pe fiecare test din catalog

### P1 — Screening scurt și scoring simplu

- Adaugă PSS-10, WHO-5 în seededTests (verificare licență)
- Adaugă SDQ, RCADS, SCARED (verificare licență)
- Adaugă DERS (verificare licență)
- Scoring automat funcțional pentru toate testele OPEN_VERIFY noi

### P2 — T0/T1/T2 tracking

- UI pentru comparare scoruri în timp (grafic evoluție)
- Recomandare frecvență per test (T0 / T1 la 4 ședințe / T2 la 8 ședințe)
- Notificare sau reminder pentru administrare periodică
- Vizualizare în fișa clientului: scor curent vs. scor anterior

### P3 — Rapoarte și export anonim

- Export CSV/JSON anonim cu `client_hash`, date, scoruri
- Raport de progres per client (agregat scoruri T0/T1/T2)
- Sumar periodic lunar cu distribuție scoruri

### P4 — Instrumente licențiate după verificare

- Adaugă BDI-II, STAI, BAI, SCL-90-R după confirmare licențe
- Metadata `licenseStatus: LICENSED` + avertisment în UI
- Itemii nu se afișează până la confirmare

### P5 — AI assistant pe scoring și sumarizare

- Sumarizare AI a evoluției scorurilor în timp (nu diagnostic)
- Sugestii de reevaluare bazate pe scor și frecvență
- Interpretare preliminară editabilă de terapeut înainte de salvare
- Zero AI pe planuri de siguranță, C-SSRS, crize

---

## 7. Propunere grupare UI în `/dashboard/tests`

```
Screening rapid
  PHQ-9 | GAD-7 | DASS-21 | WHO-5 | PSS-10

Depresie
  PHQ-9 | BDI-II* | DASS-21

Anxietate
  GAD-7 | BAI* | SPIN | PSWQ | LSAS | OCI-R | SCARED

Stres & wellbeing
  PSS-10 | WHO-5 | SWLS | PANAS | Brief COPE | WHODAS 2.0

CBT
  ATQ* | BADS | OCI-R | Y-BOCS* | Jurnal gânduri (intern) | Fișă obiective (intern) | Formular de caz (intern) | Fișă teme (intern)

DBT
  DERS | BSL-23 | ERQ | DES-II | Diary Card (intern) | Plan de siguranță (intern) | Fișă prevenție recădere (intern)

Risc & criză
  C-SSRS ⚠ | Plan de siguranță ⚠ (flux special)

Copii & adolescenți
  SDQ | RCADS | SCARED | CDI-2* | CBCL* | YSR*

Personalitate / clinic avansat
  PID-5 | SCL-90-R* | MMPI-2* | MCMI-IV* | SCID-5* | MINI*

Formulare interne
  (toate fără *)

* = licență de verificat / LICENSED
⚠ = flux special, acces restricționat
```

---

## 8. Card test propus pentru UI

```
┌──────────────────────────────────────────────┐
│  GAD-7                              [Anxietate]│
│  Generalized Anxiety Disorder Scale - 7        │
│                                                │
│  ⏱ 2–3 min   👤 Adult   📊 SUM 0–21           │
│  🔄 T0, T1, T2   🔬 Research                  │
│  🏷 CBT · Consiliere · Psihologie clinică      │
│                                                │
│  Licență: ✓ Open / de verificat               │
│                                                │
│           [Administrează]  [Detalii]           │
└──────────────────────────────────────────────┘
```

---

## 9. Ce să NU facem

- Nu includem itemii din instrumente licențiate în aplicație fără drept confirmat
- Nu facem scoring automat pentru teste proprietare fără algoritmul oficial verificat
- Nu amestecăm testele clinice standardizate cu formularele interne fără indicație vizuală clară
- Nu generăm diagnostic automat cu AI pe baza scorurilor
- Nu punem concluzii de tip „AI sugerează diagnostic X" în UI
- Nu expunem datele din planuri de siguranță sau C-SSRS în export anonim sau AI
- Nu administrăm C-SSRS ca test self-report standard — este instrument clinician-administrat
