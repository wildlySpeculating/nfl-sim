import { useEffect, useCallback, useRef } from 'react';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { GameSelection, PlayoffPicks, Game } from '@/types';

interface UrlState {
  selections: Record<string, GameSelection>;
  playoffPicks: PlayoffPicks;
}

interface UseUrlStateOptions {
  debounceMs?: number;
}

export function encodeState(state: UrlState): string {
  try {
    const json = JSON.stringify(state);
    return compressToEncodedURIComponent(json);
  } catch {
    return '';
  }
}

export function decodeState(encoded: string): UrlState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as UrlState;
  } catch {
    return null;
  }
}

export function useUrlState(
  selections: Record<string, GameSelection>,
  playoffPicks: PlayoffPicks,
  games: Game[],
  onStateLoad: (state: UrlState) => void,
  options: UseUrlStateOptions = {}
) {
  const { debounceMs = 500 } = options;
  const debounceRef = useRef<number | null>(null);
  const initialLoadDone = useRef(false);

  // Load state from URL on mount
  useEffect(() => {
    if (initialLoadDone.current) return;

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');

    if (encoded) {
      const state = decodeState(encoded);
      if (state) {
        // Partial apply: filter out selections for completed games
        const completedGameIds = new Set(
          games.filter(g => g.status === 'final').map(g => g.id)
        );

        const filteredSelections: Record<string, GameSelection> = {};
        for (const [gameId, selection] of Object.entries(state.selections)) {
          if (!completedGameIds.has(gameId)) {
            filteredSelections[gameId] = selection;
          }
        }

        onStateLoad({
          selections: filteredSelections,
          playoffPicks: state.playoffPicks,
        });
      }
    }

    initialLoadDone.current = true;
  }, [games, onStateLoad]);

  // Update URL when state changes
  useEffect(() => {
    if (!initialLoadDone.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const state: UrlState = { selections, playoffPicks };
      const hasState = Object.keys(selections).length > 0 ||
        playoffPicks.superBowl !== null ||
        playoffPicks.afc.championship !== null ||
        playoffPicks.nfc.championship !== null;

      const url = new URL(window.location.href);

      if (hasState) {
        const encoded = encodeState(state);
        url.searchParams.set('s', encoded);
      } else {
        url.searchParams.delete('s');
      }

      window.history.replaceState({}, '', url.toString());
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [selections, playoffPicks, debounceMs]);

  const getShareableUrl = useCallback((): string => {
    const state: UrlState = { selections, playoffPicks };
    const encoded = encodeState(state);
    const url = new URL(window.location.href);
    url.searchParams.set('s', encoded);
    return url.toString();
  }, [selections, playoffPicks]);

  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    try {
      const url = getShareableUrl();
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [getShareableUrl]);

  return {
    getShareableUrl,
    copyShareableUrl,
  };
}
