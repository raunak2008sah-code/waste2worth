import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface WasteScannerProps {
  onScanComplete: (scanData: any) => void;
  onNavigateToIdeas: (material: string, scanData: any) => void;
}

export const WasteScanner: React.FC<WasteScannerProps> = ({
  onScanComplete,
  onNavigateToIdeas
}) => {
  const { showToast } = useToast();
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [selectedCorrection, setSelectedCorrection] = useState<string>('Cardboard');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { id: 'cardboard', name: 'Cardboard Box', icon: '📦', image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80' },
    { id: 'plastic_bottle', name: 'Plastic Bottle', icon: '🍾', image: 'https://images.unsplash.com/photo-1562077772-3ab121863412?w=800&q=80' },
    { id: 'denim_jeans', name: 'Old Clothes / Denim', icon: '👖', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80' },
    { id: 'glass_jar', name: 'Glass Sauce Jar', icon: '🫙', image: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=800&q=80' },
    { id: 'food_scraps', name: 'Kitchen Food Waste', icon: '🍎', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80' },
    { id: 'e_waste', name: 'Electronic Scraps', icon: '🔌', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80' }
  ];

  const materialList = [
    'Cardboard', 'Paper', 'Plastic bottle', 'Plastic container', 'Plastic wrapper',
    'Plastic packaging', 'Glass', 'Metal', 'Old clothes/textiles', 'Wood',
    'Electronic waste', 'Packaging', 'Rubber', 'Organic waste',
    'Food/fruit/vegetable waste', 'Mixed waste', 'Other'
  ];

  // Start live webcam feed
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      setSelectedPreset(null);
      setImagePreview(null);
      setScanResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access unavailable, fallback to file upload:', err);
      setIsCapturing(false);
      showToast('Camera unavailable. Please upload a photo or pick a sample preset.', 'info');
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  // Capture frame from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedPreset(null);
      setScanResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset Selection
  const handlePresetSelect = (preset: typeof presets[0]) => {
    stopCamera();
    setSelectedPreset(preset.id);
    setSelectedFile(null);
    setImagePreview(preset.image);
    setScanResult(null);
  };

  // Send to AI Waste Identification API
  const runAiIdentification = async () => {
    if (!imagePreview && !selectedPreset) {
      showToast('Please capture an image, upload a file, or choose a preset.', 'error');
      return;
    }

    try {
      setIsScanning(true);
      const token = localStorage.getItem('w2w_token');
      const formData = new FormData();

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (selectedPreset) {
        formData.append('samplePreset', selectedPreset);
        formData.append('imageUrl', imagePreview || '');
      } else if (imagePreview) {
        formData.append('imageUrl', imagePreview);
        formData.append('samplePreset', 'cardboard');
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan analysis failed');

      setScanResult(data.scan);
      onScanComplete(data.scan);
      showToast(`Detected: ${data.scan.detected_material} (${Math.round(data.scan.confidence * 100)}% confidence)`, 'success');
    } catch (err: any) {
      console.error('Scan error:', err);
      showToast(err.message || 'Error scanning waste material', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Manual Correction Handler (Section 6)
  const submitManualCorrection = async () => {
    if (!scanResult) return;
    try {
      const token = localStorage.getItem('w2w_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/scan/${scanResult.id}/correct`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ correctedMaterial: selectedCorrection })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Correction failed');

      setScanResult(data.scan);
      setShowCorrectionModal(false);
      showToast(`Material updated to: ${data.scan.detected_material}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update material', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <span className="badge-pill badge-emerald" style={{ marginBottom: '10px' }}>
          <Sparkles size={14} /> AI Material Recognition
        </span>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Scan Waste Material</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '560px', margin: '0 auto' }}>
          Take a photo or upload an image. Our intelligent vision engine identifies the material, evaluates its condition, and checks upcycling viability.
        </p>
      </div>

      {/* Viewfinder / Preview Section */}
      <div className="card-glass" style={{ padding: '24px', textAlign: 'center' }}>
        {isCapturing ? (
          <div className="scanner-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="scanner-beam" />
            <button
              onClick={capturePhoto}
              className="btn btn-primary"
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20
              }}
            >
              <Camera size={18} /> Snap Photo
            </button>
          </div>
        ) : imagePreview ? (
          <div className="scanner-container">
            <img
              src={imagePreview}
              alt="Waste preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isScanning && <div className="scanner-beam" />}
          </div>
        ) : (
          <div
            onClick={startCamera}
            style={{
              padding: '60px 20px',
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(15, 23, 42, 0.4)'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              color: 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Click to Open Camera</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or upload a photo from your device</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
          >
            <Upload size={18} /> Upload Image
          </button>

          {!isCapturing && (
            <button
              onClick={startCamera}
              className="btn btn-secondary"
            >
              <Camera size={18} /> Use Camera
            </button>
          )}

          {imagePreview && (
            <button
              onClick={() => { setImagePreview(null); setSelectedFile(null); setSelectedPreset(null); setScanResult(null); }}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} /> Retake
            </button>
          )}

          {imagePreview && !scanResult && (
            <button
              onClick={runAiIdentification}
              disabled={isScanning}
              className="btn btn-primary"
            >
              {isScanning ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isScanning ? 'Analyzing Material...' : 'Identify with AI'}
            </button>
          )}
        </div>

        {/* Quick Sample Presets */}
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            ⚡ Or test instantly with a verified waste sample:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p)}
                className={`btn btn-sm ${selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <span>{p.icon}</span> {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Scan Result Card (Section 6) */}
      {scanResult && (
        <div className="card-glass" style={{ padding: '28px', border: '1px solid var(--primary-500)', animation: 'slideInUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.8rem' }}>
                  {scanResult.detected_material.toLowerCase().includes('bottle') ? '🍾' :
                   scanResult.detected_material.toLowerCase().includes('denim') || scanResult.detected_material.toLowerCase().includes('clothes') ? '👖' :
                   scanResult.detected_material.toLowerCase().includes('glass') ? '🫙' :
                   scanResult.detected_material.toLowerCase().includes('organic') ? '🍎' : '📦'}
                </span>
                <h2 style={{ fontSize: '1.8rem' }}>{scanResult.detected_material}</h2>
                <span className="badge-pill badge-emerald">
                  <CheckCircle size={12} /> {Math.round(scanResult.confidence * 100)}% Confidence
                </span>
              </div>
              {scanResult.subtype && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{scanResult.subtype}</p>
              )}
            </div>

            {/* Manual Correction Trigger (Section 6) */}
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.85rem' }}
            >
              <SlidersHorizontal size={14} /> Change Material
            </button>
          </div>

          {/* Condition and Reusability Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</span>
              <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '4px' }}>{scanResult.condition}</p>
            </div>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcycling Suitability</span>
              <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--primary-400)', marginTop: '4px' }}>
                {scanResult.is_reusable ? '✓ Highly Reusable' : '⚠️ Limited Reuse'}
              </p>
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Potential Project Categories:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {scanResult.categories?.map((cat: string, idx: number) => (
                <span key={idx} className="badge-pill badge-sky">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Safety Notes (Section 35) */}
          {scanResult.safety_notes && scanResult.safety_notes.length > 0 && (
            <div style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 600, marginBottom: '6px' }}>
                <AlertTriangle size={16} /> Safety & Handling Guidance:
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {scanResult.safety_notes.map((note: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Primary Next Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Identified by {scanResult.ai_provider || 'Waste2Worth Eco-Engine'}
            </span>
            <button
              onClick={() => onNavigateToIdeas(scanResult.detected_material, scanResult)}
              className="btn btn-primary btn-lg"
            >
              Generate Upcycling Ideas <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Section 6: Manual Correction Modal */}
      {showCorrectionModal && (
        <div className="modal-overlay" onClick={() => setShowCorrectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Correct Detected Material</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '18px' }}>
              Did our AI misidentify your waste? Select the exact material from the list below to update recommendations:
            </p>

            <select
              value={selectedCorrection}
              onChange={e => setSelectedCorrection(e.target.value)}
              className="input-field"
              style={{ marginBottom: '20px', cursor: 'pointer' }}
            >
              {materialList.map(mat => (
                <option key={mat} value={mat}>{mat}</option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitManualCorrection}
                className="btn btn-primary"
              >
                Confirm Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
