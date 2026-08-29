import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import { Dashboard } from './components/dashboard';
import { SharedDashboard } from './components/sharedDashboard';
import { BrainExpoLanding } from './components/BrainExpoLanding';
import { SettingsDialogProvider } from './components/settings/SettingsDialogProvider';
import { Unsubscribe } from './pages/Unsubscribe';
import { AdminEmail } from './pages/Admin';
import { Loader } from './icons/loader';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsDialogProvider>
        <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/dashboard"
          element={<ProtectedDashboard />}
        />
        <Route
          path="/admin/email"
          element={<ProtectedAdmin />}
        />

        <Route
          path="/sign-in/*"
          element={
            <div className="flex items-center justify-center min-h-screen bg-bg">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
            </div>
          }
        />

        <Route
          path="/sign-up/*"
          element={
            <div className="flex items-center justify-center min-h-screen bg-bg">
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
            </div>
          }
        />

        <Route path="/share/:hash" element={<SharedDashboard />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsDialogProvider>
    </BrowserRouter>
  )
}

function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <Loader message="Loading..." />
    );
  }

  // If already signed in, go straight to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <BrainExpoLanding />;
}

function ProtectedDashboard() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-line border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-fg-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Dashboard />;
}

function ProtectedAdmin() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-line border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-fg-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Ideally you'd do a role check here in the future
  return <AdminEmail />;
}