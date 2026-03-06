"use client";

import React, { useState } from "react";
import { Match, Profile, Team } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, Check, Loader2, Play, Info } from "lucide-react";
import { useMatchActions } from "@/hooks/useMatches";
import { MatchCoordinationDialog } from "./MatchCoordinationDialog";
import { toast } from "sonner";

interface MatchCardProps {
  match: Match;
  isOrganizer: boolean;
}

const PlayerSection = ({
  player,
  team,
  isTeam,
  isWinner,
  onPickWinner,
  isOrganizer,
  canPick,
  isLoading,
}: {
  player?: Profile;
  team?: Team;
  isTeam: boolean;
  isWinner: boolean;
  onPickWinner: (e: React.MouseEvent) => void;
  isOrganizer: boolean;
  canPick: boolean;
  isLoading: boolean;
}) => {
  const displayName = isTeam ? team?.name : player?.nickname;
  const avatarUrl = isTeam ? undefined : player?.avatar_url;
  const initial = isTeam ? team?.name?.[0] : player?.nickname?.[0];

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
        isWinner
          ? "bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
          : "bg-white/5 border border-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 border border-white/10">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-white/10 text-[10px] font-black italic">
            {initial?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span
            className={`text-xs font-black italic uppercase tracking-tighter truncate max-w-[100px] ${
              (player || team) ? "text-white" : "text-gray-600 italic font-medium"
            }`}
          >
            {displayName || "Aguardando..."}
          </span>
          {isWinner && (
            <span className="text-[8px] font-black uppercase text-primary tracking-widest mt-0.5">
              Vencedor
            </span>
          )}
        </div>
      </div>

      {isOrganizer && canPick && (player || team) && !isWinner && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"
          onClick={onPickWinner}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
      )}

      {isWinner && <Trophy className="h-4 w-4 text-primary" />}
    </div>
  );
};

const MatchCard = ({ match, isOrganizer }: MatchCardProps) => {
  const [open, setOpen] = useState(false);
  const { updateMatchWinner } = useMatchActions(match.tournament_id);

  const handleWinner = (winnerId: string) => {
    updateMatchWinner.mutate({ matchId: match.id, winnerId });
  };

  const isCompleted = match.status === "completed";
  const canPick = !isCompleted && ((!!match.player1_id && !!match.player2_id) || (!!match.team1_id && !!match.team2_id));

  return (
    <div className="relative p-4 w-60">
      <div 
        onClick={() => setOpen(true)}
        className="flex flex-col gap-2 p-3 bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl cursor-pointer hover:border-primary/30 transition-all group"
      >
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest italic flex items-center gap-1">
            Match #{match.position + 1}
            <Info className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          {match.status === "in_progress" && (
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4">
              AO VIVO
            </Badge>
          )}
        </div>

        <PlayerSection
          player={match.player1}
          team={match.team1}
          isTeam={!!match.team1_id}
          isWinner={match.winner_id === (match.team1_id || match.player1_id) && isCompleted}
          onPickWinner={(e) => {
            e.stopPropagation();
            handleWinner(match.team1_id || match.player1_id!);
          }}
          isOrganizer={isOrganizer}
          canPick={canPick}
          isLoading={updateMatchWinner.isPending}
        />

        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative z-10 bg-[#0D0D0F] px-2 text-[9px] font-black italic text-gray-700">
            VS
          </span>
        </div>

        <PlayerSection
          player={match.player2}
          team={match.team2}
          isTeam={!!match.team2_id}
          isWinner={match.winner_id === (match.team2_id || match.player2_id) && isCompleted}
          onPickWinner={(e) => {
            e.stopPropagation();
            handleWinner(match.team2_id || match.player2_id!);
          }}
          isOrganizer={isOrganizer}
          canPick={canPick}
          isLoading={updateMatchWinner.isPending}
        />
      </div>

      <MatchCoordinationDialog 
        open={open}
        onOpenChange={setOpen}
        match={match}
        isOrganizer={isOrganizer}
      />
    </div>
  );
};

export const TournamentBracket = ({
  matches,
  isOrganizer,
  tournamentId,
}: {
  matches: Match[];
  isOrganizer: boolean;
  tournamentId: string;
}) => {
  const { generateBracket } = useMatchActions(tournamentId);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/2 border border-dashed border-white/5 rounded-[40px] text-center">
        <Trophy className="h-16 w-16 text-gray-800 mb-6" />
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
          Chave não gerada
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mb-8 font-medium">
          {isOrganizer
            ? "O torneio está pronto para começar! Gere a chave para definir os confrontos inicias dos jogadores."
            : "Aguardando o organizador definir os confrontos deste torneio."}
        </p>

        {isOrganizer && (
          <Button
            size="lg"
            onClick={() => generateBracket.mutate()}
            disabled={generateBracket.isPending}
            className="bg-primary hover:opacity-90 px-10 h-14 rounded-2xl font-black italic uppercase shadow-xl shadow-primary/20 transition-all hover:scale-105"
          >
            {generateBracket.isPending ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                GERANDO...
              </>
            ) : (
              <>
                <Play className="mr-3 h-5 w-5 fill-current" />
                GERAR CHAVE AGORA
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // Group matches by round
  const rounds: Match[][] = [];
  matches.forEach((match) => {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  });

  return (
    <div className="flex overflow-x-auto pb-10 gap-12 scrollbar-hide py-4 items-start min-h-[600px]">
      {rounds.map((roundMatches, roundIndex) => (
        <div
          key={roundIndex}
          className="flex flex-col justify-around gap-8 h-full"
        >
          <div className="text-center mb-4">
            <h4 className="text-[10px] font-black uppercase text-primary italic tracking-[0.2em]">
              {roundIndex === rounds.length - 1
                ? "FINAIS"
                : `RODADA ${roundIndex + 1}`}
            </h4>
          </div>
          <div className="flex flex-col justify-around flex-grow relative">
            {roundMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isOrganizer={isOrganizer}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
