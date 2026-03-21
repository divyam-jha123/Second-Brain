import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import { Dashboard } from './components/dashboard';
import { SharedDashboard } from './components/sharedDashboard';
import { LandingPage } from './components/landingPage';
import { Settings } from './pages/Settings';
import { Loader } from './icons/loader';

export default function App() {
  return (
    <BrowserRouter>
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
          path="/settings"
          element={<ProtectedSettings />}
        />

        <Route
          path="/sign-in/*"
          element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
            </div>
          }
        />

        <Route
          path="/sign-up/*"
          element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
            </div>
          }
        />

        <Route path="/share/:hash" element={<SharedDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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

  return <LandingPage />;
}

function ProtectedDashboard() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Dashboard />;
}

function ProtectedSettings() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Settings />;
}