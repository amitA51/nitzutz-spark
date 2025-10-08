import { useEffect } from 'react';

interface KeyboardShortcuts {
  onNext?: () => void;
  onPrevious?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
}

export const useKeyboardShortcuts = ({
  onNext,
  onPrevious,
  onSave,
  onSearch,
}: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious?.();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSave?.();
          }
          break;
        case '/':
          e.preventDefault();
          onSearch?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onSave, onSearch]);
};
