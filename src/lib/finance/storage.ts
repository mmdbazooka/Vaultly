import { demoVault } from "./demo";
import { vaultSchema, type Vault } from "./model";
import { VaultError } from "./operations";

export const VAULT_STORAGE_KEY = "vaultly.workspace.v1";
export type VaultUpdate = (vault: Vault) => Vault;

export function decodeVault(text: string): Vault {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new VaultError("corrupt");
  }

  const result = vaultSchema.safeParse(data);
  if (!result.success) throw new VaultError("corrupt");
  return result.data;
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(VAULT_STORAGE_KEY);
  } catch {
    throw new VaultError("unavailable");
  }
}

function write(vault: Vault): Vault {
  const result = vaultSchema.safeParse(vault);
  if (!result.success) throw new VaultError("invalid");

  try {
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(result.data));
  } catch {
    throw new VaultError("unavailable");
  }
  return result.data;
}

// Web Locks serialize read-modify-write across tabs where the API is available.
async function withVaultLock<T>(operation: () => T): Promise<T> {
  if (navigator.locks) return navigator.locks.request(VAULT_STORAGE_KEY, operation);
  return operation();
}

function readOrSeed(): Vault {
  const raw = readRaw();
  return raw === null ? write(demoVault()) : decodeVault(raw);
}

export function readVault() {
  return withVaultLock(readOrSeed);
}

export function updateVault(update: VaultUpdate) {
  return withVaultLock(() => write(update(readOrSeed())));
}

export function replaceVault(vault: Vault) {
  return withVaultLock(() => write(vault));
}

export function getRawBackup() {
  return readRaw();
}
