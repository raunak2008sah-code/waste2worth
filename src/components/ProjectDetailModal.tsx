import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Wrench, AlertTriangle, HelpCircle, Send, ShoppingBag, Share2, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ProjectDetailModalProps {
  projectId: string;
  initialData?: any;
  onClose: () => void;
  onStartProjectPost: (projectData: any) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  projectId,
  initialData,
  onClose,
  onStartProjectPost
}) => {
  const { showToast } = useToast();
  const [project, setProject] = useState<any>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStepQuestion, setActiveStepQuestion] = useState<number | null>(null);
  const [stepQuery, setStepQuery] = useState<string>('');
  const [stepAiAnswer, setStepAiAnswer] = useState<{ step: number; text: string } | null>(null);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);
  const [shoppingModalItem, setShoppingModalItem] = useState<string | null>(null);
  const [shoppingOptions, setShoppingOptions] = useState<any | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ideas/projects/${projectId}`);
        const data = await res.json();
        if (data.project) {
          setProject(data.project);
        }
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [projectId]);

  const toggleStepCompleted = (stepNum: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepNum) ? prev.filter(s => s !== stepNum) : [...prev, stepNum]
    );
  };

  const handleAskStepQuestion = async (stepNum: number, stepTitle: string) => {
    if (!stepQuery.trim()) return;
    try {
      setIsAskingAi(true);
      const res = await fetch('/api/ideas/projects/step-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber: stepNum,
          stepTitle,
          question: stepQuery,
          projectTitle: project?.title
        })
      });

      const data = await res.json();
      setStepAiAnswer({ step: stepNum, text: data.answer });
      setStepQuery('');
    } catch (err) {
      showToast('Could not get AI answer', 'error');
    } finally {
      setIsAskingAi(false);
    }
  };

  // Section 13: Optional Product Recommendations
  const openShoppingOptions = async (itemName: string) => {
    setShoppingModalItem(itemName);
    try {
      const res = await fetch(`/api/shopping/options?item=${encodeURIComponent(itemName)}`);
      const data = await res.json();
      setShoppingOptions(data);
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading complete step-by-step instructions...</p>
        </div>
      </div>
    );
  }

  const allStepsDone = project.instructions?.length > 0 && completedSteps.length === project.instructions.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '780px', padding: '0', overflow: 'hidden' }}
      >
        {/* Cover Image Header */}
        <div style={{ position: 'relative', width: '100%', height: '240px' }}>
          <img
            src={project.cover_image || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80'}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
              borderRadius: '50%', width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10
            }}
          >
            <X size={20} />
          </button>
          <div style={{
            position: 'absolute', bottom: '0', left: '0', right: '0',
            background: 'linear-gradient(180deg, transparent 0%, rgba(9, 14, 23, 0.95) 100%)',
            padding: '24px 24px 12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-pill badge-emerald">{project.difficulty || 'Beginner'}</span>
              <span className="badge-pill badge-sky"><Clock size={12} /> {project.estimated_time || '45 mins'}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>{project.title}</h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: 'calc(90vh - 240px)', overflowY: 'auto' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {project.description}
          </p>

          {/* Section 12: Material Breakdown (You already have vs You may need) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* You Already Have */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <h4 style={{ color: 'var(--primary-400)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ✓ You Already Have
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {project.waste_already_have?.map((mat: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary-400)' }}>•</span> {mat}
                  </li>
                ))}
              </ul>
            </div>

            {/* You May Need */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <h4 style={{ color: 'var(--accent-amber)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ○ You May Need (Optional)
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {project.materials_may_need?.map((mat: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>○ {mat}</span>
                    <button
                      onClick={() => openShoppingOptions(mat)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    >
                      <ShoppingBag size={12} /> Options
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tools Required */}
          {project.tools_required && project.tools_required.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={14} /> Tools:
              </span>
              {project.tools_required.map((tool: string, idx: number) => (
                <span key={idx} className="badge-pill badge-secondary" style={{ background: 'var(--slate-800)', border: '1px solid var(--border-subtle)' }}>
                  {tool}
                </span>
              ))}
            </div>
          )}

          {/* Step-by-Step Instructions (Section 12) */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '14px' }}>Step-by-Step Instructions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {project.instructions?.map((stepObj: any, index: number) => {
                const stepNum = stepObj.step || index + 1;
                const isDone = completedSteps.includes(stepNum);

                return (
                  <div
                    key={stepNum}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${isDone ? 'var(--primary-600)' : 'var(--border-subtle)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <button
                        onClick={() => toggleStepCompleted(stepNum)}
                        style={{
                          background: isDone ? 'var(--primary-500)' : 'transparent',
                          color: isDone ? '#fff' : 'var(--slate-500)',
                          border: `2px solid ${isDone ? 'var(--primary-500)' : 'var(--slate-600)'}`,
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {isDone && <CheckCircle2 size={16} />}
                      </button>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '1.05rem', color: isDone ? 'var(--primary-400)' : 'var(--text-main)' }}>
                            Step {stepNum}: {stepObj.title}
                          </h4>
                          <button
                            onClick={() => setActiveStepQuestion(activeStepQuestion === stepNum ? null : stepNum)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                          >
                            <HelpCircle size={12} /> Ask AI
                          </button>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {stepObj.instruction}
                        </p>

                        {stepObj.pro_tip && (
                          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                            💡 <strong>Pro Tip:</strong> {stepObj.pro_tip}
                          </div>
                        )}

                        {/* Inline Step AI Assistant (Section 12) */}
                        {activeStepQuestion === stepNum && (
                          <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(9, 14, 23, 0.8)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input
                                type="text"
                                value={stepQuery}
                                onChange={e => setStepQuery(e.target.value)}
                                placeholder="Ask AI about this step (e.g. glue type, cutting technique)..."
                                className="input-field"
                                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                              />
                              <button
                                onClick={() => handleAskStepQuestion(stepNum, stepObj.title)}
                                disabled={isAskingAi}
                                className="btn btn-primary btn-sm"
                              >
                                <Send size={14} />
                              </button>
                            </div>

                            {stepAiAnswer && stepAiAnswer.step === stepNum && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--primary-300)', lineHeight: 1.4 }}>
                                🤖 {stepAiAnswer.text}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alternative Materials (Section 12) */}
          {project.alternative_materials && project.alternative_materials.length > 0 && (
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                🔄 Eco & Low-Cost Material Alternatives
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {project.alternative_materials.map((alt: any, idx: number) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Instead of {alt.original}:</strong> {alt.alternative} — <em>{alt.suitability_note}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completion & Share CTA */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Progress: {completedSteps.length} / {project.instructions?.length || 5} steps completed
              </span>
            </div>

            <button
              onClick={() => onStartProjectPost(project)}
              className="btn btn-primary btn-lg"
            >
              <Share2 size={18} /> I Finished This! Share Before & After
            </button>
          </div>
        </div>
      </div>

      {/* Section 13: Decoupled Optional Product Recommendations Modal */}
      {shoppingModalItem && shoppingOptions && (
        <div className="modal-overlay" onClick={() => setShoppingModalItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Options for {shoppingModalItem}</h3>
              <button onClick={() => setShoppingModalItem(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Purchases are always optional. We prioritize zero-cost household alternatives and local community sharing:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shoppingOptions.options?.map((opt: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: opt.type === 'use_alternative' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${opt.type === 'use_alternative' ? 'var(--primary-500)' : 'var(--border-subtle)'}`
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', color: opt.type === 'use_alternative' ? 'var(--primary-400)' : 'var(--text-main)', marginBottom: '4px' }}>
                    {opt.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {opt.description}
                  </p>
                  {opt.priceEstimate && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', display: 'block', marginBottom: '8px' }}>
                      Price range: {opt.priceEstimate}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      showToast(`${opt.actionLabel} selected`, 'info');
                      setShoppingModalItem(null);
                    }}
                    className={`btn btn-sm ${opt.type === 'use_alternative' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {opt.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
