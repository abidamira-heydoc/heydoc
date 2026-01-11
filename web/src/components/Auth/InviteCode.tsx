import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const InviteCode: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter an organization code');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Check if organization code exists and is active
      const orgsRef = collection(db, 'organizations');
      const q = query(
        orgsRef,
        where('code', '==', code.trim().toUpperCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Invalid organization code. Please check with your administrator.');
        return;
      }

      // Check if org is active
      const orgData = snapshot.docs[0].data();
      if (!orgData.isActive) {
        setError('This organization is no longer active.');
        return;
      }

      // Store org info in sessionStorage
      sessionStorage.setItem('orgCode', code.trim().toUpperCase());
      sessionStorage.setItem('orgId', snapshot.docs[0].id);
      sessionStorage.setItem('orgName', orgData.name);

      // Navigate to login
      navigate('/login');
    } catch (err: any) {
      console.error('Error validating code:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-500 to-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg mb-6">
              <img
                src="/heydoclogo.png"
                alt="HeyDoc Logo"
                className="w-32 h-32 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to HeyDoc</h1>
            <p className="text-gray-600">Enter your organization code to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Code
              </label>
              <input
                type="text"
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-center text-2xl font-mono tracking-widest uppercase"
                placeholder="ENTER CODE"
                maxLength={20}
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Contact your organization administrator for the code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 text-white font-semibold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Validating...
                </>
              ) : (
                <>
                  Continue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              HeyDoc is a B2B health platform. Access is provided through your organization.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default InviteCode;
