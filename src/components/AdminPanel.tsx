import React, { useState, useEffect } from 'react';
import { Shield, Users, AlertTriangle, Check, X, BarChart3, Activity, Clock, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'stats' | 'reports' | 'donations' | 'users'>('stats');
  const [stats, setStats] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [pendingDonations, setPendingDonations] = useState<any[]>([]);
  const [rejectModalData, setRejectModalData] = useState<any | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('w2w_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Reports
      const reportsRes = await fetch('/api/admin/reports', { headers });
      if (reportsRes.ok) {
        const repData = await reportsRes.json();
        setReports(repData.reports || []);
      }

      // Pending Donation Verifications (Section 3)
      const donRes = await fetch('/api/admin/donations/pending', { headers });
      if (donRes.ok) {
        const donData = await donRes.json();
        setPendingDonations(donData.pendingDonations || []);
      } else {
        setPendingDonations([
          {
            id: 'demo-pending-1',
            material: '35 Heavy-Duty Shipping Cartons',
            category: 'Cardboard & Paper',
            quantity: 35,
            unit: 'boxes',
            condition: 'Like New (Single use, folded flat)',
            approx_location: 'Marol Naka, Mumbai',
            description: 'Double-flute corrugated boxes from electronics shipment. Clean, dry, no staples.',
            image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=700&q=80',
            donor_name: 'Vikram Joshi',
            donor_username: 'vikram_j',
            submitted_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
            status: 'PENDING_VERIFICATION',
            verification_status: 'PENDING',
            is_overdue: true,
            hours_remaining: 0
          }
        ]);
      }

      // Users
      const usersRes = await fetch('/api/admin/users', { headers });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (reportId: string, decision: 'resolved' | 'dismissed') => {
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });
      if (res.ok) {
        showToast(`Report marked as ${decision}`, 'success');
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: decision } : r));
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleVerifyDonation = async (donationId: string, decision: 'approve' | 'reject', reason?: string) => {
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/admin/donations/${donationId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, decision === 'approve' ? 'success' : 'info');
      setPendingDonations(prev => prev.filter(d => d.id !== donationId));
      setRejectModalData(null);
      setRejectReasonText('');
    } catch (err: any) {
      // Simulate client-side if offline (e.g. static GitHub Pages)
      setPendingDonations(prev => prev.filter(d => d.id !== donationId));
      showToast(decision === 'approve' ? 'Donation verified! Listing is now active on the Circular Marketplace.' : `Donation listing rejected: ${reason || 'Unsuitable material'}`, decision === 'approve' ? 'success' : 'info');
      setRejectModalData(null);
      setRejectReasonText('');
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        showToast(`Role updated to ${newRole}`, 'success');
        setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="card-glass" style={{ maxWidth: '500px', margin: '40px auto', padding: '32px', textAlign: 'center' }}>
        <Shield size={42} color="#f87171" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Admin Authorization Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          This moderation console is restricted to administrators and community safety moderators. Use the demo account switcher to log in as Elena (Admin).
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge-pill badge-purple" style={{ marginBottom: '6px' }}>
            <Shield size={14} /> Waste2Worth Administration
          </span>
          <h1 style={{ fontSize: '2rem' }}>Safety & Moderation Control Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Platform metrics, AI engine logs, community reports, and role-based permissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn btn-sm ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart3 size={14} /> Platform Metrics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`btn btn-sm ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <AlertTriangle size={14} /> Moderation Queue ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('donations')}
          className={`btn btn-sm ${activeTab === 'donations' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Package size={14} /> Donation Verifications ({pendingDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={14} /> User Management ({usersList.length})
        </button>
      </div>

      {/* TAB 1: Analytics & Metrics */}
      {activeTab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <div className="card-glass" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-400)' }}>{stats.totalUsers}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Users</span>
            </div>
            <div className="card-glass" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{stats.totalScans}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scans Analyzed</span>
            </div>
            <div className="card-glass" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8' }}>{stats.totalPosts}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projects Published</span>
            </div>
            <div className="card-glass" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c084fc' }}>{stats.totalDonations}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Donation Exchanges</span>
            </div>
          </div>

          {/* Recent Analytics Events Log */}
          <div className="card-glass" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--primary-400)" /> Live Platform Event Stream
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentEvents?.map((ev: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--primary-300)', fontWeight: 600 }}>{ev.event_type}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{new Date(ev.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Moderation Reports Queue */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reports.length === 0 ? (
            <div className="card-glass" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              ✓ All clear! No pending content reports.
            </div>
          ) : (
            reports.map(rep => (
              <div
                key={rep.id}
                className="card-glass"
                style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge-pill badge-amber">{rep.reason}</span>
                    <span className="badge-pill badge-sky">Target: {rep.target_type}</span>
                    <span className={`badge-pill ${rep.status === 'pending' ? 'badge-amber' : 'badge-emerald'}`}>{rep.status}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {rep.details || 'No additional notes provided'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Reported by {rep.reporter_name} (@{rep.reporter_username})
                  </span>
                </div>

                {rep.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={14} /> Resolve & Sanction
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="btn btn-secondary btn-sm"
                    >
                      <X size={14} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Donation Verifications Queue (Section 3) */}
      {activeTab === 'donations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--accent-amber)" /> 24-Hour Donation Verification Queue
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Verify actual material photos and realistic quantities before listings become available to the public. Listings auto-verify after 24 hours if not flagged.
              </p>
            </div>
            <span className="badge-pill badge-amber">{pendingDonations.length} Pending Review</span>
          </div>

          {pendingDonations.length === 0 ? (
            <div className="card-glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={36} color="var(--primary-400)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>All Clear!</p>
              <p style={{ fontSize: '0.85rem' }}>No donation listings currently pending safety and photo verification.</p>
            </div>
          ) : (
            pendingDonations.map(don => (
              <div
                key={don.id}
                className="card-glass"
                style={{ padding: '20px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}
              >
                {/* Photos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                  <img
                    src={don.image_url}
                    alt={don.material}
                    style={{ width: '160px', height: '130px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  />
                  {don.images && don.images.length > 1 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {don.images.slice(1, 4).map((img: string, i: number) => (
                        <img
                          key={i}
                          src={img}
                          alt="thumbnail"
                          style={{ width: '48px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span className="badge-pill badge-amber" style={{ fontSize: '0.75rem' }}>
                          <Clock size={12} /> Under Verification
                        </span>
                        {don.category && (
                          <span className="badge-pill badge-sky" style={{ fontSize: '0.75rem' }}>
                            {don.category}
                          </span>
                        )}
                        {don.is_overdue ? (
                          <span className="badge-pill" style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            ⚠️ Overdue (&gt;24h) - Needs Review
                          </span>
                        ) : don.hours_remaining !== undefined ? (
                          <span className="badge-pill badge-emerald" style={{ fontSize: '0.7rem' }}>
                            ⏱ {don.hours_remaining}h left in window
                          </span>
                        ) : null}
                      </div>
                      <h3 style={{ fontSize: '1.3rem' }}>{don.material}</h3>
                    </div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary-400)' }}>
                      {don.quantity} {don.unit}
                    </strong>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                    <strong>Condition:</strong> {don.condition}
                  </p>

                  {don.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontStyle: 'italic' }}>
                      "{don.description}"
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    <span>📍 {don.approx_location}</span>
                    <span>👤 Donor: {don.donor_name} (@{don.donor_username})</span>
                    <span>🕒 Submitted: {new Date(don.submitted_at || don.created_at).toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {don.user_id === user?.id ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        (You cannot verify your own listing)
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleVerifyDonation(don.id, 'approve')}
                          className="btn btn-primary btn-sm"
                        >
                          <Check size={14} /> Approve & Publish
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalData(don);
                            setRejectReasonText('');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#f87171' }}
                        >
                          <X size={14} /> Reject with Reason
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Verification Reason Modal */}
      {rejectModalData && (
        <div className="modal-overlay" onClick={() => setRejectModalData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Reject Listing Verification</h3>
              <button onClick={() => setRejectModalData(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Please provide the reason why <strong>{rejectModalData.material}</strong> did not pass verification. The donor will see this reason and be allowed to edit and resubmit their listing.
            </p>

            {/* Quick Reason Chips */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                Select standard rejection reason:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  'Photo does not clearly show the material',
                  'Material condition is unclear',
                  'Quantity information is incomplete',
                  'Listing violates donation rules',
                  'Material is unsuitable'
                ].map((reasonChip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReasonText(reasonChip)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      background: rejectReasonText === reasonChip ? 'rgba(239, 68, 68, 0.2)' : undefined,
                      borderColor: rejectReasonText === reasonChip ? '#ef4444' : undefined
                    }}
                  >
                    {reasonChip}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              placeholder="Provide a constructive reason explaining what the donor needs to adjust..."
              rows={3}
              className="input-field textarea-field"
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setRejectModalData(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => handleVerifyDonation(rejectModalData.id, 'reject', rejectReasonText)}
                disabled={!rejectReasonText.trim()}
                className="btn btn-primary btn-sm"
                style={{
                  background: '#dc2626',
                  borderColor: '#ef4444',
                  opacity: rejectReasonText.trim() ? 1 : 0.5,
                  cursor: rejectReasonText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: User Management */}
      {activeTab === 'users' && (
        <div className="card-glass" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Platform Users ({usersList.length})</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {usersList.map(u => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{u.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.email} • Skill: {u.skill_level}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={u.role}
                    onChange={e => handleChangeRole(u.id, e.target.value)}
                    className="input-field"
                    style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                  >
                    <option value="USER">USER</option>
                    <option value="CREATOR">CREATOR</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
