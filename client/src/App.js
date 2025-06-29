import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import CountrySelect    from './pages/CountrySelect';
import ElectionPage     from './pages/ElectionPage';
import DiplomacyPage    from './pages/DiplomacyPage'; // Import DiplomacyPage
import AdminPage        from './pages/AdminPage';
import Header           from './components/Header';
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
        <Toaster position="top-right" /> {/* Add Toaster */}
        <Header />
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
          <Route path="/diplomacy"      element={<ProtectedRoute><DiplomacyPage/></ProtectedRoute>} /> {/* Add Diplomacy Route */}

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
