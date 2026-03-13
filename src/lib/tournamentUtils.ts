import { Tournament, MiniTournament } from "@/types";

/**
 * Normalizes tournament data to ensure consistent display and logical validity.
 * Handles cents vs BRL conversion and field fallbacks.
 */
export function normalizeTournamentData(data: any): Tournament {
  const normalized = { ...data };

  // 1. Normalize Entry Fee
  // Preference order: entry_fee_brl (new) -> entry_fee (legacy credits)
  let fee = normalized.entry_fee_brl ?? (normalized.entry_fee ? normalized.entry_fee / 100 : 0);
  
  // 2. Normalize Prize
  // Preference order: prize_amount_brl -> prize_pool_brl -> prize_amount -> prize
  let prize = normalized.prize_amount_brl ?? normalized.prize_pool_brl ?? normalized.prize_amount ?? normalized.prize ?? 0;

  // 3. Smart Detection for Unit Inconsistencies (Cents vs BRL)
  // Logic: If fee looks like it's in cents (>= prize and prize > 0)
  if (prize > 0 && fee >= prize && fee > 500) {
    fee = fee / 100;
  }

  // Same for prize if it's ridiculously high compared to reasonable tournament stakes
  // If entry fee is R$ 10 and prize is R$ 100,000, it's likely R$ 1,000.00 stored as 100000 cents
  if (fee > 0 && prize > fee * 200 && prize > 5000) {
    prize = prize / 100;
  }

  normalized.entry_fee_brl = fee;
  normalized.prize_pool_brl = prize;
  normalized.prize_amount_brl = prize; 
  normalized.prize_amount = prize; // For legacy support

  return normalized as Tournament;
}

/**
 * Normalizes mini-tournament (Apostado) data.
 * Specifically handles the 1.8x prize pool logic and unit corrections.
 */
export function normalizeMiniTournamentData(data: any): MiniTournament {
  const normalized = { ...data };

  // 1. Normalize values
  let fee = normalized.entry_fee_brl ?? (normalized.entry_fee ? normalized.entry_fee / 100 : 0);
  let prize = normalized.prize_pool_brl ?? normalized.prize ?? 0;

  // 2. Smart Detection
  if (prize > 0 && fee >= prize && fee > 50) {
    fee = fee / 100;
  }

  // 3. Prize Ratio Enforcement
  // For Apostados, prize is total_pot * 0.9
  const participants = normalized.max_participants || 2;
  const totalPot = fee * participants;
  const expectedPrize = totalPot * 0.9;

  if (fee > 0 && (prize === 0 || prize > totalPot || prize < fee)) {
    prize = expectedPrize;
  }

  normalized.entry_fee_brl = fee;
  normalized.prize_pool_brl = prize;
  normalized.prize_amount_brl = prize;

  return normalized as MiniTournament;
}
