import React, { useState, useEffect } from 'react';
import { Briefcase, Sparkles, DollarSign, TrendingUp, AlertCircle, ShoppingBag, Store, HelpCircle, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const BusinessHub: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'generator' | 'directory' | 'advisor'>('generator');

  // Generator inputs (Section 22 & 56)
  const [material, setMaterial] = useState<string>('Cardboard');
  const [quantity, setQuantity] = useState<string>('50 boxes');
  const [budget, setBudget] = useState<string>('₹2,000');
  const [skillLevel, setSkillLevel] = useState<string>('Beginner');
  const [concepts, setConcepts] = useState<any[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Business Directory
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  // Advisor State (Section 25: Help My Business)
  const [advisorBusinessName, setAdvisorBusinessName] = useState<string>('');
  const [advisorMaterials, setAdvisorMaterials] = useState<string>('Cardboard, Old clothes');
  const [advisorQuestion, setAdvisorQuestion] = useState<string>('What new product lines can I launch for corporate eco-gifting?');
  const [advisorGuidance, setAdvisorGuidance] = useState<any | null>(null);
  const [isAdvising, setIsAdvising] = useState<boolean>(false);

  const generateBusinessConcepts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await fetch('/api/business/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          quantity,
          budget,
          skill_level: skillLevel
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConcepts(data.concepts || []);
      setDisclaimer(data.legal_disclaimer || '');
    } catch (err: any) {
      showToast(err.message || 'Error generating business concepts', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/businesses');
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (err) {
      console.error('Failed to load businesses:', err);
    }
  };

  const loadBusinessDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/businesses/${id}`);
      const data = await res.json();
      setSelectedBusiness(data.business);
    } catch (err) {
      showToast('Failed to load business profile', 'error');
    }
  };

  const runBusinessAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAdvising(true);
      const res = await fetch('/api/business/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: advisorBusinessName || 'My Upcycling Studio',
          materialsUsed: [advisorMaterials],
          question: advisorQuestion
        })
      });

      const data = await res.json();
      setAdvisorGuidance(data.guidance);
    } catch (err) {
      showToast('Advisor unavailable right now', 'error');
    } finally {
      setIsAdvising(false);
    }
  };

  useEffect(() => {
    generateBusinessConcepts();
    fetchBusinesses();
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <span className="badge-pill badge-amber" style={{ marginBottom: '8px' }}>
          <Briefcase size={14} /> Circular Economy Venture Lab
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Turn Waste into Enterprise</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '640px' }}>
          Explore micro-manufacturing, calculate production estimates, discover green businesses, and get strategic AI advisory for your upcycling brand.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('generator')}
          className={`btn btn-sm ${activeTab === 'generator' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sparkles size={14} /> Venture Concept Generator
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`btn btn-sm ${activeTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Store size={14} /> Circular Business Directory ({businesses.length})
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`btn btn-sm ${activeTab === 'advisor' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <HelpCircle size={14} /> Help My Business (AI Advisor)
        </button>
      </div>

      {/* TAB 1: Business Concept Generator (Section 22 & 56) */}
      {activeTab === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Generator Input Form */}
          <div className="card-glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Configure Your Raw Waste & Resources:</h3>

            <form onSubmit={generateBusinessConcepts} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Waste Available
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  placeholder="e.g. Cardboard, Denim, Bottles"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Quantity Rescued
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="e.g. 50 boxes, 20 kg"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Starting Budget
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. ₹2,000"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Skill Level
                </label>
                <select
                  value={skillLevel}
                  onChange={e => setSkillLevel(e.target.value)}
                  className="input-field"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced Maker</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="submit" disabled={isGenerating} className="btn btn-primary">
                  <Sparkles size={16} /> {isGenerating ? 'Synthesizing...' : 'Generate Venture Concepts'}
                </button>
              </div>
            </form>
          </div>

          {/* Legal Disclaimer Box (Section 22 requirement: Clearly label financial info as estimates) */}
          {disclaimer && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.8rem',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{disclaimer}</span>
            </div>
          )}

          {/* Concept Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {concepts.map((concept: any) => (
              <div key={concept.id} className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span className="badge-pill badge-emerald" style={{ marginBottom: '6px' }}>Commercial Product Concept</span>
                    <h2 style={{ fontSize: '1.45rem', marginTop: '4px' }}>{concept.title}</h2>
                    <p style={{ color: 'var(--primary-300)', fontSize: '0.95rem', fontStyle: 'italic' }}>{concept.tagline}</p>
                  </div>

                  {/* Financial Projection Box */}
                  <div style={{
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-primary)',
                    textAlign: 'right'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estimated Unit Economics</span>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost: </span>
                        <strong style={{ color: '#f87171' }}>{concept.cost_estimates.unit_production_cost}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Retail: </span>
                        <strong style={{ color: 'var(--primary-400)', fontSize: '1.15rem' }}>{concept.cost_estimates.suggested_selling_price}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps and Materials Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Materials & Tools</h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}><strong>Bill of Materials:</strong> {concept.materials_needed.join(', ')}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Tools:</strong> {concept.tools_required.join(', ')}</p>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Go-To-Market & Packaging</h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}><strong>Target Market:</strong> {concept.target_customers}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Packaging:</strong> {concept.packaging_strategy}</p>
                  </div>
                </div>

                {/* Production Process */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Production Workflow:</h4>
                  <ol style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {concept.production_steps.map((st: string, i: number) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                {/* Selling Channels */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Channels:</span>
                  {concept.selling_channels.map((ch: string, i: number) => (
                    <span key={i} className="badge-pill badge-sky" style={{ fontSize: '0.75rem' }}>{ch}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Circular Business Directory (Section 24) */}
      {activeTab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedBusiness ? '1fr 1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {businesses.map(b => (
            <div
              key={b.id}
              className="card-glass card-interactive"
              onClick={() => loadBusinessDetail(b.id)}
              style={{ padding: '20px', border: selectedBusiness?.id === b.id ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img
                  src={b.logo_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&q=80'}
                  alt={b.name}
                  style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{b.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {b.location || 'India'}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                {b.description}
              </p>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {b.materials_used?.map((m: string, i: number) => (
                  <span key={i} className="badge-pill badge-sky" style={{ fontSize: '0.75rem' }}>♻️ {m}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Selected Business Profile Detail (Section 23) */}
          {selectedBusiness && (
            <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>{selectedBusiness.name}</h2>
                  <p style={{ color: 'var(--primary-400)', fontSize: '0.85rem' }}>Owner: {selectedBusiness.owner_name}</p>
                </div>
                <button onClick={() => setSelectedBusiness(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Our Story</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{selectedBusiness.story}</p>
              </div>

              {/* Products Showcase */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Products ({selectedBusiness.products?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedBusiness.products?.map((prod: any) => (
                    <div key={prod.id} style={{ display: 'flex', gap: '12px', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)' }}>
                      <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=200&q=80'} alt={prod.name} style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <h5 style={{ fontSize: '0.95rem' }}>{prod.name}</h5>
                          <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{prod.currency}{prod.price}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prod.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Contact: {selectedBusiness.contact_method}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Help My Business (Section 25) */}
      {activeTab === 'advisor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Consult Waste2Worth AI Business Strategist</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '18px' }}>
              Already crafting products from waste? Ask for expansion concepts, packaging improvements, or corporate partnership ideas.
            </p>

            <form onSubmit={runBusinessAdvisor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Business / Studio Name
                  </label>
                  <input
                    type="text"
                    value={advisorBusinessName}
                    onChange={e => setAdvisorBusinessName(e.target.value)}
                    placeholder="e.g. Revive Textiles"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Waste Materials Handled
                  </label>
                  <input
                    type="text"
                    value={advisorMaterials}
                    onChange={e => setAdvisorMaterials(e.target.value)}
                    placeholder="e.g. Denim scraps, Old clothes"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  What strategic challenge can we help solve?
                </label>
                <textarea
                  value={advisorQuestion}
                  onChange={e => setAdvisorQuestion(e.target.value)}
                  placeholder="e.g. I make tote bags from old jeans. What else can I create to use smaller offcuts and improve margins?"
                  required
                  className="input-field textarea-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isAdvising} className="btn btn-primary">
                  {isAdvising ? 'Synthesizing Advisory...' : 'Get Strategic Recommendations'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Advisory Guidance Result */}
          {advisorGuidance && (
            <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--primary-500)' }}>
              <div>
                <span className="badge-pill badge-emerald" style={{ marginBottom: '6px' }}>AI Venture Advisory Report</span>
                <h3 style={{ fontSize: '1.3rem' }}>{advisorGuidance.overview}</h3>
              </div>

              {/* New Product Lines */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-400)', marginBottom: '8px' }}>🚀 Recommended New Product Lines</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {advisorGuidance.new_product_lines?.map((line: any, i: number) => (
                    <div key={i} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.6)' }}>
                      <h5 style={{ fontSize: '1rem', marginBottom: '4px' }}>{line.title}</h5>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{line.description}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Margin: {line.margin_potential}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packaging Innovation */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-amber)', marginBottom: '8px' }}>📦 Packaging & Brand Strategy</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {advisorGuidance.packaging_innovation?.map((p: string, i: number) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* Material Utilization */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: '#38bdf8', marginBottom: '8px' }}>♻️ Zero-Scrap Material Utilization</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {advisorGuidance.material_utilization?.map((u: string, i: number) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
