import { Router, Request, Response } from 'express';
import { db } from '../db';
import { aiService, IdeaContext } from '../services/aiService';
import { analyticsService } from '../services/analyticsService';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Generate Ideas & Creator Inspiration
router.post('/generate', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      material,
      quantity,
      budget,
      skill_level,
      tools,
      constraints,
      custom_prompt,
      time,
      intended_purpose
    } = req.body;

    if (!material) {
      return res.status(400).json({ error: 'Material is required' });
    }

    const context: IdeaContext = {
      material,
      quantity,
      budget,
      skill_level,
      tools: Array.isArray(tools) ? tools : (tools ? [tools] : undefined),
      constraints,
      custom_prompt,
      time,
      intended_purpose
    };

    analyticsService.track('idea_generated', req.user?.id, { material, constraints });

    // Generate AI ideas
    const ideas = await aiService.generateIdeas(context);

    // Fetch relevant Creator Inspiration from DB for this material (Section 11)
    const creatorProjects = db.prepare(`
      SELECT p.id, p.title, p.description, p.cover_image, p.difficulty, p.estimated_time, 
             p.category, u.name as creator_name, u.avatar_url as creator_avatar,
             p.instructions, p.created_at
      FROM projects p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE LOWER(p.category) LIKE LOWER(?) OR LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?)
      LIMIT 4
    `).all(`%${material}%`, `%${material}%`, `%${material}%`) as any[];

    res.json({
      material,
      context,
      ideas,
      creator_inspiration: creatorProjects.map(cp => ({
        id: cp.id,
        title: cp.title,
        description: cp.description,
        cover_image: cp.cover_image || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&q=80',
        creator_name: cp.creator_name || 'Upcycle Pro',
        creator_avatar: cp.creator_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator',
        difficulty: cp.difficulty,
        duration: cp.estimated_time,
        source: 'Verified Creator Showcase',
        verified: true
      })),
      ai_provider: aiService.getProviderName()
    });
  } catch (err: any) {
    console.error('Idea generation error:', err);
    res.status(500).json({ error: 'Failed to generate ideas. Please try again.' });
  }
});

// Regenerate Ideas with Specific Constraint
router.post('/regenerate', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { material, constraint, prompt } = req.body;
    if (!material) {
      return res.status(400).json({ error: 'Material is required' });
    }

    analyticsService.track('idea_regenerated', req.user?.id, { material, constraint, prompt });

    const context: IdeaContext = {
      material,
      constraints: constraint,
      custom_prompt: prompt
    };

    const ideas = await aiService.generateIdeas(context);
    res.json({ ideas, constraint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate ideas' });
  }
});

// Get Project Detail by ID
router.get('/projects/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if it exists in the database
    const dbProject = db.prepare(`
      SELECT p.*, u.name as creator_name, u.avatar_url as creator_avatar, u.username as creator_username
      FROM projects p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `).get(id) as any;

    if (dbProject) {
      // Increment views count
      db.prepare('UPDATE projects SET views_count = views_count + 1 WHERE id = ?').run(id);

      const instructions = dbProject.instructions ? JSON.parse(dbProject.instructions) : [];
      const alternativeMaterials = dbProject.alternative_materials ? JSON.parse(dbProject.alternative_materials) : [];
      const optionalProducts = dbProject.optional_products ? JSON.parse(dbProject.optional_products) : [];
      const toolsRequired = dbProject.tool_requirements ? JSON.parse(dbProject.tool_requirements) : [];
      const wasteAlreadyHave = dbProject.material_requirements ? JSON.parse(dbProject.material_requirements) : ['Cardboard Box'];

      return res.json({
        project: {
          id: dbProject.id,
          title: dbProject.title,
          description: dbProject.description,
          difficulty: dbProject.difficulty,
          estimated_time: dbProject.estimated_time,
          cover_image: dbProject.cover_image,
          category: dbProject.category,
          creator: {
            id: dbProject.creator_id,
            name: dbProject.creator_name || 'Community Upcycler',
            username: dbProject.creator_username || 'upcycler',
            avatar: dbProject.creator_avatar
          },
          waste_already_have: Array.isArray(wasteAlreadyHave) ? wasteAlreadyHave : [wasteAlreadyHave],
          materials_may_need: ['PVA Glue (100ml)', 'Acrylic Paint', 'Sandpaper'],
          tools_required: Array.isArray(toolsRequired) ? toolsRequired : [toolsRequired],
          instructions,
          alternative_materials: alternativeMaterials,
          safety_information: [
            'Wear gloves when handling sharp cutting blades.',
            'Ensure adequate ventilation when applying sealants.',
            'Always cut away from fingers and body.'
          ],
          optional_products: optionalProducts
        }
      });
    }

    // Dynamic generation if it's an AI-generated idea ID (e.g. 'cardboard-desk-caddy')
    const dynamicProject = await aiService.generateProject(id, { material: 'Cardboard' });
    res.json({
      project: {
        id,
        ...dynamicProject,
        creator: {
          id: 'ai-creator',
          name: 'Waste2Worth AI Design Studio',
          username: 'waste2worth_ai',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=w2w_ai'
        }
      }
    });
  } catch (err) {
    console.error('Project fetch error:', err);
    res.status(500).json({ error: 'Failed to load project details' });
  }
});

// AI Step Assistant Q&A
router.post('/projects/step-question', async (req: Request, res: Response) => {
  try {
    const { stepNumber, stepTitle, question, projectTitle } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const answer = await aiService.answerProjectQuestion({
      stepNumber: Number(stepNumber) || 1,
      stepTitle: stepTitle || 'Current Step',
      question,
      projectTitle: projectTitle || 'Upcycling Project'
    });

    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: 'Unable to process question at this time' });
  }
});

export default router;
