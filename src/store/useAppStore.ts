import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, Bookmarks } from '../types';

interface AppStoreState {
  settings: AppSettings;
  bookmarks: Bookmarks;
  toggleTheme: () => void;
  toggleNotification: () => void;
  addBookmark: (type: 'matches' | 'teams' | 'news', id: string) => void;
  removeBookmark: (type: 'matches' | 'teams' | 'news', id: string) => void;
  isBookmarked: (type: 'matches' | 'teams' | 'news', id: string) => boolean;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      settings: {
        theme: 'dark',
        language: 'ar',
        notificationsEnabled: true,
      },
      bookmarks: {
        matches: [],
        teams: [],
        news: [],
      },
      toggleTheme: () => {
        set((state) => {
          const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
          
          // Apply light/dark classes securely to document element
          if (nextTheme === 'light') {
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
          }
          
          return {
            settings: { ...state.settings, theme: nextTheme },
          };
        });
      },
      toggleNotification: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            notificationsEnabled: !state.settings.notificationsEnabled,
          },
        }));
      },
      addBookmark: (type, id) => {
        set((state) => {
          if (state.bookmarks[type].includes(id)) return state;
          return {
            bookmarks: {
              ...state.bookmarks,
              [type]: [...state.bookmarks[type], id],
            },
          };
        });
      },
      removeBookmark: (type, id) => {
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [type]: state.bookmarks[type].filter((bId) => bId !== id),
          },
        }));
      },
      isBookmarked: (type, id) => {
        const bookmarks = get().bookmarks;
        return bookmarks[type]?.includes(id) || false;
      },
    }),
    {
      name: 'korea90-v2-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on local state reload
        if (state) {
          if (state.settings.theme === 'light') {
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
          }
        }
      },
    }
  )
);
