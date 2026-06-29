export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  popularity: number;
}

export interface MovieDetail extends Movie {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  productionCompanies: { id: number; name: string; logoPath: string | null }[];
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos: VideoResult[];
  similar: Movie[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

export interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  thumbnail?: string;
  language?: string;
  previewLink?: string;
  infoLink?: string;
}

export interface Track {
  id: number;
  name: string;
  artists: { id: number; name: string }[];
  album: {
    id: number;
    name: string;
    picUrl: string;
  };
  duration: number;
  url?: string;
}

export interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  description: string | null;
  trackCount: number;
  playCount: number;
  creator: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
  tags: string[];
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
