export enum NoteColor {
  DEFAULT = 'bg-neutral-800',
  RED = 'bg-red-900/50',
  ORANGE = 'bg-orange-900/50',
  YELLOW = 'bg-yellow-900/50',
  GREEN = 'bg-green-900/50',
  TEAL = 'bg-teal-900/50',
  BLUE = 'bg-blue-900/50',
  INDIGO = 'bg-indigo-900/50',
  PURPLE = 'bg-purple-900/50',
  PINK = 'bg-pink-900/50',
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
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
        };
      };
    };
  }
}
