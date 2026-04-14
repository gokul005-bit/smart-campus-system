import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';
      await axios.post(`${API_URL}/auth/register`, { email, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mt-20 glass rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm font-medium">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500">
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
        <button type="submit" className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition">Register</button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Log In</Link></p>
    </motion.div>
  );
}
