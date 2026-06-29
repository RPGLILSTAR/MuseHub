import { Router } from 'express';
import { bookController } from '../controllers/book.controller';

const router = Router();

router.get('/popular', (req, res, next) => bookController.getPopular(req, res, next));
router.get('/new-releases', (req, res, next) => bookController.getNewReleases(req, res, next));
router.get('/search', (req, res, next) => bookController.search(req, res, next));
router.get('/category/:category', (req, res, next) => bookController.getByCategory(req, res, next));
router.get('/:id', (req, res, next) => bookController.getDetail(req, res, next));

export default router;
