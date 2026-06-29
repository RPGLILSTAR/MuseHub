import { Router } from 'express';
import { movieController } from '../controllers/movie.controller';

const router = Router();

router.get('/popular', (req, res, next) => movieController.getPopular(req, res, next));
router.get('/trending', (req, res, next) => movieController.getTrending(req, res, next));
router.get('/top-rated', (req, res, next) => movieController.getTopRated(req, res, next));
router.get('/now-playing', (req, res, next) => movieController.getNowPlaying(req, res, next));
router.get('/genres', (req, res, next) => movieController.getGenres(req, res, next));
router.get('/search', (req, res, next) => movieController.search(req, res, next));
router.get('/:id', (req, res, next) => movieController.getDetail(req, res, next));

export default router;
