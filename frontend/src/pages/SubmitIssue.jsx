import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Send, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

export default function SubmitIssue() {
  const [formData, setFormData] = useState({ title: '', description: '', location: '' });
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('location', formData.location);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      await axios.post(`${API_URL}/issues`, payload, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a Campus Issue</h1>
          <p className="text-slate-500 mb-8">Our AI will intelligently categorize and prioritize your request for rapid resolution.</p>

          {status === 'success' ? (
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <CheckCircle2 className="w-20 h-20 text-brand-500 mb-4" />
              <h3 className="text-2xl font-semibold text-slate-800">Issue Submitted!</h3>
              <p className="text-slate-500 mt-2">Redirecting to your dashboard...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Issue Title</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    required
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow bg-white/50"
                    placeholder="E.g., WiFi is down in the library"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Description</label>
                <textarea
                  required
                  rows="4"
                  className="block w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow bg-white/50"
                  placeholder="Describe the problem in detail to help our AI assign the right team..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    required
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow bg-white/50"
                    placeholder="E.g., Block A, 2nd Floor, Room 204"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Evidence (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="block w-full text-slate-500 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition-shadow bg-white/50 file:mr-4 file:py-3 file:px-4 file:rounded-l-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={status === 'loading'}
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm md:text-md font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70"
              >
                {status === 'loading' ? 'Analyzing Details...' : (
                  <>
                    <Send className="mr-2 h-5 w-5" /> Submit Issue
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
