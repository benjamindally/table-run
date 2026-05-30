import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import { Mail } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email.trim());
    } catch {
      // Show success regardless — avoids email enumeration
    } finally {
      setSent(true);
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-3 rounded-full">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-dark mb-2">Check Your Inbox</h2>
          <p className="text-dark-300 mb-2">
            If an account exists for <span className="font-medium text-dark">{email}</span>,
            you'll receive a password reset link shortly.
          </p>
          <p className="text-sm text-dark-300 mb-6">
            Reset links expire after 24 hours. Contact your league operator if you need
            further help.
          </p>
          <Link to="/login" className="btn btn-primary inline-block">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Forgot Password</h1>
        <p className="text-dark-300">Enter your email and we'll send you a reset link</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-6">
        <Link to="/login" className="text-sm text-primary hover:text-primary-600">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
