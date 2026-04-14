import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AlertCircle, Clock, CheckCircle, Flame } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

export default function UserDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();

    const socket = io(API_BASE);
    
    socket.on('issue_updated', (updatedIssue) => {
      setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
    });

    return () => socket.disconnect();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${API_URL}/issues`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIssues(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="text-green-500" />;
      case 'In Progress': return <Clock className="text-blue-500" />;
      default: return <AlertCircle className="text-amber-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return <span className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700"><Flame size={12} className="mr-1"/> High</span>;
      case 'Medium': return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Medium</span>;
      default: return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Low</span>;
    }
  };

  if (loading) return <div className="text-center py-20">Loading issues...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Reports</h1>
          <p className="text-slate-500">Track the status of your reported campus issues.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {issues.map((issue, index) => (
          <motion.div 
            key={issue.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-200 border-l-4"
            style={{ borderLeftColor: issue.status === 'Resolved' ? '#10b981' : issue.status === 'In Progress' ? '#3b82f6' : '#f59e0b' }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wide">
                {issue.category}
              </span>
              {getPriorityBadge(issue.priority)}
            </div>
            
            <h3 className="text-lg font-semibold text-slate-800 mb-2 truncate" title={issue.title}>{issue.title}</h3>
            
            {issue.imageUrl && (
              <div className="mb-3">
                <img src={`${API_BASE}${issue.imageUrl}`} alt="Evidence" className="w-full h-32 object-cover rounded-lg border border-slate-100 shadow-sm" />
              </div>
            )}
            
            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{issue.description}</p>
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2 text-slate-600 font-medium">
                {getStatusIcon(issue.status)}
                <span>{issue.status}</span>
              </div>
              <span className="text-slate-400 text-xs">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}

        {issues.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            You haven't reported any issues yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}
