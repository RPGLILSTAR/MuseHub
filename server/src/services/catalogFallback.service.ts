import db from '../database';
import { Book, Movie, MovieDetail, PaginatedResponse } from '../types';
import { getAllItemMeta, type ItemMeta } from './itemMetadata.service';

type RatingStats = {
  cnt: number;
  avg: number;
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / safePageSize));
  const start = (safePage - 1) * safePageSize;
  return {
    data: items.slice(start, start + safePageSize),
    page: safePage,
    totalPages,
    totalResults,
  };
}

function getMovieStatsMap(): Map<string, RatingStats> {
  const rows: any[] = db.prepare(
    'SELECT CAST(movie_id AS TEXT) as item_id, COUNT(*) as cnt, AVG(COALESCE(rating,3)) as avg_r FROM movie_marks GROUP BY movie_id'
  ).all();
  const map = new Map<string, RatingStats>();
  for (const row of rows) {
    map.set(String(row.item_id), {
      cnt: Number(row.cnt || 0),
      avg: Number(row.avg_r || 0),
    });
  }
  return map;
}

function getBookStatsMap(): Map<string, RatingStats> {
  const rows: any[] = db.prepare(
    'SELECT book_id as item_id, COUNT(*) as cnt, AVG(COALESCE(rating,3)) as avg_r FROM book_marks GROUP BY book_id'
  ).all();
  const map = new Map<string, RatingStats>();
  for (const row of rows) {
    map.set(String(row.item_id), {
      cnt: Number(row.cnt || 0),
      avg: Number(row.avg_r || 0),
    });
  }
  return map;
}

function getCachedMovieMetas(): ItemMeta[] {
  return getAllItemMeta('movie');
}

function getCachedBookMetas(): ItemMeta[] {
  return getAllItemMeta('book');
}

function toMovie(meta: ItemMeta, stats?: RatingStats): Movie {
  const releaseDate = typeof meta.extra?.releaseDate === 'string'
    ? meta.extra.releaseDate
    : typeof meta.extra?.release_date === 'string'
      ? meta.extra.release_date
      : '';

  return {
    id: Number(meta.item_id) || 0,
    title: meta.title || `Movie ${meta.item_id}`,
    originalTitle: meta.extra?.originalTitle || meta.extra?.original_title || meta.title || `Movie ${meta.item_id}`,
    overview: meta.extra?.overview || meta.extra?.description || '',
    posterPath: meta.cover || null,
    backdropPath: null,
    releaseDate,
    voteAverage: stats ? Number(stats.avg.toFixed(1)) : 0,
    voteCount: stats?.cnt || 0,
    genreIds: [],
    popularity: stats?.cnt || 0,
  };
}

function buildMoviePage(
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: 'popular' | 'top-rated';
    query?: string;
  } = {},
): PaginatedResponse<Movie> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const sortBy = options.sortBy ?? 'popular';
  const query = options.query?.trim().toLowerCase();
  const statsMap = getMovieStatsMap();

  const ranked = getCachedMovieMetas()
    .filter((meta) => {
      if (!query) return true;
      const values = [meta.title, meta.item_id, ...(meta.genres || [])].map((value) => String(value));
      return values.some((value) => normalizeText(value).includes(query));
    })
    .map((meta) => ({ meta, stats: statsMap.get(meta.item_id) }))
    .sort((a, b) => {
      const aStats = a.stats || { cnt: 0, avg: 0 };
      const bStats = b.stats || { cnt: 0, avg: 0 };
      if (sortBy === 'top-rated') {
        return bStats.avg - aStats.avg || bStats.cnt - aStats.cnt || a.meta.title.localeCompare(b.meta.title, 'zh-CN');
      }
      return bStats.cnt - aStats.cnt || bStats.avg - aStats.avg || a.meta.title.localeCompare(b.meta.title, 'zh-CN');
    })
    .map(({ meta, stats }) => toMovie(meta, stats));

  return paginate(ranked, page, pageSize);
}

function toMovieDetail(meta: ItemMeta | undefined, id: number, similar: Movie[]): MovieDetail {
  const statsMap = getMovieStatsMap();
  const stats = statsMap.get(String(id));
  const genres = (meta?.genres || []).map((name, index) => ({ id: index + 1, name }));
  const releaseDate = typeof meta?.extra?.releaseDate === 'string'
    ? meta.extra.releaseDate
    : typeof meta?.extra?.release_date === 'string'
      ? meta.extra.release_date
      : '';

  return {
    id,
    title: meta?.title || `Movie ${id}`,
    originalTitle: meta?.extra?.originalTitle || meta?.extra?.original_title || meta?.title || `Movie ${id}`,
    overview: meta?.extra?.overview || meta?.extra?.description || '',
    posterPath: meta?.cover || null,
    backdropPath: null,
    releaseDate,
    voteAverage: stats ? Number(stats.avg.toFixed(1)) : 0,
    voteCount: stats?.cnt || 0,
    genreIds: [],
    popularity: stats?.cnt || 0,
    runtime: Number(meta?.extra?.runtime || 0),
    genres,
    tagline: meta?.extra?.tagline || '',
    budget: Number(meta?.extra?.budget || 0),
    revenue: Number(meta?.extra?.revenue || 0),
    status: meta?.extra?.status || 'Released',
    productionCompanies: Array.isArray(meta?.extra?.productionCompanies)
      ? meta.extra.productionCompanies
      : [],
    credits: { cast: [], crew: [] },
    videos: [],
    similar,
  };
}

export function getCachedMovieDetail(id: number): MovieDetail {
  const movieMetas = getCachedMovieMetas();
  const meta = movieMetas.find((item) => Number(item.item_id) === Number(id));
  const similar = buildMoviePage({ page: 1, pageSize: 6, sortBy: 'popular' }).data.filter((movie) => movie.id !== id).slice(0, 6);
  return toMovieDetail(meta, id, similar);
}

export function getCachedMovieGenres(): { id: number; name: string }[] {
  const names = Array.from(new Set(
    getCachedMovieMetas().flatMap((meta) => Array.isArray(meta.genres) ? meta.genres : [])
      .map((value) => String(value).trim())
      .filter(Boolean),
  ));
  return names.map((name, index) => ({ id: index + 1, name }));
}

function toBook(meta: ItemMeta, stats?: RatingStats, category?: string): Book {
  const authors = Array.isArray(meta.extra?.authors) && meta.extra.authors.length > 0
    ? meta.extra.authors
    : Array.isArray(meta.extra?.author_name) && meta.extra.author_name.length > 0
      ? meta.extra.author_name
      : ['未知作者'];

  return {
    id: meta.item_id,
    title: meta.title || `Book ${meta.item_id}`,
    authors,
    publisher: meta.extra?.publisher,
    publishedDate: meta.extra?.publishedDate || meta.extra?.published_date,
    description: meta.extra?.description || meta.extra?.summary,
    pageCount: meta.extra?.pageCount || meta.extra?.page_count,
    categories: Array.isArray(meta.genres) && meta.genres.length > 0
      ? meta.genres
      : category
        ? [category]
        : undefined,
    averageRating: stats ? Number(stats.avg.toFixed(1)) : undefined,
    ratingsCount: stats?.cnt || undefined,
    thumbnail: meta.cover || undefined,
    language: meta.extra?.language,
    previewLink: meta.extra?.previewLink || `https://openlibrary.org/works/${meta.item_id}`,
    infoLink: meta.extra?.infoLink || `https://openlibrary.org/works/${meta.item_id}`,
  };
}

function buildBookPage(
  options: {
    page?: number;
    pageSize?: number;
    category?: string;
    query?: string;
    sortBy?: 'rating' | 'title';
  } = {},
): PaginatedResponse<Book> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const category = options.category?.trim().toLowerCase();
  const query = options.query?.trim().toLowerCase();
  const sortBy = options.sortBy ?? 'rating';
  const statsMap = getBookStatsMap();

  const ranked = getCachedBookMetas()
    .filter((meta) => {
      const values = [meta.title, meta.item_id, ...(meta.genres || [])].map((value) => String(value));
      const categoryMatch = category
        ? values.some((value) => normalizeText(value).includes(category))
        : true;
      const queryMatch = query
        ? values.some((value) => normalizeText(value).includes(query))
        : true;
      return categoryMatch && queryMatch;
    })
    .map((meta) => ({ meta, stats: statsMap.get(meta.item_id) }))
    .sort((a, b) => {
      const aStats = a.stats || { cnt: 0, avg: 0 };
      const bStats = b.stats || { cnt: 0, avg: 0 };
      if (sortBy === 'title') {
        return a.meta.title.localeCompare(b.meta.title, 'zh-CN');
      }
      return bStats.avg - aStats.avg || bStats.cnt - aStats.cnt || a.meta.title.localeCompare(b.meta.title, 'zh-CN');
    })
    .map(({ meta, stats }) => toBook(meta, stats, category || undefined));

  return paginate(ranked, page, pageSize);
}

export function getCachedBookDetail(id: string): Book {
  const bookMetas = getCachedBookMetas();
  const meta = bookMetas.find((item) => item.item_id === id || item.item_id === id.replace(/^\/works\//, ''));
  const stats = getBookStatsMap().get(meta?.item_id || id);
  return meta
    ? toBook(meta, stats, Array.isArray(meta.genres) && meta.genres.length > 0 ? meta.genres[0] : undefined)
    : {
        id,
        title: `Book ${id}`,
        authors: ['未知作者'],
        categories: undefined,
        thumbnail: undefined,
        previewLink: `https://openlibrary.org/works/${id}`,
        infoLink: `https://openlibrary.org/works/${id}`,
        averageRating: stats ? Number(stats.avg.toFixed(1)) : undefined,
        ratingsCount: stats?.cnt || undefined,
      };
}

export function getCachedMoviePage(
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: 'popular' | 'top-rated';
    query?: string;
  } = {},
): PaginatedResponse<Movie> {
  return buildMoviePage(options);
}

export function getCachedMovieList(limit = 20, sortBy: 'popular' | 'top-rated' = 'popular'): Movie[] {
  return buildMoviePage({ page: 1, pageSize: limit, sortBy }).data;
}

export function getCachedBookPage(
  options: {
    page?: number;
    pageSize?: number;
    category?: string;
    query?: string;
    sortBy?: 'rating' | 'title';
  } = {},
): PaginatedResponse<Book> {
  return buildBookPage(options);
}
