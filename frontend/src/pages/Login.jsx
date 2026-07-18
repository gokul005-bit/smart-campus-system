import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
      window.location.reload(); // Hard reload to mount layout
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';
      const res = await axios.post(`${API_URL}/auth/login`, { email: demoEmail, password: demoPassword });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mt-20 bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-center mb-6">Portal Login</h2>
      <p className="text-sm text-center text-slate-500 mb-6">Enter Student ID or Staff ID</p>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm font-medium">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Student ID / Staff ID</label>
          <input required type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" />
        </div>
        <button type="submit" className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition">Log In</button>
      </form>

      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Demo Quick Access</p>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => handleQuickLogin('admin', 'admin')}
            className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg transition-colors border border-indigo-200"
          >
            Log In as Admin
          </button>
          <button 
            type="button"
            onClick={() => handleQuickLogin('student', 'student')}
            className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg transition-colors border border-emerald-200"
          >
            Log In as Student
          </button>
        </div>
      </div>
    </motion.div>
  );
}
