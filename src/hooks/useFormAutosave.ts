import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormAutosaveOptions<T> {
  key: string;
  initialData: T;
  debounceMs?: number;
  enabled?: boolean;
}

export function useFormAutosave<T>({
  key,
  initialData,
  debounceMs = 800,
  enabled = true,
}: UseFormAutosaveOptions<T>) {
  const [formData, setFormData] = useState<T>(() => {
    if (!enabled) return initialData;
    try {
      const saved = localStorage.getItem(`javadian_draft_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not restore draft:', e);
    }
    return initialData;
  });

  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (!enabled) return false;
    return !!localStorage.getItem(`javadian_draft_${key}`);
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`javadian_draft_${key}`, JSON.stringify(formData));
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(timeStr);
        setHasDraft(true);
      } catch (e) {
        console.warn('Could not autosave draft:', e);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [formData, key, debounceMs, enabled]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`javadian_draft_${key}`);
      setHasDraft(false);
      setLastSavedTime(null);
    } catch (e) {}
  }, [key]);

  const resetForm = useCallback((newData?: T) => {
    clearDraft();
    setFormData(newData !== undefined ? newData : initialData);
  }, [clearDraft, initialData]);

  return {
    formData,
    setFormData,
    hasDraft,
    lastSavedTime,
    clearDraft,
    resetForm,
  };
}
