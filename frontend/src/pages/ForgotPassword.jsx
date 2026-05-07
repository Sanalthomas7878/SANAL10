import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';

const MotionDiv = motion.div;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data } = await api.post('/auth/forgot-password', { email: normalizedEmail });

      navigate('/reset-password', {
        state: {
          email: normalizedEmail,
          message: data.message,
        },
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to send the OTP right now.'));
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
          <span className="pill" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Password help</span>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>Get a reset OTP</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Enter the email used in your account and we will send a 6-digit OTP there so you can reset your password.
          </p>
          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.75)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <KeyRound size={18} color="var(--primary)" />
              <strong>Mail delivery</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              The OTP goes to the email entered here, so the user account must already be registered with that same address.
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
            <Mail size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2>Email OTP</h2>
            <p style={{ color: 'var(--text-secondary)' }}>We will send a one-time password to your inbox</p>
          </div>

          {error ? (
            <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.75rem' }}>
              {error}
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
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <div className="text-center mt-4">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Remembered your password? <Link to="/login" style={{ color: 'var(--primary)' }}>Back to login</Link>
            </p>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default ForgotPassword;
