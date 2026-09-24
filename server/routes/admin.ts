import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// Submit a Report (Section 40)
router.post('/reports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { target_type, target_id, reason, details } = req.body;
    const reporterId = req.user!.id;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: 'Target type, target ID, and reason are required' });
    }

    const reportId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(reportId, reporterId, target_type, target_id, reason, details || '');

    res.status(201).json({
      message: 'Report submitted to community moderation team. Thank you for keeping Waste2Worth safe and constructive.',
      reportId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Admin Stats & Overview (Section 39 & 51)
router.get('/stats', authMiddleware, requireRole('ADMIN', 'MODERATOR'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = analyticsService.getAdminStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

// Admin Moderation Queue (Section 39 & 40)
router.get('/reports', authMiddleware, requireRole('ADMIN', 'MODERATOR'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT r.*, u.name as reporter_name, u.username as reporter_username
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (status && status !== 'all') {
      query += ' AND r.status = ? ';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC LIMIT 50 ';

    const reports = db.prepare(query).all(...params);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch moderation reports' });
  }
});

// Resolve or Dismiss a Report
router.post('/reports/:id/resolve', authMiddleware, requireRole('ADMIN', 'MODERATOR'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const reportId = req.params.id;
    const { decision, notes } = req.body; // 'resolved' or 'dismissed'

    if (!['resolved', 'dismissed', 'reviewing'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be resolved, dismissed, or reviewing' });
    }

    db.prepare(`
      UPDATE reports 
      SET status = ?, moderator_notes = ? 
      WHERE id = ?
    `).run(decision, notes || '', reportId);

    res.json({ message: `Report marked as ${decision}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Admin User Management: List Users and Change Roles (Section 39)
router.get('/users', authMiddleware, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT id, name, username, email, role, skill_level, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

router.post('/users/:id/role', authMiddleware, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!['USER', 'CREATOR', 'BUSINESS', 'MODERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetUserId);
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Admin Donation Verification Queue (Section 3, 4, 5, 17)
router.get('/donations/pending', authMiddleware, requireRole('ADMIN', 'MODERATOR'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const pendingDonations = db.prepare(`
      SELECT d.*, u.name as donor_name, u.username as donor_username, u.email as donor_email
      FROM donations d
      JOIN users u ON d.user_id = u.id
      WHERE d.status IN ('PENDING_VERIFICATION', 'under_verification') 
         OR d.verification_status IN ('PENDING', 'pending')
      ORDER BY d.created_at ASC
    `).all() as any[];

    const now = Date.now();

    const formatted = pendingDonations.map(don => {
      let photoList: string[] = [];
      try {
        if (don.images) photoList = JSON.parse(don.images);
      } catch (e) {}
      if (photoList.length === 0 && don.image_url) photoList = [don.image_url];

      const submittedTime = new Date(don.submitted_at || don.created_at).getTime();
      const deadlineTime = don.verification_deadline
        ? new Date(don.verification_deadline).getTime()
        : submittedTime + 24 * 3600 * 1000;
      
      const isOverdue = now > deadlineTime;
      const hoursRemaining = Math.max(0, Math.round((deadlineTime - now) / (3600 * 1000)));

      return {
        ...don,
        images: photoList,
        image_url: photoList[0] || don.image_url,
        is_overdue: isOverdue,
        hours_remaining: hoursRemaining
      };
    });

    res.json({ pendingDonations: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pending donation verifications' });
  }
});

// Admin Approve or Reject Donation Verification (Section 4 & 17)
router.post('/donations/:id/verify', authMiddleware, requireRole('ADMIN', 'MODERATOR'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const donationId = req.params.id;
    const { decision, reason } = req.body; // 'approve' or 'reject'
    const adminUserId = req.user!.id;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be "approve" or "reject"' });
    }

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
    if (!donation) {
      return res.status(404).json({ error: 'Donation listing not found' });
    }

    // Section 17 Security: Users cannot verify their own donation
    if (donation.user_id === adminUserId) {
      return res.status(403).json({ error: 'You cannot verify your own donation listing.' });
    }

    const notifId = crypto.randomUUID();

    if (decision === 'approve') {
      db.prepare(`
        UPDATE donations
        SET status = 'AVAILABLE',
            verification_status = 'VERIFIED',
            verified_at = CURRENT_TIMESTAMP,
            rejection_reason = NULL,
            verification_notes = NULL
        WHERE id = ?
      `).run(donationId);

      analyticsService.track('donation_verified', adminUserId, {
        donationId,
        material: donation.material
      });

      // Notify donor of successful verification
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'donation_verified', 'Donation Verified & Live! 📦', ?, ?)
      `).run(
        notifId,
        donation.user_id,
        `Your listing for ${donation.quantity} ${donation.unit} of ${donation.material} passed verification and is now live!`,
        `/donations/${donationId}`
      );

      return res.json({
        message: 'Donation listing approved and made available to the community!',
        status: 'AVAILABLE',
        verification_status: 'VERIFIED'
      });
    } else {
      // Section 4: If rejecting, require a rejection reason
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'A rejection reason is required when rejecting a donation.' });
      }

      const rejectReason = reason.trim();
      db.prepare(`
        UPDATE donations
        SET status = 'REJECTED',
            verification_status = 'REJECTED',
            rejection_reason = ?,
            verification_notes = ?,
            rejected_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(rejectReason, rejectReason, donationId);

      analyticsService.track('donation_rejected', adminUserId, {
        donationId,
        reason: rejectReason
      });

      // Notify donor with explanation and resubmission option
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'donation_rejected', 'Donation Verification Update', ?, ?)
      `).run(
        notifId,
        donation.user_id,
        `Your listing was not approved: "${rejectReason}". You can edit photos or details and resubmit.`,
        `/donations/${donationId}`
      );

      return res.json({
        message: 'Donation listing rejected. The donor has been notified with the reason to edit & resubmit.',
        status: 'REJECTED',
        verification_status: 'REJECTED',
        rejection_reason: rejectReason
      });
    }
  } catch (err) {
    console.error('Verify donation error:', err);
    res.status(500).json({ error: 'Failed to process donation verification' });
  }
});

export default router;
