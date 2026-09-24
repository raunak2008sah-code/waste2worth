import { db } from '../db';
import crypto from 'node:crypto';

export type AnalyticsEventType =
  | 'scan_started'
  | 'scan_completed'
  | 'idea_generated'
  | 'idea_regenerated'
  | 'idea_selected'
  | 'project_started'
  | 'project_completed'
  | 'project_shared'
  | 'post_created'
  | 'comment_created'
  | 'creator_followed'
  | 'business_created'
  | 'donation_created'
  | 'donation_requested'
  | 'donation_accepted'
  | 'donation_completed'
  | 'donation_verified'
  | 'donation_rejected';

class AnalyticsService {
  track(eventType: AnalyticsEventType, userId?: string, metadata?: Record<string, any>) {
    try {
      const id = crypto.randomUUID();
      const metaStr = metadata ? JSON.stringify(metadata) : null;
      db.prepare(`
        INSERT INTO analytics_events (id, user_id, event_type, metadata)
        VALUES (?, ?, ?, ?)
      `).run(id, userId || null, eventType, metaStr);
    } catch (err) {
      console.error('Analytics tracking error:', err);
    }
  }

  // Calculate actual, non-fabricated metrics from platform database
  getImpactMetrics(userId?: string) {
    if (userId) {
      // User-specific actual counts
      const scansCount = (db.prepare(`SELECT COUNT(*) as count FROM waste_scans WHERE user_id = ?`).get(userId) as any)?.count || 0;
      const projectsCompleted = (db.prepare(`SELECT COUNT(*) as count FROM project_posts WHERE user_id = ?`).get(userId) as any)?.count || 0;
      const materialsDonated = (db.prepare(`SELECT COALESCE(SUM(quantity - remaining_quantity), 0) as count FROM donations WHERE user_id = ?`).get(userId) as any)?.count || 0;
      const projectsShared = (db.prepare(`SELECT COUNT(*) as count FROM project_posts WHERE user_id = ?`).get(userId) as any)?.count || 0;

      return {
        materialsReused: scansCount,
        projectsCompleted,
        materialsDonated,
        projectsShared,
        isGlobal: false
      };
    }

    // Global actual counts
    const totalScans = (db.prepare(`SELECT COUNT(*) as count FROM waste_scans`).get() as any)?.count || 0;
    const totalCompletedProjects = (db.prepare(`SELECT COUNT(*) as count FROM project_posts`).get() as any)?.count || 0;
    const totalDonatedItems = (db.prepare(`SELECT COALESCE(SUM(quantity - remaining_quantity), 0) as count FROM donations`).get() as any)?.count || 0;
    const totalSharedPosts = (db.prepare(`SELECT COUNT(*) as count FROM project_posts`).get() as any)?.count || 0;

    return {
      materialsReused: totalScans,
      projectsCompleted: totalCompletedProjects,
      materialsDonated: totalDonatedItems,
      projectsShared: totalSharedPosts,
      isGlobal: true
    };
  }

  getAdminStats() {
    const totalUsers = (db.prepare(`SELECT COUNT(*) as count FROM users`).get() as any)?.count || 0;
    const totalScans = (db.prepare(`SELECT COUNT(*) as count FROM waste_scans`).get() as any)?.count || 0;
    const totalPosts = (db.prepare(`SELECT COUNT(*) as count FROM project_posts`).get() as any)?.count || 0;
    const totalDonations = (db.prepare(`SELECT COUNT(*) as count FROM donations`).get() as any)?.count || 0;
    const totalBusinesses = (db.prepare(`SELECT COUNT(*) as count FROM businesses`).get() as any)?.count || 0;
    const pendingReports = (db.prepare(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`).get() as any)?.count || 0;

    const recentEvents = db.prepare(`
      SELECT event_type, created_at, metadata 
      FROM analytics_events 
      ORDER BY created_at DESC 
      LIMIT 15
    `).all() as any[];

    return {
      totalUsers,
      totalScans,
      totalPosts,
      totalDonations,
      totalBusinesses,
      pendingReports,
      recentEvents
    };
  }
}

export const analyticsService = new AnalyticsService();
