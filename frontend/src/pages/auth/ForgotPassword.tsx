import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState('');

  const handleRequestToken = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoadingAction('request');
      setError('');
      setMessage('');
      const result = await forgotPassword(email.trim());
      setMessage(result.message || 'Reset token generated.');
      if (result.reset_token) {
        setResetToken(result.reset_token);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to request reset token.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetToken.trim()) {
      setError('Reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    try {
      setLoadingAction('reset');
      setError('');
      setMessage('');
      const result = await resetPassword(resetToken.trim(), newPassword);
      setMessage(result.message || 'Password reset successful.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to reset password.');
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <SplitLayout
      layoutType="login"
      imageSrc="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
      title="Recover Your Account"
      subtitle="Request a reset token, then set your new password securely."
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Forgot Password</h2>
        <p className="mt-2 text-slate-500">
          Reset your password in two quick steps.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleRequestToken}>
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loadingAction === 'request'}>
          {loadingAction === 'request' ? 'Generating...' : '1) Generate Reset Token'}
        </Button>
      </form>

      <form className="space-y-4 mt-8" onSubmit={handleResetPassword}>
        <Input
          label="Reset Token"
          type="text"
          icon={KeyRound}
          placeholder="Paste your reset token"
          value={resetToken}
          onChange={(event) => setResetToken(event.target.value)}
          required
        />
        <Input
          label="New Password"
          type="password"
          icon={Lock}
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loadingAction === 'reset'}>
          {loadingAction === 'reset' ? 'Resetting...' : '2) Reset Password'}
        </Button>
      </form>

      {message && (
        <p className="mt-5 text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-[#137fec] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </p>
    </SplitLayout>
  );
}
