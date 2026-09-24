import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  MapPin,
  Search,
  CheckCircle,
  Clock,
  Send,
  MessageCircle,
  X,
  Truck,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Trash2,
  ArrowRight,
  Info,
  Check,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DonationHub: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [donations, setDonations] = useState<any[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchMaterial, setSearchMaterial] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'my_listings'>('all');

  // Listing creation modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newMaterial, setNewMaterial] = useState<string>('Cardboard Boxes');
  const [newCategory, setNewCategory] = useState<string>('Cardboard & Paper');
  const [newQuantity, setNewQuantity] = useState<string>('20');
  const [newUnit, setNewUnit] = useState<string>('boxes');
  const [newCondition, setNewCondition] = useState<string>('Clean & dry shipping cartons');
  const [newLocation, setNewLocation] = useState<string>('Andheri East, Mumbai');
  const [newExactAddress, setNewExactAddress] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('20 sturdy double-wall boxes suitable for student prototyping or craft storage.');
  const [newPhotos, setNewPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=700&q=80',
    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=700&q=80'
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [newPickupOption, setNewPickupOption] = useState<string>('Self Pickup & Local Delivery Available');
  const [newPickupAvailable, setNewPickupAvailable] = useState<boolean>(true);
  const [newDeliveryAvailable, setNewDeliveryAvailable] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filters state (Section 13 & 14)
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFulfillmentFilter, setSelectedFulfillmentFilter] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [donorStatusTab, setDonorStatusTab] = useState<string>('All');

  // Edit / Resubmit Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editListing, setEditListing] = useState<any | null>(null);

  // Request / Claim Material Modal (Sections 7, 8, 9, 10)
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [requestedQuantity, setRequestedQuantity] = useState<string>('10');
  const [requestMessage, setRequestMessage] = useState<string>('I need these materials for our school maker exhibition.');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupNotes, setPickupNotes] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  // In-app Messages Modal
  const [showMessagesModal, setShowMessagesModal] = useState<boolean>(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState<string>('');

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('w2w_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/donations';
      const params = new URLSearchParams();
      if (searchMaterial) params.append('search', searchMaterial);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      setDonations(data.donations || []);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDonationDetail = async (id: string) => {
    try {
      const token = localStorage.getItem('w2w_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/donations/${id}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setSelectedDonation({
          ...data.donation,
          requests: data.requests || [],
          isOwner: data.isOwner
        });
      }
    } catch (err) {
      showToast('Failed to load listing details', 'error');
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [searchMaterial]);

  // Handle Photo Upload with Type & Size Validation (Section 2)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) {
        showToast('Please upload valid photo image files only (PNG, JPG, WEBP).', 'error');
        return;
      }
      if (files[i].size > 5 * 1024 * 1024) {
        showToast(`File "${files[i].name}" exceeds the 5MB maximum file size limit.`, 'error');
        return;
      }
    }

    try {
      setIsUploadingPhoto(true);
      const token = localStorage.getItem('w2w_token');
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }

      const res = await fetch('/api/donations/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.urls && data.urls.length > 0) {
        setNewPhotos(prev => [...prev, ...data.urls]);
        showToast(`${data.urls.length} photo(s) uploaded successfully!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Create Donation Listing (Section 1, 2, 3, 11)
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to list materials', 'info');
      return;
    }

    if (newPhotos.length === 0) {
      showToast('At least one photo of the actual material you are donating is required.', 'error');
      return;
    }

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please provide a valid useful quantity (e.g. 10 or more).', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          material: newMaterial,
          category: newCategory,
          quantity: qty,
          unit: newUnit,
          condition: newCondition,
          approx_location: newLocation,
          exact_pickup_address: newExactAddress,
          description: newDescription,
          images: newPhotos,
          image_url: newPhotos[0],
          pickup_option: newPickupOption,
          pickup_available: newPickupAvailable,
          delivery_available: newDeliveryAvailable
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setShowCreateModal(false);
      fetchDonations();
    } catch (err: any) {
      showToast(err.message || 'Error creating donation listing', 'error');
    }
  };

  // Open Edit & Resubmit Modal
  const openEditModal = (don: any) => {
    setEditListing(don);
    setShowEditModal(true);
  };

  // Resubmit listing
  const handleResubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editListing) return;

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/donations/${editListing.id}/resubmit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          material: editListing.material,
          quantity: editListing.quantity,
          unit: editListing.unit,
          condition: editListing.condition,
          description: editListing.description,
          approx_location: editListing.approx_location,
          images: editListing.images,
          image_url: editListing.images?.[0] || editListing.image_url
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setShowEditModal(false);
      fetchDonations();
      if (selectedDonation?.id === editListing.id) {
        loadDonationDetail(editListing.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resubmit listing', 'error');
    }
  };

  // Submit Request for Material (with Self Pickup vs Delivery Fee Option)
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to request materials', 'info');
      return;
    }
    if (!selectedDonation) return;

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/donations/${selectedDonation.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requested_quantity: requestedQuantity,
          message: requestMessage,
          fulfillment_method: fulfillmentType,
          fulfillment_type: fulfillmentType,
          pickup_date: fulfillmentType === 'pickup' ? pickupDate : undefined,
          pickup_notes: fulfillmentType === 'pickup' ? pickupNotes : undefined,
          delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setShowRequestModal(false);
      loadDonationDetail(selectedDonation.id);
      fetchDonations();
    } catch (err: any) {
      showToast(err.message || 'Request failed', 'error');
    }
  };

  // Owner Responds to Material Request
  const handleRespondToRequest = async (requestId: string, decision: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/donations/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      if (selectedDonation) loadDonationDetail(selectedDonation.id);
      fetchDonations();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Update Fulfillment Status (Mark Ready for Pickup / Dispatched / Completed)
  const handleUpdateFulfillment = async (requestId: string, nextStatus: string) => {
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/donations/requests/${requestId}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ next_status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      if (selectedDonation) loadDonationDetail(selectedDonation.id);
      fetchDonations();
    } catch (err: any) {
      showToast(err.message || 'Failed to update fulfillment', 'error');
    }
  };

  // In-app Coordination Chat
  const openChat = async (reqObj: any) => {
    setActiveRequest(reqObj);
    setShowMessagesModal(true);
    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/donations/requests/${reqObj.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) {
      console.error('Chat load error:', err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeRequest) return;

    try {
      const token = localStorage.getItem('w2w_token');
      const res = await fetch(`/api/donations/requests/${activeRequest.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newChatMessage.trim() })
      });

      if (res.ok) {
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender_id: user?.id,
            sender_name: user?.name,
            message: newChatMessage.trim(),
            created_at: new Date().toISOString()
          }
        ]);
        setNewChatMessage('');
      }
    } catch (err) {
      showToast('Could not send message', 'error');
    }
  };

  // Calculate estimated delivery fee for modal matching backend formula
  const estimatedDeliveryFee = (() => {
    const qty = parseInt(requestedQuantity || '1', 10) || 1;
    const unit = selectedDonation?.unit?.toLowerCase() || 'units';
    const baseFee = 60;
    const perUnitFee = unit === 'kg' ? 5 : 2;
    const variableFee = Math.min(200, Math.max(0, qty * perUnitFee));
    return baseFee + variableFee;
  })();

  // Categories & Donor status tabs
  const categoriesList = [
    'All',
    'Cardboard & Paper',
    'Fabric & Textiles',
    'Glass & Ceramics',
    'Wood & Timber',
    'Plastics',
    'Metals',
    'Other'
  ];

  const donorStatusTabsList = [
    'All',
    'Pending Verification',
    'Verified',
    'Available',
    'Partially Claimed',
    'Fully Claimed',
    'Pickup',
    'Delivery',
    'Completed',
    'Rejected'
  ];

  // Filter listings by tab and category (Section 13 & 14)
  const displayedDonations = donations.filter(don => {
    // Category filter
    if (selectedCategory !== 'All') {
      if (!don.category || don.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    // Fulfillment filter
    if (selectedFulfillmentFilter === 'pickup' && don.pickup_available === 0) return false;
    if (selectedFulfillmentFilter === 'delivery' && don.delivery_available === 0) return false;

    const st = (don.status || '').toUpperCase();
    const vst = (don.verification_status || '').toUpperCase();

    if (filterTab === 'available') {
      return st === 'AVAILABLE' || st === 'PARTIALLY_CLAIMED';
    }

    if (filterTab === 'my_listings') {
      if (don.user_id !== user?.id) return false;
      if (donorStatusTab === 'All') return true;

      if (donorStatusTab === 'Pending Verification') {
        return st === 'PENDING_VERIFICATION' || st === 'UNDER_VERIFICATION' || vst === 'PENDING';
      }
      if (donorStatusTab === 'Verified') {
        return vst === 'VERIFIED' || st === 'AVAILABLE' || st === 'PARTIALLY_CLAIMED' || st === 'FULLY_CLAIMED' || st === 'COMPLETED';
      }
      if (donorStatusTab === 'Available') {
        return st === 'AVAILABLE';
      }
      if (donorStatusTab === 'Partially Claimed') {
        return st === 'PARTIALLY_CLAIMED';
      }
      if (donorStatusTab === 'Fully Claimed') {
        return st === 'FULLY_CLAIMED';
      }
      if (donorStatusTab === 'Pickup') {
        return don.pickup_available !== 0;
      }
      if (donorStatusTab === 'Delivery') {
        return don.delivery_available !== 0;
      }
      if (donorStatusTab === 'Completed') {
        return st === 'COMPLETED';
      }
      if (donorStatusTab === 'Rejected') {
        return st === 'REJECTED' || vst === 'REJECTED';
      }
      return true;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span className="badge-pill badge-emerald" style={{ marginBottom: '6px' }}>
            <Package size={14} /> Circular Material Marketplace
          </span>
          <h1 style={{ fontSize: '2.1rem' }}>Donate & Claim Reusable Materials</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px' }}>
            Connect with local students, schools, and makers. Surplus clean packaging and offcuts are 100% free — recipient pays delivery fee only if delivery is chosen.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              showToast('Please sign in to list materials', 'info');
              return;
            }
            setShowCreateModal(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Donate Surplus Materials
        </button>
      </div>

      {/* Trust & Quality Guidance Banner (Section 1 & 7) */}
      <div
        className="card-glass"
        style={{
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={22} color="var(--primary-400)" />
        </div>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <strong style={{ fontSize: '0.95rem', color: '#fff' }}>Useful Quantities & Verified Actual Photos Only</strong>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Donate materials in quantities that are useful for someone to reuse (e.g. 20 cardboard boxes, 5 kg fabric, 15 glass bottles, 10 wooden pieces). All listings undergo 24-hour verification. Material is 100% free; choose free self-pickup or paid local delivery.
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Search Input */}
        <div className="card-glass" style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="var(--text-dim)" />
            <input
              type="text"
              value={searchMaterial}
              onChange={e => setSearchMaterial(e.target.value)}
              placeholder="Search materials (Cardboard, Glass jars, Denim fabric, Wood scraps)..."
              className="input-field"
              style={{ border: 'none', background: 'transparent', padding: '6px 0', fontSize: '0.95rem' }}
            />
          </div>
          {searchMaterial && (
            <button onClick={() => setSearchMaterial('')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* View Selection Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTab('all')}
            className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Listings ({donations.length})
          </button>
          <button
            onClick={() => setFilterTab('available')}
            className={`btn btn-sm ${filterTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Available Now ({donations.filter(d => (d.status || '').toUpperCase() === 'AVAILABLE' || (d.status || '').toUpperCase() === 'PARTIALLY_CLAIMED').length})
          </button>
          {user && (
            <button
              onClick={() => setFilterTab('my_listings')}
              className={`btn btn-sm ${filterTab === 'my_listings' ? 'btn-primary' : 'btn-secondary'}`}
            >
              My Listed Materials ({donations.filter(d => d.user_id === user.id).length})
            </button>
          )}
        </div>

        {/* Category Filter Chips (Section 14) */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '4px' }}>Category:</span>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Fulfillment Method Filter (Section 14) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Fulfillment Filter:</span>
          <button
            onClick={() => setSelectedFulfillmentFilter('all')}
            className={`badge-pill ${selectedFulfillmentFilter === 'all' ? 'badge-sky' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: selectedFulfillmentFilter === 'all' ? '1px solid var(--primary-400)' : '1px solid var(--border-subtle)' }}
          >
            All Fulfillment Options
          </button>
          <button
            onClick={() => setSelectedFulfillmentFilter('pickup')}
            className={`badge-pill ${selectedFulfillmentFilter === 'pickup' ? 'badge-emerald' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: selectedFulfillmentFilter === 'pickup' ? '1px solid var(--primary-400)' : '1px solid var(--border-subtle)' }}
          >
            🚶 Self Pickup Available
          </button>
          <button
            onClick={() => setSelectedFulfillmentFilter('delivery')}
            className={`badge-pill ${selectedFulfillmentFilter === 'delivery' ? 'badge-amber' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: selectedFulfillmentFilter === 'delivery' ? '1px solid var(--primary-400)' : '1px solid var(--border-subtle)' }}
          >
            🚚 Delivery Available
          </button>
        </div>

        {/* Donor Management Dashboard: 10 Tabs (Section 13) */}
        {filterTab === 'my_listings' && (
          <div
            className="card-glass"
            style={{
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--primary-glow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} /> Donor Dashboard Status Tabs
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Track and manage your surplus donations
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {donorStatusTabsList.map(tabName => (
                <button
                  key={tabName}
                  onClick={() => setDonorStatusTab(tabName)}
                  className={`btn btn-sm ${donorStatusTab === tabName ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Listings on Left, Detail Panel on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedDonation ? '1.1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', alignItems: 'start' }}>
        {/* Listings Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading material listings...</p>
          ) : displayedDonations.length === 0 ? (
            <div className="card-glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Package size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>No materials found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                {filterTab === 'my_listings'
                  ? "You don't have any listings in this status tab. Click 'Donate Surplus Materials' above!"
                  : "Try clearing your search or category filters, or list surplus materials from your home or business."}
              </p>
            </div>
          ) : (
            displayedDonations.map(don => {
              const stUpper = (don.status || '').toUpperCase();
              const vstUpper = (don.verification_status || '').toUpperCase();
              const isPendingVerif = stUpper === 'PENDING_VERIFICATION' || stUpper === 'UNDER_VERIFICATION' || vstUpper === 'PENDING';
              const isRejected = stUpper === 'REJECTED' || stUpper === 'VERIFICATION_FAILED' || vstUpper === 'REJECTED';
              const isVerified = vstUpper === 'VERIFIED' || stUpper === 'AVAILABLE' || stUpper === 'PARTIALLY_CLAIMED' || stUpper === 'FULLY_CLAIMED' || stUpper === 'COMPLETED';
              const isOwner = don.user_id === user?.id;

              return (
                <div
                  key={don.id}
                  className={`card-glass card-interactive ${selectedDonation?.id === don.id ? 'border-primary' : ''}`}
                  onClick={() => loadDonationDetail(don.id)}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: selectedDonation?.id === don.id ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top Row: Photo + Core Info (Section 6 Card Redesign) */}
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {/* [REAL MATERIAL PHOTO] with badge */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                      <img
                        src={don.image_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&q=80'}
                        alt={don.material}
                        style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#34d399',
                          fontSize: '0.62rem',
                          padding: '2px 5px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600
                        }}
                      >
                        📷 Real Photo
                      </span>
                      {don.images && don.images.length > 1 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            fontSize: '0.62rem',
                            padding: '2px 5px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          +{don.images.length - 1}
                        </span>
                      )}
                    </div>

                    {/* Core Header Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Status Badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                        {isPendingVerif && (
                          <span className="badge-pill badge-amber" style={{ fontSize: '0.7rem' }}>
                            <Clock size={11} /> Verification in progress
                          </span>
                        )}
                        {isRejected && (
                          <span className="badge-pill" style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                            <AlertTriangle size={11} /> Verification Rejected
                          </span>
                        )}
                        {isVerified && !isPendingVerif && !isRejected && (
                          <span className="badge-pill badge-emerald" style={{ fontSize: '0.7rem' }}>
                            ✓ Verified
                          </span>
                        )}
                        {don.category && (
                          <span className="badge-pill badge-sky" style={{ fontSize: '0.65rem' }}>
                            {don.category}
                          </span>
                        )}
                        {isOwner && (
                          <span className="badge-pill badge-purple" style={{ fontSize: '0.65rem' }}>
                            Donation #{don.id.slice(0, 6)}
                          </span>
                        )}
                      </div>

                      {/* Title: Quantity + Material (e.g. 20 Cardboard Boxes) */}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '4px' }}>
                        {don.quantity} {don.material}
                      </h3>

                      {/* Condition: Good */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <strong>Condition:</strong> {don.condition}
                      </p>

                      {/* Available: 20 of 50 boxes (Section 6 Partial Claims Format) */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary-300)', fontWeight: 600 }}>
                        Available: <strong>{don.remaining_quantity} of {don.quantity} {don.unit}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Approximate Location */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--primary-400)" /> Approximate Location: <strong>{don.approx_location}</strong>
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>
                      Donor: <strong>{don.donor_name}</strong>
                    </span>
                  </div>

                  {/* FREE MATERIAL Banner + Pickup/Delivery availability (Section 6 & 7) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                          color: '#34d399',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.04em',
                          display: 'inline-block',
                          marginBottom: '3px'
                        }}
                      >
                        FREE MATERIAL
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Free material — recipient pays delivery only.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>{don.pickup_available !== 0 ? '🚶 Self pickup available' : 'Self pickup unavailable'}</span>
                      <span>{don.delivery_available !== 0 ? '🚚 Delivery available' : 'Delivery unavailable'}</span>
                    </div>
                  </div>

                  {/* Donor Lifecycle Stepper for Own Listings (Section 13) */}
                  {isOwner && (
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>Lifecycle Status:</span>
                        <span>{stUpper}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#34d399' }}>✓ Submitted</span>
                        <span style={{ color: isRejected ? '#f87171' : isVerified ? '#34d399' : 'var(--accent-amber)' }}>
                          {isRejected ? '⚠️ Rejected' : isVerified ? '✓ Verified' : '⏳ Verifying'}
                        </span>
                        <span style={{ color: (don.remaining_quantity < don.quantity) ? '#34d399' : 'var(--text-dim)' }}>
                          {(don.remaining_quantity < don.quantity) ? '✓ Claimed' : '○ Claim'}
                        </span>
                        <span style={{ color: (stUpper === 'COMPLETED') ? '#34d399' : 'var(--text-dim)' }}>
                          {(stUpper === 'COMPLETED') ? '✓ Completed' : '○ Completed'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rejected Re-submission Callout (Section 4) */}
                  {isRejected && (
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.8rem' }}>
                      <span style={{ color: '#f87171', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Rejection Reason: {don.rejection_reason || 'Photo or condition needs clarification'}
                      </span>
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(don);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '4px', fontSize: '0.75rem' }}
                        >
                          <RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Edit & Resubmit Listing
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons (Section 6) */}
                  <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr' : '1.2fr 1fr 1fr', gap: '8px' }}>
                    {isOwner ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDonationDetail(don.id);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                      >
                        Manage Listing & Requests ({don.requests_count || 0})
                      </button>
                    ) : isPendingVerif ? (
                      <button
                        disabled
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: 0.6, cursor: 'not-allowed', gridColumn: 'span 3' }}
                      >
                        <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Verification in progress. This can take up to 24 hours.
                      </button>
                    ) : isRejected ? (
                      <button
                        disabled
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: 0.6, cursor: 'not-allowed', gridColumn: 'span 3' }}
                      >
                        Listing not available
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDonationDetail(don.id);
                            setFulfillmentType('pickup');
                            setShowRequestModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Claim Material
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDonationDetail(don.id);
                            setFulfillmentType('pickup');
                            setShowRequestModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Collect material yourself for free"
                        >
                          Self Pickup (₹0)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDonationDetail(don.id);
                            setFulfillmentType('delivery');
                            setShowRequestModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Recipient pays only delivery fee"
                        >
                          <Truck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          Delivery
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Donation Detailed Panel & Status Tracking (Section 6) */}
        {selectedDonation && (
          <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '90px' }}>
            {/* Header with Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span
                    className={`badge-pill ${
                      selectedDonation.status === 'under_verification'
                        ? 'badge-amber'
                        : selectedDonation.status === 'verification_failed'
                        ? 'badge-amber'
                        : 'badge-emerald'
                    }`}
                  >
                    {selectedDonation.status === 'under_verification' && '🕒 Verification in progress'}
                    {selectedDonation.status === 'verification_failed' && '⚠️ Verification Failed'}
                    {selectedDonation.status === 'available' && '✓ Verified & Available'}
                    {selectedDonation.status === 'partially_claimed' && '✓ Partially Claimed'}
                    {selectedDonation.status === 'completed' && '✓ Fully Completed'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ID: {selectedDonation.id.slice(0, 8)}</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {selectedDonation.quantity} {selectedDonation.material}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDonation(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo Gallery Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <img
                src={selectedDonation.image_url}
                alt={selectedDonation.material}
                style={{ width: '100%', height: '220px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
              />
              {selectedDonation.images && selectedDonation.images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {selectedDonation.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      onClick={() => setSelectedDonation((prev: any) => ({ ...prev, image_url: img }))}
                      style={{
                        width: '60px',
                        height: '50px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: selectedDonation.image_url === img ? '2px solid var(--primary-400)' : '1px solid var(--border-subtle)'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Verification Notice (If Under Verification or Failed) */}
            {selectedDonation.status === 'under_verification' && (
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                  <Clock size={16} /> 24-Hour Safety & Authenticity Check
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  This donation was submitted and is undergoing verification. Our community moderators ensure photos depict actual reusable materials and sensible quantities. Listings auto-verify within 24 hours.
                </p>
              </div>
            )}

            {selectedDonation.status === 'verification_failed' && (
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                  <AlertTriangle size={16} /> Verification Update Needed
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Reason: <strong>{selectedDonation.verification_notes || 'Photos or description did not meet community reuse standards.'}</strong>
                </p>
                {selectedDonation.isOwner && (
                  <button onClick={() => openEditModal(selectedDonation)} className="btn btn-primary btn-sm">
                    <RefreshCw size={13} /> Edit & Resubmit Listing
                  </button>
                )}
              </div>
            )}

            {/* Stepper Status Tracking (Section 6) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
                {selectedDonation.isOwner ? 'Donor Lifecycle Tracking' : 'Material Progress'}
              </span>

              {selectedDonation.isOwner ? (
                /* Donor Lifecycle: Submitted -> Verification -> Verified -> Claimed -> Pickup/Delivery -> Completed */
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', fontSize: '0.75rem' }}>
                  {[
                    { label: 'Submitted', done: true },
                    { label: 'Verification', done: selectedDonation.status !== 'under_verification' && selectedDonation.status !== 'verification_failed', active: selectedDonation.status === 'under_verification' },
                    { label: 'Verified', done: selectedDonation.status === 'available' || selectedDonation.status === 'partially_claimed' || selectedDonation.status === 'completed' },
                    { label: 'Claimed', done: selectedDonation.status === 'partially_claimed' || selectedDonation.status === 'completed' },
                    { label: 'Completed', done: selectedDonation.status === 'completed' }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: step.done ? 'var(--primary-500)' : step.active ? 'var(--accent-amber)' : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      >
                        {step.done ? <Check size={12} /> : idx + 1}
                      </div>
                      <span style={{ color: step.done ? 'var(--primary-300)' : step.active ? 'var(--accent-amber)' : 'var(--text-dim)', textAlign: 'center' }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Recipient Lifecycle: Requested -> Approved -> Pickup/Delivery -> Completed */
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  {[
                    { label: 'Requested', done: selectedDonation.requests && selectedDonation.requests.length > 0 },
                    { label: 'Approved', done: selectedDonation.requests?.some((r: any) => r.status === 'accepted' || r.status === 'completed') },
                    { label: 'Pickup / Delivery', done: selectedDonation.requests?.some((r: any) => r.fulfillment_status === 'ready_for_pickup' || r.fulfillment_status === 'preparing_delivery') },
                    { label: 'Completed', done: selectedDonation.requests?.some((r: any) => r.status === 'completed') }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: step.done ? 'var(--primary-500)' : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      >
                        {step.done ? <Check size={12} /> : idx + 1}
                      </div>
                      <span style={{ color: step.done ? 'var(--primary-300)' : 'var(--text-dim)' }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory & Location Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.5)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>Remaining Stock</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--primary-400)' }}>
                  {selectedDonation.remaining_quantity} {selectedDonation.unit}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                  (Initial Total: {selectedDonation.quantity} {selectedDonation.unit})
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.5)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>Approximate Area</span>
                <strong style={{ display: 'block' }}>{selectedDonation.approx_location}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Exact pickup point shared in chat</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Description & Reuse Notes</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {selectedDonation.description || 'No additional details provided.'}
              </p>
            </div>

            {/* Private Exact Address Protection (Section 8 & 11) */}
            {selectedDonation.exact_pickup_address ? (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-400)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  <Shield size={14} /> Confirmed Exact Pickup Location (Verified & Private)
                </div>
                <p style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontWeight: 500 }}>
                  📍 {selectedDonation.exact_pickup_address}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                  Disclosed exclusively to the listing owner and approved claimant.
                </span>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                🔒 <strong>Privacy Protection:</strong> Exact street address stays private until pickup/delivery arrangements are confirmed.
              </div>
            )}

            {/* Request CTA Button (If not owner & available) */}
            {user && !selectedDonation.isOwner && selectedDonation.remaining_quantity > 0 && selectedDonation.status !== 'under_verification' && selectedDonation.status !== 'PENDING_VERIFICATION' && selectedDonation.status !== 'verification_failed' && selectedDonation.status !== 'REJECTED' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setFulfillmentType('pickup');
                    setShowRequestModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Request Material
                </button>
              </div>
            )}

            {/* Incoming Requests Section (Owner View) */}
            {selectedDonation.isOwner && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>
                  Incoming Material Requests ({selectedDonation.requests?.length || 0})
                </h4>

                {(!selectedDonation.requests || selectedDonation.requests.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No requests received yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDonation.requests.map((reqItem: any) => (
                      <div
                        key={reqItem.id}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{reqItem.requester_name}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span className={`badge-pill ${reqItem.status === 'accepted' ? 'badge-emerald' : reqItem.status === 'completed' ? 'badge-sky' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                              {reqItem.fulfillment_status ? reqItem.fulfillment_status.replace(/_/g, ' ').toUpperCase() : reqItem.status.toUpperCase()}
                            </span>
                            <span className="badge-pill badge-sky" style={{ fontSize: '0.7rem' }}>
                              {reqItem.fulfillment_type === 'delivery' ? `🚚 Delivery (Fee: ₹${reqItem.delivery_fee})` : '🚶 Self Pickup'}
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Requested: <strong>{reqItem.requested_quantity} {selectedDonation.unit}</strong> — "{reqItem.message}"
                        </p>

                        {reqItem.delivery_address && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                            📍 Delivery Address: {reqItem.delivery_address}
                          </p>
                        )}

                        {reqItem.pickup_date && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                            📅 Preferred Pickup: {new Date(reqItem.pickup_date).toLocaleString()}
                          </p>
                        )}

                        {/* Status advancement actions */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {reqItem.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRespondToRequest(reqItem.id, 'accept')}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Accept & Claim
                              </button>
                              <button
                                onClick={() => handleRespondToRequest(reqItem.id, 'reject')}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {reqItem.status === 'accepted' && reqItem.fulfillment_status !== 'completed' && reqItem.fulfillment_status !== 'COMPLETED' && (
                            <>
                              {/* Self Pickup Steps: CLAIMED -> PICKUP_SCHEDULED -> PICKED_UP -> COMPLETED */}
                              {reqItem.fulfillment_type === 'pickup' && (
                                <>
                                  {(reqItem.fulfillment_status === 'PICKUP_SCHEDULED' || reqItem.fulfillment_status === 'ready_for_pickup') && (
                                    <button
                                      onClick={() => handleUpdateFulfillment(reqItem.id, 'PICKED_UP')}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      ✓ Mark Handed Over (Picked Up)
                                    </button>
                                  )}
                                  {reqItem.fulfillment_status === 'PICKED_UP' && (
                                    <button
                                      onClick={() => handleUpdateFulfillment(reqItem.id, 'COMPLETED')}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      ✓ Mark Completed
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Delivery Steps: CLAIMED -> DELIVERY_REQUESTED -> DELIVERY_SCHEDULED -> DELIVERED -> COMPLETED */}
                              {reqItem.fulfillment_type === 'delivery' && (
                                <>
                                  {reqItem.fulfillment_status === 'DELIVERY_REQUESTED' && (
                                    <button
                                      onClick={() => handleUpdateFulfillment(reqItem.id, 'DELIVERY_SCHEDULED')}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      🚚 Schedule Delivery Courier
                                    </button>
                                  )}
                                  {reqItem.fulfillment_status === 'DELIVERY_SCHEDULED' && (
                                    <button
                                      onClick={() => handleUpdateFulfillment(reqItem.id, 'DELIVERED')}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      📦 Mark Out for Delivery / Delivered
                                    </button>
                                  )}
                                  {reqItem.fulfillment_status === 'DELIVERED' && (
                                    <button
                                      onClick={() => handleUpdateFulfillment(reqItem.id, 'COMPLETED')}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      ✓ Mark Completed
                                    </button>
                                  )}
                                </>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => openChat(reqItem)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <MessageCircle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Chat with Requester
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recipient View of My Own Request on this Item */}
            {!selectedDonation.isOwner && selectedDonation.requests && selectedDonation.requests.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Your Material Request</h4>
                {selectedDonation.requests.map((myReq: any) => (
                  <div key={myReq.id} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className={`badge-pill ${myReq.status === 'accepted' ? 'badge-emerald' : myReq.status === 'completed' ? 'badge-sky' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                        {myReq.fulfillment_status ? myReq.fulfillment_status.replace(/_/g, ' ').toUpperCase() : myReq.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {myReq.fulfillment_type === 'delivery' ? `🚚 Delivery (Fee: ₹${myReq.delivery_fee})` : '🚶 Self Pickup (Free)'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Requested {myReq.requested_quantity} {selectedDonation.unit}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => openChat(myReq)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        <MessageCircle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Message Donor
                      </button>

                      {myReq.status === 'accepted' && myReq.fulfillment_status !== 'completed' && myReq.fulfillment_status !== 'COMPLETED' && (
                        <>
                          {myReq.fulfillment_type === 'pickup' && (
                            <button
                              onClick={() => handleUpdateFulfillment(myReq.id, 'COMPLETED')}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              ✓ Confirm Material Picked Up & Complete
                            </button>
                          )}
                          {myReq.fulfillment_type === 'delivery' && (
                            <button
                              onClick={() => handleUpdateFulfillment(myReq.id, 'COMPLETED')}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              ✓ Confirm Delivery Received & Complete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE DONATION MODAL (Sections 1, 2, 3, 7) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span className="badge-pill badge-emerald" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
                  24-Hour Verified Listing
                </span>
                <h3 style={{ fontSize: '1.4rem' }}>List Surplus Material for Donation</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Guidance Callout (Sections 1 & 7) */}
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <p>💡 <strong>Listing Guidelines:</strong></p>
              <ul style={{ paddingLeft: '18px', marginTop: '4px', lineHeight: 1.5 }}>
                <li>Donate when you have a <strong>useful quantity</strong> of material (e.g. 20 boxes, 5 kg fabric, 15 bottles).</li>
                <li>Materials should be in <strong>usable, clean, and safe condition</strong>.</li>
                <li>Upload photos of the <strong>actual material</strong>. Stock or generated images are prohibited.</li>
                <li>Your listing enters a <strong>24-hour verification check</strong> before becoming available.</li>
              </ul>
            </div>

            <form onSubmit={handleCreateDonation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Photo Upload Section (Section 2) */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Material Photos * <span style={{ color: '#34d399', fontWeight: 400 }}>(Upload photos of the actual material you are donating)</span>
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  At least 1 photo required. Do not use stock or generated images.
                </div>

                {/* Previews Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  {newPhotos.map((photoUrl, idx) => (
                    <div key={idx} style={{ position: 'relative', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={photoUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button Box */}
                  <label
                    style={{
                      height: '80px',
                      borderRadius: 'var(--radius-sm)',
                      border: '2px dashed var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'rgba(15, 23, 42, 0.4)',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <Upload size={18} color="var(--primary-400)" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {isUploadingPhoto ? 'Uploading...' : '+ Add Photo'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Material Name */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Material Name / Type *
                </label>
                <input
                  type="text"
                  value={newMaterial}
                  onChange={e => setNewMaterial(e.target.value)}
                  placeholder="e.g. 20 Cardboard Boxes, 5 kg Fabric, 15 Glass Bottles, 10 Wooden Pieces"
                  required
                  className="input-field"
                />
              </div>

              {/* Material Category */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Material Category *
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="Cardboard & Paper">Cardboard & Paper</option>
                  <option value="Fabric & Textiles">Fabric & Textiles</option>
                  <option value="Glass & Ceramics">Glass & Ceramics</option>
                  <option value="Wood & Timber">Wood & Timber</option>
                  <option value="Plastics">Plastics</option>
                  <option value="Metals">Metals</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Quantity & Unit (Section 1) */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Quantity Available *
                    </label>
                    <input
                      type="number"
                      value={newQuantity}
                      onChange={e => setNewQuantity(e.target.value)}
                      required
                      min="1"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Unit of Measurement
                    </label>
                    <select
                      value={newUnit}
                      onChange={e => setNewUnit(e.target.value)}
                      className="input-field"
                    >
                      <option value="boxes">boxes</option>
                      <option value="bottles">bottles</option>
                      <option value="kg">kg (kilograms)</option>
                      <option value="jars">jars</option>
                      <option value="sheets">sheets</option>
                      <option value="meters">meters</option>
                      <option value="items">items / pieces</option>
                    </select>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                  💡 <em>Please list a useful quantity that another maker can realistically reuse (e.g. 20 cardboard boxes, 5 kg fabric, 15 glass bottles, 10 wooden pieces).</em>
                </span>
              </div>

              {/* Condition */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Condition *
                </label>
                <input
                  type="text"
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  placeholder="e.g. Single-use clean cartons, dry, no tape residues"
                  required
                  className="input-field"
                />
              </div>

              {/* Approximate Area (Publicly visible) */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Approximate Neighborhood / Area * <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(Publicly visible)</span>
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Andheri East, Mumbai or Koramangala, Bengaluru"
                  required
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  Shown on the public marketplace so recipients know the general area.
                </span>
              </div>

              {/* Exact Residential Address (Privacy protected) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Exact Residential / Pickup Address *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Shield size={12} /> Strictly Private
                  </span>
                </div>
                <input
                  type="text"
                  value={newExactAddress}
                  onChange={e => setNewExactAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Building 5, Green Acres, Marol Naka"
                  required
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '3px' }}>
                  🔒 <em>Your exact address stays private until pickup/delivery arrangements are confirmed.</em>
                </span>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Description & Useful Details
                </label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Explain approximate sizes, dimensions, recommended uses, or storage details..."
                  rows={3}
                  className="input-field textarea-field"
                />
              </div>

              {/* Fulfillment Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pickup & Delivery Availability</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newPickupAvailable}
                    onChange={e => setNewPickupAvailable(e.target.checked)}
                  />
                  Self pickup available (Recipient collects material from your approximate area)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newDeliveryAvailable}
                    onChange={e => setNewDeliveryAvailable(e.target.checked)}
                  />
                  Allow local delivery (Recipient pays delivery fee; material is 100% free)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit for 24-hr Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT & RESUBMIT MODAL (Section 3) */}
      {showEditModal && editListing && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.3rem' }}>Edit & Resubmit Listing</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {editListing.verification_notes && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '14px', fontSize: '0.85rem', color: '#f87171' }}>
                <strong>Verification feedback:</strong> {editListing.verification_notes}
              </div>
            )}

            <form onSubmit={handleResubmitListing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Material Name
                </label>
                <input
                  type="text"
                  value={editListing.material}
                  onChange={e => setEditListing({ ...editListing, material: e.target.value })}
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
                    type="number"
                    value={editListing.quantity}
                    onChange={e => setEditListing({ ...editListing, quantity: e.target.value })}
                    required
                    min="1"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editListing.unit}
                    onChange={e => setEditListing({ ...editListing, unit: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Condition
                </label>
                <input
                  type="text"
                  value={editListing.condition}
                  onChange={e => setEditListing({ ...editListing, condition: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Approximate Area
                </label>
                <input
                  type="text"
                  value={editListing.approx_location}
                  onChange={e => setEditListing({ ...editListing, approx_location: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={editListing.description || ''}
                  onChange={e => setEditListing({ ...editListing, description: e.target.value })}
                  rows={3}
                  className="input-field textarea-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Resubmit for 24-hr Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST MATERIAL MODAL (Section 4: Self Pickup vs Delivery Fee Option) */}
      {showRequestModal && selectedDonation && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span className="badge-pill badge-emerald" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
                  Claim Free Material
                </span>
                <h3 style={{ fontSize: '1.3rem' }}>Request {selectedDonation.material}</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Available: <strong>{selectedDonation.remaining_quantity} {selectedDonation.unit}</strong> • From {selectedDonation.donor_name} in {selectedDonation.approx_location}.
            </p>

            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quantity */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Quantity Needed *
                </label>
                <input
                  type="number"
                  value={requestedQuantity}
                  onChange={e => setRequestedQuantity(e.target.value)}
                  max={selectedDonation.remaining_quantity}
                  min="1"
                  required
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  Partial claims supported: request only what you need.
                </span>
              </div>

              {/* Fulfillment Method Selection (Section 4) */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Fulfillment Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Option A: Self Pickup */}
                  <div
                    onClick={() => setFulfillmentType('pickup')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: fulfillmentType === 'pickup' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                      border: fulfillmentType === 'pickup' ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                      <CheckCircle size={14} color={fulfillmentType === 'pickup' ? 'var(--primary-400)' : 'var(--text-dim)'} />
                      Option A: Self Pickup
                    </div>
                    <span style={{ color: 'var(--primary-400)', fontWeight: 700, fontSize: '0.85rem', display: 'block' }}>
                      Delivery Fee: ₹0
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                      Prefer to save the delivery fee? Choose self pickup.
                    </span>
                  </div>

                  {/* Option B: Delivery */}
                  <div
                    onClick={() => setFulfillmentType('delivery')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: fulfillmentType === 'delivery' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                      border: fulfillmentType === 'delivery' ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                      <Truck size={14} color={fulfillmentType === 'delivery' ? 'var(--primary-400)' : 'var(--text-dim)'} />
                      Option B: Delivery
                    </div>
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.85rem', display: 'block' }}>
                      Delivery Fee: ₹{estimatedDeliveryFee}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                      Recipient pays only the delivery fee. Material remains free.
                    </span>
                  </div>
                </div>
              </div>

              {/* Self Pickup Options if pickup selected (Section 8) */}
              {fulfillmentType === 'pickup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                    <MapPin size={15} /> Approximate Pickup Location: {selectedDonation.approx_location}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    🔒 <em>Your exact address stays private until pickup/delivery arrangements are confirmed.</em>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Preferred Pickup Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={pickupDate}
                      onChange={e => setPickupDate(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Pickup Instructions / Notes
                    </label>
                    <input
                      type="text"
                      value={pickupNotes}
                      onChange={e => setPickupNotes(e.target.value)}
                      placeholder="e.g. Will arrive at 5 PM with a cloth bag / small vehicle"
                      className="input-field"
                    />
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                    💡 <strong>Save the delivery fee with self pickup.</strong>
                  </span>
                </div>
              )}

              {/* Delivery Address Input if Delivery selected (Section 9) */}
              {fulfillmentType === 'delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    📦 <em>Free material — recipient pays delivery only.</em>
                  </span>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Delivery Drop-Off Address / Landmark *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Flat 301, Tower B, Hiranandani Gardens, Powai, Mumbai"
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {/* Transparent Price Breakdown (Section 7, 8, 9) */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>MATERIAL:</span>
                  <strong style={{ color: 'var(--primary-400)' }}>₹0 (FREE MATERIAL)</strong>
                </div>
                {fulfillmentType === 'delivery' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>DELIVERY:</span>
                      <strong>₹{estimatedDeliveryFee}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>TOTAL DELIVERY PAYMENT:</span>
                      <span style={{ color: 'var(--accent-amber)' }}>
                        ₹{estimatedDeliveryFee}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                      Material is free. You only pay the delivery fee.
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>DELIVERY:</span>
                      <strong style={{ color: 'var(--primary-400)' }}>₹0 (Self Pickup)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>TOTAL PAYMENT:</span>
                      <span style={{ color: 'var(--primary-400)' }}>
                        ₹0 (100% Free)
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  What project are you building? *
                </label>
                <textarea
                  value={requestMessage}
                  onChange={e => setRequestMessage(e.target.value)}
                  placeholder="Explain how you plan to reuse this material (e.g. school exhibition, planter, art piece)..."
                  required
                  rows={2}
                  className="input-field textarea-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Request Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP COORDINATION CHAT MODAL (Section 4 & 28) */}
      {showMessagesModal && activeRequest && (
        <div className="modal-overlay" onClick={() => setShowMessagesModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Coordination Chat</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Coordinate safe contactless collection or delivery without sharing phone numbers.
                </span>
              </div>
              <button onClick={() => setShowMessagesModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', marginBottom: '14px', padding: '10px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-sm)' }}>
              {chatMessages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                  No messages yet. Say hello and coordinate pickup timing or delivery confirmation!
                </p>
              ) : (
                chatMessages.map(m => (
                  <div
                    key={m.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: m.sender_id === user?.id ? 'var(--primary-glow)' : 'rgba(30, 41, 59, 0.8)',
                      alignSelf: m.sender_id === user?.id ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', fontWeight: 600 }}>
                      {m.sender_name}
                    </span>
                    <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>{m.message}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newChatMessage}
                onChange={e => setNewChatMessage(e.target.value)}
                placeholder="Type coordination message..."
                className="input-field"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
