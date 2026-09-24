import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db';
import { authMiddleware, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['USER', 'CREATOR', 'BUSINESS', 'MODERATOR', 'ADMIN']).optional().default('USER'),
  skill_level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
  bio: z.string().optional()
});

const loginSchema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);

    // Check if email or username exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(validated.email, validated.username);
    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const id = crypto.randomUUID();
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(validated.password, salt);
    const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${validated.username}`;

    db.prepare(`
      INSERT INTO users (id, name, username, email, password_hash, avatar_url, bio, skill_level, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validated.name,
      validated.username,
      validated.email,
      password_hash,
      avatar_url,
      validated.bio || 'Upcycling enthusiast eager to transform waste into value.',
      validated.skill_level,
      validated.role
    );

    const user = {
      id,
      name: validated.name,
      username: validated.username,
      email: validated.email,
      role: validated.role as any,
      avatar_url,
      skill_level: validated.skill_level
    };

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE email = ? OR username = ?
    `).get(validated.login, validated.login) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const isMatch = bcrypt.compareSync(validated.password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const authUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      skill_level: user.skill_level
    };

    const token = generateToken(authUser);
    res.json({ user: authUser, token });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Current User Me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.prepare(`
    SELECT id, name, username, email, avatar_url, bio, skill_level, role, interests, created_at 
    FROM users 
    WHERE id = ?
  `).get(req.user!.id) as any;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate user impact stats
  const scansCount = (db.prepare(`SELECT COUNT(*) as c FROM waste_scans WHERE user_id = ?`).get(user.id) as any)?.c || 0;
  const projectsCount = (db.prepare(`SELECT COUNT(*) as c FROM project_posts WHERE user_id = ?`).get(user.id) as any)?.c || 0;
  const donationsCount = (db.prepare(`SELECT COUNT(*) as c FROM donations WHERE user_id = ?`).get(user.id) as any)?.c || 0;

  res.json({
    user: {
      ...user,
      stats: {
        scans: scansCount,
        projects: projectsCount,
        donations: donationsCount
      }
    }
  });
});

// Update Profile
router.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, skill_level, avatar_url } = req.body;
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          bio = COALESCE(?, bio),
          skill_level = COALESCE(?, skill_level),
          avatar_url = COALESCE(?, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, bio, skill_level, avatar_url, req.user!.id);

    const updated = db.prepare('SELECT id, name, username, email, avatar_url, bio, skill_level, role FROM users WHERE id = ?').get(req.user!.id);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Quick demo user list for frictionless evaluation & role switching
router.get('/demo-users', (req: Request, res: Response) => {
  const demoUsers = db.prepare(`
    SELECT id, name, username, email, role, avatar_url, skill_level, bio
    FROM users
    LIMIT 6
  `).all();
  res.json({ demoUsers });
});

export default router;
