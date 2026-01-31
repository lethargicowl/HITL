import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  handler: KeyHandler;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const altMatch = !!shortcut.alt === event.altKey;
        const shiftMatch = !!shortcut.shift === event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.handler(event);
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common rating shortcuts
export function useRatingShortcuts(
  onRating: (value: number) => void,
  maxRating: number = 5,
  enabled: boolean = true
) {
  const shortcuts: ShortcutConfig[] = [];

  for (let i = 1; i <= maxRating; i++) {
    shortcuts.push({
      key: String(i),
      handler: () => onRating(i),
      enabled,
    });
  }

  useKeyboardShortcuts(shortcuts);
}

// Navigation shortcuts
export function useNavigationShortcuts(
  onPrevious: () => void,
  onNext: () => void,
  enabled: boolean = true
) {
  useKeyboardShortcuts([
    { key: 'ArrowLeft', handler: onPrevious, enabled },
    { key: 'ArrowRight', handler: onNext, enabled },
    { key: 'p', handler: onPrevious, enabled },
    { key: 'n', handler: onNext, enabled },
  ]);
}

// Save shortcut
export function useSaveShortcut(onSave: () => void, enabled: boolean = true) {
  useKeyboardShortcuts([
    { key: 's', ctrl: true, handler: onSave, enabled },
    { key: 'Enter', ctrl: true, handler: onSave, enabled },
  ]);
}
