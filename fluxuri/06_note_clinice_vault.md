# Flux 06 — Note Clinice Criptate + Vault PIN

## Descriere

Notele clinice sunt criptate end-to-end folosind AES-GCM 256. Cheia de criptare este derivată din PIN-ul terapeututlui pe client (browserul terapeututlui) — serverul nu vede niciodată cheia sau conținutul în clar. Vault-ul se blochează automat după 15 minute de inactivitate.

## Fișiere Cheie

- [src/app/dashboard/vault/page.tsx](../src/app/dashboard/vault/page.tsx) — pagina vault
- [src/components/vault/VaultClient.tsx](../src/components/vault/VaultClient.tsx) — UI vault
- [src/components/notes/notes-context.tsx](../src/components/notes/notes-context.tsx) — NotesVaultProvider (context global)
- [src/components/notes/note-editor.tsx](../src/components/notes/note-editor.tsx) — editor note criptate
- [src/lib/notes/](../src/lib/notes/) — criptare AES-GCM 256
- [src/app/dashboard/notes/actions.ts](../src/app/dashboard/notes/actions.ts) — Server Actions (salvare blob criptat)
- [src/app/dashboard/vault/vault-actions.ts](../src/app/dashboard/vault/vault-actions.ts) — acțiuni vault

## Diagrama Criptare (Securitate)

```mermaid
flowchart TD
    subgraph CLIENT["Browser Terapeut (Client-Side)"]
        PIN["PIN introdus de terapeut"]
        SALT["Salt unic stocat local"]
        KEY["Cheie AES-GCM 256\nderivatã din PIN + Salt\n(PBKDF2 / WebCrypto API)"]
        PLAIN["Notă în clar\n(text editat în browser)"]
        ENC["Blob criptat\n(IV + ciphertext)"]
        DEC["Notă decriptată\n(afișată în editor)"]
    end

    subgraph SERVER["Server + Supabase"]
        STORE["Blob criptat stocat\nin Supabase\n(opac pentru server)"]
        AI["AI interpret\n(poate primi blob —\nnu decriptează)"]
    end

    PIN --> KEY
    SALT --> KEY
    KEY --> |encrypt| ENC
    PLAIN --> ENC
    ENC --> STORE
    STORE --> ENC
    ENC --> |decrypt cu KEY| DEC

    style KEY fill:#ff9,stroke:#fa0
    style PLAIN fill:#cfc,stroke:#090
    style STORE fill:#eee,stroke:#999
```

## Stările Vault-ului

```mermaid
stateDiagram-v2
    [*] --> Loading : pagina vault încărcată

    Loading --> NeedsSetup : prima utilizare\n(niciun PIN configurat)
    Loading --> Locked : PIN configurat\ndar vault blocat

    NeedsSetup --> Unlocked : terapeut setează\nPIN nou (6+ cifre)

    Locked --> Unlocked : terapeut introduce\nPIN corect
    Locked --> Locked : PIN greșit\n(eroare afișată)

    Unlocked --> Locked : auto-lock după\n15 min inactivitate
    Unlocked --> Locked : terapeut apasă\n"Blochează"
    Unlocked --> NotesAccess : acces la note\ncriptate

    NeedsSetup: Configurare PIN\n(prima utilizare)
    Locked: Vault Blocat\n🔒
    Unlocked: Vault Deblocat\n🔓
    NotesAccess: Note Decriptate\nVizibile în editor
```

## Flux Complet — De la PIN la Notă

```mermaid
sequenceDiagram
    actor T as Terapeut
    participant VAULT as VaultClient UI
    participant CTX as NotesVaultProvider
    participant NOTES as Note Editor
    participant CRYPTO as WebCrypto (browser)
    participant DB as Supabase

    Note over T,DB: PRIMA UTILIZARE (Setup PIN)

    T->>VAULT: Accesează /dashboard/vault
    VAULT->>CTX: getVaultStatus()
    CTX-->>VAULT: status: needs-setup

    T->>VAULT: Introduce PIN nou (6+ cifre)
    T->>VAULT: Confirmă PIN
    VAULT->>CRYPTO: deriveKey(PIN, salt)
    CRYPTO-->>VAULT: cheie AES-GCM
    VAULT->>CTX: setKey(key), saveHashedPIN(local)
    CTX-->>VAULT: status: unlocked ✅

    Note over T,DB: UTILIZARE NORMALĂ (Unlock)

    T->>VAULT: Introduce PIN
    VAULT->>CTX: validatePIN(pin)
    CTX->>CRYPTO: deriveKey(pin, salt)
    CRYPTO-->>CTX: key AES-GCM
    CTX->>CTX: verifyCanary(key) — test decifrare
    CTX-->>VAULT: status: unlocked

    Note over T,DB: EDITARE NOTĂ CLINICĂ

    T->>NOTES: /dashboard/notes/[appointmentId]
    NOTES->>CTX: getKey()
    CTX-->>NOTES: key AES-GCM (în memorie)

    NOTES->>DB: getEncryptedNote(appointmentId)
    DB-->>NOTES: blob criptat
    NOTES->>CRYPTO: decrypt(blob, key)
    CRYPTO-->>NOTES: text în clar
    NOTES-->>T: Editor cu nota decriptată

    T->>NOTES: Editează nota
    T->>NOTES: Salvează

    NOTES->>CRYPTO: encrypt(text, key)
    CRYPTO-->>NOTES: blob criptat nou
    NOTES->>DB: saveEncryptedNote(appointmentId, blob)
    DB-->>NOTES: ✅

    Note over T,DB: AUTO-LOCK

    CTX->>CTX: timer 15 min inactivitate
    CTX->>CTX: clearKey() — ștergere cheie din memorie
    CTX-->>VAULT: status: locked
    VAULT-->>T: UI vault blocat — cerere PIN
```

## Note de Criză

```mermaid
flowchart LR
    CRISIS["Notă de criză\n(flagged în editor)"]
    ACTIONS["crisis-notes-actions.ts"]
    DB[(Supabase\nnote criză separate)]
    ALERT["Alert vizibil în\nfișa clientului"]

    CRISIS --> ACTIONS --> DB --> ALERT
```

## AI Interpret (Opțional)

```mermaid
flowchart TD
    T[Terapeut] -->|alege notă pt. interpretare| AI_UI["/dashboard/ai"]
    AI_UI -->|trimite blob criptat| API["/api/ai/interpret"]
    API -->|decriptare client-side\nsau text rezumat non-PII| OLLAMA["Ollama / Claude API"]
    OLLAMA -->|interpretare clinică| API
    API --> AI_UI
    AI_UI --> T

    style OLLAMA fill:#e8f4fd
```

## Caracteristici Securitate

| Proprietate | Implementare |
|-------------|-------------|
| Algoritm criptare | AES-GCM 256 |
| Derivare cheie | PBKDF2 din PIN + salt unic |
| Stocare cheie | Numai în memorie (nu localStorage) |
| Verificare PIN | Canary bytes — test decifrare fără a expune date |
| Auto-lock | 15 minute inactivitate (configurable) |
| Server access | Server vede doar blob opac (nu poate decripta) |
| Backup cheie | Niciun backup — PIN pierdut = date inaccesibile |
