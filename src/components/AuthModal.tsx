import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Shield, User, Briefcase, GraduationCap, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login, register, switchDemoUser } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('USER');
  const [skillLevel, setSkillLevel] = useState<string>('Beginner');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fast demo account switcher
  const demoAccounts = [
    { label: 'Rahul', role: 'Creator', username: 'rahul_crafts', icon: '🎨', color: 'var(--primary-400)' },
    { label: 'Elena', role: 'Admin', username: 'elena_admin', icon: '🛡️', color: '#c084fc' },
    { label: 'Aarav', role: 'Business', username: 'greenkraft_studios', icon: '💼', color: 'var(--accent-amber)' },
    { label: 'Maya', role: 'Student', username: 'maya_ecostudent', icon: '🎓', color: '#38bdf8' },
    { label: 'Vikram', role: 'Donor', username: 'vikram_m', icon: '📦', color: '#34d399' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email || username, password);
        showToast('Welcome back to Waste2Worth!', 'success');
      } else {
        await register({ name, username, email, password, role, skill_level: skillLevel });
        showToast('Account created successfully! Welcome to the circular movement.', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSwitch = async (demoUsername: string, label: string, roleName: string) => {
    try {
      await switchDemoUser(demoUsername);
      showToast(`Logged in as ${label} (${roleName})`, 'success');
      onClose();
    } catch (err) {
      showToast('Demo switch failed', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem' }}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Waste2Worth — Don't Throw It, Transform It
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Demo Switcher Strip */}
        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-primary)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            ⚡ 1-Click Demo Profiles (Switch Persona Instantly):
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {demoAccounts.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleDemoSwitch(d.username, d.label, d.role)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <span>{d.icon}</span> <strong>{d.label}</strong> ({d.role})
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--slate-800)', borderRadius: 'var(--radius-full)', padding: '3px' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, borderRadius: 'var(--radius-full)', border: 'none' }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, borderRadius: 'var(--radius-full)', border: 'none' }}
          >
            <UserPlus size={14} /> New Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alex_maker"
                  required
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>User Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
                    <option value="USER">Normal User</option>
                    <option value="CREATOR">DIY Creator</option>
                    <option value="BUSINESS">Small Business</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Skill Level</label>
                  <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} className="input-field">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced Maker</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              {mode === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <input
              type={mode === 'login' ? 'text' : 'email'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In to Account' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};
