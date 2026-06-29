import { AxiosInstance } from 'axios';
import { config } from '../config';
import {
  getCachedMovieDetail,
  getCachedMovieGenres,
  getCachedMovieList,
  getCachedMoviePage,
} from './catalogFallback.service';
import { createOutboundClient } from '../utils/outboundAxios';
import { Movie, MovieDetail, CastMember, PaginatedResponse } from '../types';

class TmdbService {
  private client: AxiosInstance;

  constructor() {
    this.client = createOutboundClient({
      baseURL: config.tmdb.baseUrl,
      timeout: 8000,
      params: {
        api_key: config.tmdb.apiKey,
        language: 'zh-CN',
      },
    });
  }

  private formatMovie(raw: any): Movie {
    return {
      id: raw.id,
      title: raw.title,
      originalTitle: raw.original_title,
      overview: raw.overview,
      posterPath: raw.poster_path
        ? `${config.tmdb.imageBaseUrl}/w500${raw.poster_path}`
        : null,
      backdropPath: raw.backdrop_path
        ? `${config.tmdb.imageBaseUrl}/original${raw.backdrop_path}`
        : null,
      releaseDate: raw.release_date,
      voteAverage: raw.vote_average,
      voteCount: raw.vote_count,
      genreIds: raw.genre_ids || [],
      popularity: raw.popularity,
    };
  }

  async getPopular(page = 1): Promise<PaginatedResponse<Movie>> {
    try {
      const { data } = await this.client.get('/movie/popular', {
        params: { page },
      });
      return {
        data: data.results.map((m: any) => this.formatMovie(m)),
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (err) {
      console.warn('[TMDB] popular failed, using cached movies:', err instanceof Error ? err.message : err);
      return getCachedMoviePage({ page, pageSize: 20, sortBy: 'popular' });
    }
  }

  async getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
    try {
      const { data } = await this.client.get(`/trending/movie/${timeWindow}`);
      return data.results.map((m: any) => this.formatMovie(m));
    } catch (err) {
      console.warn('[TMDB] trending failed, using cached movies:', err instanceof Error ? err.message : err);
      return getCachedMovieList(12, 'popular');
    }
  }

  async getTopRated(page = 1): Promise<PaginatedResponse<Movie>> {
    try {
      const { data } = await this.client.get('/movie/top_rated', {
        params: { page },
      });
      return {
        data: data.results.map((m: any) => this.formatMovie(m)),
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (err) {
      console.warn('[TMDB] top rated failed, using cached movies:', err instanceof Error ? err.message : err);
      return getCachedMoviePage({ page, pageSize: 20, sortBy: 'top-rated' });
    }
  }

  async getNowPlaying(page = 1): Promise<PaginatedResponse<Movie>> {
    try {
      const { data } = await this.client.get('/movie/now_playing', {
        params: { page },
      });
      return {
        data: data.results.map((m: any) => this.formatMovie(m)),
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (err) {
      console.warn('[TMDB] now playing failed, using cached movies:', err instanceof Error ? err.message : err);
      return getCachedMoviePage({ page, pageSize: 20, sortBy: 'popular' });
    }
  }

  async getDetail(id: number): Promise<MovieDetail> {
    try {
      const { data } = await this.client.get(`/movie/${id}`, {
        params: { append_to_response: 'credits,videos,similar' },
      });

      const cast: CastMember[] = (data.credits?.cast || [])
        .slice(0, 20)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path
            ? `${config.tmdb.imageBaseUrl}/w185${c.profile_path}`
            : null,
          order: c.order,
        }));

      const crew = (data.credits?.crew || [])
        .filter((c: any) => ['Director', 'Screenplay', 'Writer'].includes(c.job))
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          job: c.job,
          department: c.department,
          profilePath: c.profile_path
            ? `${config.tmdb.imageBaseUrl}/w185${c.profile_path}`
            : null,
        }));

      const videos = (data.videos?.results || []).map((v: any) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type,
      }));

      const similar = (data.similar?.results || [])
        .slice(0, 12)
        .map((m: any) => this.formatMovie(m));

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title,
        overview: data.overview,
        posterPath: data.poster_path
          ? `${config.tmdb.imageBaseUrl}/w500${data.poster_path}`
          : null,
        backdropPath: data.backdrop_path
          ? `${config.tmdb.imageBaseUrl}/original${data.backdrop_path}`
          : null,
        releaseDate: data.release_date,
        voteAverage: data.vote_average,
        voteCount: data.vote_count,
        genreIds: (data.genres || []).map((g: any) => g.id),
        popularity: data.popularity,
        runtime: data.runtime,
        genres: data.genres || [],
        tagline: data.tagline || '',
        budget: data.budget,
        revenue: data.revenue,
        status: data.status,
        productionCompanies: (data.production_companies || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          logoPath: p.logo_path
            ? `${config.tmdb.imageBaseUrl}/w200${p.logo_path}`
            : null,
        })),
        credits: { cast, crew },
        videos,
        similar,
      };
    } catch (err) {
      console.warn('[TMDB] detail failed, using cached movie:', err instanceof Error ? err.message : err);
      return getCachedMovieDetail(id);
    }
  }

  async search(query: string, page = 1): Promise<PaginatedResponse<Movie>> {
    try {
      const { data } = await this.client.get('/search/movie', {
        params: { query, page },
      });
      return {
        data: data.results.map((m: any) => this.formatMovie(m)),
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (err) {
      console.warn('[TMDB] search failed, using cached movies:', err instanceof Error ? err.message : err);
      return getCachedMoviePage({ page, pageSize: 20, sortBy: 'popular', query });
    }
  }

  async getGenres(): Promise<{ id: number; name: string }[]> {
    try {
      const { data } = await this.client.get('/genre/movie/list');
      return data.genres;
    } catch (err) {
      console.warn('[TMDB] genres failed, using cached genres:', err instanceof Error ? err.message : err);
      return getCachedMovieGenres();
    }
  }
}

export const tmdbService = new TmdbService();
