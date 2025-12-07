import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// Store principal da aplicação
const useStore = create(
    devtools(
        persist(
            (set, get) => ({
                // Estado do usuário
                user: null,
                userRole: null,
                allowedBases: [],

                // Base/Projeto atual
                currentBase: null,

                // UI State
                darkMode: false,
                sidebarOpen: true,
                loading: false,

                // Dados
                clients: [],
                tickets: [],

                // Paginação
                pagination: {
                    clients: { page: 1, limit: 50, total: 0 },
                    tickets: { page: 1, limit: 50, total: 0 },
                },

                // Dashboard
                dashboard: {
                    stats: null,
                    loading: false,
                },

                // Actions - User
                setUser: (user) => set({ user }),
                setUserRole: (role) => set({ userRole: role }),
                setAllowedBases: (bases) => set({ allowedBases: bases }),
                logout: () => set({
                    user: null,
                    userRole: null,
                    allowedBases: [],
                    currentBase: null,
                    clients: [],
                    tickets: [],
                }),

                // Actions - Base
                setCurrentBase: (base) => set({ currentBase: base }),

                // Actions - UI
                toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
                setDarkMode: (value) => set({ darkMode: value }),
                toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
                setSidebarOpen: (value) => set({ sidebarOpen: value }),
                setLoading: (value) => set({ loading: value }),

                // Actions - Clients
                setClients: (clients) => set({ clients }),
                addClient: (client) => set((state) => ({
                    clients: [client, ...state.clients]
                })),
                updateClient: (id, updates) => set((state) => ({
                    clients: state.clients.map((c) =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                })),
                removeClient: (id) => set((state) => ({
                    clients: state.clients.filter((c) => c.id !== id),
                })),

                // Actions - Tickets
                setTickets: (tickets) => set({ tickets }),
                addTicket: (ticket) => set((state) => ({
                    tickets: [ticket, ...state.tickets]
                })),
                updateTicket: (id, updates) => set((state) => ({
                    tickets: state.tickets.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),
                removeTicket: (id) => set((state) => ({
                    tickets: state.tickets.filter((t) => t.id !== id),
                })),

                // Actions - Pagination
                setPagination: (type, data) => set((state) => ({
                    pagination: {
                        ...state.pagination,
                        [type]: { ...state.pagination[type], ...data },
                    },
                })),

                // Actions - Dashboard
                setDashboardStats: (stats) => set((state) => ({
                    dashboard: { ...state.dashboard, stats },
                })),
                setDashboardLoading: (loading) => set((state) => ({
                    dashboard: { ...state.dashboard, loading },
                })),
            }),
            {
                name: 'hube-crm-storage',
                partialize: (state) => ({
                    // Apenas persistir dados essenciais
                    currentBase: state.currentBase,
                    darkMode: state.darkMode,
                    sidebarOpen: state.sidebarOpen,
                }),
            }
        ),
        { name: 'HubeCRM' }
    )
);

// Seletores otimizados para evitar re-renders desnecessários
export const useUser = () => useStore((state) => state.user);
export const useUserRole = () => useStore((state) => state.userRole);
export const useAllowedBases = () => useStore((state) => state.allowedBases);
export const useCurrentBase = () => useStore((state) => state.currentBase);
export const useDarkMode = () => useStore((state) => state.darkMode);
export const useSidebarOpen = () => useStore((state) => state.sidebarOpen);
export const useLoading = () => useStore((state) => state.loading);
export const useClients = () => useStore((state) => state.clients);
export const useTickets = () => useStore((state) => state.tickets);
export const usePagination = (type) => useStore((state) => state.pagination[type]);
export const useDashboard = () => useStore((state) => state.dashboard);

export default useStore;
