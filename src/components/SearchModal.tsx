import React, { useState, useEffect } from 'react';
import { Search, X, Compass, Users, Store, HelpCircle, Package, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  onClose,
  onSelectProject,
  onNavigateTab
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <Search size={22} color="var(--primary-400)" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, materials (cardboard, bottles, denim), businesses, questions..."
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: '4px', fontSize: '1.05rem', boxShadow: 'none' }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Results */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh' }}>
          {isLoading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>Searching circular ecosystem...</p>}

          {results && (
            <>
              {/* Projects */}
              {results.projects?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={14} /> Upcycling Projects ({results.projects.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.projects.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => { onSelectProject(p.id); onClose(); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', cursor: 'pointer' }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{p.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{p.category} • {p.difficulty}</span>
                        </div>
                        <ArrowRight size={14} color="var(--primary-400)" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Businesses */}
              {results.businesses?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Store size={14} /> Circular Businesses ({results.businesses.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.businesses.map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => { onNavigateTab('business'); onClose(); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', cursor: 'pointer' }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{b.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>📍 {b.location}</span>
                        </div>
                        <span className="badge-pill badge-sky" style={{ fontSize: '0.75rem' }}>View</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Donations */}
              {results.donations?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={14} /> Material Donation Listings ({results.donations.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.donations.map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => { onNavigateTab('donations'); onClose(); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', cursor: 'pointer' }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{d.material}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            {d.quantity} {d.unit} • {d.approx_location}
                          </span>
                        </div>
                        <span className="badge-pill badge-emerald" style={{ fontSize: '0.75rem' }}>Claim</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Creators */}
              {results.creators?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> Makers & Creators ({results.creators.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {results.creators.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => { onNavigateTab('discover'); onClose(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(15, 23, 42, 0.6)', cursor: 'pointer' }}
                      >
                        <img src={c.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`} alt={c.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!query && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              Try searching for "cardboard", "denim", "greenkraft", or "bottles"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
