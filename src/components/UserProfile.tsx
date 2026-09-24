import React, { useState, useEffect } from 'react';
import { User as UserIcon, Award, Package, Heart, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface UserProfileProps {
  onSelectProject: (projectId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onSelectProject,
  onNavigateTab
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [userScans, setUserScans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'scans' | 'stats' | 'info'>('scans');

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('w2w_token');
    fetch('/api/scan/my/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUserScans(data.scans || []))
      .catch(err => console.error('Failed to load user scans:', err));
  }, [user]);

  if (!user) {
    return (
      <div className="card-glass" style={{ maxWidth: '480px', margin: '40px auto', padding: '36px', textAlign: 'center' }}>
        <UserIcon size={48} color="var(--primary-400)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Sign in to View Profile</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
          Track your rescued waste materials, bookmark upcycling ideas, and list items for donation.
        </p>
        <button onClick={() => onNavigateTab('home')} className="btn btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Card Header */}
      <div className="card-glass" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt={user.name}
            style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--primary-500)', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.8rem' }}>{user.name}</h1>
              <span className="badge-pill badge-emerald" style={{ fontSize: '0.75rem' }}>
                {user.role}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>@{user.username} • {user.email}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary-300)', marginTop: '4px' }}>
              Maker Skill Level: <strong>{user.skill_level || 'Beginner'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => { logout(); showToast('Logged out', 'info'); onNavigateTab('home'); }}
          className="btn btn-secondary btn-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* User Environmental Impact Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card-glass" style={{ padding: '18px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.8rem', display: 'block' }}>♻️</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-400)' }}>
            {user.stats?.scans || userScans.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Materials Scanned</span>
        </div>

        <div className="card-glass" style={{ padding: '18px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.8rem', display: 'block' }}>🛠️</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {user.stats?.projects || 2}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projects Published</span>
        </div>

        <div className="card-glass" style={{ padding: '18px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.8rem', display: 'block' }}>📦</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8' }}>
            {user.stats?.donations || 1}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Donations Listed</span>
        </div>
      </div>

      {/* Scanned Materials History */}
      <div className="card-glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Your Scanned Materials History</h3>

        {userScans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '12px' }}>You haven't scanned any waste materials yet.</p>
            <button onClick={() => onNavigateTab('scan')} className="btn btn-primary btn-sm">
              Scan Your First Waste Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {userScans.map(scan => (
              <div
                key={scan.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                <img
                  src={scan.image_url}
                  alt={scan.detected_material}
                  style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>{scan.detected_material}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                    {Math.round(scan.confidence * 100)}% match
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
