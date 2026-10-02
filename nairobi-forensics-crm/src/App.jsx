import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';  // ← Add
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute';
import Nav from './Components/Navigation/nav';
import Home from './Pages/home/home';
import Login from './Pages/Login/login';
import Register from './Pages/Register/register';
import DashboardLayout from './Pages/Dashboard/DashboardLayout';
import Dashboard from './Pages/Dashboard/dashboard';
import Clients from './Pages/Clients/clients';
import Invoices from './Pages/Invoices/invoices';
import Payments from './Pages/Payments/payments';
import Receipts from './Pages/Receipts/receipts';
import Reports from './Pages/Reports/reports';
import Communications from './Pages/Communications/communications';
import Settings from './Pages/Settings/settings';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>              {/* ← Wrap here */}
        <Router>
          <Routes>
            <Route path="/" element={<><Nav /><Home /></>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="communications" element={<Communications />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;