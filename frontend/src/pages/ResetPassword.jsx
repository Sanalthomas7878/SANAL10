import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeySquare, RefreshCcw } from 'lucide-react';
import PasswordField from '../components/PasswordField';
import { api, getErrorMessage } from '../lib/api';

const MotionDiv = motion.div;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !otp || !password || !confirmPassword) {
      setError('Please fill in email, OTP, and both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp,
        password,
      });

      navigate('/login', {
        replace: true,
        state: { message: data.message },
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to reset the password right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <video
        className="auth-page__video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/media/auth-background.mp4" type="video/mp4" />
      </video>
      <div className="container auth-page__grid">
        <MotionDiv
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel auth-panel auth-panel--hero"
          style={{ padding: '2rem' }}
        >
          <span className="pill" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Enter OTP</span>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>Finish the reset</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Check your email for the OTP, then enter it here together with your new password.
          </p>
          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.75)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <RefreshCcw size={18} color="var(--primary)" />
              <strong>OTP expiry</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              OTP codes stay valid for 15 minutes. If it expires, request a fresh one from the forgot-password page.
            </p>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel auth-panel auth-panel--form"
          style={{ width: '100%', maxWidth: '480px', justifySelf: 'center', padding: '2rem' }}
        >
          <div className="text-center mb-4">
            <KeySquare size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2>Reset Password</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Enter your email, OTP, and new password</p>
          </div>

          {error ? (
            <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.75rem' }}>
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary-dark)', borderRadius: '0.75rem' }}>
              {successMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">OTP</label>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <PasswordField
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <PasswordField
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving new password...' : 'Reset password'}
            </button>
          </form>

          <div className="text-center mt-4">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Need a fresh OTP? <Link to="/forgot-password" style={{ color: 'var(--primary)' }}>Request again</Link>
            </p>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default ResetPassword;
