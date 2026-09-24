import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { aiService, CommentItem } from '../services/aiService';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// Get comments for a post
router.get('/posts/:id/comments', (req, res) => {
  try {
    const postId = req.params.id;
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.username as user_username, u.avatar_url as user_avatar, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId) as any[];

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// Add comment to a post
router.post('/posts/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const { content, parent_id } = req.body;
    const userId = req.user!.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const commentId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO comments (id, post_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, postId, userId, content.trim(), parent_id || null);

    analyticsService.track('comment_created', userId, { postId, commentId });

    // Send notification to post author if not self
    const post = db.prepare('SELECT user_id, title FROM project_posts WHERE id = ?').get(postId) as any;
    if (post && post.user_id !== userId) {
      const notifId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'comment', 'New Comment!', ?, ?)
      `).run(notifId, post.user_id, `${req.user!.name} commented on your project "${post.title}"`, `/posts/${postId}`);
    }

    const newComment = db.prepare(`
      SELECT c.*, u.name as user_name, u.username as user_username, u.avatar_url as user_avatar, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error('Comment creation error:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// AI Comment Manager: Trigger / Refresh AI Discussion Summary (Section 20)
router.post('/ai/comment-summary', async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const comments = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
    `).all(postId) as unknown as CommentItem[];

    const aiSummary = await aiService.summarizeComments(comments);

    const summaryId = crypto.randomUUID();
    const groupsJson = JSON.stringify(aiSummary.groups);
    const questionsJson = JSON.stringify(aiSummary.questions);
    const highlightsJson = JSON.stringify(aiSummary.highlights);

    db.prepare(`
      INSERT INTO comment_ai_summaries (id, post_id, summary, groups, questions, highlights, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(post_id) DO UPDATE SET
        summary = excluded.summary,
        groups = excluded.groups,
        questions = excluded.questions,
        highlights = excluded.highlights,
        generated_at = CURRENT_TIMESTAMP
    `).run(summaryId, postId, aiSummary.summary, groupsJson, questionsJson, highlightsJson);

    res.json({
      summary: aiSummary.summary,
      groups: aiSummary.groups,
      questions: aiSummary.questions,
      highlights: aiSummary.highlights,
      total_comments_analyzed: comments.length,
      ai_label: 'AI-generated discussion summary'
    });
  } catch (err) {
    console.error('Comment summary error:', err);
    res.status(500).json({ error: 'Failed to synthesize discussion summary' });
  }
});

// Delete own comment (Section 21)
router.delete('/comments/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const commentId = req.params.id;
    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(commentId) as any;

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'MODERATOR') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
