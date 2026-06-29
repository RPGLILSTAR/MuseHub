import { Router, Request, Response } from 'express';
import { authRequired, adminRequired, optionalAuth } from '../middleware/auth';
import { recommendationEngine } from '../services/recommendation.service';
import { seedRecommendationData, clearSeedData } from '../services/seed.service';

const router = Router();

router.get('/movies', authRequired, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const results = recommendationEngine.recommend(req.user!.userId, 'movie', limit);
  res.json({ success: true, data: results });
});

router.get('/books', authRequired, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const results = recommendationEngine.recommend(req.user!.userId, 'book', limit);
  res.json({ success: true, data: results });
});

router.get('/music', authRequired, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 30;
  const results = recommendationEngine.recommendMusic(req.user!.userId, limit);
  res.json({ success: true, data: results });
});

router.get('/cross', authRequired, (req: Request, res: Response) => {
  const source = (req.query.source as string) || 'movie';
  const target = (req.query.target as string) || 'book';
  const limit = parseInt(req.query.limit as string) || 10;
  const results = recommendationEngine.crossModuleRecommend(req.user!.userId, source as any, target as any, limit);
  res.json({ success: true, data: results });
});

router.get('/similar-users', authRequired, (req: Request, res: Response) => {
  const itemType = (req.query.type as string) || 'movie';
  const topK = parseInt(req.query.limit as string) || 10;
  const results = recommendationEngine.findSimilarUsers(req.user!.userId, itemType as any, topK);
  res.json({ success: true, data: results });
});

router.get('/similar-items/:type/:id', (req: Request, res: Response) => {
  const { type, id } = req.params;
  const topK = parseInt(req.query.limit as string) || 10;
  const results = recommendationEngine.findSimilarItems(id, type as any, topK);
  res.json({ success: true, data: results });
});

router.get('/popular/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  if (type === 'music') {
    res.json({ success: true, data: recommendationEngine.recommendMusic(0, limit) });
  } else {
    res.json({ success: true, data: recommendationEngine.getPopularItems(type as any, limit) });
  }
});

// ─── 管理员：算法评估与调参 ───

router.get('/admin/stats', adminRequired, (_req: Request, res: Response) => {
  const stats = recommendationEngine.getStats();
  res.json({ success: true, data: stats });
});

router.get('/admin/evaluate/:type', adminRequired, (req: Request, res: Response) => {
  const { type } = req.params;
  const result = recommendationEngine.evaluate(type as any);
  res.json({ success: true, data: result });
});

router.put('/admin/weights', adminRequired, (req: Request, res: Response) => {
  const { userCF, itemCF, content } = req.body;
  recommendationEngine.setWeights({ userCF, itemCF, content });
  res.json({ success: true, data: recommendationEngine.getWeights() });
});

router.get('/admin/user-profile/:userId/:type', adminRequired, (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const type = req.params.type as 'movie' | 'book';
  const profile = recommendationEngine.buildUserProfile(userId, type);
  res.json({ success: true, data: Object.fromEntries(profile) });
});

router.post('/admin/seed', adminRequired, async (req: Request, res: Response) => {
  try {
    const result = await seedRecommendationData();
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Seed] Error:', err);
    res.status(500).json({ success: false, message: err.message || '种子数据生成失败' });
  }
});

router.post('/admin/clear-seed', adminRequired, (_req: Request, res: Response) => {
  const result = clearSeedData();
  res.json({ success: true, data: result });
});

export default router;
