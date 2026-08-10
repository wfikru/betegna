import React from 'react';
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
import BrowseTaskers from './pages/BrowseTaskers';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import { MessageProvider } from '@/lib/MessageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout } = pagesConfig;

// Pages that require the user to be logged in
const PROTECTED_PAGES = new Set(['MyBookings', 'BookTasker', 'BookingDetail', 'Messages', 'Profile', 'PostTask', 'MyTasks', 'TaskDetail']);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth routes — redirect to browse if already signed in */}
      <Route path="/login"  element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/Login"  element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/Signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
      <Route path="/ForgotPassword"  element={user ? <Navigate to="/" /> : <ForgotPassword />} />

      {/* Root → render configured main page (Home by default) */}
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={pagesConfig.mainPage}>
            {React.createElement(pagesConfig.Pages[pagesConfig.mainPage])}
          </LayoutWrapper>
        }
      />

      {/* Notifications — protected */}
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

      {/* All other pages — protected ones redirect to login if not signed in */}
      {Object.entries(Pages)
        .filter(([path]) => !['Login', 'Signup', 'ForgotPassword'].includes(path))
        .map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              PROTECTED_PAGES.has(path) && !user ? (
                <Navigate to="/login" />
              ) : (
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              )
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
