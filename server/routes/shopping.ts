import { Router, Request, Response } from 'express';
import { shoppingService } from '../services/shoppingService';
import { recommendationService } from '../services/recommendationService';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Section 13: Optional Product Recommendations
router.get('/options', async (req: Request, res: Response) => {
  try {
    const itemName = (req.query.item as string) || 'glue';
    const category = (req.query.category as string) || 'Craft Supplies';

    const solutions = await shoppingService.getOptionsForItem({ itemName, category });
    res.json(solutions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve supply options' });
  }
});

// Section 37: Personalized Recommendations
router.get('/recommendations', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recommendations = await recommendationService.getPersonalizedRecommendations(req.user?.id);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

export default router;
