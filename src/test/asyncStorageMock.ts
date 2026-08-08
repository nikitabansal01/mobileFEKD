const values = new Map<string, string>();
export default {
  getItem: async (key: string) => values.get(key) ?? null,
  setItem: async (key: string, value: string) => { values.set(key, value); },
  removeItem: async (key: string) => { values.delete(key); },
  getAllKeys: async () => [...values.keys()],
  multiRemove: async (keys: readonly string[]) => { keys.forEach((key) => values.delete(key)); },
};
