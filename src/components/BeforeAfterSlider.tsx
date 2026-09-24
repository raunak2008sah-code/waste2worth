import React, { useState, useRef } from 'react';
import { ArrowLeftRight, Columns } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = '♻️ Waste / Before',
  afterLabel = '✨ Transformed / After',
  aspectRatio = '16 / 10'
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  if (isSideBySide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio }}>
            <img src={beforeImage} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span style={{
              position: 'absolute', bottom: '8px', left: '8px',
              background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '3px 8px',
              borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600
            }}>
              {beforeLabel}
            </span>
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio }}>
            <img src={afterImage} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span style={{
              position: 'absolute', bottom: '8px', right: '8px',
              background: 'rgba(16, 185, 129, 0.85)', color: '#fff', padding: '3px 8px',
              borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600
            }}>
              {afterLabel}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsSideBySide(false)}
          className="btn btn-secondary btn-sm"
          style={{ alignSelf: 'flex-end', fontSize: '0.75rem' }}
        >
          <ArrowLeftRight size={14} /> Interactive Split Slider
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        ref={containerRef}
        className="ba-wrapper"
        style={{ aspectRatio }}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Background: After Image (Full width) */}
        <img src={afterImage} alt="Transformed" className="ba-image" />

        {/* Foreground: Before Image (Clipped to slider percentage) */}
        <div
          className="ba-after-container"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Waste"
            className="ba-image"
            style={{ width: containerRef.current?.offsetWidth || '100%' }}
          />
        </div>

        {/* Draggable Divider Line */}
        <div
          className="ba-divider"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="ba-handle">
            <ArrowLeftRight size={16} />
          </div>
        </div>

        {/* Floating Labels */}
        <span
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 15,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {beforeLabel}
        </span>

        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(5, 150, 105, 0.9)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 15,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {afterLabel}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          👈 Drag slider to reveal transformation 👉
        </span>
        <button
          onClick={() => setIsSideBySide(true)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem' }}
        >
          <Columns size={14} /> Side-by-side
        </button>
      </div>
    </div>
  );
};
