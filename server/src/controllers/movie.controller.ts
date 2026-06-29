import { Request, Response, NextFunction } from 'express';
import { tmdbService } from '../services/tmdb.service';
import { AppError } from '../middleware/errorHandler';
import { toUpstreamAppError } from '../utils/upstreamError';

export class MovieController {
  async getPopular(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbService.getPopular(page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch popular movies'));
    }
  }

  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const timeWindow = (req.query.time as 'day' | 'week') || 'week';
      const result = await tmdbService.getTrending(timeWindow);
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch trending movies'));
    }
  }

  async getTopRated(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbService.getTopRated(page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch top rated movies'));
    }
  }

  async getNowPlaying(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbService.getNowPlaying(page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch now playing movies'));
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid movie ID', 400);
      const result = await tmdbService.getDetail(id);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      next(toUpstreamAppError(err, 'Failed to fetch movie detail'));
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query) throw new AppError('Search query is required', 400);
      const page = parseInt(req.query.page as string) || 1;
      const result = await tmdbService.search(query, page);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      next(toUpstreamAppError(err, 'Failed to search movies'));
    }
  }

  async getGenres(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tmdbService.getGenres();
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch genres'));
    }
  }
}

export const movieController = new MovieController();
