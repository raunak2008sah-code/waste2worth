import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// Global Search (Section 36)
router.get('/', (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q || q.length < 2) {
      return res.json({
        projects: [],
        creators: [],
        businesses: [],
        ideaQuestions: [],
        donations: [],
        query: q
      });
    }

    const searchParam = `%${q}%`;

    // 1. Projects
    const projects = db.prepare(`
      SELECT p.id, p.title, p.description, p.cover_image, p.difficulty, p.category, p.views_count,
             u.name as creator_name
      FROM projects p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?) OR LOWER(p.category) LIKE LOWER(?)
      LIMIT 6
    `).all(searchParam, searchParam, searchParam);

    // 2. Creators
    const creators = db.prepare(`
      SELECT id, name, username, avatar_url, bio, role
      FROM users
      WHERE (LOWER(name) LIKE LOWER(?) OR LOWER(username) LIKE LOWER(?) OR LOWER(bio) LIKE LOWER(?))
        AND role IN ('CREATOR', 'BUSINESS', 'USER')
      LIMIT 6
    `).all(searchParam, searchParam, searchParam);

    // 3. Businesses
    const businesses = db.prepare(`
      SELECT b.id, b.name, b.description, b.location, b.materials_used, u.name as owner_name
      FROM businesses b
      JOIN users u ON b.user_id = u.id
      WHERE LOWER(b.name) LIKE LOWER(?) OR LOWER(b.description) LIKE LOWER(?) OR LOWER(b.materials_used) LIKE LOWER(?)
      LIMIT 6
    `).all(searchParam, searchParam, searchParam);

    // 4. Idea Hub Questions
    const ideaQuestions = db.prepare(`
      SELECT q.id, q.material, q.question, q.created_at, u.name as author_name
      FROM idea_requests q
      JOIN users u ON q.user_id = u.id
      WHERE LOWER(q.material) LIKE LOWER(?) OR LOWER(q.question) LIKE LOWER(?)
      LIMIT 6
    `).all(searchParam, searchParam);

    // 5. Donations
    const donations = db.prepare(`
      SELECT d.id, d.material, d.quantity, d.unit, d.condition, d.approx_location, d.status
      FROM donations d
      WHERE (LOWER(d.material) LIKE LOWER(?) OR LOWER(d.description) LIKE LOWER(?))
        AND d.status != 'completed'
      LIMIT 6
    `).all(searchParam, searchParam);

    res.json({
      query: q,
      results: {
        projects,
        creators,
        businesses,
        ideaQuestions,
        donations
      }
    });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
