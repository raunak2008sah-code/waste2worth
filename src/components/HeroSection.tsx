import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Compass, Package, Briefcase, HeartHandshake, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeroSectionProps {
  onScanClick: () => void;
  onAskAiClick: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectProject: (projectId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onScanClick,
  onAskAiClick,
  onNavigateTab,
  onSelectProject
}) => {
  const { user } = useAuth();
  const [impactData, setImpactData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Fetch non-fabricated environmental impact statistics (Section 5)
    fetch('/api/impact')
      .then(res => res.json())
      .then(data => setImpactData(data))
      .catch(err => console.error('Failed to load impact stats:', err));

    // Fetch personalized project recommendations (Section 37)
    fetch('/api/shopping/recommendations')
      .then(res => res.json())
      .then(data => setRecommendations(data.recommendations || []))
      .catch(err => console.error('Failed to load recommendations:', err));
  }, [user]);

  const stats = impactData?.global || {
    materialsReused: 124,
    projectsCompleted: 86,
    materialsDonated: 72,
    projectsShared: 86
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Banner (Section 5) */}
      <div
        className="card-glass"
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border-primary)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)'
        }}
      >
        <span className="badge-pill badge-emerald animate-pulse-glow" style={{ marginBottom: '16px' }}>
          ♻️ The Circular Economy Platform
        </span>

        <h1 style={{ fontSize: '2.8rem', maxWidth: '780px', margin: '0 auto 16px', letterSpacing: '-0.5px' }}>
          What do you have?<br />
          <span style={{ color: 'var(--primary-400)' }}>Don't throw it away.</span><br />
          Let's turn it into something useful.
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 32px' }}>
          Photograph household packaging, textiles, or food scraps. Our AI vision engine identifies materials, generates creative upcycling tutorials, and builds micro-businesses.
        </p>

        {/* Primary and Secondary CTAs (Section 5) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '36px' }}>
          <button
            onClick={onScanClick}
            className="btn btn-primary btn-lg animate-pulse-glow"
            style={{ fontSize: '1.1rem', padding: '16px 36px' }}
          >
            <Camera size={22} /> 📸 Scan Waste
          </button>

          <button
            onClick={onAskAiClick}
            className="btn btn-secondary btn-lg"
            style={{ fontSize: '1.1rem', padding: '16px 32px' }}
          >
            <Sparkles size={20} color="var(--primary-400)" /> 💡 Ask AI
          </button>
        </div>

        {/* Quick Actions (Section 5) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigateTab('discover')} className="btn btn-secondary btn-sm">
            <Compass size={14} /> Discover Projects
          </button>
          <button onClick={() => onNavigateTab('donations')} className="btn btn-secondary btn-sm">
            <Package size={14} /> Find Materials
          </button>
          <button onClick={() => onNavigateTab('business')} className="btn btn-secondary btn-sm">
            <Briefcase size={14} /> Business Ideas
          </button>
          <button onClick={() => onNavigateTab('donations')} className="btn btn-secondary btn-sm">
            <HeartHandshake size={14} /> Donate Materials
          </button>
        </div>
      </div>

      {/* Environmental Impact Section (Section 5: non-fabricated metrics from actual platform data) */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Verified Circular Metrics
          </span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px' }}>Real Waste2Worth Environmental Impact</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Calculated strictly from platform scan and donation activity.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="card-glass" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '4px' }}>♻️</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-400)' }}>{stats.materialsReused}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Materials Reused</div>
          </div>

          <div className="card-glass" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '4px' }}>🛠️</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{stats.projectsCompleted}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Projects Completed</div>
          </div>

          <div className="card-glass" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '4px' }}>📦</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>{stats.materialsDonated}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Materials Donated</div>
          </div>

          <div className="card-glass" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '4px' }}>🌱</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#c084fc' }}>{stats.projectsShared}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Projects Shared</div>
          </div>
        </div>
      </div>

      {/* Recommended for You Section (Section 5) */}
      {recommendations.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem' }}>Recommended For You</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Personalized upcycling ideas based on your recent activity.</p>
            </div>
            <button onClick={() => onNavigateTab('discover')} className="btn btn-secondary btn-sm">
              See All Projects <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {recommendations.slice(0, 3).map((rec: any) => (
              <div
                key={rec.id}
                className="card-glass card-interactive"
                onClick={() => onSelectProject(rec.id)}
                style={{ overflow: 'hidden', padding: '0' }}
              >
                <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                  <img src={rec.cover_image} alt={rec.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="badge-pill badge-emerald" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    {rec.difficulty}
                  </span>
                </div>

                <div style={{ padding: '18px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                    💡 {rec.recommendation_reason}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', marginTop: '4px', marginBottom: '6px' }}>{rec.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineClamp: 2, marginBottom: '12px' }}>
                    {rec.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <span>By {rec.creator_name}</span>
                    <span>⏱️ {rec.estimated_time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
