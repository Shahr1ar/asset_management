import { create } from "zustand";

import type { HistoryFilters, UserFilters } from "@/types";

interface AppState {
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  userFilters: UserFilters;
  historyFilters: HistoryFilters;
  setSidebarOpen: (value: boolean) => void;
  setMobileNavOpen: (value: boolean) => void;
  setUserFilters: (value: Partial<UserFilters>) => void;
  setHistoryFilters: (value: Partial<HistoryFilters>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,
  userFilters: {
    query: "",
    status: "all",
  },
  historyFilters: {
    month: "all",
    year: "all",
    userId: "all",
  },
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  setUserFilters: (value) =>
    set((state) => ({ userFilters: { ...state.userFilters, ...value } })),
  setHistoryFilters: (value) =>
    set((state) => ({ historyFilters: { ...state.historyFilters, ...value } })),
}));
