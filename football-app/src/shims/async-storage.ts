const hasLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch (error) {
    return false;
  }
};

const memoryStore = new Map<string, string | null>();

const readFromLocalStorage = (key: string): string | null => {
  if (!hasLocalStorage()) {
    return memoryStore.get(key) ?? null;
  }

  const value = window.localStorage.getItem(key);
  return value ?? null;
};

const writeToLocalStorage = (key: string, value: string): void => {
  if (!hasLocalStorage()) {
    memoryStore.set(key, value);
    return;
  }

  window.localStorage.setItem(key, value);
};

const removeFromLocalStorage = (key: string): void => {
  if (!hasLocalStorage()) {
    memoryStore.delete(key);
    return;
  }

  window.localStorage.removeItem(key);
};

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return readFromLocalStorage(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    writeToLocalStorage(key, value);
  },

  async removeItem(key: string): Promise<void> {
    removeFromLocalStorage(key);
  },

  async clear(): Promise<void> {
    if (!hasLocalStorage()) {
      memoryStore.clear();
      return;
    }

    window.localStorage.clear();
  },
};

export default AsyncStorage;
