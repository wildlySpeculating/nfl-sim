import { useState, useCallback } from 'react';
import type { Game, GameSelection, PlayoffPicks } from '@/types';

interface ScenarioState {
  selections: Record<string, GameSelection>;
  playoffPicks: PlayoffPicks;
}

const initialPlayoffPicks: PlayoffPicks = {
  afc: {
    wildCard: [null, null, null],
    divisional: [null, null],
    championship: null,
  },
  nfc: {
    wildCard: [null, null, null],
    divisional: [null, null],
    championship: null,
  },
  superBowl: null,
};

interface Conflict {
  gameId: string;
  game: Game;
  teams: [string, string]; // Team IDs that conflict
}

interface UseScenarioReturn {
  selections: Record<string, GameSelection>;
  playoffPicks: PlayoffPicks;
  setGameWinner: (gameId: string, selection: GameSelection) => void;
  setTeamWinsRemaining: (teamId: string, games: Game[]) => Conflict[];
  clearSelections: () => void;
  clearPlayoffPicks: () => void;
  setPlayoffWinner: (
    conference: 'afc' | 'nfc',
    round: 'wildCard' | 'divisional' | 'championship',
    matchupIndex: number,
    winnerId: string | null
  ) => void;
  setSuperBowlWinner: (winnerId: string | null) => void;
  getConflicts: (teamId: string, games: Game[]) => Conflict[];
  applyBulkSelections: (selections: Record<string, GameSelection>) => void;
}

export function useScenario(initialState?: Partial<ScenarioState>): UseScenarioReturn {
  const [selections, setSelections] = useState<Record<string, GameSelection>>(
    initialState?.selections || {}
  );
  const [playoffPicks, setPlayoffPicks] = useState<PlayoffPicks>(
    initialState?.playoffPicks || initialPlayoffPicks
  );

  const setGameWinner = useCallback((gameId: string, selection: GameSelection) => {
    setSelections(prev => {
      if (selection === null) {
        const { [gameId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [gameId]: selection };
    });
  }, []);

  const getConflicts = useCallback((teamId: string, games: Game[]): Conflict[] => {
    const conflicts: Conflict[] = [];

    // Get all remaining games for this team
    const teamGames = games.filter(
      g => g.status !== 'final' &&
      (g.homeTeam.id === teamId || g.awayTeam.id === teamId)
    );

    for (const game of teamGames) {
      const opponentId = game.homeTeam.id === teamId ? game.awayTeam.id : game.homeTeam.id;
      const existingSelection = selections[game.id];

      // Check if there's already a selection for the opponent winning
      const teamIsHome = game.homeTeam.id === teamId;
      const teamWinSelection = teamIsHome ? 'home' : 'away';

      if (existingSelection && existingSelection !== teamWinSelection && existingSelection !== 'tie') {
        conflicts.push({
          gameId: game.id,
          game,
          teams: [teamId, opponentId],
        });
      }
    }

    return conflicts;
  }, [selections]);

  const setTeamWinsRemaining = useCallback((teamId: string, games: Game[]): Conflict[] => {
    const conflicts = getConflicts(teamId, games);

    if (conflicts.length > 0) {
      return conflicts;
    }

    // Apply all wins for this team
    const teamGames = games.filter(
      g => g.status !== 'final' &&
      (g.homeTeam.id === teamId || g.awayTeam.id === teamId)
    );

    const newSelections: Record<string, GameSelection> = {};
    for (const game of teamGames) {
      const teamIsHome = game.homeTeam.id === teamId;
      newSelections[game.id] = teamIsHome ? 'home' : 'away';
    }

    setSelections(prev => ({ ...prev, ...newSelections }));
    return [];
  }, [getConflicts]);

  const clearSelections = useCallback(() => {
    setSelections({});
  }, []);

  const clearPlayoffPicks = useCallback(() => {
    setPlayoffPicks(initialPlayoffPicks);
  }, []);

  const setPlayoffWinner = useCallback((
    conference: 'afc' | 'nfc',
    round: 'wildCard' | 'divisional' | 'championship',
    matchupIndex: number,
    winnerId: string | null
  ) => {
    setPlayoffPicks(prev => {
      const newPicks = { ...prev };
      const confPicks = { ...newPicks[conference] };

      if (round === 'championship') {
        confPicks.championship = winnerId;
        // Clear super bowl if this conference's champ changes
        newPicks.superBowl = null;
      } else {
        const roundPicks = [...confPicks[round]];
        roundPicks[matchupIndex] = winnerId;
        confPicks[round] = roundPicks as typeof confPicks[typeof round];

        // Cascade clear: if changing earlier round, clear later rounds
        if (round === 'wildCard') {
          confPicks.divisional = [null, null];
          confPicks.championship = null;
          newPicks.superBowl = null;
        } else if (round === 'divisional') {
          confPicks.championship = null;
          newPicks.superBowl = null;
        }
      }

      newPicks[conference] = confPicks;
      return newPicks;
    });
  }, []);

  const setSuperBowlWinner = useCallback((winnerId: string | null) => {
    setPlayoffPicks(prev => ({ ...prev, superBowl: winnerId }));
  }, []);

  const applyBulkSelections = useCallback((newSelections: Record<string, GameSelection>) => {
    setSelections(prev => ({ ...prev, ...newSelections }));
  }, []);

  return {
    selections,
    playoffPicks,
    setGameWinner,
    setTeamWinsRemaining,
    clearSelections,
    clearPlayoffPicks,
    setPlayoffWinner,
    setSuperBowlWinner,
    getConflicts,
    applyBulkSelections,
  };
}
