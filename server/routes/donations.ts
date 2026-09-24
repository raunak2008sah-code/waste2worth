import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// Configurable verification duration in hours (Section 5)
export const VERIFICATION_WINDOW_HOURS = 24;

// Moderation rule: Auto-verification only if explicitly enabled in config/env (Section 5)
// Default is FALSE to ensure human moderation safety, while surfacing overdue items to admins.
export const AUTO_VERIFY_ENABLED = process.env.AUTO_VERIFY_ENABLED === 'true';

// Auto-verify helper if explicitly enabled by business rules
export function autoVerifyExpiredDonations() {
  if (!AUTO_VERIFY_ENABLED) {
    return;
  }
  try {
    const result = db.prepare(`
      UPDATE donations
      SET status = 'AVAILABLE',
          verification_status = 'VERIFIED',
          verified_at = CURRENT_TIMESTAMP
      WHERE (status = 'PENDING_VERIFICATION' OR status = 'under_verification' OR verification_status = 'PENDING')
        AND datetime('now') >= datetime(COALESCE(verification_deadline, datetime(created_at, '+24 hours')))
    `).run();

    if (result.changes > 0) {
      console.log(`[Donations] Auto-verified ${result.changes} listings past ${VERIFICATION_WINDOW_HOURS}-hour window.`);
    }
  } catch (err) {
    console.error('Error during auto-verification check:', err);
  }
}

// Modular Delivery Fee Calculator (Section 7 & 9)
// Material is always ₹0. Recipient only pays the calculated delivery fee if delivery is chosen.
export function calculateDeliveryFee(quantity: number, unit: string): number {
  const baseFee = 60; // Base delivery fee in ₹
  const unitLower = (unit || '').toLowerCase();
  let weightFactor = 1;
  if (unitLower.includes('kg')) weightFactor = 4;
  if (unitLower.includes('box')) weightFactor = 1;
  
  const additionalFee = Math.ceil(Math.min(quantity * weightFactor, 60));
  return baseFee + additionalFee; // Standard ₹60 to ₹120 fee
}

// Multiple Photo Upload for Donations (Section 2)
router.post('/upload', authMiddleware, upload.array('photos', 5), (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one photo of the actual material you are donating.' });
    }

    const urls = files.map(file => `/uploads/${file.filename}`);
    res.status(201).json({
      message: `${urls.length} photo(s) uploaded successfully`,
      urls
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload donation photos' });
  }
});

// List Donations (Section 6, 11, 14)
router.get('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    autoVerifyExpiredDonations();

    const {
      material,
      category,
      status,
      search,
      location,
      pickup_available,
      delivery_available
    } = req.query;

    const currentUserId = req.user?.id;
    const isElevatedUser = req.user?.role === 'ADMIN' || req.user?.role === 'MODERATOR';

    // Privacy (Section 11): Notice exact_pickup_address is NEVER selected in public list
    let query = `
      SELECT d.id, d.user_id, d.material, d.category, d.quantity, d.remaining_quantity,
             d.unit, d.condition, d.description, d.approx_location, d.is_location_public,
             d.image_url, d.images, d.pickup_option, d.pickup_available, d.delivery_available,
             d.estimated_delivery_fee, d.status, d.verification_status, d.rejection_reason,
             d.submitted_at, d.verification_deadline, d.verified_at, d.created_at,
             u.name as donor_name, u.avatar_url as donor_avatar,
             (SELECT COUNT(*) FROM donation_requests dr WHERE dr.donation_id = d.id) as requests_count
      FROM donations d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (material && material !== 'all') {
      query += ' AND LOWER(d.material) LIKE LOWER(?) ';
      params.push(`%${material}%`);
    }

    if (category && category !== 'all') {
      query += ' AND LOWER(d.category) = LOWER(?) ';
      params.push(category);
    }

    if (search) {
      query += ' AND (LOWER(d.material) LIKE LOWER(?) OR LOWER(d.description) LIKE LOWER(?) OR LOWER(d.approx_location) LIKE LOWER(?) OR LOWER(d.category) LIKE LOWER(?)) ';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location) {
      query += ' AND LOWER(d.approx_location) LIKE LOWER(?) ';
      params.push(`%${location}%`);
    }

    if (pickup_available === 'true' || pickup_available === '1') {
      query += ' AND d.pickup_available = 1 ';
    }

    if (delivery_available === 'true' || delivery_available === '1') {
      query += ' AND d.delivery_available = 1 ';
    }

    // Visibility rules:
    // Regular public users ONLY see verified, claimable inventory (AVAILABLE, PARTIALLY_CLAIMED).
    // Donors can see their own listings regardless of status (including PENDING_VERIFICATION, REJECTED).
    // Admins/Moderators can see all.
    if (status && status !== 'all') {
      query += ' AND (LOWER(d.status) = LOWER(?) OR LOWER(d.verification_status) = LOWER(?)) ';
      params.push(status, status);
    } else if (isElevatedUser) {
      // Admins see all active/pending items
      query += " AND d.status NOT IN ('COMPLETED', 'completed') ";
    } else if (currentUserId) {
      query += ` AND (
        d.status IN ('AVAILABLE', 'available', 'PARTIALLY_CLAIMED', 'partially_claimed')
        OR d.user_id = ?
      ) `;
      params.push(currentUserId);
    } else {
      query += " AND d.status IN ('AVAILABLE', 'available', 'PARTIALLY_CLAIMED', 'partially_claimed') ";
    }

    query += ' ORDER BY d.created_at DESC LIMIT 50 ';

    const rawDonations = db.prepare(query).all(...params) as any[];

    const donations = rawDonations.map(don => {
      let photoList: string[] = [];
      try {
        if (don.images) photoList = JSON.parse(don.images);
      } catch (e) {}
      if (photoList.length === 0 && don.image_url) {
        photoList = [don.image_url];
      }

      return {
        ...don,
        images: photoList,
        image_url: photoList[0] || don.image_url,
        isOwner: currentUserId === don.user_id,
        // Check if listing has reached verification deadline
        is_overdue: don.verification_deadline ? new Date() > new Date(don.verification_deadline) : false
      };
    });

    res.json({ donations });
  } catch (err) {
    console.error('Failed to retrieve donations:', err);
    res.status(500).json({ error: 'Failed to retrieve donations' });
  }
});

// Create Donation Listing (Sections 1, 2, 3, 5, 11)
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      material,
      category = 'Cardboard',
      quantity,
      unit = 'items',
      condition,
      description,
      approx_location,
      exact_pickup_address,
      is_location_public = true,
      image_url,
      images,
      pickup_option = 'Self Pickup & Local Delivery Available',
      pickup_available = true,
      delivery_available = true
    } = req.body;

    const parsedQty = parseInt(quantity, 10);
    if (!material || isNaN(parsedQty) || parsedQty <= 0 || !condition || !approx_location) {
      return res.status(400).json({
        error: 'Please provide material name, a useful positive quantity, condition, and approximate area.'
      });
    }

    // Section 2: Mandatory Actual Material Photo Requirement
    let photoList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      photoList = images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    } else if (image_url && typeof image_url === 'string' && image_url.trim().length > 0) {
      photoList = [image_url.trim()];
    }

    if (photoList.length === 0) {
      return res.status(400).json({
        error: 'At least one photo of the actual material you are donating is required. Please upload photos before submitting.'
      });
    }

    const donationId = crypto.randomUUID();
    const userId = req.user!.id;
    const primaryImage = photoList[0];
    const imagesJson = JSON.stringify(photoList);
    const estimatedFee = calculateDeliveryFee(parsedQty, unit);

    // Initial state: PENDING_VERIFICATION (Sections 3 & 5)
    const initialStatus = 'PENDING_VERIFICATION';
    const initialVerificationStatus = 'PENDING';

    db.prepare(`
      INSERT INTO donations (
        id, user_id, material, category, quantity, remaining_quantity, unit,
        condition, description, approx_location, exact_pickup_address, is_location_public,
        image_url, images, pickup_option, pickup_available, delivery_available,
        estimated_delivery_fee, status, verification_status,
        submitted_at, verification_deadline
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        CURRENT_TIMESTAMP, datetime('now', '+24 hours')
      )
    `).run(
      donationId,
      userId,
      material.trim(),
      category || 'Cardboard',
      parsedQty,
      parsedQty,
      unit.trim() || 'items',
      condition.trim(),
      description ? description.trim() : '',
      approx_location.trim(),
      exact_pickup_address ? exact_pickup_address.trim() : null,
      is_location_public ? 1 : 0,
      primaryImage,
      imagesJson,
      pickup_option,
      pickup_available ? 1 : 0,
      delivery_available ? 1 : 0,
      estimatedFee,
      initialStatus,
      initialVerificationStatus
    );

    analyticsService.track('donation_created', userId, {
      donationId,
      material,
      quantity: parsedQty,
      status: initialStatus
    });

    // Notify donor of 24-hour verification process
    const notifId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'donation_verification', 'Donation Submitted for 24h Verification', ?, ?)
    `).run(
      notifId,
      userId,
      `Your listing for ${parsedQty} ${unit} of ${material} has been submitted. Our team verifies listings within 24 hours.`,
      `/donations/${donationId}`
    );

    res.status(201).json({
      message: 'Donation submitted! It is now under 24-hour verification before becoming publicly available.',
      donationId,
      status: initialStatus,
      verification_status: initialVerificationStatus
    });
  } catch (err) {
    console.error('Donation create error:', err);
    res.status(500).json({ error: 'Failed to create donation listing' });
  }
});

// Edit & Resubmit Rejected or Pending Donation Listing (Section 4)
router.put('/:id/resubmit', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const donationId = req.params.id;
    const userId = req.user!.id;
    const {
      material,
      category,
      quantity,
      unit,
      condition,
      description,
      approx_location,
      exact_pickup_address,
      images,
      image_url,
      pickup_option,
      pickup_available,
      delivery_available
    } = req.body;

    const existing = db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Donation listing not found' });
    }

    if (existing.user_id !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the original donor can edit this listing' });
    }

    let photoList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      photoList = images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    } else if (image_url) {
      photoList = [image_url];
    } else {
      try {
        photoList = existing.images ? JSON.parse(existing.images) : [existing.image_url];
      } catch (e) {
        photoList = [existing.image_url];
      }
    }

    if (photoList.length === 0) {
      return res.status(400).json({ error: 'At least one photo of the actual material is required.' });
    }

    const parsedQty = quantity ? parseInt(quantity, 10) : existing.quantity;
    const primaryImage = photoList[0];
    const imagesJson = JSON.stringify(photoList);

    // Reset status to PENDING_VERIFICATION and clear failure notes
    db.prepare(`
      UPDATE donations
      SET material = ?,
          category = ?,
          quantity = ?,
          remaining_quantity = ?,
          unit = ?,
          condition = ?,
          description = ?,
          approx_location = ?,
          exact_pickup_address = ?,
          image_url = ?,
          images = ?,
          pickup_option = ?,
          pickup_available = ?,
          delivery_available = ?,
          status = 'PENDING_VERIFICATION',
          verification_status = 'PENDING',
          rejection_reason = NULL,
          verification_notes = NULL,
          submitted_at = CURRENT_TIMESTAMP,
          verification_deadline = datetime('now', '+24 hours'),
          rejected_at = NULL
      WHERE id = ?
    `).run(
      material || existing.material,
      category || existing.category || 'Cardboard',
      parsedQty,
      parsedQty,
      unit || existing.unit,
      condition || existing.condition,
      description !== undefined ? description : existing.description,
      approx_location || existing.approx_location,
      exact_pickup_address !== undefined ? exact_pickup_address : existing.exact_pickup_address,
      primaryImage,
      imagesJson,
      pickup_option || existing.pickup_option,
      pickup_available !== undefined ? (pickup_available ? 1 : 0) : existing.pickup_available,
      delivery_available !== undefined ? (delivery_available ? 1 : 0) : existing.delivery_available,
      donationId
    );

    res.json({
      message: 'Listing resubmitted successfully! It is now in the 24-hour verification queue.',
      status: 'PENDING_VERIFICATION'
    });
  } catch (err) {
    console.error('Resubmit error:', err);
    res.status(500).json({ error: 'Failed to resubmit listing' });
  }
});

// Get Single Donation with Request Details & Privacy Enforcement (Section 11)
router.get('/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    autoVerifyExpiredDonations();

    const donationId = req.params.id;
    const currentUserId = req.user?.id;

    const donation = db.prepare(`
      SELECT d.*, u.name as donor_name, u.username as donor_username, u.avatar_url as donor_avatar
      FROM donations d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(donationId) as any;

    if (!donation) {
      return res.status(404).json({ error: 'Donation listing not found' });
    }

    let photoList: string[] = [];
    try {
      if (donation.images) {
        photoList = JSON.parse(donation.images);
      }
    } catch (e) {}
    if (photoList.length === 0 && donation.image_url) {
      photoList = [donation.image_url];
    }
    donation.images = photoList;

    const isOwner = currentUserId === donation.user_id;

    // Requests query
    let requests: any[] = [];
    let isAcceptedRequester = false;

    if (currentUserId) {
      if (isOwner || req.user?.role === 'ADMIN') {
        requests = db.prepare(`
          SELECT dr.*, u.name as requester_name, u.avatar_url as requester_avatar, u.username as requester_username
          FROM donation_requests dr
          JOIN users u ON dr.requester_id = u.id
          WHERE dr.donation_id = ?
          ORDER BY dr.created_at DESC
        `).all(donationId);
      } else {
        requests = db.prepare(`
          SELECT dr.*, u.name as requester_name, u.avatar_url as requester_avatar, u.username as requester_username
          FROM donation_requests dr
          JOIN users u ON dr.requester_id = u.id
          WHERE dr.donation_id = ? AND dr.requester_id = ?
          ORDER BY dr.created_at DESC
        `).all(donationId, currentUserId);

        isAcceptedRequester = requests.some(r => r.status === 'accepted' || r.status === 'completed');
      }
    }

    // Privacy Protection (Section 11): Only disclose exact_pickup_address to the owner or an accepted recipient
    if (!isOwner && !isAcceptedRequester && req.user?.role !== 'ADMIN') {
      delete donation.exact_pickup_address;
    }

    res.json({
      donation,
      requests,
      isOwner
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve donation listing' });
  }
});

// Claim Material / Request from Listing (Section 7, 8, 9, 10, 17)
router.post(['/:id/request', '/:id/claim'], authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const donationId = req.params.id;
    const {
      requested_quantity,
      message,
      fulfillment_method = 'pickup', // 'pickup' | 'delivery'
      fulfillment_type,
      pickup_date,
      pickup_notes,
      delivery_address
    } = req.body;
    const requesterId = req.user!.id;

    const chosenFulfillment = (fulfillment_method || fulfillment_type || 'pickup').toLowerCase();

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
    if (!donation) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Rule: User cannot request own material
    if (donation.user_id === requesterId) {
      return res.status(400).json({ error: 'You cannot request your own listed materials' });
    }

    // Rule: Cannot claim pending or rejected listings
    const statusUpper = (donation.status || '').toUpperCase();
    const verifUpper = (donation.verification_status || '').toUpperCase();

    if (statusUpper === 'PENDING_VERIFICATION' || statusUpper === 'UNDER_VERIFICATION' || verifUpper === 'PENDING') {
      return res.status(400).json({
        error: 'This material listing is currently under 24-hour verification. Requests will open once verified.'
      });
    }

    if (statusUpper === 'REJECTED' || statusUpper === 'VERIFICATION_FAILED' || verifUpper === 'REJECTED') {
      return res.status(400).json({
        error: 'This material listing did not pass verification and is not available for claiming.'
      });
    }

    const qty = parseInt(requested_quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Please request a quantity of at least 1.' });
    }

    if (qty > donation.remaining_quantity) {
      return res.status(400).json({
        error: `Cannot claim more than remaining quantity (${donation.remaining_quantity} ${donation.unit} available).`
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please explain what project or cause you need this material for.' });
    }

    // Material price is strictly ₹0 (Section 7)
    let fee = 0;
    if (chosenFulfillment === 'delivery') {
      if (!delivery_address || !delivery_address.trim()) {
        return res.status(400).json({ error: 'Please provide a delivery address or nearby landmark.' });
      }
      // Calculate server-side delivery fee (Section 9 & 17: Cannot be manipulated from frontend)
      fee = calculateDeliveryFee(qty, donation.unit);
    }

    const requestId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO donation_requests (
        id, donation_id, requester_id, requested_quantity, message,
        fulfillment_method, fulfillment_type, pickup_date, pickup_notes,
        delivery_fee, delivery_address, delivery_status, fulfillment_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'pending')
    `).run(
      requestId,
      donationId,
      requesterId,
      qty,
      message.trim(),
      chosenFulfillment,
      chosenFulfillment,
      pickup_date || null,
      pickup_notes || null,
      fee,
      delivery_address ? delivery_address.trim() : null
    );

    analyticsService.track('donation_requested', requesterId, {
      donationId,
      requested_quantity: qty,
      fulfillment_method: chosenFulfillment,
      delivery_fee: fee
    });

    // Notify donor
    const notifId = crypto.randomUUID();
    const methodLabel = chosenFulfillment === 'delivery' ? 'Local Delivery' : 'Self Pickup';
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'donation_request', 'New Material Claim Request', ?, ?)
    `).run(
      notifId,
      donation.user_id,
      `${req.user!.name} requested ${qty} ${donation.unit} of ${donation.material} (${methodLabel})!`,
      `/donations/${donationId}`
    );

    res.status(201).json({
      message: chosenFulfillment === 'delivery'
        ? `Claim submitted with Delivery option (Material: ₹0, Delivery Fee: ₹${fee}). Once approved, delivery will be scheduled.`
        : 'Claim submitted for Self Pickup (₹0 fee)! Coordinate safe collection with the donor once approved.',
      requestId,
      delivery_fee: fee,
      material_cost: 0
    });
  } catch (err) {
    console.error('Claim submission error:', err);
    res.status(500).json({ error: 'Failed to submit donation claim' });
  }
});

// Owner Responds to Claim Request (Accept / Reject / Partial Claim Flow) (Section 10)
router.post('/requests/:id/respond', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { decision } = req.body; // 'accept' or 'reject'
    const userId = req.user!.id;

    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be "accept" or "reject"' });
    }

    const request = db.prepare(`
      SELECT dr.*, d.user_id as donor_id, d.remaining_quantity, d.unit, d.material,
             d.exact_pickup_address, d.approx_location
      FROM donation_requests dr
      JOIN donations d ON dr.donation_id = d.id
      WHERE dr.id = ?
    `).get(requestId) as any;

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.donor_id !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the material owner can respond to requests' });
    }

    if (decision === 'accept') {
      const newRemaining = Math.max(0, request.remaining_quantity - request.requested_quantity);
      const newStatus = newRemaining === 0 ? 'FULLY_CLAIMED' : 'PARTIALLY_CLAIMED';

      db.prepare('UPDATE donations SET remaining_quantity = ?, status = ? WHERE id = ?').run(
        newRemaining,
        newStatus,
        request.donation_id
      );

      // Workflow transition:
      // Self Pickup -> PICKUP_SCHEDULED
      // Delivery -> DELIVERY_REQUESTED
      const isDelivery = (request.fulfillment_method || request.fulfillment_type) === 'delivery';
      const nextFulfillmentStatus = isDelivery ? 'DELIVERY_REQUESTED' : 'PICKUP_SCHEDULED';

      db.prepare(`
        UPDATE donation_requests 
        SET status = 'accepted',
            fulfillment_status = ?,
            delivery_status = ?
        WHERE id = ?
      `).run(nextFulfillmentStatus, nextFulfillmentStatus, requestId);

      analyticsService.track('donation_accepted', userId, {
        donationId: request.donation_id,
        quantityGiven: request.requested_quantity
      });

      // Notify requester with pickup or delivery coordination instructions
      const notifId = crypto.randomUUID();
      const methodText = isDelivery
        ? `Delivery will be scheduled for your ${request.requested_quantity} ${request.unit}.`
        : `Your claim for ${request.requested_quantity} ${request.unit} is approved! Arrange safe pickup via chat.`;

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'donation_accepted', 'Material Claim Approved! 📦', ?, ?)
      `).run(
        notifId,
        request.requester_id,
        `Your request for ${request.requested_quantity} ${request.unit} of ${request.material} was approved! ${methodText}`,
        `/donations/${request.donation_id}`
      );

      return res.json({
        message: `Claim approved! Status updated to ${newStatus}. Remaining: ${newRemaining} ${request.unit}.`,
        status: 'accepted',
        fulfillment_status: nextFulfillmentStatus,
        remaining_quantity: newRemaining
      });
    } else {
      db.prepare("UPDATE donation_requests SET status = 'rejected', fulfillment_status = 'cancelled' WHERE id = ?").run(requestId);
      return res.json({ message: 'Request declined', status: 'rejected' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request response' });
  }
});

// Update Fulfillment Status (Section 10: Pickup / Delivery Step Advancement)
router.post('/requests/:id/fulfill', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { next_status } = req.body;
    const userId = req.user!.id;

    const request = db.prepare(`
      SELECT dr.*, d.user_id as donor_id, d.material, d.unit, d.remaining_quantity
      FROM donation_requests dr
      JOIN donations d ON dr.donation_id = d.id
      WHERE dr.id = ?
    `).get(requestId) as any;

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isDonor = request.donor_id === userId;
    const isRecipient = request.requester_id === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isDonor && !isRecipient && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to update fulfillment status' });
    }

    const validStatuses = [
      'PICKUP_SCHEDULED', 'PICKED_UP', 'ready_for_pickup',
      'DELIVERY_REQUESTED', 'DELIVERY_SCHEDULED', 'DELIVERED', 'out_for_delivery',
      'COMPLETED', 'completed'
    ];

    if (!validStatuses.includes(next_status)) {
      return res.status(400).json({ error: `Invalid fulfillment status. Allowed: ${validStatuses.join(', ')}` });
    }

    const isCompleted = next_status === 'COMPLETED' || next_status === 'completed';

    db.prepare(`
      UPDATE donation_requests
      SET fulfillment_status = ?,
          delivery_status = ?,
          status = CASE WHEN ? = 1 THEN 'completed' ELSE status END,
          completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `).run(next_status, next_status, isCompleted ? 1 : 0, isCompleted ? 1 : 0, requestId);

    if (isCompleted) {
      // If remaining quantity of donation is 0, ensure donation completion_status is marked completed
      if (request.remaining_quantity === 0) {
        db.prepare("UPDATE donations SET status = 'COMPLETED', completion_status = 'completed' WHERE id = ?").run(request.donation_id);
      }

      analyticsService.track('donation_completed', userId, {
        requestId,
        donationId: request.donation_id,
        quantity: request.requested_quantity
      });

      // Notify other participant
      const otherUserId = isDonor ? request.requester_id : request.donor_id;
      const notifId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'donation_completed', 'Material Exchange Completed! 🎉', ?, ?)
      `).run(
        notifId,
        otherUserId,
        `Material exchange for ${request.requested_quantity} ${request.unit} of ${request.material} is marked as completed!`,
        `/donations/${request.donation_id}`
      );
    }

    res.json({
      message: `Fulfillment status updated to ${next_status}`,
      fulfillment_status: next_status
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update fulfillment status' });
  }
});

// In-app Messages between Donor and Requester (Section 8, 10, 11)
router.get('/requests/:id/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const userId = req.user!.id;

    // Verify participant or admin
    const request = db.prepare(`
      SELECT dr.requester_id, d.user_id as donor_id
      FROM donation_requests dr
      JOIN donations d ON dr.donation_id = d.id
      WHERE dr.id = ?
    `).get(requestId) as any;

    if (!request || (request.requester_id !== userId && request.donor_id !== userId && req.user!.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Unauthorized to view these messages' });
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM donation_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.request_id = ?
      ORDER BY m.created_at ASC
    `).all(requestId);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/requests/:id/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { message } = req.body;
    const userId = req.user!.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const msgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO donation_messages (id, request_id, sender_id, message)
      VALUES (?, ?, ?, ?)
    `).run(msgId, requestId, userId, message.trim());

    res.status(201).json({ message: 'Message sent', id: msgId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
