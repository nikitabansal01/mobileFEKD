import { randomUUID } from "expo-crypto";

/** Keeps a durable-operation key stable while a mounted screen retries it. */
export interface OperationKeyStore {
  get(operation: string): string;
  clear(operation: string): void;
}

export function createOperationKeyStore(
  createKey: () => string = randomUUID,
): OperationKeyStore {
  const keys = new Map<string, string>();
  return {
    get(operation) {
      const existing = keys.get(operation);
      if (existing) return existing;
      const key = createKey();
      keys.set(operation, key);
      return key;
    },
    clear(operation) {
      keys.delete(operation);
    },
  };
}
