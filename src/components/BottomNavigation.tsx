import React from 'react';
import { Home, Camera, Compass, MessageSquare, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenScan: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onNavigateTab,
  onOpenScan
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'scan', label: 'Scan', icon: Camera, isCenter: true },
    { id: 'idea_hub', label: 'Idea Hub', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'rgba(9, 14, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 900,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      className="mobile-bottom-nav"
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              onClick={onOpenScan}
              style={{
                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                color: '#ffffff',
                border: 'none',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.5)',
                cursor: 'pointer',
                transform: 'translateY(-12px)',
                transition: 'transform 0.2s ease'
              }}
              title="Scan Waste"
            >
              <Icon size={24} />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onNavigateTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--primary-400)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              padding: '6px 12px'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}

      <style>{`
        @media (min-width: 900px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};
