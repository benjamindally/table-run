import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login({ email, password });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Welcome Back</h1>
        <p className="text-dark-300">
          Sign in to your account to access the admin features
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="form-label">Password</label>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-600">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-dark-200 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-dark">
                Remember me
              </label>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-400"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-dark-300">Demo credentials</span>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-dark-300">
            <p>Email: <span className="font-medium text-dark">admin@example.com</span></p>
            <p>Password: <span className="font-medium text-dark">admin123</span></p>
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-dark-300 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-600 font-medium">
            Contact us to register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;