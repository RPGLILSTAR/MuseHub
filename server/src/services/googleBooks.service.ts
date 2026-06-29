import { AxiosInstance } from 'axios';
import { Book, PaginatedResponse } from '../types';
import {
  getCachedBookDetail,
  getCachedBookPage,
} from './catalogFallback.service';
import { createOutboundClient } from '../utils/outboundAxios';

class OpenLibraryService {
  private client: AxiosInstance;

  constructor() {
    this.client = createOutboundClient({
      baseURL: 'https://openlibrary.org',
      timeout: 8000,
    });
  }

  private formatBook(doc: any): Book {
    const coverId = doc.cover_i || doc.cover_id;
    return {
      id: doc.key?.replace('/works/', '') || doc.seed?.[0] || String(Math.random()),
      title: doc.title || 'Unknown',
      subtitle: doc.subtitle,
      authors: doc.author_name || (doc.authors?.map((a: any) => a.name)) || ['Unknown'],
      publisher: doc.publisher?.[0],
      publishedDate: doc.first_publish_year?.toString() || doc.publish_date?.[0],
      description: typeof doc.description === 'string'
        ? doc.description
        : doc.description?.value || doc.first_sentence?.value || doc.first_sentence?.[0],
      pageCount: doc.number_of_pages_median || doc.number_of_pages,
      categories: doc.subject?.slice(0, 5),
      averageRating: doc.ratings_average ? parseFloat(doc.ratings_average.toFixed(1)) : undefined,
      ratingsCount: doc.ratings_count,
      thumbnail: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : undefined,
      language: doc.language?.[0],
      previewLink: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
      infoLink: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
    };
  }

  async search(query: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Book>> {
    const offset = (page - 1) * pageSize;
    try {
      const { data } = await this.client.get('/search.json', {
        params: {
          q: query,
          limit: pageSize,
          offset,
          fields: 'key,title,subtitle,author_name,publisher,first_publish_year,cover_i,subject,ratings_average,ratings_count,number_of_pages_median,first_sentence,language,edition_count',
        },
      });

      const totalResults = data.numFound || 0;
      return {
        data: (data.docs || []).map((doc: any) => this.formatBook(doc)),
        page,
        totalPages: Math.ceil(totalResults / pageSize),
        totalResults,
      };
    } catch (err) {
      console.warn('[OpenLibrary] search failed, using cached books:', err instanceof Error ? err.message : err);
      return getCachedBookPage({ page, pageSize, query, sortBy: 'rating' });
    }
  }

  async getDetail(id: string): Promise<Book> {
    const workKey = id.startsWith('/works/') ? id : `/works/${id}`;
    try {
      const { data } = await this.client.get(`${workKey}.json`);

      let ratingsAvg: number | undefined;
      let ratingsCount: number | undefined;
      try {
        const { data: ratings } = await this.client.get(`${workKey}/ratings.json`);
        ratingsAvg = ratings.summary?.average ? parseFloat(ratings.summary.average.toFixed(1)) : undefined;
        ratingsCount = ratings.summary?.count;
      } catch {}

      const coverId = data.covers?.[0];
      const authorKeys: string[] = (data.authors || []).map((a: any) => a.author?.key || a.key).filter(Boolean);
      const authorNames: string[] = [];
      for (const key of authorKeys.slice(0, 5)) {
        try {
          const { data: authorData } = await this.client.get(`${key}.json`);
          authorNames.push(authorData.name || 'Unknown');
        } catch {
          authorNames.push('Unknown');
        }
      }

      return {
        id: id,
        title: data.title || 'Unknown',
        subtitle: data.subtitle,
        authors: authorNames.length > 0 ? authorNames : ['Unknown'],
        description: typeof data.description === 'string'
          ? data.description
          : data.description?.value,
        categories: data.subjects?.slice(0, 8),
        averageRating: ratingsAvg,
        ratingsCount: ratingsCount,
        thumbnail: coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          : undefined,
        previewLink: `https://openlibrary.org${workKey}`,
        infoLink: `https://openlibrary.org${workKey}`,
      };
    } catch (err) {
      console.warn('[OpenLibrary] detail failed, using cached book:', err instanceof Error ? err.message : err);
      return getCachedBookDetail(id);
    }
  }

  async getPopular(category = 'fiction', page = 1): Promise<PaginatedResponse<Book>> {
    return this.getByCategory(category, page);
  }

  async getByCategory(category: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Book>> {
    const offset = (page - 1) * pageSize;
    try {
      const { data } = await this.client.get(`/subjects/${category.toLowerCase()}.json`, {
        params: { limit: pageSize, offset },
      });

      const totalResults = data.work_count || 0;
      const books: Book[] = (data.works || []).map((work: any) => ({
        id: work.key?.replace('/works/', '') || String(Math.random()),
        title: work.title,
        authors: work.authors?.map((a: any) => a.name) || ['Unknown'],
        publishedDate: work.first_publish_year?.toString(),
        thumbnail: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : undefined,
        categories: [category],
        previewLink: work.key ? `https://openlibrary.org${work.key}` : undefined,
        infoLink: work.key ? `https://openlibrary.org${work.key}` : undefined,
      }));

      return { data: books, page, totalPages: Math.ceil(totalResults / pageSize), totalResults };
    } catch (err) {
      console.warn('[OpenLibrary] category failed, using cached books:', err instanceof Error ? err.message : err);
      return getCachedBookPage({ page, pageSize, category, sortBy: 'rating' });
    }
  }

  async getNewReleases(page = 1): Promise<PaginatedResponse<Book>> {
    try {
      return await this.search('new releases 2025', page, 20);
    } catch (err) {
      console.warn('[OpenLibrary] new releases failed, using cached books:', err instanceof Error ? err.message : err);
      return getCachedBookPage({ page, pageSize: 20, sortBy: 'rating' });
    }
  }
}

export const googleBooksService = new OpenLibraryService();
