import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import { MessageProvider } from '@/lib/MessageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user } = useAuth();

  // Render the main app without blocking on auth check
  // (auth state updates in background via onAuthStateChanged listener)
  return (
    <Routes>
      {/* login route always available; if already signed in redirect to home */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />

      {/* Login route with capital L (for dynamic routing) */}
      <Route
        path="/Login"
        element={user ? <Navigate to="/" /> : <Login />}
      />

      {/* signup route always available; if already signed in redirect to home */}
      <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      />

      {/* Signup route with capital S (for dynamic routing) */}
      <Route
        path="/Signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      />

      {/* forgot password route always available; if already signed in redirect to home */}
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/" /> : <ForgotPassword />}
      />

      {/* ForgotPassword route with capital letters (for dynamic routing) */}
      <Route
        path="/ForgotPassword"
        element={user ? <Navigate to="/" /> : <ForgotPassword />}
      />

      {/* public home page - always accessible */}
      <Route
        path="/"
        element={user ? <Navigate to="/BrowseTasks" /> : (
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        )}
      />

      {/* notifications route - protected */}
      <Route
        path="/notifications"
        element={user ? (
          <LayoutWrapper currentPageName="Notifications">
            <Notifications />
          </LayoutWrapper>
        ) : (
          <Navigate to="/login" />
        )}
      />

      {/* dynamically register remaining pages; no auth redirects */}
      {Object.entries(Pages)
        .filter(([path]) => path !== 'Login' && path !== 'Signup' && path !== 'ForgotPassword')
        .map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <NotificationProvider>
        <MessageProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </MessageProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
