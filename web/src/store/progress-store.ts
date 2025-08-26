function createProgressStore() {
  let value = 0;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (v: number) => {
      value = v;
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
export const progressStore = createProgressStore();
