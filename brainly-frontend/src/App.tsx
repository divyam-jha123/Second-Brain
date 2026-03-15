import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RedirectToSignIn, SignIn, SignUp, useAuth } from '@clerk/react';
import { Dashboard } from './components/dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<ProtectedDashboard />}
        />

        <Route
          path="/sign-in/*"
          element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            </div>
          }
        />

        <Route
          path="/sign-up/*"
          element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
            </div>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedDashboard() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <Dashboard />;
}