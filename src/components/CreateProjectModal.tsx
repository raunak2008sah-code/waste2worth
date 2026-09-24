import React, { useState } from 'react';
import { X, Upload, Sparkles, Image, Check, Eye } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CreateProjectModalProps {
  initialProjectData?: any;
  onClose: () => void;
  onPostPublished: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  initialProjectData,
  onClose,
  onPostPublished
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState<string>(initialProjectData?.title ? `My ${initialProjectData.title}` : '');
  const [description, setDescription] = useState<string>('');
  const [wasteUsed, setWasteUsed] = useState<string>(initialProjectData?.waste_already_have?.[0] || 'Cardboard');
  const [quantity, setQuantity] = useState<string>('1 item');
  const [beforeImage, setBeforeImage] = useState<string>('https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80');
  const [afterImage, setAfterImage] = useState<string>('https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80');
  const [difficulty, setDifficulty] = useState<string>('Beginner');
  const [estimatedTime, setEstimatedTime] = useState<string>('1 hour');
  const [tips, setTips] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Preset Samples for Before / After demonstration
  const samplePresets = [
    {
      label: '📦 Cardboard Transformation',
      waste: 'Corrugated Cardboard',
      before: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80',
      after: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80'
    },
    {
      label: '🍾 Bottle Herb Planter',
      waste: 'Plastic Bottle',
      before: 'https://images.unsplash.com/photo-1562077772-3ab121863412?w=800&q=80',
      after: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80'
    },
    {
      label: '👖 Denim Artisan Tote',
      waste: 'Old Jeans / Denim',
      before: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
      after: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80'
    }
  ];

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    setWasteUsed(preset.waste);
    setBeforeImage(preset.before);
    setAfterImage(preset.after);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to publish your project', 'error');
      return;
    }

    if (!title || !description || !beforeImage || !afterImage) {
      showToast('Please provide a title, description, and both before/after photos', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('w2w_token');

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          waste_used: wasteUsed,
          quantity,
          before_image: beforeImage,
          after_image: afterImage,
          difficulty,
          estimated_time: estimatedTime,
          tips
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish post');

      showToast('🎉 Your transformation has been published to Discover!', 'success');
      onPostPublished();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error publishing project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>Publish Your Transformation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Inspire thousands of upcyclers by showcasing the journey from waste to finished product.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Live Preview Toggle (Section 18 requirement: Show preview before publishing) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary btn-sm"
          >
            <Eye size={14} /> {showPreview ? 'Back to Edit' : 'Live Preview'}
          </button>
        </div>

        {showPreview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.3rem' }}>{title || 'Untitled Transformation'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{description || 'No description yet.'}</p>
            <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge-pill badge-sky">♻️ {wasteUsed}</span>
              <span className="badge-pill badge-emerald">{difficulty}</span>
              <span className="badge-pill badge-amber">{estimatedTime}</span>
            </div>
            {tips && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                💡 Tip: {tips}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowPreview(false)} className="btn btn-secondary">
                Edit Details
              </button>
              <button onClick={handlePublish} disabled={isSubmitting} className="btn btn-primary">
                Confirm & Publish
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Demo Presets */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                ⚡ Auto-fill with demo transformation:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {samplePresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Turned a Delivery Box into a Multi-Tier Desk Organizer"
                required
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Story / Description *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What waste did you start with? What challenges did you solve? How are you using it now?"
                required
                className="input-field textarea-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Waste Material Used *
                </label>
                <input
                  type="text"
                  value={wasteUsed}
                  onChange={e => setWasteUsed(e.target.value)}
                  placeholder="e.g. Cardboard"
                  required
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
                  placeholder="e.g. 2 courier boxes"
                  className="input-field"
                />
              </div>
            </div>

            {/* Photos (Before and After) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Before Photo URL (Waste) *
                </label>
                <input
                  type="text"
                  value={beforeImage}
                  onChange={e => setBeforeImage(e.target.value)}
                  placeholder="Image URL"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  After Photo URL (Transformed) *
                </label>
                <input
                  type="text"
                  value={afterImage}
                  onChange={e => setAfterImage(e.target.value)}
                  placeholder="Image URL"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="input-field"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Estimated Time Taken
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={e => setEstimatedTime(e.target.value)}
                  placeholder="e.g. 1 hour"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Tips for other makers
              </label>
              <input
                type="text"
                value={tips}
                onChange={e => setTips(e.target.value)}
                placeholder="e.g. Score the fold lines lightly with a butter knife first!"
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Publishing...' : 'Publish to Discover'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
