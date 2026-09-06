// LocalStorage persistence layer for Javadian Operations workflow state

const STORAGE_KEY = 'javadian_operations_state_v1';

export interface PersistedWorkflowState {
  version: number;
  timestamp: number;
  payments?: any[];
  salesOrders?: any[];
  supplyRequests?: any[];
  repositoryRecords?: any[];
}

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function loadPersistedState(): PersistedWorkflowState | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.version === 1) {
      return parsed as PersistedWorkflowState;
    }
  } catch (err) {
    console.warn('[Persistence] Error loading persisted workflow state:', err);
  }
  return null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function savePersistedState(state: Partial<PersistedWorkflowState>): void {
  if (!isStorageAvailable()) return;

  // Debounce consecutive saves
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const existing = loadPersistedState() || { version: 1, timestamp: Date.now() };
      const updated: PersistedWorkflowState = {
        ...existing,
        ...state,
        version: 1,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[Persistence] Error saving workflow state to localStorage:', err);
    }
  }, 150);
}

export function clearPersistedState(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  } catch (err) {
    console.warn('[Persistence] Error clearing workflow state:', err);
  }
}

export function hasPersistedState(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}
