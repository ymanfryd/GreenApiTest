export function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("sessionStorage is not available", error);
  }
}

export function remove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn("sessionStorage is not available", error);
  }
}