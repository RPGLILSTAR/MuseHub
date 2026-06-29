export type ItemType = 'book' | 'movie';
export type MarkStatus = 'wish' | 'doing' | 'done';

export interface UserMark {
  itemId: string;
  itemType: ItemType;
  status: MarkStatus;
  rating: number | null;
  tags: string[];
  comment: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserReview {
  id: string;
  itemId: string;
  itemType: ItemType;
  content: string;
  rating: number;
  author: string;
  likeCount: number;
  createdAt: number;
}

export interface UserList {
  id: string;
  name: string;
  description: string;
  itemType: ItemType;
  items: string[];
  coverUrl: string;
  createdAt: number;
  updatedAt: number;
}

class UserCollectionService {
  private marks = new Map<string, UserMark>();
  private reviews: UserReview[] = [];
  private lists = new Map<string, UserList>();
  private counter = 0;

  private markKey(itemType: ItemType, itemId: string) {
    return `${itemType}:${itemId}`;
  }

  // ─── 标记（想看/在看/看过）───
  setMark(itemType: ItemType, itemId: string, status: MarkStatus, rating?: number, tags?: string[], comment?: string): UserMark {
    const key = this.markKey(itemType, itemId);
    const existing = this.marks.get(key);
    const mark: UserMark = {
      itemId,
      itemType,
      status,
      rating: rating ?? existing?.rating ?? null,
      tags: tags ?? existing?.tags ?? [],
      comment: comment ?? existing?.comment ?? '',
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    this.marks.set(key, mark);
    return mark;
  }

  removeMark(itemType: ItemType, itemId: string): boolean {
    return this.marks.delete(this.markKey(itemType, itemId));
  }

  getMark(itemType: ItemType, itemId: string): UserMark | null {
    return this.marks.get(this.markKey(itemType, itemId)) || null;
  }

  getMarksByStatus(itemType: ItemType, status?: MarkStatus): UserMark[] {
    const result: UserMark[] = [];
    this.marks.forEach((m) => {
      if (m.itemType === itemType && (!status || m.status === status)) result.push(m);
    });
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getMarkStats(itemType: ItemType): Record<MarkStatus, number> {
    const stats: Record<MarkStatus, number> = { wish: 0, doing: 0, done: 0 };
    this.marks.forEach((m) => {
      if (m.itemType === itemType) stats[m.status]++;
    });
    return stats;
  }

  // ─── 评论/短评 ───
  addReview(itemType: ItemType, itemId: string, content: string, rating: number, author = '匿名用户'): UserReview {
    const review: UserReview = {
      id: `review-${++this.counter}-${Date.now()}`,
      itemId,
      itemType,
      content,
      rating,
      author,
      likeCount: 0,
      createdAt: Date.now(),
    };
    this.reviews.unshift(review);
    return review;
  }

  getReviews(itemType: ItemType, itemId: string): UserReview[] {
    return this.reviews.filter((r) => r.itemType === itemType && r.itemId === itemId);
  }

  likeReview(reviewId: string): boolean {
    const r = this.reviews.find((x) => x.id === reviewId);
    if (!r) return false;
    r.likeCount++;
    return true;
  }

  deleteReview(reviewId: string): boolean {
    const idx = this.reviews.findIndex((x) => x.id === reviewId);
    if (idx < 0) return false;
    this.reviews.splice(idx, 1);
    return true;
  }

  // ─── 书单/片单 ───
  createList(itemType: ItemType, name: string, description = ''): UserList {
    const list: UserList = {
      id: `list-${++this.counter}-${Date.now()}`,
      name,
      description,
      itemType,
      items: [],
      coverUrl: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.lists.set(list.id, list);
    return list;
  }

  deleteList(id: string): boolean {
    return this.lists.delete(id);
  }

  getLists(itemType: ItemType): UserList[] {
    const result: UserList[] = [];
    this.lists.forEach((l) => { if (l.itemType === itemType) result.push(l); });
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getList(id: string): UserList | null {
    return this.lists.get(id) || null;
  }

  addToList(listId: string, itemId: string): boolean {
    const l = this.lists.get(listId);
    if (!l || l.items.includes(itemId)) return false;
    l.items.unshift(itemId);
    l.updatedAt = Date.now();
    return true;
  }

  removeFromList(listId: string, itemId: string): boolean {
    const l = this.lists.get(listId);
    if (!l) return false;
    l.items = l.items.filter((x) => x !== itemId);
    l.updatedAt = Date.now();
    return true;
  }
}

export const userCollectionService = new UserCollectionService();
