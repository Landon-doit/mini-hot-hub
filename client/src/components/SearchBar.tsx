import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchHistoryItem, SearchResult } from '../types/hot';
import { highlightTitle } from '../lib/highlight';
import { useSearchIndex } from '../lib/minisearch';

const HISTORY_KEY = 'mhh_search_history';
const MAX_HISTORY_ITEMS = 10;

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getSearchHistory(): SearchHistoryItem[] {
  if (!hasLocalStorage()) return [];

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is SearchHistoryItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as SearchHistoryItem).keyword === 'string' &&
          typeof (item as SearchHistoryItem).createdAt === 'string',
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function saveSearchHistory(keyword: string): SearchHistoryItem[] {
  const normalized = keyword.trim();
  if (!normalized) return getSearchHistory();

  const next: SearchHistoryItem[] = [
    { keyword: normalized, createdAt: new Date().toISOString() },
    ...getSearchHistory().filter((item) => item.keyword !== normalized),
  ].slice(0, MAX_HISTORY_ITEMS);

  if (hasLocalStorage()) {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearSearchHistory(): void {
  if (hasLocalStorage()) window.localStorage.removeItem(HISTORY_KEY);
}

function SearchGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HistoryGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ClearGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
    </svg>
  );
}

interface SearchBarProps {
  autoFocus?: boolean;
  onSubmitSearch?: () => void;
}

function SearchBar({ autoFocus = false, onSubmitSearch }: SearchBarProps) {
  const navigate = useNavigate();
  const { ready, search, mount } = useSearchIndex();
  const formRef = useRef<HTMLFormElement>(null);
  const releaseIndexRef = useRef<(() => void) | null>(null);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const trimmedValue = value.trim();
  const showingSuggestions = focused && trimmedValue.length >= 2 && suggestions.length > 0;
  const showingHistory = focused && trimmedValue.length === 0 && history.length > 0;

  const mountIndex = () => {
    if (!releaseIndexRef.current) {
      releaseIndexRef.current = mount();
    }
  };

  useEffect(
    () => () => {
      releaseIndexRef.current?.();
      releaseIndexRef.current = null;
    },
    [],
  );

  useEffect(() => {
    setHighlightedIndex(-1);
    if (!focused || trimmedValue.length < 2) {
      setSuggestions([]);
      return;
    }

    if (!ready) return;
    const timer = window.setTimeout(() => {
      setSuggestions(search(trimmedValue, { limit: 8 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [focused, ready, search, trimmedValue]);

  const submitSearch = (keyword: string) => {
    const normalized = keyword.trim();
    if (!normalized) return;
    const nextHistory = saveSearchHistory(normalized);
    setHistory(nextHistory);
    setSuggestions([]);
    setFocused(false);
    onSubmitSearch?.();
    navigate(`/search?q=${encodeURIComponent(normalized)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (showingSuggestions && highlightedIndex >= 0) {
      submitSearch(suggestions[highlightedIndex]?.title ?? value);
      return;
    }
    submitSearch(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const itemCount = showingSuggestions ? suggestions.length : showingHistory ? history.length : 0;
    if (event.key === 'ArrowDown' && itemCount > 0) {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % itemCount);
    } else if (event.key === 'ArrowUp' && itemCount > 0) {
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? itemCount - 1 : current - 1));
    } else if (event.key === 'Escape') {
      setFocused(false);
      setSuggestions([]);
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    setHighlightedIndex(-1);
  };

  return (
    <form
      ref={formRef}
      role="search"
      aria-label="搜索热搜"
      onSubmit={handleSubmit}
      onFocus={() => {
        mountIndex();
        setFocused(true);
        if (value.trim() === '') setHistory(getSearchHistory());
      }}
      onBlur={(event) => {
        if (!formRef.current?.contains(event.relatedTarget as Node | null)) {
          window.setTimeout(() => setFocused(false), 0);
        }
      }}
      className="relative flex w-full items-center"
    >
      <span className="pointer-events-none absolute left-3 text-muted">
        <SearchGlyph />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue.trim()) mountIndex();
          setValue(nextValue);
          if (nextValue.trim() === '') setHistory(getSearchHistory());
        }}
        onKeyDown={handleKeyDown}
        placeholder="搜索热搜"
        aria-label="搜索关键词"
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-expanded={showingSuggestions || showingHistory}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-12 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <button
        type="submit"
        aria-label="提交搜索"
        title="提交搜索"
        className="absolute right-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <SearchGlyph />
      </button>

      {(showingSuggestions || showingHistory) && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-md border border-border bg-card shadow-lg"
        >
          {showingSuggestions &&
            suggestions.map((result, index) => (
              <button
                type="button"
                role="option"
                aria-selected={highlightedIndex === index}
                key={`${result.platform}-${result.id}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitSearch(result.title)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-background ${
                  highlightedIndex === index ? 'bg-background' : ''
                }`}
              >
                <span className="mt-0.5 shrink-0 text-xs text-muted">{result.platformName}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {highlightTitle(result.title, value)}
                </span>
              </button>
            ))}

          {showingHistory && (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted">
                <span>最近搜索</span>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-background hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <ClearGlyph />
                  清空
                </button>
              </div>
              {history.map((item, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === index}
                  key={`${item.keyword}-${item.createdAt}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitSearch(item.keyword)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-background ${
                    highlightedIndex === index ? 'bg-background' : ''
                  }`}
                >
                  <span className="text-muted">
                    <HistoryGlyph />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{item.keyword}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </form>
  );
}

export default SearchBar;
