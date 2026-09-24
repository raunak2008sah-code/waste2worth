import { Router, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Section 5: Real environmental impact statistics
// "Do not present fabricated environmental statistics. Only calculate metrics from actual user/platform data:
// Materials reused, Projects completed, Materials donated, Projects shared"
const handleGetImpact = (req: AuthenticatedRequest, res: Response) => {
  try {
    const globalMetrics = analyticsService.getImpactMetrics();
    const userMetrics = req.user ? analyticsService.getImpactMetrics(req.user.id) : null;

    res.json({
      global: globalMetrics,
      user: userMetrics,
      units: {
        materialsReused: 'rescued items',
        projectsCompleted: 'completed projects',
        materialsDonated: 'items donated',
        projectsShared: 'community showcases'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate impact metrics' });
  }
};

router.get('/', optionalAuthMiddleware, handleGetImpact);
router.get('/summary', optionalAuthMiddleware, handleGetImpact);

export default router;
