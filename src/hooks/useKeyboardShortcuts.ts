import { useEffect, useCallback, RefObject } from 'react';

interface UseKeyboardShortcutsProps {
  onEscape?: () => void;
  onSlash?: () => void;
  searchInputRef?: RefObject<HTMLInputElement>;
}

export function useKeyboardShortcuts({
  onEscape,
  onSlash,
  searchInputRef,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (event.key === 'Escape') {
        onEscape?.();
        // Also blur any focused input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
        }
        onSlash?.();
      }
    },
    [onEscape, onSlash, searchInputRef]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
