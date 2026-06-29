import { Request, Response, NextFunction } from 'express';
import { googleBooksService } from '../services/googleBooks.service';
import { AppError } from '../middleware/errorHandler';
import { toUpstreamAppError } from '../utils/upstreamError';

export class BookController {
  async getPopular(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const category = (req.query.category as string) || 'fiction';
      const result = await googleBooksService.getPopular(category, page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch popular books'));
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new AppError('Book ID is required', 400);
      const result = await googleBooksService.getDetail(id);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      next(toUpstreamAppError(err, 'Failed to fetch book detail'));
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query) throw new AppError('Search query is required', 400);
      const page = parseInt(req.query.page as string) || 1;
      const result = await googleBooksService.search(query, page);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      next(toUpstreamAppError(err, 'Failed to search books'));
    }
  }

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.params.category;
      if (!category) throw new AppError('Category is required', 400);
      const page = parseInt(req.query.page as string) || 1;
      const result = await googleBooksService.getByCategory(category, page);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      next(toUpstreamAppError(err, 'Failed to fetch books by category'));
    }
  }

  async getNewReleases(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await googleBooksService.getNewReleases(page);
      res.json({ success: true, data: result });
    } catch (err) {
      next(toUpstreamAppError(err, 'Failed to fetch new releases'));
    }
  }
}

export const bookController = new BookController();
