import React, { useState, useEffect } from 'react';
import { Camera, Search, Bell, User, LogIn, Shield, Briefcase, Plus, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenScan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigateTab,
  onOpenSearch,
  onOpenAuth,
  onOpenScan
}) => {
  const { user, switchDemoUser } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [showDemoDropdown, setShowDemoDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('w2w_token');
    fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUnreadNotifs(data.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'scan', label: 'Scan Waste' },
    { id: 'discover', label: 'Discover' },
    { id: 'idea_hub', label: 'Idea Hub' },
    { id: 'business', label: 'Business' },
    { id: 'donations', label: 'Donate' }
  ];

  if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
    navLinks.push({ id: 'admin', label: 'Admin' });
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-height)',
        background: 'rgba(9, 14, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div className="app-container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand Logo (Section 1) */}
        <div
          onClick={() => onNavigateTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}>
            ♻️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              Waste<span style={{ color: 'var(--primary-400)' }}>2</span>Worth
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
              Transform, Don't Throw
            </span>
          </div>
        </div>

        {/* Desktop Nav Links (Section 4) */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '6px' }} className="desktop-nav">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigateTab(link.id)}
              style={{
                background: activeTab === link.id ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: activeTab === link.id ? 'var(--primary-400)' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: activeTab === link.id ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Action Icons & Auth Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Global Search Button (Section 36) */}
          <button
            onClick={onOpenSearch}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
            title="Global Search (Ctrl+K)"
          >
            <Search size={18} />
          </button>

          {/* Quick Demo Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '4px' }}
              title="Switch demo persona"
            >
              <Sparkles size={12} color="var(--primary-400)" />
              <span className="hide-mobile">Persona</span>
              <ChevronDown size={12} />
            </button>

            {showDemoDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--slate-900)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  width: '210px',
                  padding: '6px',
                  zIndex: 1000
                }}
              >
                <div style={{ padding: '6px 8px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Switch Test Persona:
                </div>
                {[
                  { name: 'Rahul (Creator)', user: 'rahul_crafts' },
                  { name: 'Elena (Admin)', user: 'elena_admin' },
                  { name: 'Aarav (Business)', user: 'greenkraft_studios' },
                  { name: 'Maya (Student)', user: 'maya_ecostudent' },
                  { name: 'Vikram (Donor)', user: 'vikram_m' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      switchDemoUser(item.user);
                      setShowDemoDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Scan Button (Section 5 CTA) */}
          <button
            onClick={onOpenScan}
            className="btn btn-primary btn-sm"
          >
            <Camera size={16} /> Scan Waste
          </button>

          {/* Auth Button / Avatar */}
          {user ? (
            <div
              onClick={() => onNavigateTab('profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.name}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--primary-500)', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-secondary btn-sm"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
        }
        @media (max-width: 600px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
