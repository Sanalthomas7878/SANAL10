import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { api, getErrorMessage } from '../lib/api';

const MotionDiv = motion.div;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { persistSession, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, navigate, user?.role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data);
      navigate(location.state?.from?.pathname || (data.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to log you in right now.'));
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
      <div
        className="container auth-page__grid"
      >
        <MotionDiv
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel auth-panel auth-panel--hero"
          style={{ padding: '2rem' }}
        >
          <span className="pill" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Login page</span>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Login connects your account with profile data, service area data, and booking history from the database.
          </p>
          <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.75)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <strong>What you get after login</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Access your dashboard, create new scrap or service bookings, and review all requests by area and pincode.
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
            <LogIn size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2>Sign In</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Continue to your account dashboard</p>
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
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="text-center mt-4">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Need an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register here</Link>
            </p>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default Login;
