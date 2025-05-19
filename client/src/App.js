import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import CountrySelect    from './pages/CountrySelect';
import ElectionPage     from './pages/ElectionPage';
import AdminPage        from './pages/AdminPage';
import StatsPage        from './pages/StatsPage';

import DashboardLayout  from './components/DashboardLayout';
import OverviewPage     from './pages/OverviewPage';
import BuyUnitsPage     from './pages/BuyUnitsPage';
import SendUnitsPage    from './pages/SendUnitsPage';
import BuildPage        from './pages/BuildPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />

          <Route path="/select-country"  element={<ProtectedRoute><CountrySelect/></ProtectedRoute>} />
          <Route path="/election"        element={<ProtectedRoute><ElectionPage/></ProtectedRoute>} />
          <Route path="/stats"           element={<ProtectedRoute><StatsPage/></ProtectedRoute>} />

          {/* Dashboard with nested tabs */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}
          >
            <Route index       element={<OverviewPage/>} />
            <Route path="buy"  element={<BuyUnitsPage/>} />
            <Route path="send" element={<SendUnitsPage/>} />
            <Route path="build"element={<BuildPage/>} />
          </Route>

          <Route path="/admin"           element={<ProtectedRoute><AdminPage/></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
