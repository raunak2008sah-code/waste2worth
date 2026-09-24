import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, CheckCircle, ThumbsUp, Sparkles, Send, UserCheck, X, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface IdeaHubProps {
  initialQuestionPrefill?: string;
  initialMaterialPrefill?: string;
}

export const IdeaHub: React.FC<IdeaHubProps> = ({
  initialQuestionPrefill,
  initialMaterialPrefill
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');

  // Modal states
  const [showAskModal, setShowAskModal] = useState<boolean>(Boolean(initialQuestionPrefill));
  const [newMaterial, setNewMaterial] = useState<string>(initialMaterialPrefill || 'Cardboard');
  const [newQuantity, setNewQuantity] = useState<string>('1 unit');
  const [newBudget, setNewBudget] = useState<string>('Flexible');
  const [newQuestionText, setNewQuestionText] = useState<string>(initialQuestionPrefill || '');
  const [replyText, setReplyText] = useState<string>('');

  // Ask Creator Modal state (Section 16)
  const [showCreatorModal, setShowCreatorModal] = useState<boolean>(false);
  const [targetCreator, setTargetCreator] = useState<{ id: string; name: string } | null>(null);
  const [creatorInquiryMessage, setCreatorInquiryMessage] = useState<string>('');

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      let url = '/api/idea-hub/questions';
      if (selectedMaterial !== 'all') {
        url += `?material=${encodeURIComponent(selectedMaterial)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestionDetail = async (qId: string) => {
    try {
      const res = await fetch(`/api/idea-hub/questions/${qId}`);
      const data = await res.json();
      setSelectedQuestion(data.question);
      setResponses(data.responses || []);
    } catch (err) {
      showToast('Failed to load question thread', 'error');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedMaterial]);

  useEffect(() => {
    if (initialQuestionPrefill) {
      setShowAskModal(true);
      setNewQuestionText(initialQuestionPrefill);
      if (initialMaterialPrefill) setNewMaterial(initialMaterialPrefill);
    }
  }, [initialQuestionPrefill, initialMaterialPrefill]);

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to ask the community', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch('/api/idea-hub/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          material: newMaterial,
          quantity: newQuantity,
          budget: newBudget,
          question: newQuestionText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post question');

      showToast('🎉 Question posted! AI has also generated an initial concept.', 'success');
      setShowAskModal(false);
      setNewQuestionText('');
      fetchQuestions();
      loadQuestionDetail(data.questionId);
    } catch (err: any) {
      showToast(err.message || 'Error posting question', 'error');
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedQuestion) return;
    if (!user) {
      showToast('Please sign in to reply', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/idea-hub/questions/${selectedQuestion.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyText.trim() })
      });

      if (!res.ok) throw new Error('Failed to post reply');

      setReplyText('');
      showToast('Idea response shared with the maker!', 'success');
      loadQuestionDetail(selectedQuestion.id);
    } catch (err: any) {
      showToast(err.message || 'Error replying', 'error');
    }
  };

  const handleReaction = async (responseId: string, reactionType: 'helpful' | 'used') => {
    if (!user) {
      showToast('Please sign in to react', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/idea-hub/responses/${responseId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction_type: reactionType })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.reacted ? `Marked as: ${reactionType === 'helpful' ? 'This Helped!' : 'I Used This Idea!'}` : 'Reaction removed', 'info');
        if (selectedQuestion) loadQuestionDetail(selectedQuestion.id);
      }
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // Section 16: "Ask Creator" direct message inquiry
  const handleSendCreatorInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCreator || !creatorInquiryMessage.trim()) return;

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch('/api/idea-hub/ask-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          creator_id: targetCreator.id,
          idea_id: selectedQuestion?.id,
          message: creatorInquiryMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setShowCreatorModal(false);
      setCreatorInquiryMessage('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send inquiry', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="badge-pill badge-emerald" style={{ marginBottom: '6px' }}>
            <MessageSquare size={14} /> Community & AI Brainstorming
          </span>
          <h1 style={{ fontSize: '2rem' }}>Idea Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Have unusual waste? Ask the community and AI for unique upcycling concepts.
          </p>
        </div>

        <button
          onClick={() => setShowAskModal(true)}
          className="btn btn-primary"
        >
          <Plus size={18} /> Ask the Community
        </button>
      </div>

      {/* Main Grid: Question List on Left/Top, Thread Detail on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedQuestion ? '1fr 1.3fr' : '1fr', gap: '24px' }}>
        {/* Questions Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'Cardboard', 'Plastic bottle', 'Old clothes', 'Glass'].map(m => (
              <button
                key={m}
                onClick={() => setSelectedMaterial(m)}
                className={`btn btn-sm ${selectedMaterial === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem' }}
              >
                {m === 'all' ? 'All Questions' : m}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Loading questions...</p>
          ) : questions.length === 0 ? (
            <div className="card-glass" style={{ padding: '30px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No questions for this material yet. Be the first to ask!</p>
            </div>
          ) : (
            questions.map(q => (
              <div
                key={q.id}
                className={`card-glass card-interactive ${selectedQuestion?.id === q.id ? 'border-primary' : ''}`}
                onClick={() => loadQuestionDetail(q.id)}
                style={{
                  padding: '18px',
                  border: selectedQuestion?.id === q.id ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge-pill badge-sky">♻️ {q.material}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {q.responses_count || 0} suggestions
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                  {q.question}
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <span>Asked by {q.author_name}</span>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Question Detail Thread */}
        {selectedQuestion && (
          <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge-pill badge-sky">♻️ {selectedQuestion.material}</span>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <h2 style={{ fontSize: '1.35rem', marginBottom: '10px' }}>{selectedQuestion.question}</h2>

              <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span><strong>Quantity:</strong> {selectedQuestion.quantity}</span>
                <span><strong>Budget:</strong> {selectedQuestion.budget}</span>
              </div>
            </div>

            {/* Responses List (AI Suggestion first, then community replies) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto' }}>
              {responses.map((resp: any) => (
                <div
                  key={resp.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: resp.is_ai_generated ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${resp.is_ai_generated ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={resp.author_avatar}
                        alt={resp.author_name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{resp.author_name}</span>
                      {resp.is_ai_generated ? (
                        <span className="badge-pill badge-emerald" style={{ fontSize: '0.7rem' }}>
                          <Sparkles size={10} /> AI Concept
                        </span>
                      ) : (
                        resp.author_role === 'CREATOR' && <span className="badge-pill badge-sky" style={{ fontSize: '0.7rem' }}>Creator</span>
                      )}
                    </div>

                    {/* Section 16: "Ask Creator" button if human creator */}
                    {!resp.is_ai_generated && resp.user_id && user && user.id !== resp.user_id && (
                      <button
                        onClick={() => {
                          setTargetCreator({ id: resp.user_id, name: resp.author_name });
                          setShowCreatorModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      >
                        <UserCheck size={12} /> Ask Creator
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-line', marginBottom: '12px' }}>
                    {resp.content}
                  </div>

                  {/* Reaction Buttons (Section 15: "This helped" & "I used this idea") */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleReaction(resp.id, 'helpful')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                    >
                      <ThumbsUp size={12} color="var(--primary-400)" /> This helped ({resp.helpful_count || 0})
                    </button>

                    <button
                      onClick={() => handleReaction(resp.id, 'used')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                    >
                      <CheckCircle size={12} color="var(--accent-amber)" /> I used this ({resp.used_count || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Post a Reply form */}
            <form onSubmit={handlePostReply} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={user ? 'Share an idea or technique with this maker...' : 'Sign in to suggest an idea...'}
                disabled={!user}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={!user || !replyText.trim()} className="btn btn-primary">
                <Send size={16} /> Share
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="modal-overlay" onClick={() => setShowAskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.35rem' }}>Ask the Community</h3>
              <button onClick={() => setShowAskModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Describe what waste materials you have available. Both AI and experienced makers will suggest transformations.
            </p>

            <form onSubmit={handlePostQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Waste Material *
                </label>
                <input
                  type="text"
                  value={newMaterial}
                  onChange={e => setNewMaterial(e.target.value)}
                  placeholder="e.g. Cardboard boxes, Plastic bottles, Old clothes"
                  required
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={newQuantity}
                    onChange={e => setNewQuantity(e.target.value)}
                    placeholder="e.g. 20 items"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Budget Limit
                  </label>
                  <input
                    type="text"
                    value={newBudget}
                    onChange={e => setNewBudget(e.target.value)}
                    placeholder="e.g. Under ₹500 or ₹0"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Your Question / Dilemma *
                </label>
                <textarea
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="e.g. I have 20 plastic bottles from our school festival. What can I make that would be educational or practical?"
                  required
                  className="input-field textarea-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAskModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Post Question & Get AI Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 16: "Ask Creator" Direct Inquiry Modal (No private contact exposed) */}
      {showCreatorModal && targetCreator && (
        <div className="modal-overlay" onClick={() => setShowCreatorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Ask {targetCreator.name} for Advice</h3>
              <button onClick={() => setShowCreatorModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Send a direct question to this creator regarding their project technique. Your private contact details remain protected.
            </p>

            <form onSubmit={handleSendCreatorInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                value={creatorInquiryMessage}
                onChange={e => setCreatorInquiryMessage(e.target.value)}
                placeholder="Ask about tools, materials, or structural advice..."
                required
                className="input-field textarea-field"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreatorModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
