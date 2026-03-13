import { FallResult, TournamentParticipant, ScoringSystemConfig } from "@/types";

export interface LeaderboardEntry {
  participantId: string;
  nickname: string;
  teamName?: string;
  avatarUrl?: string;
  totalPoints: number;
  totalKills: number;
  booyahs: number;
  bestPlacement: number;
  lastFallPlacement: number;
  placementHistory: number[];
  rank?: number;
  previousRank?: number;
}

export function calculateLeaderboard(
  participants: (TournamentParticipant & { player?: any })[],
  results: FallResult[],
  scoringConfig: ScoringSystemConfig
): LeaderboardEntry[] {
  const entryMap: Record<string, LeaderboardEntry> = {};

  // 1. Initialize entries for all participants
  participants.forEach(p => {
    entryMap[p.id] = {
      participantId: p.id,
      nickname: p.player?.nickname || 'Jogador',
      teamName: p.team_name || undefined,
      avatarUrl: p.player?.avatar_url || undefined,
      totalPoints: 0,
      totalKills: 0,
      booyahs: 0,
      bestPlacement: 100, // Large number for easier min calculation
      lastFallPlacement: 100,
      placementHistory: []
    };
  });

  // 2. Aggregate results
  results.forEach(res => {
    const entry = entryMap[res.participant_id];
    if (!entry) return;

    entry.totalPoints += res.points;
    entry.totalKills += res.kills;
    entry.placementHistory.push(res.placement);
    
    if (res.placement === 1) entry.booyahs += 1;
    if (res.placement < entry.bestPlacement) entry.bestPlacement = res.placement;
    
    // We'll need to know which fall this is for lastFallPlacement
    // For now, we'll assume results are ordered by fall_number or we find it later
  });

  // 3. Convert to array and calculate last fall placement
  // (Assuming we have fall info or some way to sort them)
  // For the sake of this utility, we'll assume the results are applied sequentially
  
  const entries = Object.values(entryMap);

  // 4. Sort based on tie-breaker rules
  // Standard: 1. Points, 2. Booyahs, 3. Kills, 4. Best Placement, 5. Last Fall
  entries.sort((a, b) => {
    // 1. Total Points
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    
    // 2. Booyahs
    if (b.booyahs !== a.booyahs) return b.booyahs - a.booyahs;
    
    // 3. Total Kills
    if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
    
    // 4. Best Placement
    if (a.bestPlacement !== b.bestPlacement) return a.bestPlacement - b.bestPlacement;
    
    // 5. Last Fall (if we have history)
    const aLast = a.placementHistory[a.placementHistory.length - 1] || 100;
    const bLast = b.placementHistory[b.placementHistory.length - 1] || 100;
    return aLast - bLast;
  });

  // 5. Assign ranks
  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}
