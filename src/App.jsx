import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components';
import { MainLayout } from './layouts/MainLayout';
import { useAuth } from './hooks/useAuth';
import { useUser, useDarkMode } from './stores/useStore';
import { useClients } from './hooks/useClients';
import { useTickets } from './hooks/useTickets';

// Lazy load pages para melhor performance
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TicketsPage = lazy(() => import('./pages/TicketsPage').then(m => ({ default: m.TicketsPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const OnboardingPipelinePage = lazy(() => import('./pages/OnboardingPipelinePage').then(m => ({ default: m.OnboardingPipelinePage })));
const OnboardingDashboard = lazy(() => import('./pages/OnboardingDashboard').then(m => ({ default: m.OnboardingDashboard })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const OperationsDashboard = lazy(() => import('./pages/OperationsDashboard').then(m => ({ default: m.OperationsDashboard })));


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = useUser();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const user = useUser();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Carregando..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const darkMode = useDarkMode();
  const user = useUser();
  const { listenToClients } = useClients();
  const { listenToTickets } = useTickets();

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ✅ SOLUÇÃO P0-1: Listeners globais para popular store ao fazer login
  // Isso garante que Dashboard, ClientSelector e todos os componentes
  // vejam os mesmos dados sincronizados do Firestore
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Iniciando listeners globais de dados...');

    // Listener de clientes
    const unsubscribeClients = listenToClients();

    // Listener de tickets
    const unsubscribeTickets = listenToTickets();

    // Cleanup ao fazer logout
    return () => {
      console.log('🛑 Parando listeners globais de dados...');
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeTickets) unsubscribeTickets();
    };
  }, [user, listenToClients, listenToTickets]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes - to be implemented */}
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ClientsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TicketsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OnboardingPipelinePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OnboardingDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* ✅ SOLUÇÃO P1-1: Rota Configurações */}
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Rota Admin - Importadores */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Rota Dashboard Operacional */}
            <Route
              path="/operacoes"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OperationsDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />


            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-primary-600">404</h1>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                      Página não encontrada
                    </p>
                    <a
                      href="/"
                      className="mt-6 inline-block text-primary-600 hover:text-primary-700"
                    >
                      Voltar para o início
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>

        {/* ✅ SOLUÇÃO P2-3: Toast Notifications com Duração Adequada */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Duração padrão: 4 segundos
            duration: 4000,

            // Estilo base
            style: {
              background: darkMode ? '#1f2937' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#111827',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              padding: '16px',
              borderRadius: '8px',
              boxShadow: darkMode
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              maxWidth: '500px',
            },

            // Success: 3 segundos (ação rápida, não precisa ficar muito tempo)
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#10b981' : '#d1fae5'}`,
              },
            },

            // Error: 6 segundos (usuário precisa ler o erro)
            error: {
              duration: 6000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#ef4444' : '#fee2e2'}`,
              },
            },

            // Loading: infinito (até ser dismissado manualmente)
            loading: {
              duration: Infinity,
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#ffffff',
              },
            },

            // Warning: 5 segundos
            custom: {
              duration: 5000,
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
