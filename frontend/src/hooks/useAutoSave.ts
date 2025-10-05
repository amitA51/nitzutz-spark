import { useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // milliseconds
  onSave: (value: any) => Promise<void>;
}

export const useAutoSave = <T>(
  value: T,
  { delay = 2000, onSave }: UseAutoSaveOptions
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousValueRef = useRef<T>(value);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if value hasn't changed
    if (JSON.stringify(value) === JSON.stringify(previousValueRef.current)) {
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(value);
        setLastSaved(new Date());
        previousValueRef.current = value;
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, onSave]);

  return { isSaving, lastSaved };
};
