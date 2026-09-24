import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || 'waste2worth.db';
const fullDbPath = path.resolve(process.cwd(), dbPath);

// Ensure directory exists
const dbDir = path.dirname(fullDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(fullDbPath);

// Enable foreign keys and WAL mode for maximum performance and reliability
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      skill_level TEXT DEFAULT 'Beginner',
      role TEXT DEFAULT 'USER', -- USER, CREATOR, BUSINESS, MODERATOR, ADMIN
      interests TEXT, -- JSON array of strings
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT,
      safety_information TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waste_scans (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      image_url TEXT NOT NULL,
      detected_material TEXT NOT NULL,
      confidence REAL NOT NULL,
      condition TEXT,
      is_reusable BOOLEAN DEFAULT 1,
      categories TEXT, -- JSON array
      safety_notes TEXT, -- JSON array
      raw_ai_result TEXT, -- JSON
      user_corrected_material TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      creator_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Beginner',
      estimated_time TEXT,
      material_requirements TEXT, -- JSON array or text
      tool_requirements TEXT, -- JSON array
      instructions TEXT NOT NULL, -- JSON array of step objects {step: number, title: string, text: string, tip?: string}
      safety_information TEXT,
      cover_image TEXT,
      category TEXT,
      is_organic BOOLEAN DEFAULT 0,
      alternative_materials TEXT, -- JSON array
      optional_products TEXT, -- JSON array of recommendations
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_materials (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      material_id TEXT NOT NULL,
      quantity TEXT,
      required BOOLEAN DEFAULT 1,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      waste_used TEXT NOT NULL,
      quantity TEXT,
      before_image TEXT NOT NULL,
      after_image TEXT NOT NULL,
      process_images TEXT, -- JSON array
      video_url TEXT,
      tools_used TEXT, -- JSON array
      materials_used TEXT, -- JSON array
      instructions TEXT,
      tips TEXT,
      difficulty TEXT DEFAULT 'Beginner',
      estimated_time TEXT,
      likes_count INTEGER DEFAULT 0,
      saves_count INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES project_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_ai_summaries (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL, -- Overall summary text
      groups TEXT NOT NULL, -- JSON array of {topic: string, count: number, example: string}
      questions TEXT NOT NULL, -- JSON array of question groups
      highlights TEXT NOT NULL, -- JSON array of useful suggestions
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES project_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES project_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES project_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS idea_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material TEXT NOT NULL,
      quantity TEXT,
      budget TEXT,
      skill_level TEXT,
      question TEXT NOT NULL,
      status TEXT DEFAULT 'open', -- open, answered, closed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS idea_responses (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      user_id TEXT,
      content TEXT NOT NULL,
      is_ai_generated BOOLEAN DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES idea_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS response_reactions (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL, -- 'helpful' or 'used'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(response_id, user_id, reaction_type),
      FOREIGN KEY (response_id) REFERENCES idea_responses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS creator_inquiries (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      idea_id TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      story TEXT,
      location TEXT,
      website TEXT,
      contact_method TEXT,
      materials_used TEXT, -- JSON array
      logo_url TEXT,
      banner_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_products (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      currency TEXT DEFAULT '₹',
      images TEXT, -- JSON array
      materials TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_questions (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material TEXT NOT NULL,
      category TEXT DEFAULT 'Cardboard',
      quantity INTEGER NOT NULL,
      remaining_quantity INTEGER NOT NULL,
      unit TEXT DEFAULT 'items',
      condition TEXT NOT NULL,
      description TEXT,
      approx_location TEXT NOT NULL,
      exact_pickup_address TEXT, -- Private: only disclosed to accepted recipient
      is_location_public BOOLEAN DEFAULT 1,
      image_url TEXT,
      images TEXT, -- JSON array of photo URLs
      pickup_option TEXT DEFAULT 'Self Pickup & Local Delivery Available',
      pickup_available BOOLEAN DEFAULT 1,
      delivery_available BOOLEAN DEFAULT 1,
      estimated_delivery_fee REAL DEFAULT 70,
      status TEXT DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, AVAILABLE, PARTIALLY_CLAIMED, FULLY_CLAIMED, REJECTED, COMPLETED
      verification_status TEXT DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
      rejection_reason TEXT,
      verification_notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verification_deadline DATETIME,
      verified_at DATETIME,
      rejected_at DATETIME,
      completion_status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS donation_requests (
      id TEXT PRIMARY KEY,
      donation_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      requested_quantity INTEGER NOT NULL,
      message TEXT NOT NULL,
      fulfillment_method TEXT DEFAULT 'pickup', -- 'pickup' or 'delivery'
      fulfillment_type TEXT DEFAULT 'pickup', -- backward compat alias
      pickup_date TEXT,
      pickup_notes TEXT,
      delivery_fee REAL DEFAULT 0,
      delivery_address TEXT,
      delivery_status TEXT DEFAULT 'pending',
      fulfillment_status TEXT DEFAULT 'pending', -- 'pending', 'ready_for_pickup', 'pickup_scheduled', 'picked_up', 'delivery_requested', 'delivery_scheduled', 'delivered', 'completed'
      status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS donation_messages (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES donation_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_type TEXT NOT NULL, -- post, comment, user, business, donation
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
      moderator_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      metadata TEXT, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_posts_user ON project_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON project_posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_saves_post ON saves(post_id);
    CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_idea_requests_user ON idea_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `);

  // Safe migration helper for existing tables
  const addCol = (tbl: string, col: string, typeDef: string) => {
    try {
      db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${typeDef};`);
    } catch {
      // Column already exists
    }
  };

  addCol('donations', 'category', "TEXT DEFAULT 'Cardboard'");
  addCol('donations', 'images', 'TEXT');
  addCol('donations', 'exact_pickup_address', 'TEXT');
  addCol('donations', 'pickup_available', 'BOOLEAN DEFAULT 1');
  addCol('donations', 'delivery_available', 'BOOLEAN DEFAULT 1');
  addCol('donations', 'estimated_delivery_fee', 'REAL DEFAULT 70');
  addCol('donations', 'verification_status', "TEXT DEFAULT 'VERIFIED'");
  addCol('donations', 'rejection_reason', 'TEXT');
  addCol('donations', 'verification_notes', 'TEXT');
  addCol('donations', 'submitted_at', 'DATETIME');
  addCol('donations', 'verification_deadline', 'DATETIME');
  addCol('donations', 'verified_at', 'DATETIME');
  addCol('donations', 'rejected_at', 'DATETIME');
  addCol('donations', 'completion_status', "TEXT DEFAULT 'active'");

  addCol('donation_requests', 'fulfillment_method', "TEXT DEFAULT 'pickup'");
  addCol('donation_requests', 'fulfillment_type', "TEXT DEFAULT 'pickup'");
  addCol('donation_requests', 'pickup_date', 'TEXT');
  addCol('donation_requests', 'pickup_notes', 'TEXT');
  addCol('donation_requests', 'delivery_fee', 'REAL DEFAULT 0');
  addCol('donation_requests', 'delivery_address', 'TEXT');
  addCol('donation_requests', 'delivery_status', "TEXT DEFAULT 'pending'");
  addCol('donation_requests', 'fulfillment_status', "TEXT DEFAULT 'pending'");
  addCol('donation_requests', 'completed_at', 'DATETIME');
}
