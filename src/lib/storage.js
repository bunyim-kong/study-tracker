export function createMemoryStorage() {
  const values = new Map()

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

export function createSafeStorage(primaryStorage) {
  const fallback = createMemoryStorage()

  return {
    getItem(key) {
      try {
        return primaryStorage?.getItem?.(key) ?? fallback.getItem(key)
      } catch {
        return fallback.getItem(key)
      }
    },
    setItem(key, value) {
      // Mirroring every write keeps data available if browser storage fails later.
      fallback.setItem(key, value)
      try {
        primaryStorage?.setItem?.(key, value)
      } catch {
        // The in-memory copy is already current.
      }
    },
    removeItem(key) {
      fallback.removeItem(key)
      try {
        primaryStorage?.removeItem?.(key)
      } catch {
        // Removing the in-memory copy is enough for this session.
      }
    },
  }
}

export function getBrowserStorage() {
  if (typeof window === 'undefined') return createSafeStorage()

  try {
    return createSafeStorage(window.localStorage)
  } catch {
    return createSafeStorage()
  }
}
