import { db } from '../db';

export interface ScoredProject {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  cover_image: string;
  category: string;
  waste_material: string;
  creator_name: string;
  creator_avatar?: string;
  recommendation_reason: string;
  relevance_score: number;
}

class RecommendationService {
  async getPersonalizedRecommendations(userId?: string): Promise<ScoredProject[]> {
    // If user is logged in, find their scanned materials and saved categories
    let scannedMaterials: string[] = [];
    let savedProjectIds: string[] = [];

    if (userId) {
      const scans = db.prepare(`SELECT detected_material FROM waste_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`).all(userId) as any[];
      scannedMaterials = scans.map(s => s.detected_material.toLowerCase());

      const saves = db.prepare(`SELECT post_id FROM saves WHERE user_id = ?`).all(userId) as any[];
      savedProjectIds = saves.map(s => s.post_id);
    }

    // Fetch projects from database
    const allProjects = db.prepare(`
      SELECT p.*, u.name as creator_name, u.avatar_url as creator_avatar 
      FROM projects p
      LEFT JOIN users u ON p.creator_id = u.id
      ORDER BY p.views_count DESC
      LIMIT 20
    `).all() as any[];

    const scored: ScoredProject[] = allProjects.map(proj => {
      let score = 50; // base score
      let reason = 'Trending upcycling project in the community';

      const projCat = (proj.category || '').toLowerCase();
      const projTitle = (proj.title || '').toLowerCase();

      // Check match with scanned materials
      for (const mat of scannedMaterials) {
        if (projCat.includes(mat) || projTitle.includes(mat)) {
          score += 40;
          reason = `Matches your recently scanned material: ${mat}`;
          break;
        }
      }

      if (proj.is_organic) {
        score += 5;
      }

      return {
        id: proj.id,
        title: proj.title,
        description: proj.description,
        difficulty: proj.difficulty,
        estimated_time: proj.estimated_time,
        cover_image: proj.cover_image,
        category: proj.category,
        waste_material: projCat.split(' ')[0] || 'Cardboard',
        creator_name: proj.creator_name || 'Waste2Worth Community',
        creator_avatar: proj.creator_avatar,
        recommendation_reason: reason,
        relevance_score: score
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.relevance_score - a.relevance_score);
    return scored.slice(0, 8);
  }
}

export const recommendationService = new RecommendationService();
