import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/app.context';

export default function AddExistingEmployeePage() {
  const { authAxios, user, token, jobTitle } = useAuth();

  // ── Guard: only admins
  if (!user || !token || jobTitle !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  // ── Form state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      // POST only { email }
      await authAxios.post('/add-employee/', { email: email.trim() });
      toast.success('✅ Existing user added as employee!');
      setEmail('');
    } catch (err) {
      const data = err.response?.data || {};
      const message =
        data.detail ||
        data.email?.[0] ||
        'Failed to add existing user';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back
        </button>

        <h2 className="text-2xl font-bold mb-4">Add Existing Employee</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Employee Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="existing@user.com"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Adding…
              </>
            ) : (
              'Add Existing User'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
