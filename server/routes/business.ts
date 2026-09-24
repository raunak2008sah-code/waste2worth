import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { aiService, BusinessContext } from '../services/aiService';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// Generate Business Concepts (Section 22 & 56)
router.post('/ideas', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      material,
      quantity,
      budget,
      skill_level,
      available_tools,
      target_market,
      location
    } = req.body;

    if (!material) {
      return res.status(400).json({ error: 'Material is required to explore business concepts' });
    }

    const context: BusinessContext = {
      material,
      quantity: quantity || '50 units',
      budget: budget || '₹2,000',
      skill_level: skill_level || 'Beginner',
      available_tools: Array.isArray(available_tools) ? available_tools : [],
      target_market,
      location
    };

    analyticsService.track('business_created', req.user?.id, { material, budget });

    const concepts = await aiService.generateBusinessIdeas(context);

    res.json({
      material,
      context,
      concepts,
      legal_disclaimer: 'All financial figures, cost estimations, and suggested prices are preliminary planning projections, not guarantees of commercial profitability. Market validation and regulatory compliance remain the responsibility of the entrepreneur.',
      ai_provider: aiService.getProviderName()
    });
  } catch (err) {
    console.error('Business ideas generation error:', err);
    res.status(500).json({ error: 'Failed to generate business concepts' });
  }
});

// Help My Business AI Advisor (Section 25)
router.post('/help', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessName, materialsUsed, currentProducts, question } = req.body;

    const guidance = await aiService.helpBusiness({
      businessName,
      materialsUsed: Array.isArray(materialsUsed) ? materialsUsed : [materialsUsed || 'Recycled Materials'],
      currentProducts,
      question
    });

    res.json({
      guidance,
      ai_provider: aiService.getProviderName()
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to provide business recommendations' });
  }
});

// List Businesses (Section 24)
router.get('/', (req, res) => {
  try {
    const { material, search, location } = req.query;

    let query = `
      SELECT b.*, u.name as owner_name, u.avatar_url as owner_avatar,
             (SELECT COUNT(*) FROM business_products bp WHERE bp.business_id = b.id) as products_count
      FROM businesses b
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (material && material !== 'all') {
      query += ' AND LOWER(b.materials_used) LIKE LOWER(?) ';
      params.push(`%${material}%`);
    }

    if (search) {
      query += ' AND (LOWER(b.name) LIKE LOWER(?) OR LOWER(b.description) LIKE LOWER(?) OR LOWER(b.story) LIKE LOWER(?)) ';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location) {
      query += ' AND LOWER(b.location) LIKE LOWER(?) ';
      params.push(`%${location}%`);
    }

    query += ' ORDER BY b.created_at DESC LIMIT 30 ';

    const businesses = db.prepare(query).all(...params) as any[];

    const formatted = businesses.map(b => ({
      ...b,
      materials_used: b.materials_used ? JSON.parse(b.materials_used) : []
    }));

    res.json({ businesses: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get Business Detail by ID
router.get('/:id', (req, res) => {
  try {
    const businessId = req.params.id;
    const business = db.prepare(`
      SELECT b.*, u.name as owner_name, u.username as owner_username, u.avatar_url as owner_avatar
      FROM businesses b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(businessId) as any;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const products = db.prepare('SELECT * FROM business_products WHERE business_id = ? ORDER BY created_at DESC').all(businessId) as any[];
    const questions = db.prepare(`
      SELECT bq.*, u.name as user_name, u.avatar_url as user_avatar
      FROM business_questions bq
      JOIN users u ON bq.user_id = u.id
      WHERE bq.business_id = ?
      ORDER BY bq.created_at DESC
    `).all(businessId) as any[];

    res.json({
      business: {
        ...business,
        materials_used: business.materials_used ? JSON.parse(business.materials_used) : [],
        products: products.map(p => ({
          ...p,
          images: p.images ? JSON.parse(p.images) : [],
          materials: p.materials ? JSON.parse(p.materials) : []
        })),
        questions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve business profile' });
  }
});

// Create or Update Business Profile (Section 23)
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, story, location, website, contact_method, materials_used, logo_url } = req.body;
    const userId = req.user!.id;

    if (!name || !description) {
      return res.status(400).json({ error: 'Business name and description are required' });
    }

    // Check if user already has a business
    const existing = db.prepare('SELECT id FROM businesses WHERE user_id = ?').get(userId) as any;

    const materialsJson = JSON.stringify(Array.isArray(materials_used) ? materials_used : [materials_used || 'Upcycled Waste']);

    if (existing) {
      db.prepare(`
        UPDATE businesses
        SET name = ?, description = ?, story = ?, location = ?,
            website = ?, contact_method = ?, materials_used = ?, logo_url = ?
        WHERE id = ?
      `).run(name, description, story || '', location || '', website || '', contact_method || 'Platform messaging', materialsJson, logo_url || null, existing.id);

      return res.json({ message: 'Business profile updated', businessId: existing.id });
    } else {
      const businessId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO businesses (id, user_id, name, description, story, location, website, contact_method, materials_used, logo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(businessId, userId, name, description, story || '', location || '', website || '', contact_method || 'Platform messaging', materialsJson, logo_url || null);

      // Upgrade user role if regular user
      db.prepare("UPDATE users SET role = 'BUSINESS' WHERE id = ? AND role = 'USER'").run(userId);

      return res.status(201).json({ message: 'Business profile created', businessId });
    }
  } catch (err) {
    console.error('Business save error:', err);
    res.status(500).json({ error: 'Failed to save business profile' });
  }
});

// Add Product to Business Catalog
router.post('/:id/products', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.params.id;
    const userId = req.user!.id;

    // Verify ownership
    const business = db.prepare('SELECT user_id FROM businesses WHERE id = ?').get(businessId) as any;
    if (!business || (business.user_id !== userId && req.user!.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'You do not have permission to manage products for this business' });
    }

    const { name, description, price, currency = '₹', images, materials } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const productId = crypto.randomUUID();
    const imagesJson = JSON.stringify(Array.isArray(images) ? images : [images || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80']);
    const materialsJson = JSON.stringify(Array.isArray(materials) ? materials : ['Upcycled Materials']);

    db.prepare(`
      INSERT INTO business_products (id, business_id, name, description, price, currency, images, materials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(productId, businessId, name, description || '', Number(price), currency, imagesJson, materialsJson);

    res.status(201).json({ message: 'Product listed successfully', productId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Ask Business a Question
router.post('/:id/questions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.params.id;
    const { question } = req.body;
    const userId = req.user!.id;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question cannot be empty' });
    }

    const questionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO business_questions (id, business_id, user_id, question)
      VALUES (?, ?, ?, ?)
    `).run(questionId, businessId, userId, question.trim());

    // Notify business owner
    const business = db.prepare('SELECT user_id, name FROM businesses WHERE id = ?').get(businessId) as any;
    if (business && business.user_id !== userId) {
      const notifId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'business_inquiry', 'New Customer Question', ?, ?)
      `).run(notifId, business.user_id, `${req.user!.name} asked a question about ${business.name}: "${question.slice(0, 50)}..."`, `/businesses/${businessId}`);
    }

    res.status(201).json({ message: 'Question sent to business owner', questionId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

export default router;
