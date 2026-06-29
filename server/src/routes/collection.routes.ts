import { Router, Request, Response } from 'express';
import { authRequired, optionalAuth } from '../middleware/auth';
import { dbCollectionService } from '../services/dbCollection.service';

const router = Router();

router.post('/mark', authRequired, (req: Request, res: Response) => {
  const { itemType, itemId, status, rating, comment, itemTitle, itemCover, genres } = req.body;
  const result = dbCollectionService.setMark(req.user!.userId, itemType, itemId, status, rating, comment, itemTitle, itemCover, genres || []);
  res.json({ success: true, data: result });
});

router.delete('/mark', authRequired, (req: Request, res: Response) => {
  const { itemType, itemId } = req.body;
  dbCollectionService.removeMark(req.user!.userId, itemType, itemId);
  res.json({ success: true });
});

router.get('/mark/:itemType/:itemId', optionalAuth, (req: Request, res: Response) => {
  if (!req.user) return res.json({ success: true, data: null });
  const mark = dbCollectionService.getMark(req.user.userId, req.params.itemType as any, req.params.itemId);
  res.json({ success: true, data: mark });
});

router.get('/marks/:itemType', authRequired, (req: Request, res: Response) => {
  const marks = dbCollectionService.getMarks(req.user!.userId, req.params.itemType as any, req.query.status as any);
  res.json({ success: true, data: marks });
});

router.get('/marks/:itemType/stats', authRequired, (req: Request, res: Response) => {
  const stats = dbCollectionService.getMarkStats(req.user!.userId, req.params.itemType as any);
  res.json({ success: true, data: stats });
});

router.post('/reviews', authRequired, (req: Request, res: Response) => {
  const { itemType, itemId, content, rating, title, isLong, itemTitle, itemCover } = req.body;
  const review = dbCollectionService.addReview(req.user!.userId, itemType, itemId, content, rating, title, isLong, itemTitle, itemCover);
  res.json({ success: true, data: review });
});

router.get('/reviews/:itemType/:itemId', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = dbCollectionService.getReviews(req.params.itemType as any, req.params.itemId, page);
  res.json({ success: true, data: result.data, total: result.total, page: result.page });
});

router.post('/reviews/:id/like', authRequired, (req: Request, res: Response) => {
  const result = dbCollectionService.likeReview(req.user!.userId, parseInt(req.params.id));
  res.json({ success: true, data: result });
});

router.delete('/reviews/:id', authRequired, (req: Request, res: Response) => {
  dbCollectionService.deleteReview(req.user!.userId, parseInt(req.params.id), req.user!.role === 'admin');
  res.json({ success: true });
});

router.get('/lists/:itemType', authRequired, (req: Request, res: Response) => {
  const lists = dbCollectionService.getLists(req.user!.userId, req.params.itemType as any);
  res.json({ success: true, data: lists });
});

router.post('/lists', authRequired, (req: Request, res: Response) => {
  const { itemType, name, description } = req.body;
  const list = dbCollectionService.createList(req.user!.userId, itemType, name, description);
  res.json({ success: true, data: list });
});

router.delete('/lists/:id', authRequired, (req: Request, res: Response) => {
  dbCollectionService.deleteList(req.user!.userId, parseInt(req.params.id), req.user!.role === 'admin');
  res.json({ success: true });
});

router.get('/lists/detail/:id', (req: Request, res: Response) => {
  const list = dbCollectionService.getListDetail(parseInt(req.params.id));
  res.json({ success: true, data: list });
});

router.post('/lists/:id/add', authRequired, (req: Request, res: Response) => {
  const ok = dbCollectionService.addToList(req.user!.userId, parseInt(req.params.id), req.body.itemId);
  if (!ok) return res.status(404).json({ success: false, message: '清单不存在或无权访问' });
  res.json({ success: true });
});

router.post('/lists/:id/remove', authRequired, (req: Request, res: Response) => {
  const ok = dbCollectionService.removeFromList(req.user!.userId, parseInt(req.params.id), req.body.itemId);
  if (!ok) return res.status(404).json({ success: false, message: '清单不存在或无权访问' });
  res.json({ success: true });
});

export default router;
