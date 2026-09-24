import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// Discover Feed
router.get('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { material, tab, search, limit = '20', offset = '0' } = req.query;
    const currentUserId = req.user?.id;

    let query = `
      SELECT p.*, 
             u.name as creator_name, 
             u.username as creator_username, 
             u.avatar_url as creator_avatar,
             u.role as creator_role,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
             (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count
    `;

    if (currentUserId) {
      query += `,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = '${currentUserId}') as has_liked,
        EXISTS(SELECT 1 FROM saves s WHERE s.post_id = p.id AND s.user_id = '${currentUserId}') as has_saved,
        EXISTS(SELECT 1 FROM follows f WHERE f.following_id = p.user_id AND f.follower_id = '${currentUserId}') as is_following_creator
      `;
    } else {
      query += `, 0 as has_liked, 0 as has_saved, 0 as is_following_creator`;
    }

    query += ` FROM project_posts p
               JOIN users u ON p.user_id = u.id
               WHERE 1=1 `;

    const params: any[] = [];

    if (material && material !== 'all') {
      query += ` AND LOWER(p.waste_used) LIKE LOWER(?) `;
      params.push(`%${material}%`);
    }

    if (search) {
      query += ` AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?) OR LOWER(p.waste_used) LIKE LOWER(?)) `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (tab === 'trending') {
      query += ` ORDER BY (p.likes_count * 2 + p.views_count) DESC, p.created_at DESC `;
    } else {
      query += ` ORDER BY p.created_at DESC `;
    }

    query += ` LIMIT ? OFFSET ? `;
    params.push(Number(limit), Number(offset));

    const posts = db.prepare(query).all(...params) as any[];

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      waste_used: post.waste_used,
      quantity: post.quantity,
      before_image: post.before_image,
      after_image: post.after_image,
      process_images: post.process_images ? JSON.parse(post.process_images) : [],
      video_url: post.video_url,
      tools_used: post.tools_used ? JSON.parse(post.tools_used) : [],
      materials_used: post.materials_used ? JSON.parse(post.materials_used) : [],
      difficulty: post.difficulty,
      estimated_time: post.estimated_time,
      likes_count: post.likes_count || 0,
      saves_count: post.saves_count || 0,
      comments_count: post.comments_count || 0,
      has_liked: Boolean(post.has_liked),
      has_saved: Boolean(post.has_saved),
      is_following_creator: Boolean(post.is_following_creator),
      creator: {
        id: post.user_id,
        name: post.creator_name,
        username: post.creator_username,
        avatar: post.creator_avatar,
        role: post.creator_role
      },
      created_at: post.created_at
    }));

    res.json({
      posts: formattedPosts,
      total: formattedPosts.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (err) {
    console.error('Discover feed error:', err);
    res.status(500).json({ error: 'Failed to fetch discover feed' });
  }
});

// Create / Publish Project Post (Section 18)
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      waste_used,
      quantity,
      before_image,
      after_image,
      process_images,
      video_url,
      tools_used,
      materials_used,
      instructions,
      tips,
      difficulty,
      estimated_time
    } = req.body;

    if (!title || !description || !waste_used || !before_image || !after_image) {
      return res.status(400).json({ error: 'Please fill in title, description, waste used, and both before and after photos.' });
    }

    const postId = crypto.randomUUID();
    const userId = req.user!.id;

    db.prepare(`
      INSERT INTO project_posts (
        id, user_id, title, description, waste_used, quantity,
        before_image, after_image, process_images, video_url,
        tools_used, materials_used, instructions, tips,
        difficulty, estimated_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      postId,
      userId,
      title,
      description,
      waste_used,
      quantity || '1 item',
      before_image,
      after_image,
      process_images ? JSON.stringify(process_images) : '[]',
      video_url || null,
      tools_used ? JSON.stringify(tools_used) : '[]',
      materials_used ? JSON.stringify(materials_used) : '[]',
      instructions || '',
      tips || '',
      difficulty || 'Beginner',
      estimated_time || '1 hour'
    );

    analyticsService.track('post_created', userId, { postId, waste_used, title });

    res.status(201).json({
      message: 'Project post published successfully!',
      postId
    });
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ error: 'Failed to publish project' });
  }
});

// Get Single Post Detail
router.get('/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const post = db.prepare(`
      SELECT p.*, 
             u.name as creator_name, 
             u.username as creator_username, 
             u.avatar_url as creator_avatar,
             u.bio as creator_bio,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
             (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count
             ${currentUserId ? `,
               EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = '${currentUserId}') as has_liked,
               EXISTS(SELECT 1 FROM saves s WHERE s.post_id = p.id AND s.user_id = '${currentUserId}') as has_saved
             ` : ', 0 as has_liked, 0 as has_saved'}
      FROM project_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

    if (!post) {
      return res.status(404).json({ error: 'Project post not found' });
    }

    // Increment view count
    db.prepare('UPDATE project_posts SET views_count = views_count + 1 WHERE id = ?').run(post.id);

    // Fetch AI Summary if generated
    const aiSummaryRecord = db.prepare('SELECT * FROM comment_ai_summaries WHERE post_id = ?').get(post.id) as any;
    let aiSummary = null;
    if (aiSummaryRecord) {
      aiSummary = {
        summary: aiSummaryRecord.summary,
        groups: JSON.parse(aiSummaryRecord.groups),
        questions: JSON.parse(aiSummaryRecord.questions),
        highlights: JSON.parse(aiSummaryRecord.highlights),
        generated_at: aiSummaryRecord.generated_at
      };
    }

    res.json({
      post: {
        id: post.id,
        title: post.title,
        description: post.description,
        waste_used: post.waste_used,
        quantity: post.quantity,
        before_image: post.before_image,
        after_image: post.after_image,
        process_images: post.process_images ? JSON.parse(post.process_images) : [],
        video_url: post.video_url,
        tools_used: post.tools_used ? JSON.parse(post.tools_used) : [],
        materials_used: post.materials_used ? JSON.parse(post.materials_used) : [],
        instructions: post.instructions,
        tips: post.tips,
        difficulty: post.difficulty,
        estimated_time: post.estimated_time,
        likes_count: post.likes_count,
        saves_count: post.saves_count,
        comments_count: post.comments_count,
        views_count: post.views_count,
        has_liked: Boolean(post.has_liked),
        has_saved: Boolean(post.has_saved),
        creator: {
          id: post.user_id,
          name: post.creator_name,
          username: post.creator_username,
          avatar: post.creator_avatar,
          bio: post.creator_bio
        },
        ai_summary: aiSummary,
        created_at: post.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve post' });
  }
});

// Like / Unlike Post
router.post('/:id/like', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId) as any;

    if (existing) {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
      db.prepare('UPDATE project_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId);
      return res.json({ liked: false });
    } else {
      const likeId = crypto.randomUUID();
      db.prepare('INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)').run(likeId, userId, postId);
      db.prepare('UPDATE project_posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);

      // Notify post author if not self
      const postAuthor = (db.prepare('SELECT user_id, title FROM project_posts WHERE id = ?').get(postId) as any);
      if (postAuthor && postAuthor.user_id !== userId) {
        const notifId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, link)
          VALUES (?, ?, 'like', 'New Like!', ?, ?)
        `).run(notifId, postAuthor.user_id, `${req.user!.name} liked your project "${postAuthor.title}"`, `/posts/${postId}`);
      }

      return res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

// Save / Unsave Post
router.post('/:id/save', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const existing = db.prepare('SELECT id FROM saves WHERE user_id = ? AND post_id = ?').get(userId, postId) as any;

    if (existing) {
      db.prepare('DELETE FROM saves WHERE user_id = ? AND post_id = ?').run(userId, postId);
      db.prepare('UPDATE project_posts SET saves_count = MAX(0, saves_count - 1) WHERE id = ?').run(postId);
      return res.json({ saved: false });
    } else {
      const saveId = crypto.randomUUID();
      db.prepare('INSERT INTO saves (id, user_id, post_id) VALUES (?, ?, ?)').run(saveId, userId, postId);
      db.prepare('UPDATE project_posts SET saves_count = saves_count + 1 WHERE id = ?').run(postId);
      return res.json({ saved: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update save status' });
  }
});

// Follow / Unfollow Creator
router.post('/users/:id/follow', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, targetUserId) as any;

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, targetUserId);
      return res.json({ following: false });
    } else {
      const followId = crypto.randomUUID();
      db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(followId, currentUserId, targetUserId);

      // Notify target user
      const notifId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'follow', 'New Follower!', ?, ?)
      `).run(notifId, targetUserId, `${req.user!.name} started following your upcycling projects!`, `/profile/${currentUserId}`);

      return res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update follow status' });
  }
});

export default router;
