import type { WatchlistItem, CreateWatchlistItem } from '@/types';

/**
 * DIP — Route handlers depend on this interface, not SupabaseWatchlistRepository.
 * Swap with MockWatchlistRepository in tests with zero code changes.
 */
export interface IWatchlistRepository {
  findByUserId(userId: string): Promise<WatchlistItem[]>;
  findById(id: string, userId: string): Promise<WatchlistItem | null>;
  create(userId: string, data: CreateWatchlistItem): Promise<WatchlistItem>;
  delete(id: string, userId: string): Promise<void>;
  existsBySymbol(userId: string, symbol: string): Promise<boolean>;
}