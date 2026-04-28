"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  deriveNoteKey,
  generateSalt,
  makeCanary,
  saltFromBase64,
  saltToBase64,
  verifyCanary,
} from "@/lib/crypto/notes";
import {
  clearPinState,
  readPinState,
  writePinState,
} from "@/lib/notes/pin-storage";

type VaultStatus = "loading" | "needs-setup" | "locked" | "unlocked";

interface NotesVaultValue {
  status: VaultStatus;
  key: CryptoKey | null;
  unlock: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  setup: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  lock: () => void;
  reset: () => void;
}

const NotesVaultContext = createContext<NotesVaultValue | null>(null);

const AUTO_LOCK_MS = 15 * 60 * 1000;

export function NotesVaultProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>(() => {
    if (typeof window === "undefined") {
      return "loading";
    }
    return readPinState() ? "locked" : "needs-setup";
  });
  const [key, setKey] = useState<CryptoKey | null>(null);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (autoLockTimer.current) {
      clearTimeout(autoLockTimer.current);
      autoLockTimer.current = null;
    }
  };

  const lock = useCallback(() => {
    clearTimer();
    setKey(null);
    setStatus((prev) => (prev === "needs-setup" ? prev : "locked"));
  }, []);

  useEffect(() => {
    if (!key) return;
    const bump = () => {
      clearTimer();
      autoLockTimer.current = setTimeout(lock, AUTO_LOCK_MS);
    };
    bump();
    const events = ["mousemove", "keydown", "click", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, bump));
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearTimer();
    };
  }, [key, lock]);

  const setup = useCallback(async (pin: string) => {
    if (pin.length < 4) return { ok: false, error: "PIN minim 4 caractere." };
    try {
      const salt = generateSalt();
      const derived = await deriveNoteKey(pin, salt);
      const canary = await makeCanary(derived);
      writePinState({ saltB64: saltToBase64(salt), canary });
      setKey(derived);
      setStatus("unlocked");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const state = readPinState();
    if (!state) return { ok: false, error: "Nu există PIN configurat." };
    try {
      const salt = saltFromBase64(state.saltB64);
      const derived = await deriveNoteKey(pin, salt);
      const ok = await verifyCanary(state.canary, derived);
      if (!ok) return { ok: false, error: "PIN incorect." };
      setKey(derived);
      setStatus("unlocked");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    clearPinState();
    setKey(null);
    setStatus("needs-setup");
  }, []);

  const value = useMemo<NotesVaultValue>(
    () => ({ status, key, unlock, setup, lock, reset }),
    [status, key, unlock, setup, lock, reset],
  );

  return (
    <NotesVaultContext.Provider value={value}>
      {children}
    </NotesVaultContext.Provider>
  );
}

export function useNotesVault(): NotesVaultValue {
  const ctx = useContext(NotesVaultContext);
  if (!ctx)
    throw new Error("useNotesVault must be used inside NotesVaultProvider");
  return ctx;
}
