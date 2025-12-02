export enum NoteColor {
  DEFAULT = 'bg-surface',
  RED = 'bg-red-100 dark:bg-red-900/20',
  ORANGE = 'bg-orange-100 dark:bg-orange-900/20',
  YELLOW = 'bg-yellow-100 dark:bg-yellow-900/20',
  GREEN = 'bg-green-100 dark:bg-green-900/20',
  TEAL = 'bg-teal-100 dark:bg-teal-900/20',
  BLUE = 'bg-blue-100 dark:bg-blue-900/20',
  INDIGO = 'bg-indigo-100 dark:bg-indigo-900/20',
  PURPLE = 'bg-purple-100 dark:bg-purple-900/20',
  PINK = 'bg-pink-100 dark:bg-pink-900/20',
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  labels: string[];
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'notes' | 'archive' | 'trash' | 'search';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface AIResponse {
  success: boolean;
  text?: string;
  error?: string;
}

// Telegram WebApp Types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        onEvent: (eventType: string, eventHandler: Function) => void;
        offEvent: (eventType: string, eventHandler: Function) => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          secondary_bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}