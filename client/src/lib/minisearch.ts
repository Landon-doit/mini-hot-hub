import type MiniSearch from 'minisearch';
import type { SearchResult as MiniSearchResult } from 'minisearch';
import type { Segment, useDefault } from 'segmentit';
import { useSyncExternalStore } from 'react';
import type { HotPlatform, Platform, SearchResult } from '../types/hot';
import { MOCK_PLATFORMS } from '@shared/mock-data';

const INDEX_REFRESH_MS = 5 * 60 * 1000;
const BASE = import.meta.env.VITE_API_BASE ?? '';

export type SearchOptions = {
  platform?: Platform;
  category?: string;
  limit?: number;
};

type SearchDocument = SearchResult;
type Index = Pick<MiniSearch<SearchDocument>, 'search'>;
type Segmenter = ReturnType<typeof useDefault>;
type SegmentitExports = { Segment: typeof Segment; useDefault: typeof useDefault };
type MiniSearchConstructor = typeof MiniSearch;

let segmenterPromise: Promise<Segmenter> | null = null;
let miniSearchPromise: Promise<MiniSearchConstructor> | null = null;

function getSegmenter(): Promise<Segmenter> {
  if (!segmenterPromise) {
    segmenterPromise = import('segmentit').then((module) => {
      const segmentit = (module.default ?? module) as unknown as SegmentitExports;
      const { Segment, useDefault } = segmentit;
      return useDefault(new Segment());
    });
  }
  return segmenterPromise;
}

function getMiniSearch(): Promise<MiniSearchConstructor> {
  if (!miniSearchPromise) {
    miniSearchPromise = import('minisearch').then(({ default: MiniSearch }) => MiniSearch);
  }
  return miniSearchPromise;
}

function createEmptyIndex(): Index {
  return { search: () => [] };
}

async function createIndex(): Promise<MiniSearch<SearchDocument>> {
  const [MiniSearch, segmenter] = await Promise.all([getMiniSearch(), getSegmenter()]);
  return new MiniSearch<SearchDocument>({
    fields: ['title', 'platformName'],
    storeFields: ['title', 'url', 'platform', 'platformName', 'heat', 'category', 'isMock', 'updatedAt'],
    tokenize: (text) => segmenter.doSegment(text, { simple: true }) as string[],
    searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
  });
}

function toSearchDocuments(aggregate: HotPlatform[]): SearchDocument[] {
  return aggregate.flatMap((platform) =>
    platform.items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      platform: item.platform,
      platformName: platform.platformName,
      heat: item.hotValue.raw,
      category: item.primaryCategory ?? item.categories[0] ?? undefined,
      isMock: item.isMock,
      updatedAt: item.updatedAt,
    })),
  );
}

export async function buildIndex(aggregate: HotPlatform[]): Promise<Index> {
  const index = await createIndex();
  index.addAll(toSearchDocuments(aggregate));
  return index;
}

async function fetchAggregate(): Promise<HotPlatform[]> {
  const response = await fetch(`${BASE}/api/hot/aggregate?refresh=1`);
  if (!response.ok) {
    throw new Error(`Aggregate request failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as { data?: Record<string, HotPlatform> };
  const aggregate = Object.values(body.data ?? {});
  if (!aggregate.length || aggregate.some((platform) => !Array.isArray(platform.items))) {
    throw new Error('Invalid aggregate response');
  }
  return aggregate;
}

function hoursSince(updatedAt?: string): number {
  if (!updatedAt) return 0;
  const timestamp = Date.parse(updatedAt);
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
}

function rankScore(result: MiniSearchResult, maxHeat: number): number {
  const document = result as MiniSearchResult & SearchDocument;
  const heatWeight = maxHeat > 0 ? (document.heat / maxHeat) * 0.5 : 0;
  const timeDecay = Math.exp(-0.1 * hoursSince(document.updatedAt));
  return result.score + heatWeight + timeDecay;
}

export function search(keyword: string, options: SearchOptions = {}): SearchResult[] {
  const query = keyword.trim();
  if (!query) return [];

  const matches = searchIndexManager.index.search(query) as MiniSearchResult[];
  const filtered = matches.filter((match) => {
    const result = match as MiniSearchResult & SearchDocument;
    return (
      (!options.platform || result.platform === options.platform) &&
      (!options.category || result.category === undefined || result.category === options.category)
    );
  });
  const maxHeat = Math.max(0, ...filtered.map((match) => (match as unknown as SearchDocument).heat));

  filtered.sort((left, right) => rankScore(right, maxHeat) - rankScore(left, maxHeat));
  const limit = options.limit === undefined ? filtered.length : Math.max(0, options.limit);
  return filtered.slice(0, limit).map((match) => {
    const result = match as MiniSearchResult & SearchDocument;
    return {
      id: result.id,
      title: result.title,
      url: result.url,
      platform: result.platform,
      platformName: result.platformName,
      heat: result.heat,
      ...(result.category === undefined ? {} : { category: result.category }),
      isMock: result.isMock,
      score: result.score,
      ...(result.updatedAt === undefined ? {} : { updatedAt: result.updatedAt }),
    };
  });
}

type IndexSnapshot = { ready: boolean; loading: boolean };

class SearchIndexManager {
  index: Index = createEmptyIndex();
  private snapshot: IndexSnapshot = { ready: false, loading: false };
  private readonly listeners = new Set<() => void>();
  private subscribers = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private rebuilding = false;

  getSnapshot = (): IndexSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get mounted(): boolean {
    return this.subscribers > 0;
  }

  mount = (): (() => void) => {
    this.subscribers += 1;
    if (this.subscribers === 1) {
      void this.rebuild();
      this.timer = setInterval(() => void this.rebuild(), INDEX_REFRESH_MS);
    }

    return () => {
      this.subscribers = Math.max(0, this.subscribers - 1);
      if (this.subscribers === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  }

  async rebuild(): Promise<void> {
    if (this.rebuilding || !this.mounted) return;
    this.rebuilding = true;
    this.setSnapshot({ ready: this.snapshot.ready, loading: true });
    try {
      const aggregate = await fetchAggregate();
      this.index = await buildIndex(aggregate);
      this.setSnapshot({ ready: true, loading: false });
    } catch {
      if (!this.snapshot.ready) {
        this.index = await buildIndex(MOCK_PLATFORMS);
        this.setSnapshot({ ready: true, loading: false });
      } else {
        this.setSnapshot({ ready: true, loading: false });
      }
    } finally {
      this.rebuilding = false;
    }
  }

  private setSnapshot(snapshot: IndexSnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

export const searchIndexManager = new SearchIndexManager();

export function useSearchIndex(): IndexSnapshot & { search: typeof search; mount: typeof searchIndexManager.mount } {
  const snapshot = useSyncExternalStore(
    searchIndexManager.subscribe,
    searchIndexManager.getSnapshot,
    searchIndexManager.getSnapshot,
  );
  return { ...snapshot, search, mount: searchIndexManager.mount };
}
