import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, Plus, Sparkles, Filter, CheckCircle } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { AICommentManager } from './AICommentManager';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface DiscoverFeedProps {
  onOpenCreateModal: () => void;
  onSelectProject: (projectId: string) => void;
}

export const DiscoverFeed: React.FC<DiscoverFeedProps> = ({
  onOpenCreateModal,
  onSelectProject
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('trending');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedPostDetail, setSelectedPostDetail] = useState<any | null>(null);

  const materialsList = [
    { id: 'all', label: 'All Materials' },
    { id: 'cardboard', label: '📦 Cardboard' },
    { id: 'plastic', label: '🍾 Plastic' },
    { id: 'denim', label: '👖 Denim / Textiles' },
    { id: 'glass', label: '🫙 Glass' },
    { id: 'organic', label: '🍎 Organic' }
  ];

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('w2w_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `/api/discover?tab=${activeTab}`;
      if (selectedMaterial !== 'all') {
        url += `&material=${selectedMaterial}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeTab, selectedMaterial]);

  const handleLike = async (postId: string) => {
    if (!user) {
      showToast('Please sign in to like projects', 'info');
      return;
    }

    // Optimistic UI update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const newLiked = !p.has_liked;
          return {
            ...p,
            has_liked: newLiked,
            likes_count: newLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1)
          };
        }
        return p;
      })
    );

    try {
      const token = localStorage.getItem('w2w_token');
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) {
      showToast('Please sign in to bookmark ideas', 'info');
      return;
    }

    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const newSaved = !p.has_saved;
          return {
            ...p,
            has_saved: newSaved,
            saves_count: newSaved ? p.saves_count + 1 : Math.max(0, p.saves_count - 1)
          };
        }
        return p;
      })
    );

    try {
      const token = localStorage.getItem('w2w_token');
      await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showToast('Saved to your collection!', 'success');
    } catch (err) {
      console.error('Save toggle failed:', err);
    }
  };

  const handleFollowCreator = async (creatorId: string) => {
    if (!user) {
      showToast('Please sign in to follow creators', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/posts/users/${creatorId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      setPosts(prev =>
        prev.map(p => {
          if (p.creator.id === creatorId) {
            return { ...p, is_following_creator: data.following };
          }
          return p;
        })
      );

      showToast(data.following ? 'Creator followed!' : 'Unfollowed creator', 'info');
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleShare = (post: any) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `Check out this upcycling transformation on Waste2Worth: ${post.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Feed Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Discover Upcycling</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real before-and-after transformations shared by creators and community members.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn btn-primary"
        >
          <Plus size={18} /> Share Your Transformation
        </button>
      </div>

      {/* Filter Tabs (Section 17) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'trending', label: '🔥 Trending' },
            { id: 'recent', label: '✨ Recent' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Material Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {materialsList.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMaterial(m.id)}
              className={`badge-pill ${selectedMaterial === m.id ? 'badge-emerald' : 'badge-secondary'}`}
              style={{
                cursor: 'pointer',
                background: selectedMaterial === m.id ? 'var(--primary-glow)' : 'var(--slate-800)',
                color: selectedMaterial === m.id ? 'var(--primary-400)' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 14px'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Posts */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading community transformations...
        </div>
      ) : posts.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '14px', color: 'var(--text-muted)' }}>
            No project posts found for this material yet.
          </p>
          <button onClick={onOpenCreateModal} className="btn btn-primary">
            <Plus size={16} /> Be the first to share one!
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {posts.map(post => (
            <div
              key={post.id}
              className="card-glass"
              style={{ overflow: 'hidden', padding: '0' }}
            >
              {/* Post Header: Creator Info */}
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={post.creator.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator.username}`}
                    alt={post.creator.name}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{post.creator.name}</span>
                      {post.creator.role === 'CREATOR' && <CheckCircle size={14} color="var(--primary-400)" />}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      @{post.creator.username} • {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {user && user.id !== post.creator.id && (
                  <button
                    onClick={() => handleFollowCreator(post.creator.id)}
                    className={`btn btn-sm ${post.is_following_creator ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {post.is_following_creator ? 'Following' : '+ Follow'}
                  </button>
                )}
              </div>

              {/* Signature Before / After Split Slider Experience (Section 19) */}
              <div style={{ padding: '0 20px' }}>
                <BeforeAfterSlider
                  beforeImage={post.before_image}
                  afterImage={post.after_image}
                />
              </div>

              {/* Post Content */}
              <div style={{ padding: '18px 20px 14px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span className="badge-pill badge-sky">♻️ {post.waste_used}</span>
                  <span className="badge-pill badge-emerald">{post.difficulty || 'Beginner'}</span>
                  {post.quantity && <span className="badge-pill badge-amber">{post.quantity}</span>}
                </div>

                <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>{post.title}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
                  {post.description}
                </p>

                {/* Engagement Action Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: post.has_liked ? '#ef4444' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      <Heart size={20} fill={post.has_liked ? '#ef4444' : 'none'} />
                      <span>{post.likes_count}</span>
                    </button>

                    {/* Comment Button (Toggles AI Comment Manager!) */}
                    <button
                      onClick={() => setSelectedPostDetail(selectedPostDetail?.id === post.id ? null : post)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <MessageCircle size={20} />
                      <span>{post.comments_count}</span>
                    </button>

                    {/* Bookmark Save */}
                    <button
                      onClick={() => handleSave(post.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: post.has_saved ? 'var(--primary-400)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      title="Bookmark idea"
                    >
                      <Bookmark size={20} fill={post.has_saved ? 'var(--primary-400)' : 'none'} />
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(post)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      title="Share transformation"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>

                  {post.project_id && (
                    <button
                      onClick={() => onSelectProject(post.project_id)}
                      className="btn btn-secondary btn-sm"
                    >
                      View Instructions
                    </button>
                  )}
                </div>
              </div>

              {/* Embedded AI Comment Manager for Selected Post (Section 20) */}
              {selectedPostDetail?.id === post.id && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px' }}>
                  <AICommentManager postId={post.id} initialSummary={post.ai_summary} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
