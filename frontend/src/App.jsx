import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, PlusCircle, LogIn, LogOut } from 'lucide-react';
import SubmitIssue from './pages/SubmitIssue';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" />;
  if (roleRequired && role !== roleRequired) return <Navigate to="/dashboard" />;

  return children;
}

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 selection:bg-brand-300 selection:text-slate-900">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 mb-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 text-dark-900 font-bold text-xl hover:text-brand-600 transition-colors">
              <ShieldAlert className="text-brand-500" />
              <span>SmartCampus</span>
            </Link>
            <div className="flex space-x-6 text-sm font-medium text-slate-600">
              {!token ? (
                <Link to="/login" className="flex items-center space-x-1 hover:text-brand-600 transition">
                  <LogIn size={18} /><span>Login</span>
                </Link>
              ) : (
                <>
                  {role === 'STUDENT' && (
                    <>
                      <Link to="/submit" className="flex items-center space-x-1 hover:text-brand-600 transition">
                        <PlusCircle size={18} /><span>Report Issue</span>
                      </Link>
                      <Link to="/dashboard" className="flex items-center space-x-1 hover:text-brand-600 transition">
                        <LayoutDashboard size={18} /><span>My Issues</span>
                      </Link>
                    </>
                  )}
                  {role === 'ADMIN' && (
                    <Link to="/admin" className="flex items-center space-x-1 hover:text-brand-600 transition">
                      <ShieldAlert size={18} /><span>Admin Panel</span>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center space-x-1 text-red-500 hover:text-red-700 transition">
                    <LogOut size={18} /><span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 pb-12">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/submit" element={
              <ProtectedRoute roleRequired="STUDENT">
                <SubmitIssue />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute roleRequired="STUDENT">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roleRequired="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to={token ? (role === 'ADMIN' ? '/admin' : '/dashboard') : '/login'} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
