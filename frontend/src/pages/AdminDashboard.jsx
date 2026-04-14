import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart3, CheckSquare, Clock, BrainCircuit, ShieldAlert, Trash2, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState("Loading AI analysis...");
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues', 'ai', 'students'
  
  // Registration state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    fetchData();

    // Initialize WebSockets
    const socket = io(API_BASE);
    
    socket.on('new_issue', (newIssue) => {
      setIssues(prev => [newIssue, ...prev]);
      fetchData(); // Update live analytics
    });

    socket.on('issue_updated', (updatedIssue) => {
      setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
      fetchData(); // Update live analytics
    });

    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, statsRes, aiRes] = await Promise.all([
        axios.get(`${API_URL}/issues`, authHeader),
        axios.get(`${API_URL}/analytics`, authHeader),
        axios.get(`${API_URL}/ai-insights`, authHeader).catch(() => ({ data: { insight: "AI Server offline" } }))
      ]);
      setIssues(issuesRes.data);
      setStats(statsRes.data);
      setInsight(aiRes.data?.insight || "No data");
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/issues/${id}`, { status: newStatus }, authHeader);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to permanently delete this issue from the queue? It will still reside in analytics.")) {
      updateStatus(id, 'Archived');
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { email: regEmail, password: regPassword, role: 'STUDENT' }, authHeader);
      setRegMessage('Student successfully registered!');
      setRegEmail('');
      setRegPassword('');
    } catch (err) {
      setRegMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  const baseFiltered = issues.filter(i => i.status !== 'Archived');
  const filteredIssues = filter === 'All' ? baseFiltered : baseFiltered.filter(i => i.category === filter);
  const categories = ['All', ...new Set(baseFiltered.map(i => i.category))];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444', '#10b981'];
  
  const [useMockData, setUseMockData] = useState(true);
  const mockChartData = [
    { name: 'Food & Catering', count: 35 },
    { name: 'Fire / Electrical', count: 20 },
    { name: 'Water Leakage', count: 25 },
    { name: 'Network Sync', count: 10 },
    { name: 'Other', count: 10 }
  ];
  const chartData = useMockData ? mockChartData : (stats?.byCategory?.map(c => ({ name: c.category, count: c.count })) || []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Command Center</h1>
          <p className="text-slate-500">Manage all issues and view AI reports.</p>
        </div>
        <div className="flex bg-white/50 p-1 rounded-xl glass border border-slate-200">
          <button 
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'issues' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:bg-white/30'}`}
          >
            Management
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'students' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:bg-white/30'}`}
          >
            Add Student / Staff
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all ${activeTab === 'ai' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:bg-white/30'}`}
          >
            <BrainCircuit size={16} /> <span>AI Analytics</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -5 }} className="glass p-6 rounded-2xl flex items-center space-x-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><BarChart3 size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Issues</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="glass p-6 rounded-2xl flex items-center space-x-4">
            <div className="p-4 bg-amber-100 text-amber-600 rounded-xl"><Clock size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.pending}</h3>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="glass p-6 rounded-2xl flex items-center space-x-4">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl"><CheckSquare size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Resolved</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.resolved}</h3>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'issues' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
            <h2 className="text-lg font-bold text-slate-800">Issue Queue</h2>
            <select className="border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Issue</th>
                  <th className="px-6 py-4 font-semibold">Category (AI)</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{issue.title}</div>
                      <div className="text-xs text-slate-500">{issue.location}</div>
                      {issue.imageUrl && (
                        <a href={`${API_BASE}${issue.imageUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-brand-600 hover:text-brand-800 hover:underline mt-1 font-semibold">
                          <ExternalLink size={14} className="mr-1" /> View Evidence
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-semibold">{issue.category}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${issue.priority === 'High' ? 'bg-red-50 text-red-700' : issue.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{issue.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <select className="border border-slate-200 rounded text-xs px-2 py-1 focus:ring-brand-500" value={issue.status} onChange={(e) => updateStatus(issue.id, e.target.value)}>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        {issue.status === 'Resolved' && (
                          <button onClick={() => handleDelete(issue.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition" title="Delete Issue">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIssues.length === 0 && <div className="text-center py-12 text-slate-500">No issues found.</div>}
          </div>
        </motion.div>
      )}

      {activeTab === 'students' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 max-w-lg mx-auto mt-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Register New Student / Staff</h2>
          {regMessage && <div className={`p-3 rounded mb-4 text-sm font-medium ${regMessage.includes('success') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{regMessage}</div>}
          <form onSubmit={handleRegisterStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student ID / Staff ID</label>
              <input required type="text" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input required type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition">Create Account</button>
          </form>
        </motion.div>
      )}

      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-8 bg-slate-900 border border-slate-800 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-6">
                <BrainCircuit className="w-8 h-8 text-brand-400" />
                <h2 className="text-2xl font-bold">SmartCampus AI Core</h2>
              </div>
              <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
                <p className="text-lg leading-relaxed text-slate-200 font-medium tracking-wide">
                  {insight}
                </p>
              </div>
              <div className="mt-6 flex items-center space-x-2 text-sm text-slate-400 font-medium">
                <ShieldAlert size={16} /> <span>Insight generated dynamically via FastAPI Machine Learning</span>
              </div>
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700 p-4 relative">
              <div className="flex justify-between w-full mb-2 px-4 items-center">
                <h3 className="font-semibold text-slate-300 tracking-wide uppercase text-sm">Historical Campus Analytics</h3>
                <button 
                  onClick={() => setUseMockData(!useMockData)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold transition-colors"
                >
                  {useMockData ? "Reset to Live Data" : "Switch to Demo Data"}
                </button>
              </div>
              {chartData.length === 0 ? (
                <div className="w-full h-[250px] flex items-center justify-center flex-col text-slate-400">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                  <p className="font-medium">No historical data available.</p>
                  <p className="text-xs mt-1 text-slate-500">Wait for students to report issues.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      dataKey="count" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
