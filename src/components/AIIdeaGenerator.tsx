import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, MessageSquare, Wrench, Clock, ShieldAlert, ArrowRight, Play, CheckCircle, Sliders, DollarSign, Lightbulb } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface AIIdeaGeneratorProps {
  material: string;
  scanData?: any;
  onSelectProject: (projectId: string, ideaData?: any) => void;
  onAskCommunity: (prefilledQuestion: string, material: string) => void;
}

export const AIIdeaGenerator: React.FC<AIIdeaGeneratorProps> = ({
  material,
  scanData,
  onSelectProject,
  onAskCommunity
}) => {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [creatorInspiration, setCreatorInspiration] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeConstraint, setActiveConstraint] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selectedCreatorProject, setSelectedCreatorProject] = useState<any | null>(null);

  // Constraints specified in Section 8 & 9
  const constraintOptions = [
    { id: 'easier', label: '🌱 Easier Ideas' },
    { id: 'decorative', label: '🎨 Decorative / Home Decor' },
    { id: 'commercial', label: '💰 Something I Can Sell' },
    { id: 'school_project', label: '🎒 School / STEM Project' },
    { id: 'budget_500', label: '🪙 Under ₹500 Budget' },
    { id: 'no_tools', label: '✂️ Zero Tools Required' },
    { id: 'completely_new', label: '🚀 Completely New Concept' }
  ];

  const fetchIdeas = async (constraint?: string, promptText?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          constraints: constraint || undefined,
          custom_prompt: promptText || undefined,
          skill_level: 'Beginner'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ideas');

      setIdeas(data.ideas || []);
      setCreatorInspiration(data.creator_inspiration || []);
    } catch (err: any) {
      showToast(err.message || 'Error generating ideas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [material]);

  const handleApplyConstraint = (constraintId: string) => {
    setActiveConstraint(constraintId);
    fetchIdeas(constraintId, customPrompt);
    showToast(`Generating with filter: ${constraintId}`, 'info');
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    fetchIdeas(activeConstraint, customPrompt);
  };

  // Section 14: "I Don't Like These Ideas" -> Ask Community prefill
  const handleAskCommunityClick = () => {
    const prefill = `I have ${material} (approx condition: ${scanData?.condition || 'clean'}). What creative or practical projects can I make with this? Tried AI suggestions, looking for community maker inspiration!`;
    onAskCommunity(prefill, material);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge-pill badge-emerald">
            <Sparkles size={14} /> AI Upcycling Intelligence
          </span>
          <span className="badge-pill badge-sky">
            Material: {material}
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>What You Can Make</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
          Explore project concepts generated specifically for your {material}. You can refine with constraints or browse community creator inspiration.
        </p>
      </div>

      {/* Constraints & Personalization Bar (Section 8 & 9) */}
      <div className="card-glass" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sliders size={18} color="var(--primary-400)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Refine AI Concepts by Constraint:</span>
        </div>

        {/* Constraint Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {constraintOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleApplyConstraint(opt.id)}
              className={`btn btn-sm ${activeConstraint === opt.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
            >
              {opt.label}
            </button>
          ))}
          {activeConstraint && (
            <button
              onClick={() => { setActiveConstraint(''); fetchIdeas(); }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Custom Constraint Prompt */}
        <form onSubmit={handleCustomPromptSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder='e.g., "Give me a decorative item for a balcony garden" or "Must take under 30 minutes"'
            className="input-field"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={isLoading} className="btn btn-secondary">
            {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Ask AI
          </button>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <RefreshCw className="animate-spin" size={36} color="var(--primary-400)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Consulting circular design patterns for {material}...</p>
        </div>
      )}

      {/* Ideas Cards Grid */}
      {!isLoading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={22} color="var(--accent-amber)" /> AI Project Ideas ({ideas.length})
            </h2>
            <button
              onClick={() => fetchIdeas(activeConstraint, customPrompt)}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} /> Generate Again
            </button>
          </div>

          <div className="grid-cards">
            {ideas.map((idea: any) => (
              <div
                key={idea.id}
                className="card-glass"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge-pill badge-sky">{idea.category}</span>
                    <span className={`badge-pill ${idea.difficulty === 'Beginner' ? 'badge-emerald' : 'badge-amber'}`}>
                      {idea.difficulty}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{idea.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
                    {idea.description}
                  </p>

                  {/* Specs & Material Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--primary-400)" />
                      <span><strong>Est. Time:</strong> {idea.estimated_time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wrench size={14} color="var(--accent-amber)" />
                      <span><strong>Tools:</strong> {idea.tools?.join(', ') || 'Household scissors'}</span>
                    </div>
                    {idea.estimated_cost && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={14} color="var(--primary-400)" />
                        <span><strong>Est. Cost:</strong> {idea.estimated_cost}</span>
                      </div>
                    )}
                  </div>

                  {/* Sustainability explanation */}
                  {idea.sustainability_explanation && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '0.8rem',
                      color: 'var(--primary-300)',
                      marginBottom: '18px'
                    }}>
                      🌱 <strong>Eco-Value:</strong> {idea.sustainability_explanation}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectProject(idea.id, idea)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  Try This Idea <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 11: Creator Inspiration (Shown Together with AI Ideas!) */}
      {creatorInspiration.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Play size={22} color="var(--primary-400)" />
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>Creator Inspiration</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Handcrafted transformations built by verified upcyclers and makers using {material}.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {creatorInspiration.map((item: any) => (
              <div
                key={item.id}
                className="card-glass card-interactive"
                onClick={() => setSelectedCreatorProject(item)}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                  <img src={item.cover_image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
                      {item.duration || '45 mins'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img
                      src={item.creator_avatar}
                      alt={item.creator_name}
                      style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.creator_name}</span>
                    <CheckCircle size={12} color="var(--primary-400)" />
                  </div>

                  <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>{item.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px', lineClamp: 2 }}>
                    {item.description}
                  </p>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectProject(item.id, item); }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    View Project Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 14: "I Don't Like These Ideas" Flow */}
      <div
        className="card-glass"
        style={{
          padding: '24px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px dashed var(--border-subtle)',
          marginTop: '10px'
        }}
      >
        <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Didn't find what you're looking for?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 18px' }}>
          Ask the AI for a fresh angle, or ask our community of 5,000+ crafters and students for creative suggestions.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchIdeas('completely_new')}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} /> 🔄 Generate Again
          </button>

          <button
            onClick={handleAskCommunityClick}
            className="btn btn-primary"
          >
            <MessageSquare size={16} /> 📢 Ask the Community
          </button>
        </div>
      </div>
    </div>
  );
};
