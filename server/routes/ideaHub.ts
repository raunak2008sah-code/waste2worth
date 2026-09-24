import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';

const router = Router();

// List Questions
router.get('/questions', (req, res) => {
  try {
    const { material, status } = req.query;

    let query = `
      SELECT q.*, 
             u.name as author_name, 
             u.username as author_username, 
             u.avatar_url as author_avatar,
             (SELECT COUNT(*) FROM idea_responses r WHERE r.request_id = q.id) as responses_count
      FROM idea_requests q
      JOIN users u ON q.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (material && material !== 'all') {
      query += ' AND LOWER(q.material) LIKE LOWER(?) ';
      params.push(`%${material}%`);
    }

    if (status) {
      query += ' AND q.status = ? ';
      params.push(status);
    }

    query += ' ORDER BY q.created_at DESC LIMIT 50 ';

    const questions = db.prepare(query).all(...params) as any[];

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve questions' });
  }
});

// Post a new Question (Section 14 & 15)
router.post('/questions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { material, quantity, budget, skill_level, question } = req.body;
    const userId = req.user!.id;

    if (!material || !question) {
      return res.status(400).json({ error: 'Material and question text are required' });
    }

    const questionId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO idea_requests (id, user_id, material, quantity, budget, skill_level, question)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      questionId,
      userId,
      material,
      quantity || '1 unit',
      budget || 'Flexible',
      skill_level || 'Beginner',
      question
    );

    // Automatically generate an intelligent AI suggested idea to start the thread
    const generatedIdeas = await aiService.generateIdeas({ material, budget, skill_level, custom_prompt: question });
    const topIdea = generatedIdeas[0];

    if (topIdea) {
      const aiResponseId = crypto.randomUUID();
      const aiContent = `🤖 **Waste2Worth AI Suggestion: ${topIdea.title}**\n\n${topIdea.description}\n\n• **Difficulty:** ${topIdea.difficulty}\n• **Estimated Time:** ${topIdea.estimated_time}\n• **Key Materials:** ${topIdea.material_requirement}\n• **Tools Needed:** ${topIdea.tools.join(', ')}\n• **Sustainability:** ${topIdea.sustainability_explanation}`;

      db.prepare(`
        INSERT INTO idea_responses (id, request_id, user_id, content, is_ai_generated)
        VALUES (?, ?, NULL, ?, 1)
      `).run(aiResponseId, questionId, aiContent);
    }

    res.status(201).json({
      message: 'Question posted to Idea Hub!',
      questionId
    });
  } catch (err) {
    console.error('Question creation error:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Get Single Question and its Responses
router.get('/questions/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const questionId = req.params.id;
    const question = db.prepare(`
      SELECT q.*, 
             u.name as author_name, 
             u.username as author_username, 
             u.avatar_url as author_avatar
      FROM idea_requests q
      JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).get(questionId) as any;

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const responses = db.prepare(`
      SELECT r.*, 
             COALESCE(u.name, 'Waste2Worth AI') as author_name,
             COALESCE(u.username, 'w2w_ai') as author_username,
             COALESCE(u.avatar_url, 'https://api.dicebear.com/7.x/bottts/svg?seed=w2w_ai') as author_avatar,
             COALESCE(u.role, 'AI') as author_role
      FROM idea_responses r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.request_id = ?
      ORDER BY r.is_ai_generated DESC, (r.helpful_count + r.used_count * 2) DESC, r.created_at ASC
    `).all(questionId) as any[];

    res.json({
      question,
      responses
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve question details' });
  }
});

// Reply to a Question
router.post('/questions/:id/responses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const questionId = req.params.id;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Response content cannot be empty' });
    }

    const responseId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO idea_responses (id, request_id, user_id, content, is_ai_generated)
      VALUES (?, ?, ?, ?, 0)
    `).run(responseId, questionId, userId, content.trim());

    // Notify question author
    const question = db.prepare('SELECT user_id, material FROM idea_requests WHERE id = ?').get(questionId) as any;
    if (question && question.user_id !== userId) {
      const notifId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'idea_response', 'New Idea on Your Request!', ?, ?)
      `).run(notifId, question.user_id, `${req.user!.name} shared an idea for your ${question.material} request!`, `/idea-hub/${questionId}`);
    }

    res.status(201).json({
      message: 'Response shared successfully',
      responseId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post idea response' });
  }
});

// React to a Response ("This helped" or "I used this idea")
router.post('/responses/:id/react', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const responseId = req.params.id;
    const { reaction_type } = req.body; // 'helpful' or 'used'
    const userId = req.user!.id;

    if (!['helpful', 'used'].includes(reaction_type)) {
      return res.status(400).json({ error: 'Reaction type must be "helpful" or "used"' });
    }

    const existing = db.prepare('SELECT id FROM response_reactions WHERE response_id = ? AND user_id = ? AND reaction_type = ?').get(responseId, userId, reaction_type) as any;

    if (existing) {
      // Toggle off
      db.prepare('DELETE FROM response_reactions WHERE id = ?').run(existing.id);
      if (reaction_type === 'helpful') {
        db.prepare('UPDATE idea_responses SET helpful_count = MAX(0, helpful_count - 1) WHERE id = ?').run(responseId);
      } else {
        db.prepare('UPDATE idea_responses SET used_count = MAX(0, used_count - 1) WHERE id = ?').run(responseId);
      }
      return res.json({ reacted: false, reaction_type });
    } else {
      const reactId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO response_reactions (id, response_id, user_id, reaction_type)
        VALUES (?, ?, ?, ?)
      `).run(reactId, responseId, userId, reaction_type);

      if (reaction_type === 'helpful') {
        db.prepare('UPDATE idea_responses SET helpful_count = helpful_count + 1 WHERE id = ?').run(responseId);
      } else {
        db.prepare('UPDATE idea_responses SET used_count = used_count + 1 WHERE id = ?').run(responseId);
      }
      return res.json({ reacted: true, reaction_type });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to record reaction' });
  }
});

// Section 16: Idea Creator Connection ("Ask Creator")
router.post('/ask-creator', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { creator_id, idea_id, message } = req.body;
    const senderId = req.user!.id;

    if (!creator_id || !message) {
      return res.status(400).json({ error: 'Creator ID and message are required' });
    }

    const inquiryId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO creator_inquiries (id, sender_id, creator_id, idea_id, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(inquiryId, senderId, creator_id, idea_id || null, message);

    // Notify creator
    const notifId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'inquiry', 'New Creator Inquiry', ?, ?)
    `).run(notifId, creator_id, `${req.user!.name} asked for your advice on an upcycling idea: "${message.slice(0, 60)}..."`, `/profile`);

    res.status(201).json({
      message: 'Inquiry sent to creator! They will be notified through the platform while preserving contact privacy.',
      inquiryId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send creator inquiry' });
  }
});

export default router;
