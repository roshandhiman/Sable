import { useState, useEffect } from 'react';
import SplashCursor from './ui/SplashCursor';
import { supabase } from '../lib/supabase';

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '0.85rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s, background 0.18s',
  letterSpacing: '0.02em',
};

const labelStyle = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const focusInput = (e) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
};

const blurInput = (e) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
};

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const timer = setTimeout(() => setMounted(isOpen), 10);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || !password) return;
    setIsLoading(true);
    setError('');
    try {
      if (!supabase) throw new Error('Supabase is not configured yet (set VITE_SUPABASE_URL in .env)');
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { data: { name: mail.split('@')[0] } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) throw new Error('Confirm your email first, then sign in.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: mail,
          password,
        });
        if (signInError) throw signInError;
      }
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (signUp) => {
    setIsSignUp(signUp);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    >
      <SplashCursor
        colors={['#94a3b8']}
        rainbow={false}
        theme="dark"
        quality="medium"
        intensity={0.9}
        size={0.9}
        glow={0.4}
        clickSplash={false}
        zIndex={1}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '400px',
          margin: '1rem',
          background: 'rgba(8, 8, 12, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '2rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.7)',
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          ✕
        </button>

        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px', padding: '4px', marginTop: '1.75rem', marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.07)', gap: '4px',
        }}>
          {['Sign In', 'Sign Up'].map((tab, idx) => {
            const active = idx === 0 ? !isSignUp : isSignUp;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabSwitch(idx === 1)}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px',
                  background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
                  color: active ? '#000' : 'rgba(255,255,255,0.4)',
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit', letterSpacing: '0.04em',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete={isSignUp ? 'new-password' : 'current-password'} style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: '#f87171',
                fontFamily: 'inherit',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.75rem', padding: '0.85rem',
              background: isLoading ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.95)',
              color: '#000', border: 'none', borderRadius: '12px',
              fontWeight: 700, fontSize: '0.82rem', cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.opacity = '0.88';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? (
              <>{isSignUp ? 'Creating...' : 'Signing in...'}</>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
