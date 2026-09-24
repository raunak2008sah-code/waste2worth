import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, HelpCircle, Lightbulb, Trash2, Send, RefreshCw, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AICommentManagerProps {
  postId: string;
  initialSummary?: any;
}

export const AICommentManager: React.FC<AICommentManagerProps> = ({
  postId,
  initialSummary
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'ai_summary' | 'raw_comments'>('ai_summary');
  const [comments, setComments] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(initialSummary || null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const fetchAiSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      const res = await fetch('/api/ai/comment-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      setSummaryData(data);
    } catch (err) {
      showToast('Could not synthesize AI summary', 'error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    fetchComments();
    if (!summaryData) {
      fetchAiSummary();
    }
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      showToast('Please sign in to join the discussion', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post comment');

      setComments(prev => [...prev, data.comment]);
      setNewComment('');
      showToast('Comment posted! You can refresh AI summary to incorporate it.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error posting comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        showToast('Comment deleted', 'info');
      }
    } catch (err) {
      showToast('Failed to delete comment', 'error');
    }
  };

  return (
    <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Toggle Controls (Section 20 requirement: Clean toggle between AI Summary and Raw Discussion) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--primary-400)" /> Community Discussion ({comments.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            AI organizes and clusters high-volume maker suggestions
          </span>
        </div>

        {/* View Mode Toggle Switch */}
        <div style={{ display: 'flex', background: 'var(--slate-800)', borderRadius: 'var(--radius-full)', padding: '3px' }}>
          <button
            onClick={() => setViewMode('ai_summary')}
            className={`btn btn-sm ${viewMode === 'ai_summary' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', border: 'none' }}
          >
            <Sparkles size={14} /> AI Summary & Groups
          </button>
          <button
            onClick={() => setViewMode('raw_comments')}
            className={`btn btn-sm ${viewMode === 'raw_comments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', border: 'none' }}
          >
            <MessageSquare size={14} /> All Comments ({comments.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: AI Discussion Summary (Section 20) */}
      {viewMode === 'ai_summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* AI Banner */}
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge-pill badge-emerald" style={{ fontSize: '0.75rem' }}>
                <Sparkles size={12} /> AI-generated discussion summary
              </span>
              <button
                onClick={fetchAiSummary}
                disabled={isGeneratingSummary}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
              >
                <RefreshCw size={12} className={isGeneratingSummary ? 'animate-spin' : ''} /> Refresh Synthesis
              </button>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              {summaryData?.summary || 'Synthesizing community suggestions...'}
            </p>
          </div>

          {/* Group Similar Comments (Section 20) */}
          {summaryData?.groups && summaryData.groups.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> Grouped Suggestions ({summaryData.groups.length} clusters):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {summaryData.groups.map((group: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-300)' }}>
                        {group.topic}
                      </span>
                      <span className="badge-pill badge-emerald" style={{ fontSize: '0.75rem' }}>
                        {group.count} makers suggest this
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {group.example}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Questions (Section 20) */}
          {summaryData?.questions && summaryData.questions.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} /> Common Questions Clustered:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                {summaryData.questions.map((qGroup: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
                        {qGroup.topic}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {qGroup.count} questions
                      </span>
                    </div>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {qGroup.examples?.map((ex: string, i: number) => (
                        <li key={i} style={{ marginBottom: '2px' }}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlight Useful Suggestions (Section 20) */}
          {summaryData?.highlights && summaryData.highlights.length > 0 && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)'
            }}>
              <h4 style={{ fontSize: '0.9rem', color: '#c084fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} /> High-Signal Community Highlights
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summaryData.highlights.map((hl: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '0.85rem' }}>
                    <p style={{ color: 'var(--text-main)', marginBottom: '2px' }}>
                      "{hl.suggestion}"
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      — <strong>{hl.author}</strong> ({hl.reason})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Raw Chronological Comments */}
      {viewMode === 'raw_comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
              No comments yet. Share your experience or suggest an improvement!
            </p>
          ) : (
            comments.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '12px'
                }}
              >
                <img
                  src={c.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user_name}`}
                  alt={c.user_name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.user_name}</span>
                      {c.user_role === 'CREATOR' && <span className="badge-pill badge-emerald" style={{ fontSize: '0.7rem' }}>Creator</span>}
                      {c.user_role === 'ADMIN' && <span className="badge-pill badge-purple" style={{ fontSize: '0.7rem' }}>Staff</span>}
                    </div>
                    {user && (user.id === c.user_id || user.role === 'ADMIN') && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer' }}
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {c.content}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Comment Input Form */}
      <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder={user ? 'Add to the community conversation...' : 'Sign in to comment...'}
          disabled={!user || isSubmitting}
          className="input-field"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={!user || !newComment.trim() || isSubmitting}
          className="btn btn-primary"
        >
          <Send size={16} /> Post
        </button>
      </form>
    </div>
  );
};
