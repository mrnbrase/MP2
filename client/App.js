import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CountrySelect from './pages/CountrySelect';
import ElectionPage  from './pages/ElectionPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage     from './pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/select-country"
            element={<ProtectedRoute><CountrySelect /></ProtectedRoute>}
          />

          <Route
            path="/election"
            element={<ProtectedRoute><ElectionPage /></ProtectedRoute>}
          />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />

          <Route
            path="/admin"
            element={<ProtectedRoute><AdminPage /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
