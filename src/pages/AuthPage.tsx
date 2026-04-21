import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuthPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loading) return null;
  if (user) {
    if (user.mode === 'setup') return <Navigate to="/mode-selection" />;
    return <Navigate to="/app/tutor" />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-100">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">
          K
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Karma AI</h1>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 text-center">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-slate-500 mb-8 text-center text-sm">
          {isLogin ? 'Enter your details to sign in.' : 'Get started with your free account.'}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-start">
            <span className="block">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">Password</label>
              {isLogin && <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-sm active:scale-[0.98]">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-slate-500 text-xs font-medium uppercase tracking-wider">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl transition-all font-medium shadow-sm active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>

        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-slate-500">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
